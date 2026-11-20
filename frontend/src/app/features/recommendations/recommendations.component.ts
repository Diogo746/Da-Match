import { HttpErrorResponse } from "@angular/common/http";
import { ChangeDetectionStrategy, Component, DestroyRef, ElementRef, OnInit, ViewChild,
  computed, effect, inject, signal, untracked } from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { FormsModule } from "@angular/forms";
import { ActivatedRoute, Router, RouterLink } from "@angular/router";
import { firstValueFrom } from "rxjs";
import { AuthStateStore } from "../../core/auth-state.store";
import { LumenChatTrigger } from "../../core/lumen-chat-trigger";
import { MentorService } from "../../core/mentor.service";
import { cityLabel, sectorLabel, topicLabel, ProfileKind } from "../../core/profile.models";
import { Recommendation, Recommendations, RecommendationsService } from "../../core/recommendations.service";
import { REGISTRATION_MODE } from "../../core/registration.config";
import { StartupProfile } from "../../core/startup.models";
import { StartupService } from "../../core/startup.service";
import { DiscoveryCardComponent } from "../explore/discovery-card.component";

@Component({
  selector: "app-recommendations", standalone: true, imports: [RouterLink, FormsModule, DiscoveryCardComponent],
  templateUrl: "./recommendations.component.html",
  styleUrls: ["../explore/api-discovery.component.css", "./recommendations.component.css"],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RecommendationsComponent implements OnInit {
  readonly state = inject(AuthStateStore);
  private readonly lumen = inject(LumenChatTrigger);
  private readonly api = inject(RecommendationsService);
  private readonly startups = inject(StartupService);
  private readonly mentors = inject(MentorService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);
  readonly apiMode = inject(REGISTRATION_MODE) === "API";
  private readonly params = signal(this.route.snapshot.queryParamMap);
  readonly kind = computed(() => {
    const kind = this.state.user()?.tipoUsuario;
    return kind === "STARTUP" || kind === "MENTOR" ? kind : null;
  });
  readonly projects = signal<StartupProfile[]>([]);
  readonly selectedId = signal("");
  readonly loading = signal(false);
  readonly error = signal("");
  private readonly response = signal<{ key: string; value: Recommendations } | null>(null);
  private readonly key = computed(() => JSON.stringify([this.state.revision(), this.kind(), this.selectedId(), this.params().get("startupId")]));
  readonly result = computed(() => this.response()?.key === this.key() ? this.response()?.value : null);
  readonly profileLink = computed(() => this.kind() === "STARTUP" ? "/startup/perfil" : "/mentor/perfil");
  readonly quizLink = computed(() => this.kind() === "STARTUP"
    ? ["/startup/perfil", this.selectedId(), "questionario"] : ["/mentor/questionario"]);
  readonly detail = signal<Recommendation | null>(null);
  readonly detailLoading = signal(false);
  readonly detailError = signal("");
  readonly cityLabel = cityLabel;
  readonly topicLabel = topicLabel;
  readonly sectorLabel = sectorLabel;
  @ViewChild("profileDialog", { static: true }) private readonly dialog?: ElementRef<HTMLDialogElement>;
  @ViewChild("closeButton", { static: true }) private readonly closeButton?: ElementRef<HTMLButtonElement>;
  private revision = 0;
  private detailRevision = 0;
  private destroyed = false;
  private opener: HTMLElement | null = null;

  constructor() {
    effect(() => {
      const session = this.state.revision();
      const requested = this.params().get("startupId");
      untracked(() => void this.initialize(session, requested));
    });
    this.destroyRef.onDestroy(() => { this.destroyed = true; this.revision++; this.resetDetail(); });
  }

  ngOnInit(): void {
    this.route.queryParamMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(params => this.params.set(params));
  }

  reload(): void { void this.initialize(this.state.revision(), this.params().get("startupId")); }

  async select(id: string): Promise<void> {
    if (id === this.selectedId() && id === (this.params().get("startupId") ?? "")) return;
    const revision = ++this.revision;
    this.loading.set(true);
    this.selectedId.set(id);
    this.response.set(null);
    this.resetDetail();
    const session = this.state.revision();
    try {
      const changed = await this.router.navigate([], { relativeTo: this.route, queryParams: id ? { startupId: id } : {} });
      if (!changed && !this.destroyed && session === this.state.revision() && revision === this.revision) {
        this.loading.set(false);
        this.error.set("Não foi possível selecionar o projeto. Tente novamente.");
      }
    } catch {
      if (!this.destroyed && session === this.state.revision() && revision === this.revision) {
        this.loading.set(false);
        this.error.set("Não foi possível selecionar o projeto. Tente novamente.");
      }
    }
  }

  private async initialize(session: number, requested: string | null): Promise<void> {
    const revision = ++this.revision;
    this.response.set(null);
    this.projects.set([]);
    this.selectedId.set("");
    this.error.set("");
    this.resetDetail();
    const kind = this.kind();
    this.loading.set(this.apiMode && !!kind);
    if (!this.apiMode || !kind) return;
    try {
      const id = await this.origin(kind, requested, () => this.current(session, revision, requested));
      if (!this.current(session, revision, requested) || !id) return;
      this.selectedId.set(id);
      const key = this.key();
      const value = await firstValueFrom(this.api.list(kind, id));
      if (this.current(session, revision, requested) && key === this.key()) this.response.set({ key, value });
    } catch (error: unknown) {
      if (this.current(session, revision, requested)) this.error.set(this.message(error));
    } finally {
      if (this.current(session, revision, requested)) this.loading.set(false);
    }
  }

  private async origin(kind: ProfileKind, requested: string | null, current: () => boolean): Promise<string> {
    if (kind === "MENTOR") return (await firstValueFrom(this.mentors.me())).id;
    const projects = await firstValueFrom(this.startups.mine());
    if (!current()) return "";
    this.projects.set(projects);
    if (requested && !projects.some(item => item.id === requested)) throw new Error("PROJECT");
    return requested ?? (projects.length === 1 ? projects[0].id : "");
  }

  askLumen(item: Recommendation, event: Event): void {
    const startupId = this.selectedId();
    if (!startupId || this.kind() !== "STARTUP") return;
    this.lumen.open(event, { startupId, mentorId: item.perfil.id, mentorName: item.perfil.nome });
  }

  async open(item: Recommendation, event: Event): Promise<void> {
    const kind = this.kind();
    if (!kind || !this.result()?.itens.some(current => current.perfil.id === item.perfil.id)) return;
    const key = this.key();
    const revision = ++this.detailRevision;
    this.opener = event.currentTarget instanceof HTMLElement ? event.currentTarget : null;
    this.detail.set(null); this.detailError.set(""); this.detailLoading.set(true);
    this.dialog?.nativeElement.showModal(); this.closeButton?.nativeElement.focus();
    try {
      const value = await firstValueFrom(this.api.list(kind, this.selectedId()));
      if (!this.destroyed && key === this.key() && revision === this.detailRevision) {
        this.response.set({ key, value });
        this.detail.set(value.itens.find(current => current.perfil.id === item.perfil.id) ?? null);
        if (!this.detail()) this.detailError.set("Esta indicação não está mais disponível. Atualize suas recomendações.");
      }
    } catch (error: unknown) {
      if (!this.destroyed && key === this.key() && revision === this.detailRevision) {
        this.response.set(null); this.detailError.set(this.message(error));
      }
    } finally {
      if (key === this.key() && revision === this.detailRevision) this.detailLoading.set(false);
    }
  }

  dismiss(): void { this.dialog?.nativeElement.close(); }
  closed(): void {
    this.detailRevision++; this.detail.set(null); this.detailError.set(""); this.detailLoading.set(false);
    if (this.opener?.isConnected) this.opener.focus();
    this.opener = null;
  }
  private resetDetail(): void {
    this.detailRevision++; this.detail.set(null); this.detailError.set(""); this.detailLoading.set(false);
    if (this.dialog?.nativeElement.open) this.dialog.nativeElement.close();
    this.opener = null;
  }
  private current(session: number, revision: number, requested: string | null): boolean {
    return !this.destroyed && session === this.state.revision() && revision === this.revision && requested === this.params().get("startupId");
  }
  format(value: string): string {
    if (value === "AMBOS") return "Online ou presencial";
    return value === "ONLINE" ? "Online" : "Presencial";
  }
  date(value: string): string { return new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short", timeZone: "America/Sao_Paulo" }).format(new Date(value)); }
  private message(error: unknown): string {
    if (error instanceof HttpErrorResponse) {
      if (error.status === 401) return "Sua sessão expirou. Entre novamente.";
      if (error.status === 403) return "Você não tem mais acesso a este perfil. Recarregue sua conta.";
      if (error.status === 404) return "Seu perfil não foi encontrado. Confira sua conta e seus vínculos.";
    }
    if (error instanceof Error && error.message === "PROJECT") return "Esta startup não está entre seus projetos atuais. Selecione outra.";
    return "Não foi possível consultar as recomendações. Tente novamente.";
  }
}
