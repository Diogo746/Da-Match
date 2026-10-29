import { HttpErrorResponse } from "@angular/common/http";
import { ChangeDetectionStrategy, Component, DestroyRef, OnInit, computed, effect, inject, signal } from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { ActivatedRoute, RouterLink } from "@angular/router";
import { firstValueFrom } from "rxjs";
import { AuthStateStore } from "../../core/auth-state.store";
import { MentorService } from "../../core/mentor.service";
import { StartupService } from "../../core/startup.service";
import { QuestionnaireService } from "../../core/questionnaire.service";
import { DAYS, ProfileDraft, ProfileKind, audienceLabel, backgroundLabel, cadenceLabel, capacityLabel, emptyProfile, momentLabel, sectorLabel, slotLabel, topicLabel } from "../../core/profile.models";
import { ProfileSetupComponent } from "./profile-setup.component";

interface QuestionnaireContext {
  revision: number;
  actor: string;
  project: string;
}

@Component({
  selector: "app-questionnaire",
  standalone: true,
  imports: [RouterLink, ProfileSetupComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: "./questionnaire.component.html",
  styleUrl: "./questionnaire.component.css",
})
export class QuestionnaireComponent implements OnInit {
  readonly state = inject(AuthStateStore);
  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);
  private readonly questionnaires = inject(QuestionnaireService);
  private readonly mentors = inject(MentorService);
  private readonly startups = inject(StartupService);
  readonly kind: ProfileKind = this.route.snapshot.data["kind"];
  readonly loading = signal(false);
  readonly busy = signal(false);
  readonly ready = signal(false);
  readonly editing = signal(false);
  readonly uncertain = signal(false);
  readonly error = signal("");
  readonly message = signal("");
  readonly canEdit = signal(false);
  readonly name = signal("");
  readonly initial = signal<ProfileDraft>(emptyProfile(this.kind));
  readonly saved = signal<ProfileDraft | null>(null);
  private readonly actor = signal("");
  private targetId = "";
  private revision = 0;
  readonly summary = computed(() => {
    const answers = this.saved();
    if (!answers) return [];
    return [
      { label: "Momento", value: answers.moments.map(momentLabel).join(" · ") },
      { label: "Setores", value: answers.sectors.map(sectorLabel).join(" · ") },
      { label: this.kind === "STARTUP" ? "Necessidades (por prioridade)" : "Especialidades", value: answers.topics.map(topic => {
        const experience = answers.experience[topic];
        if (!experience) return topicLabel(topic);
        return topicLabel(topic) + (experience === "PRACTICAL" ? " (experiência prática)" : " (conhecimento)");
      }).join(" · ") },
      { label: "Público", value: answers.audiences.map(audienceLabel).join(" · ") },
      { label: "Áreas de formação ou do time", value: answers.backgrounds.map(backgroundLabel).join(" · ") },
      { label: "Encontros", value: answers.format + (answers.cityId ? " · " + answers.cityId : "") },
      { label: "Agenda", value: cadenceLabel(answers.cadence) + " · " + answers.availability.map(slotLabel).join("; ") },
      ...(this.kind === "MENTOR" ? [{ label: "Capacidade declarada", value: capacityLabel(answers.capacity) },
        { label: "Novas mentorias", value: answers.accepting ? "Recebendo startups" : "Pausadas" }] : []),
    ];
  });

  constructor() {
    effect(() => {
      if (this.actor() && (this.actor() !== this.state.user()?.id || this.state.user()?.tipoUsuario !== this.kind)) {
        this.invalidateContext();
      }
    });
  }

  ngOnInit(): void {
    this.route.paramMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => {
      this.invalidateContext();
      void this.load();
    });
  }

  async load(): Promise<void> {
    const user = this.state.user();
    if (user?.tipoUsuario !== this.kind || this.loading() || this.busy()) return;
    const context = this.context();
    this.actor.set(user.id);
    this.clear();
    this.loading.set(true);
    this.error.set("");
    this.message.set("");
    try {
      const initial = await this.loadIdentity(context);
      if (!initial || !this.isCurrent(context)) return;
      const saved = await firstValueFrom(this.questionnaires.load(this.kind, this.targetId));
      if (!this.isCurrent(context)) return;
      this.saved.set(saved);
      this.initial.set(structuredClone(saved ?? initial));
      this.uncertain.set(false);
      this.ready.set(true);
    } catch (error: unknown) {
      if (this.isCurrent(context)) { this.clear(); this.showError(error, false); }
    } finally { if (this.isCurrent(context)) this.loading.set(false); }
  }

  private async loadIdentity(context: QuestionnaireContext): Promise<ProfileDraft | null> {
    const initial = emptyProfile(this.kind);
    if (this.kind === "MENTOR") {
      const mentor = await firstValueFrom(this.mentors.me());
      if (!this.isCurrent(context)) return null;
      if (mentor.usuarioId !== context.actor) throw new Error("Perfil inválido.");
      this.targetId = mentor.id;
      this.name.set(mentor.nome);
      this.canEdit.set(true);
      const periods = { MANHA: "MORNING", TARDE: "AFTERNOON", NOITE: "EVENING" } as const;
      initial.availability = mentor.disponibilidades.map(slot => ({ day: DAYS[slot.diaSemana - 1].id, period: periods[slot.periodo] }));
      return initial;
    }
    const records = await firstValueFrom(this.startups.mine());
    if (!this.isCurrent(context)) return null;
    const profile = records.find(item => item.id === context.project);
    const member = profile?.membros.find(item => item.usuarioId === context.actor);
    if (!profile || !member) throw new Error("Projeto indisponível.");
    this.targetId = profile.id;
    this.name.set(profile.nomeProvisorio);
    this.canEdit.set(["FUNDADOR", "REPRESENTANTE"].includes(member.papelMembro));
    return initial;
  }

  edit(): void {
    if (!this.ready() || !this.canEdit() || this.uncertain() || this.loading() || this.busy() || !this.matchesTarget()) return;
    this.message.set(""); this.error.set(""); this.editing.set(true);
  }

  cancel(): void {
    if (this.busy()) return;
    this.editing.set(false);
  }

  async save(answers: ProfileDraft): Promise<void> {
    if (!this.editing() || !this.canEdit() || this.uncertain() || this.busy() ||
        !this.actor() || this.actor() !== this.state.user()?.id || !this.matchesTarget()) return;
    const context = this.context();
    this.busy.set(true); this.error.set(""); this.message.set("");
    try {
      const saved = await firstValueFrom(this.questionnaires.save(this.kind, this.targetId, answers));
      if (!this.isCurrent(context)) return;
      this.saved.set(saved); this.initial.set(structuredClone(saved)); this.editing.set(false);
      this.message.set("Questionário salvo para este perfil. Você pode consultar as respostas ao entrar novamente.");
    } catch (error: unknown) {
      if (this.isCurrent(context)) this.showError(error, true);
    } finally {
      if (!this.destroyRef.destroyed) {
        this.busy.set(false);
        if (context.revision === this.revision && !this.isCurrent(context)) this.invalidateContext();
        // A write already sent may finish after navigation. Read the new context before editing it.
        if (!this.isCurrent(context)) void this.load();
      }
    }
  }

  private projectId(): string {
    return this.kind === "STARTUP" ? this.route.snapshot.paramMap.get("startupId") ?? "" : "";
  }

  private context(): QuestionnaireContext {
    return { revision: this.revision, actor: this.state.user()?.id ?? "", project: this.projectId() };
  }

  private isCurrent(context: QuestionnaireContext): boolean {
    return !this.destroyRef.destroyed && context.revision === this.revision &&
      context.actor === this.state.user()?.id && this.state.user()?.tipoUsuario === this.kind &&
      context.project === this.projectId();
  }

  private matchesTarget(): boolean {
    return !!this.targetId && (this.kind !== "STARTUP" || this.targetId === this.projectId());
  }

  private invalidateContext(): void {
    this.revision++;
    this.actor.set("");
    this.clear();
    this.loading.set(false);
    this.error.set("");
    this.message.set("");
  }

  private clear(): void {
    this.saved.set(null); this.initial.set(emptyProfile(this.kind)); this.name.set("");
    this.ready.set(false); this.editing.set(false); this.canEdit.set(false); this.targetId = "";
  }

  private showError(error: unknown, write: boolean): void {
    if (error instanceof HttpErrorResponse) {
      if (error.status === 401) { this.clear(); this.error.set("Entre novamente para consultar seu questionário."); return; }
      if (error.status === 403 || error.status === 404) {
        this.clear(); this.error.set("O perfil está indisponível ou você não tem permissão. Recarregue para conferir seu acesso."); return;
      }
      if (error.status === 400) { this.error.set("Revise as respostas. O servidor não aceitou o preenchimento."); return; }
    }
    this.uncertain.set(write || this.uncertain());
    if (write) this.editing.set(false);
    this.error.set(write ? "Não foi possível confirmar o salvamento. Recarregue as respostas antes de editar novamente."
      : "Não foi possível carregar o questionário. Tente recarregar os dados.");
  }
}
