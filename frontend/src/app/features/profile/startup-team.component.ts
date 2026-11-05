import { HttpErrorResponse } from "@angular/common/http";
import { ChangeDetectionStrategy, Component, DestroyRef, OnInit, computed, inject, signal } from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from "@angular/forms";
import { ActivatedRoute, RouterLink } from "@angular/router";
import { firstValueFrom } from "rxjs";
import { AuthStateStore } from "../../core/auth-state.store";
import { REGISTRATION_MODE } from "../../core/registration.config";
import { StartupMember, StartupProfile } from "../../core/startup.models";
import { StartupService } from "../../core/startup.service";
import { StartupTeamService } from "../../core/startup-team.service";
import { StartupTeamPendingStore } from "../../core/startup-team-pending.store";
import { INVITATION_STATUS_LABELS, InvitationPage, InvitationRole, MEMBER_ROLE_LABELS,
  StartupInvitation, TeamOperation } from "../../core/startup-team.models";

interface RequestContext { session: number; revision: number; key: string; }

@Component({
  selector: "app-startup-team",
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: "./startup-team.component.html",
  styleUrl: "./startup-team.component.css",
})
export class StartupTeamComponent implements OnInit {
  readonly auth = inject(AuthStateStore);
  private readonly mode = inject(REGISTRATION_MODE);
  private readonly route = inject(ActivatedRoute);
  private readonly destroy = inject(DestroyRef);
  private readonly startups = inject(StartupService);
  private readonly teams = inject(StartupTeamService);
  private readonly pendingStore = inject(StartupTeamPendingStore);
  readonly inbox = this.route.snapshot.data["inbox"] === true;
  readonly projectId = signal("");
  private readonly key = computed(() => this.inbox ? "inbox" : this.projectId());
  private revision = 0;
  private readonly recordSession = signal(-1);
  private readonly projectRecord = signal<StartupProfile | null>(null);
  private readonly pageRecord = signal<InvitationPage | null>(null);
  private readonly accessible = signal<StartupProfile[]>([]);
  private readonly errorText = signal("");
  private readonly messageText = signal("");
  private readonly confirmationRecord = signal<TeamOperation | null>(null);
  readonly active = computed(() => this.mode === "API" && this.auth.user()?.tipoUsuario === "STARTUP");
  private readonly visible = computed(() => this.active() && this.recordSession() === this.auth.revision());
  readonly profile = computed(() => this.visible() ? this.projectRecord() : null);
  readonly page = computed(() => this.visible() ? this.pageRecord() : null);
  readonly error = computed(() => this.visible() ? this.errorText() : "");
  readonly message = computed(() => this.visible() ? this.messageText() : "");
  readonly confirmation = computed(() => this.visible() ? this.confirmationRecord() : null);
  readonly pending = computed(() => this.pendingStore.get(this.key()));
  readonly canManage = computed(() => this.profile()?.membros.some(member => member.usuarioId === this.auth.user()?.id &&
    ["FUNDADOR", "REPRESENTANTE"].includes(member.papelMembro)) ?? false);
  readonly loading = signal(false);
  readonly busy = signal(false);
  readonly retryAllowed = signal(false);
  readonly blocked = computed(() => !this.active() || this.loading() || this.busy() || !!this.pending());
  readonly roleLabels = MEMBER_ROLE_LABELS;
  readonly statusLabels = INVITATION_STATUS_LABELS;
  readonly form = new FormGroup({
    email: new FormControl("", { nonNullable: true, validators: [Validators.required, Validators.email, Validators.maxLength(254)] }),
    papelMembro: new FormControl<InvitationRole>("MEMBRO", { nonNullable: true,
      validators: [Validators.required, Validators.pattern(/^(MEMBRO|REPRESENTANTE)$/)] }),
  });

  ngOnInit(): void {
    this.route.paramMap.pipe(takeUntilDestroyed(this.destroy)).subscribe(params => {
      this.revision++;
      this.projectId.set(params.get("startupId") ?? "");
      this.busy.set(false); this.loading.set(false);
      this.projectRecord.set(null); this.pageRecord.set(null); this.accessible.set([]);
      this.confirmationRecord.set(null); this.form.reset(); this.retryAllowed.set(false);
      void this.load();
    });
  }

  async load(page = this.page()?.pagina ?? 0): Promise<void> {
    if (!this.active() || this.busy() || this.loading()) return;
    const context = this.begin();
    this.loading.set(true);
    this.projectRecord.set(null); this.accessible.set([]);
    this.pageRecord.set(null); this.confirmationRecord.set(null); this.retryAllowed.set(false);
    try {
      await this.refresh(context, page);
    } catch (error: unknown) { if (this.current(context)) this.showError(error); }
    finally { if (this.owns(context)) this.loading.set(false); }
  }

