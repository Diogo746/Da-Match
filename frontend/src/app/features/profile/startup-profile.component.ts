import { HttpErrorResponse } from "@angular/common/http";
import { ChangeDetectionStrategy, Component, DestroyRef, OnInit, computed, inject, signal } from "@angular/core";
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from "@angular/forms";
import { ActivatedRoute, Router, RouterLink } from "@angular/router";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { firstValueFrom } from "rxjs";
import { AuthStateStore } from "../../core/auth-state.store";
import { STARTUP_FIELDS, STARTUP_STATUS_LABELS, StartupProfile, StartupValidationStatus } from "../../core/startup.models";
import { StartupService } from "../../core/startup.service";
import { STARTUP_PUBLICATION_LABELS, StartupPublication, StartupPublicationStatus,
  readStartupPublicationConflict } from "../../core/startup-publication.models";

interface StartupRequestContext { actor: string; session: number; revision: number; }

@Component({
  selector: "app-startup-profile",
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: "./startup-profile.component.html",
  styleUrl: "./startup-profile.component.css",
})
export class StartupProfileComponent implements OnInit {
  readonly state = inject(AuthStateStore);
  private readonly startups = inject(StartupService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly routeSelection = signal("");
  private reloadAfterOperation = false;
  private readonly records = signal<StartupProfile[]>([]);
  private readonly recordsSession = signal(-1);
  private readonly loadedSession = signal(-1);
  private readonly publicationRecord = signal<StartupPublication | null>(null);
  private readonly feedbackSession = signal(-1);
  private readonly errorText = signal("");
  private readonly messageText = signal("");
  private revision = 0;
  readonly profiles = computed(() => this.recordsSession() === this.state.revision()
    ? this.records().filter(profile => this.belongsToSession(profile)) : []);
  readonly selectedId = signal("");
  readonly profile = computed(() => {
    if (this.routeSelection() && this.routeSelection() !== this.selectedId()) return null;
    return this.profiles().find(profile => profile.id === this.selectedId()) ?? null;
  });
  readonly publication = computed(() => this.profile()?.id === this.publicationRecord()?.startupId
    ? this.publicationRecord() : null);
  readonly canEdit = computed(() => this.publication()?.podeGerenciar === true &&
    (this.profile()?.membros.some(member => member.usuarioId === this.state.user()?.id &&
      ["FUNDADOR", "REPRESENTANTE"].includes(member.papelMembro)) ?? false));
  readonly fields = STARTUP_FIELDS;
  readonly statusLabels = STARTUP_STATUS_LABELS;
  readonly publicationLabels = STARTUP_PUBLICATION_LABELS;
  readonly statuses = Object.entries(STARTUP_STATUS_LABELS);
  readonly loading = signal(false);
  readonly loaded = computed(() => this.loadedSession() === this.state.revision());
  readonly publicationLoading = signal(false);
  readonly busy = signal(false);
  readonly editing = signal(false);
  readonly uncertain = signal(false);
  readonly error = computed(() => this.feedbackSession() === this.state.revision() ? this.errorText() : "");
  readonly message = computed(() => this.feedbackSession() === this.state.revision() ? this.messageText() : "");
  readonly publicationBlocked = computed(() => this.loading() || this.publicationLoading() || this.busy() ||
    this.editing() || this.uncertain() || !this.canEdit());
  readonly form = new FormGroup({
    nomeProvisorio: this.textControl(255), pitchCurto: this.textControl(255),
    problemaCentral: this.textControl(5000), solucaoProposta: this.textControl(5000),
    publicoAlvo: this.textControl(255), modeloDeNegocio: this.textControl(255),
    statusValidacao: new FormControl<StartupValidationStatus>("APENAS_IDEIA", { nonNullable: true,
      validators: [Validators.required, Validators.pattern(/^(APENAS_IDEIA|PESQUISA_MERCADO)$/)] }),
  });

  ngOnInit(): void {
    this.routeSelection.set(this.route.snapshot.queryParamMap.get("projeto") ?? "");
    this.route.queryParamMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(params => {
      const target = params.get("projeto") ?? "";
      if (target === this.routeSelection()) return;
      this.routeSelection.set(target);
      if (!target) this.selectedId.set("");
      if (this.busy() || this.loading() || this.publicationLoading()) this.reloadAfterOperation = true;
      else void this.load();
    });
    void this.load();
  }

  async load(): Promise<void> {
    if (this.loading() || this.busy() || this.state.user()?.tipoUsuario !== "STARTUP") return;
    this.revision++;
    this.reloadAfterOperation = false;
    const context = this.context();
    this.loading.set(true);
    this.publicationRecord.set(null);
    this.publicationLoading.set(false);
    this.clearFeedback();
    let identified = false;
    try {
      const profiles = await firstValueFrom(this.startups.mine());
      if (!this.isCurrent(context)) return;
      if (profiles.some(profile => !this.belongsToSession(profile)) ||
          new Set(profiles.map(profile => profile.id)).size !== profiles.length) throw new Error("Resposta inválida.");
      this.recordsSession.set(context.session);
      this.records.set(profiles);
      const wanted = this.routeSelection() || this.selectedId();
      this.selectedId.set(this.routeSelection() || profiles.find(profile => profile.id === wanted)?.id || profiles[0]?.id || "");
      this.loadedSession.set(context.session);
      this.cancel();
      identified = true;
      if (profiles.length && !this.profile()) {
        this.errorText.set("O projeto selecionado não está disponível para sua conta. Escolha um projeto da lista.");
      }
      if (this.profile()) {
        this.publicationLoading.set(true);
        await this.fetchPublication(context, this.selectedId());
      }
      if (this.isCurrent(context)) this.uncertain.set(false);
    } catch (error: unknown) {
      if (!this.isCurrent(context)) return;
      if (!identified) this.clearProfiles();
      this.showError(error, false);
    } finally {
      this.finishRequest(context, false);
    }
  }

  async select(id: string): Promise<void> {
    if (this.busy() || this.loading() || this.editing() || this.uncertain() || !this.profiles().some(profile => profile.id === id)) return;
    this.revision++;
    this.selectedId.set(id);
    this.routeSelection.set(id);
    this.publicationRecord.set(null);
    this.cancel();
    this.clearFeedback();
    const context = this.context();
    this.publicationLoading.set(true);
    try {
      await this.router.navigate([], { relativeTo: this.route, queryParams: { projeto: id }, queryParamsHandling: "merge", replaceUrl: true });
      if (this.isCurrent(context, id)) await this.fetchPublication(context, id);
    }
    catch (error: unknown) { if (this.isCurrent(context, id)) this.showError(error, false); }
    finally { this.finishRequest(context, false); }
  }

  edit(): void {
    if (!this.canEdit() || this.busy() || this.loading() || this.publicationLoading() || this.uncertain()) return;
    this.cancel();
    this.clearFeedback();
    this.editing.set(true);
  }

  cancel(): void {
    if (this.busy()) return;
    const profile = this.profile();
    this.form.reset(profile ?? {});
    this.editing.set(false);
  }

  invalid(field: keyof typeof this.form.controls): boolean {
    const control = this.form.controls[field];
    return control.touched && control.invalid;
  }

  async save(): Promise<void> {
    const profile = this.profile();
    if (!profile || !this.editing() || !this.canEdit() || this.busy() || this.loading() || this.publicationLoading() || this.uncertain()) return;
    this.form.markAllAsTouched();
    this.clearFeedback();
    if (this.form.invalid) { this.errorText.set("Revise os campos indicados antes de salvar."); return; }
    const context = this.context();
    this.busy.set(true);
    let confirmed = false;
    try {
      const saved = await firstValueFrom(this.startups.update(profile.id, this.form.getRawValue()));
      if (!this.isCurrent(context, profile.id)) return;
      if (saved.id !== profile.id || !this.belongsToSession(saved)) throw new Error("Resposta inválida.");
      this.records.update(profiles => profiles.map(item => item.id === saved.id ? saved : item));
      this.form.reset(saved);
      this.editing.set(false);
      confirmed = true;
      this.publicationRecord.set(null);
      this.publicationLoading.set(true);
      await this.fetchPublication(context, profile.id);
      if (this.isCurrent(context, profile.id)) this.messageText.set("Dados da startup salvos com sucesso.");
    } catch (error: unknown) {
      if (!this.isCurrent(context, profile.id)) return;
      this.showError(error, !confirmed);
      if (confirmed && this.profile()) {
        this.errorText.set("Dados salvos, mas não foi possível atualizar as pendências. Recarregue os dados para continuar.");
      }
    } finally {
      this.finishRequest(context, true);
    }
  }

  async changeStatus(status: StartupPublicationStatus): Promise<void> {
    const publication = this.publication();
    if (!publication || this.publicationBlocked() || publication.status === status ||
        status === "PUBLICADO" && !publication.aptoParaPublicacao) return;
    const context = this.context();
    this.clearFeedback();
    this.busy.set(true);
    try {
      const saved = await firstValueFrom(this.startups.setStatus(publication.startupId, status));
      if (!this.isCurrent(context, publication.startupId)) return;
      this.applyPublication(saved, publication.startupId);
      this.messageText.set(`Estado do perfil: ${this.publicationLabels[saved.status]}.`);
    } catch (error: unknown) {
      if (!this.isCurrent(context, publication.startupId)) return;
      if (status === "PUBLICADO" && error instanceof HttpErrorResponse && error.status === 409) {
        this.showConflict(error, publication);
      } else this.showError(error, true);
    } finally { this.finishRequest(context, true); }
  }

  pendingLabel(field: string): string {
    if (field === "perfilMatch") return "Questionário";
    if (field === "statusValidacao") return "Momento da ideia";
    return this.fields.find(item => item.key === field)?.label ?? field;
  }

  private async fetchPublication(context: StartupRequestContext, id: string): Promise<void> {
    const publication = await firstValueFrom(this.startups.publication(id));
    if (this.isCurrent(context, id)) this.applyPublication(publication, id);
  }

  private applyPublication(publication: StartupPublication, id: string): void {
    if (publication.startupId !== id) throw new Error("Projeto diferente da publicação consultada.");
    this.publicationRecord.set(publication);
    this.records.update(profiles => profiles.map(profile => profile.id === id ? { ...profile, status: publication.status } : profile));
  }

  private showConflict(error: HttpErrorResponse, publication: StartupPublication): void {
    try {
      const pending = readStartupPublicationConflict(error.error);
      this.publicationRecord.set({ ...publication, aptoParaPublicacao: false, pendencias: pending });
      this.errorText.set("A startup possui pendências para publicação. Revise as orientações abaixo.");
    } catch { this.showError(new Error("Conflito não confirmado."), true); }
  }

  private context(): StartupRequestContext {
    return { actor: this.state.user()?.id ?? "", session: this.state.revision(), revision: this.revision };
  }

  private ownsRequest(context: StartupRequestContext): boolean {
    return !this.destroyRef.destroyed && this.revision === context.revision;
  }

  private isCurrent(context: StartupRequestContext, project?: string): boolean {
    return this.ownsRequest(context) && this.state.revision() === context.session &&
      this.state.user()?.tipoUsuario === "STARTUP" && context.actor === this.state.user()?.id &&
      (project === undefined || project === this.selectedId() && (!this.routeSelection() || this.routeSelection() === project));
  }

  private finishRequest(context: StartupRequestContext, write: boolean): void {
    if (!this.ownsRequest(context)) return;
    if (write) this.busy.set(false);
    else this.loading.set(false);
    this.publicationLoading.set(false);
    if (this.reloadAfterOperation) { this.reloadAfterOperation = false; void this.load(); }
  }

  private clearFeedback(): void {
    this.feedbackSession.set(this.state.revision());
    this.errorText.set(""); this.messageText.set("");
  }

  private clearProfiles(): void {
    this.records.set([]); this.publicationRecord.set(null);
    this.editing.set(false); this.form.reset();
  }

  private belongsToSession(profile: StartupProfile): boolean {
    const user = this.state.user();
    return user?.tipoUsuario === "STARTUP" && profile.membros.some(member => member.usuarioId === user.id);
  }

  private textControl(maxLength: number): FormControl<string> {
    return new FormControl("", { nonNullable: true,
      validators: [Validators.required, Validators.pattern(/\S/), Validators.maxLength(maxLength)] });
  }

  private showError(error: unknown, write: boolean): void {
    if (error instanceof HttpErrorResponse) {
      if (error.status === 401) {
        this.clearProfiles();
        this.state.setUser(null);
        this.feedbackSession.set(this.state.revision());
        this.errorText.set("Sua sessão expirou. Entre novamente para continuar.");
        return;
      }
      if (error.status === 403) {
        this.publicationRecord.set(null);
        this.errorText.set("Sem permissão ou proteção do envio expirada. Recarregue para conferir seu acesso."); return;
      }
      if (error.status === 404) {
        this.clearProfiles();
        this.errorText.set("A startup não está disponível. Recarregue para conferir seus vínculos."); return;
      }
      if (error.status === 400) { this.errorText.set("O servidor não aceitou os dados. Revise o preenchimento."); return; }
    }
    this.uncertain.set(write || this.uncertain());
    this.errorText.set(write
      ? "Não foi possível confirmar a alteração. Recarregue os dados para conferir o resultado antes de editar novamente."
      : "Não foi possível carregar suas startups. Tente recarregar os dados.");
  }
}