  async changePage(page: number): Promise<void> {
    const current = this.page();
    if (!current || this.blocked() || page < 0 || page >= current.totalPaginas) return;
    await this.load(page);
  }

  async send(): Promise<void> {
    if (this.blocked() || !this.canManage()) return;
    this.form.controls.email.setValue(this.form.controls.email.value.trim());
    this.form.markAllAsTouched();
    if (this.form.invalid) { this.errorText.set("Confira o e-mail e o papel do convite."); return; }
    await this.execute({ kind: "create", project: this.projectId(), request: {
      solicitacaoId: crypto.randomUUID(), ...this.form.getRawValue(),
    } });
  }

  requestAction(invitation: StartupInvitation, kind: "accept" | "refuse" | "cancel"): void {
    if (this.blocked() || invitation.status !== "PENDENTE" || !this.page()?.itens.some(item => item.id === invitation.id) ||
      (kind === "cancel" ? this.inbox || !this.canManage() : !this.inbox)) return;
    this.confirmationRecord.set({ kind, invitation });
  }

  requestRemoval(member: StartupMember): void {
    if (this.blocked() || !this.canManage() || !this.profile()?.membros.some(item => item.usuarioId === member.usuarioId) ||
      this.protectedFounder(member)) return;
    this.confirmationRecord.set({ kind: "remove", project: this.projectId(), userId: member.usuarioId, name: member.nomeUsuario });
  }

  protectedFounder(member: StartupMember): boolean {
    return member.papelMembro === "FUNDADOR" && this.profile()?.membros.filter(item => item.papelMembro === "FUNDADOR").length === 1;
  }

  cancelConfirmation(): void { if (!this.busy()) this.confirmationRecord.set(null); }

  async confirm(): Promise<void> {
    const operation = this.confirmation();
    if (!operation || this.blocked()) return;
    this.confirmationRecord.set(null);
    await this.execute(operation);
  }

  confirmationText(operation: TeamOperation): string {
    if (operation.kind === "remove") return `Remover ${operation.name} de ${this.profile()?.nomeProvisorio}? O acesso ao projeto será revogado.`;
    if (operation.kind === "create") return "Enviar convite?";
    const verbs = { accept: "Aceitar", refuse: "Recusar", cancel: "Cancelar" };
    return `${verbs[operation.kind]} o convite de ${operation.invitation.nomeStartup} para ${operation.invitation.nomeDestinatario} como ${this.roleLabels[operation.invitation.papelMembro]}?`;
  }

  canOpen(project: string): boolean { return this.visible() && this.accessible().some(item => item.id === project); }

  date(value: string): string {
    return new Intl.DateTimeFormat("pt-BR", { timeZone: "America/Sao_Paulo", dateStyle: "short", timeStyle: "short" }).format(new Date(value));
  }

  async recover(): Promise<void> {
    const operation = this.pending();
    if (!operation || this.busy() || this.loading() || !this.active()) return;
    const context = this.begin();
    this.busy.set(true); this.retryAllowed.set(false);
    let result: StartupInvitation | undefined;
    let queried = false;
    try {
      if (operation.kind === "create") {
        result = await firstValueFrom(this.teams.recover(operation.project, operation.request.solicitacaoId));
        if (result.papelMembro !== operation.request.papelMembro) throw new Error("Papel divergente.");
      } else if (operation.kind !== "remove") {
        result = await firstValueFrom(this.teams.invitation(operation.invitation.id, operation.invitation.startupId));
      }
      queried = true;
      if (!this.current(context)) return;
      if (!await this.refresh(context, 0)) return;
      this.pendingStore.clear(context.key);
      this.form.reset();
      this.messageText.set(result ? `Estado confirmado do convite: ${this.statusLabels[result.status]}.`
        : "Equipe consultada. Confira os integrantes atuais antes de uma nova ação.");
    } catch (error: unknown) {
      if (!this.current(context)) return;
      if (!queried && operation.kind === "create" && error instanceof HttpErrorResponse && error.status === 404) {
        this.retryAllowed.set(true);
        this.errorText.set("A solicitação ainda não foi localizada. Você pode consultar novamente ou reenviar explicitamente o mesmo convite, com o mesmo identificador.");
      } else this.showError(error);
    } finally { if (this.owns(context)) this.busy.set(false); }
  }

  async retryCreate(): Promise<void> {
    const operation = this.pending();
    if (!this.retryAllowed() || operation?.kind !== "create" || this.busy() || this.loading() || !this.canManage()) return;
    await this.execute(operation);
  }

  private async execute(operation: TeamOperation): Promise<void> {
    const context = this.begin();
    this.busy.set(true); this.retryAllowed.set(false);
    this.pendingStore.set(context.key, operation);
    let result: StartupInvitation | undefined;
    let receipt = false;
    try {
      if (operation.kind === "create") result = await firstValueFrom(this.teams.create(operation.project, operation.request));
      else if (operation.kind === "remove") await firstValueFrom(this.teams.remove(operation.project, operation.userId));
      else result = await firstValueFrom(this.teams.act(operation.invitation, operation.kind));
      receipt = true;
      if (!this.current(context)) return;
      // The write receipt alone cannot grant access: reread current memberships, even for an already accepted invite.
      if (!await this.refresh(context, 0)) return;
      this.pendingStore.clear(context.key);
      this.form.reset();
      this.messageText.set(result ? `Convite ${this.statusLabels[result.status].toLocaleLowerCase("pt-BR")}.`
        : "Integrante removido. Equipe atualizada.");
    } catch (error: unknown) {
      if (!this.current(context)) return;
      if (!receipt && this.definitive(error)) this.pendingStore.clear(context.key);
      this.showError(error);
    } finally { if (this.owns(context)) this.busy.set(false); }
  }

  private begin(): RequestContext {
    this.recordSession.set(this.auth.revision());
    this.errorText.set(""); this.messageText.set("");
    return { session: this.auth.revision(), revision: ++this.revision, key: this.key() };
  }

  private owns(context: RequestContext): boolean { return !this.destroy.destroyed && context.revision === this.revision; }

  private current(context: RequestContext): boolean {
    return this.owns(context) && this.active() && context.session === this.auth.revision() && context.key === this.key();
  }

  private async refreshProjects(context: RequestContext): Promise<void> {
    const profiles = await firstValueFrom(this.startups.mine());
    if (!this.current(context)) return;
    if (new Set(profiles.map(item => item.id)).size !== profiles.length ||
      profiles.some(item => !item.membros.some(member => member.usuarioId === this.auth.user()?.id))) throw new Error("Vínculos inválidos.");
    this.accessible.set(profiles);
    this.projectRecord.set(profiles.find(item => item.id === this.projectId()) ?? null);
    if (!this.inbox && !this.profile()) {
      this.pageRecord.set(null);
      this.errorText.set("Este projeto não está disponível nos seus vínculos atuais.");
    }
  }

  private async refreshPage(context: RequestContext, page: number): Promise<void> {
    const result = await firstValueFrom(this.teams.list(page, this.inbox ? undefined : this.projectId()));
    if (this.current(context)) this.pageRecord.set(result);
  }

  private async refresh(context: RequestContext, page: number): Promise<boolean> {
    await this.refreshProjects(context);
    if (!this.current(context)) return false;
    if (this.inbox || this.canManage()) await this.refreshPage(context, page);
    return this.current(context);
  }

  private definitive(error: unknown): boolean {
    return error instanceof HttpErrorResponse && [400, 403, 404, 409, 410, 415].includes(error.status);
  }

  private showError(error: unknown): void {
    this.messageText.set("");
    if (error instanceof HttpErrorResponse) {
      if ([401, 403, 404].includes(error.status)) { this.projectRecord.set(null); this.pageRecord.set(null); this.accessible.set([]); }
      if (error.status === 401) { this.auth.setUser(null); return; }
      if (error.status === 403) { this.errorText.set("Sem permissão ou proteção do envio expirada. Recarregue para conferir seu acesso."); return; }
      if (error.status === 404) { this.errorText.set("Não foi possível acessar o projeto, convite ou convidar essa conta. Confira os dados e seus vínculos."); return; }
      if (error.status === 400 || error.status === 415) { this.errorText.set("O servidor não aceitou os dados. Confira o preenchimento."); return; }
      if (error.status === 409 || error.status === 410) {
        this.pageRecord.set(null); this.projectRecord.set(null);
        this.errorText.set("A ação está indisponível: confira vencimento, convite pendente, integrantes e permissão atual. Recarregue os dados."); return;
      }
    }
    this.errorText.set(this.pending()
      ? "Não foi possível confirmar o resultado. Consulte a operação antes de realizar novas alterações."
      : "Não foi possível carregar os dados. Tente recarregar.");
  }
}
