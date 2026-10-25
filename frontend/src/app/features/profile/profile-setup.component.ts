import { AfterViewInit, ChangeDetectionStrategy, Component, DestroyRef, ElementRef, OnInit, ViewChild, computed, inject, input, output, signal } from "@angular/core";
import { toSignal } from "@angular/core/rxjs-interop";
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from "@angular/forms";
import { AUDIENCES, AUDIENCE_LIMIT, AudienceId, BACKGROUNDS, BACKGROUND_LIMIT, BackgroundId, CADENCES, CAPACITIES, CITIES, CapacityId, DAYS, FORMATS, MOMENTS, PERIODS, PHASE_DONE, PROFILE_PHASES, PROFILE_STEPS, SECTORS, SECTOR_LIMIT, TOPICS, TOPIC_LIMIT, AvailabilitySlot, Cadence, DayId, MeetingFormat, MomentId, PeriodId, ProfileDraft, ProfileKind, SectorId, TopicExperience, TopicId, audienceLabel, backgroundLabel, cadenceLabel, capacityLabel, cityLabel, emptyProfile, momentLabel, phaseOf, sectorLabel, slotLabel, stepIsComplete, topicLabel } from "../../core/profile.models";
import { MotionStore } from "../../core/motion.store";
import { IconComponent } from "../../shared/icon.component";
import { LumenGuideComponent } from "../../shared/lumen-guide.component";
import { LumenPose } from "../../shared/lumen.component";
import { ProfilePreviewComponent } from "./profile-preview.component";

const LAST_STEP = PROFILE_STEPS.length - 1;
const normalize = (text: string) => text.normalize("NFD").replace(/[̀-ͯ]/g, "").toLocaleLowerCase("pt-BR");

@Component({
  selector: "app-profile-setup",
  standalone: true,
  imports: [ReactiveFormsModule, IconComponent, LumenGuideComponent, ProfilePreviewComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: "./profile-setup.component.html",
  styleUrls: ["./profile-setup.component.css", "./profile-gamification.css"],
  host: { "[class.mentor-deep]": "kind() === 'MENTOR'", "[class.startup-deep]": "kind() === 'STARTUP'" },
})
export class ProfileSetupComponent implements OnInit, AfterViewInit {
  readonly motion = inject(MotionStore);
  readonly kind = input<ProfileKind>("STARTUP");
  readonly name = input("");
  readonly initial = input<ProfileDraft | null>(null);
  readonly editing = input(false);
  readonly startStep = input(0);
  readonly finished = output<ProfileDraft>();
  readonly cancelled = output<void>();
  readonly step = signal(0);
  readonly reviewing = signal(false);
  // Índice da fase recém-concluída enquanto a comemoração está na tela.
  readonly celebrating = signal<number | null>(null);
  readonly error = signal("");
  readonly acknowledged = signal(false);
  readonly activeDay = signal<DayId>("MON");
  readonly sectorSearch = signal("");
  readonly moments = MOMENTS;
  readonly topics = TOPICS;
  readonly formats = FORMATS;
  readonly days = DAYS;
  readonly periods = PERIODS;
  readonly cities = CITIES;
  readonly cadences = CADENCES;
  readonly capacities = CAPACITIES;
  readonly steps = PROFILE_STEPS;
  readonly lastStep = LAST_STEP;
  readonly topicLabel = topicLabel;
  readonly slotLabel = slotLabel;
  readonly confetti = Array.from({ length: 14 }, (_, index) => index);
  readonly form = new FormGroup({
    kind: new FormControl<ProfileKind>("STARTUP", { nonNullable: true }),
    moments: new FormControl<MomentId[]>([], { nonNullable: true }),
    sectors: new FormControl<SectorId[]>([], { nonNullable: true }),
    topics: new FormControl<TopicId[]>([], { nonNullable: true }),
    experience: new FormControl<Partial<Record<TopicId, TopicExperience>>>({}, { nonNullable: true }),
    audiences: new FormControl<AudienceId[]>([], { nonNullable: true }),
    backgrounds: new FormControl<BackgroundId[]>([], { nonNullable: true }),
    capacity: new FormControl<CapacityId | "">("", { nonNullable: true }),
    format: new FormControl<MeetingFormat | "">("", { nonNullable: true }),
    cityId: new FormControl("", { nonNullable: true }),
    availability: new FormControl<AvailabilitySlot[]>([], { nonNullable: true }),
    cadence: new FormControl<Cadence | "">("", { nonNullable: true }),
    accepting: new FormControl(true, { nonNullable: true }),
    projectName: new FormControl("", { nonNullable: true, validators: Validators.maxLength(60) }),
  });
  private readonly changes = toSignal(this.form.valueChanges, { initialValue: this.form.value });
  readonly draft = computed(() => { this.changes(); return this.form.getRawValue(); });
  readonly completed = computed(() => this.steps.filter((_, step) => stepIsComplete(this.draft(), step)).length);
  readonly isStartup = computed(() => this.kind() === "STARTUP");
  readonly sectorLimit = computed(() => SECTOR_LIMIT[this.kind()]);
  readonly topicLimit = computed(() => TOPIC_LIMIT[this.kind()]);
  readonly audienceLimit = computed(() => AUDIENCE_LIMIT[this.kind()]);
  readonly backgroundLimit = computed(() => BACKGROUND_LIMIT[this.kind()]);
  readonly audiences = computed(() => AUDIENCES.filter((item) => this.isStartup() || !item.startupOnly));
  readonly backgrounds = computed(() => BACKGROUNDS.filter((item) => this.isStartup() || !item.startupOnly));
  readonly sectors = computed(() => {
    const term = normalize(this.sectorSearch().trim());
    return term ? SECTORS.filter((sector) => normalize(sector.label).includes(term)) : SECTORS;
  });
  readonly phaseNames = computed(() => PROFILE_PHASES[this.kind()]);
  readonly phase = computed(() => phaseOf(this.step()));
  readonly phaseProgress = computed(() => this.phaseNames().map((name, phase) => {
    const celebrated = this.celebrating();
    if (this.reviewing() || (celebrated !== null && phase <= celebrated)) return { name, percent: 100 };
    if (phase !== this.phase()) return { name, percent: phase < this.phase() ? 100 : 0 };
    const answered = this.step() - phase * 2 + (stepIsComplete(this.draft(), this.step()) ? 1 : 0);
    return { name, percent: answered * 50 };
  }));
  readonly activeDayLabel = computed(() => DAYS.find((day) => day.id === this.activeDay())!.full);
  readonly title = computed(() => {
    const celebrated = this.celebrating();
    if (celebrated !== null) return PHASE_DONE[this.kind()][celebrated];
    if (this.reviewing()) return "Seu perfil ficou assim. Vamos conferir?";
    return [
      this.isStartup() ? "O que você já tem da sua ideia?" : "Em quais momentos da ideação você pode ajudar?",
      this.isStartup() ? "Em que universo sua ideia vive?" : "Em quais universos você tem experiência?",
      this.isStartup() ? "Se um mentor aparecesse agora, o que você pediria?" : "Em que você pode dar uma força?",
      this.isStartup() ? "Quem vai amar sua solução?" : "Com quem você já trabalhou?",
      "Como você prefere conversar?",
      "Quando cabe uma boa conversa?",
    ][this.step()];
  });
  // Resposta curta do Lumen depois que a etapa atual foi respondida.
  readonly reaction = computed<string | null>(() => {
    const answers = this.draft();
    if (this.editing() || !stepIsComplete(answers, this.step())) return null;
    const startup = this.isStartup();
    switch (this.step()) {
      case 0: return startup ? "Toda grande startup começou exatamente aí." : "Ótimo, já sabemos em que fase você brilha.";
      case 1:
        if (answers.sectors.includes("GENERAL")) return "Generalistas são ouro para quem está começando.";
        if (answers.sectors.includes("DISCOVERING")) return "Tudo bem! Um mentor pode te ajudar a enxergar o seu mercado.";
        return startup ? "Boa! Isso ajuda a achar quem conhece esse universo." : "Anotado no seu perfil.";
      case 2:
        if (!startup) return "Experiência prática vale ouro para quem está começando.";
        return answers.topics.includes("VALIDATION") ? "Boa! Validar o problema cedo evita o erro mais comum das startups." : "Anotado! Vamos atrás de quem já fez isso na prática.";
      case 3:
        if (!startup) return "Vamos te apresentar a quem precisa da sua experiência.";
        return answers.audiences.includes("UNKNOWN") ? "Tudo bem, um mentor pode te ajudar a descobrir." : "Perfeito, isso afina bastante a busca.";
      case 4: return answers.format === "ONLINE" ? "Online abre portas para " + (startup ? "mentores" : "startups") + " do Brasil todo." : "Vamos priorizar quem está perto de você.";
      default: return "Constância vale mais que intensidade.";
    }
  });
  readonly message = computed(() => {
    const celebrated = this.celebrating();
    if (celebrated !== null) return "Fase " + (celebrated + 1) + " de 3 concluída. Próxima fase: " + this.phaseNames()[celebrated + 1] + ".";
    if (this.reviewing()) return "Confira suas respostas. Você pode ajustar qualquer etapa antes de concluir.";
    return this.reaction() ?? [
      this.isStartup() ? "Escolha o que melhor descreve seu ponto de partida." : "Escolha os momentos em que você costuma orientar. Pode marcar mais de um.",
      this.isStartup() ? "Escolha até duas áreas. Tudo bem se você ainda estiver descobrindo." : "Escolha até cinco áreas, ou indique que ajuda em qualquer uma.",
      this.isStartup() ? "Escolha sua prioridade. Uma segunda necessidade é opcional. É o que mais pesa no match." : "Até seis especialidades. Depois, conte como você conhece cada uma.",
      this.isStartup() ? "Conte para quem é a solução e o que o seu time já domina." : "Conte seus públicos, sua área e quantas startups você topa acompanhar.",
      "Escolha o que funciona para você. Os detalhes serão combinados na conversa.",
      "Escolha uma frequência e marque os períodos de cada dia em que você pode conversar.",
    ][this.step()];
  });
  readonly pose = computed<LumenPose>(() => {
    if (this.reviewing() || this.celebrating() !== null) return "complete";
    if (this.acknowledged() && this.motion.allowed()) return "confirmed";
    return (["curious", "thinking", "presenting", "curious", "curious", "thinking"] as LumenPose[])[this.step()];
  });
  readonly summary = computed(() => [
    { step: 0, title: "Momento da ideia", value: this.draft().moments.map(momentLabel).join(" · ") },
    { step: 1, title: "Setor e apresentação", value: [this.draft().projectName, ...this.draft().sectors.map(sectorLabel)].filter(Boolean).join(" · ") },
    { step: 2, title: this.isStartup() ? "Necessidades" : "Especialidades", value: this.draft().topics.map((topic, index) => this.describeTopic(topic, index)).join(" · ") },
    { step: 3, title: this.isStartup() ? "Público e equipe" : "Público, área e vagas", value: [...this.draft().audiences.map(audienceLabel), ...this.draft().backgrounds.map(backgroundLabel), ...(this.isStartup() ? [] : [capacityLabel(this.draft().capacity)])].join(" · ") },
    { step: 4, title: "Encontro", value: (FORMATS.find((format) => format.id === this.draft().format)?.label ?? "") + (this.draft().cityId ? " · " + cityLabel(this.draft().cityId) : "") },
    { step: 5, title: "Agenda", value: cadenceLabel(this.draft().cadence) + " · " + this.draft().availability.map(slotLabel).join("; ") },
  ]);
  // Respostas da fase recém-concluída, mostradas como checkpoint antes de seguir.
  readonly phaseSummary = computed(() => this.summary().filter((section) => phaseOf(section.step) === this.celebrating()));
  @ViewChild(LumenGuideComponent) private readonly guide?: LumenGuideComponent;
  @ViewChild("errorSummary") private readonly errorSummary?: ElementRef<HTMLElement>;
  private returnToReview = false;
  private reactionTimer?: ReturnType<typeof setTimeout>;

  constructor() { inject(DestroyRef).onDestroy(() => this.stopReaction()); }
  ngOnInit(): void {
    // Perfis salvos antes das perguntas novas recebem os campos vazios.
    this.form.reset(structuredClone({ ...emptyProfile(this.kind()), ...this.initial() }));
    if (this.editing()) this.step.set(Math.max(0, Math.min(LAST_STEP, this.startStep())));
    this.activeDay.set(this.draft().availability[0]?.day ?? "MON");
  }
  ngAfterViewInit(): void { if (this.editing()) this.guide?.focusQuestion(); }
  selectStep(step: number): void {
    if (this.reviewing()) this.returnToReview = true;
    this.stopReaction();
    this.error.set("");
    this.celebrating.set(null);
    this.reviewing.set(false);
    this.sectorSearch.set("");
    this.step.set(step);
    queueMicrotask(() => this.guide?.focusQuestion());
  }
  selectMoment(id: MomentId): void {
    const selected = this.form.controls.moments.value;
    if (this.isStartup()) this.form.controls.moments.setValue([id]);
    else this.form.controls.moments.setValue(selected.includes(id) ? selected.filter((value) => value !== id) : [...selected, id]);
    this.answerChanged();
  }
  selectSector(id: SectorId): void {
    const special = this.isStartup() ? "DISCOVERING" : "GENERAL";
    const selected = this.form.controls.sectors.value.filter((sector) => sector !== special);
    if (id === special) this.form.controls.sectors.setValue([id]);
    else if (selected.includes(id)) this.form.controls.sectors.setValue(selected.filter((sector) => sector !== id));
    else if (selected.length < this.sectorLimit()) this.form.controls.sectors.setValue([...selected, id]);
    else { this.error.set("Escolha até " + this.sectorLimit() + " áreas. Desmarque uma para trocar."); return; }
    this.answerChanged();
  }
  searchSectors(event: Event): void { this.sectorSearch.set((event.target as HTMLInputElement).value); }
  toggleTopic(id: TopicId): void {
    const selected = this.form.controls.topics.value;
    const maximum = this.topicLimit();
    if (selected.includes(id)) {
      this.form.controls.topics.setValue(selected.filter((topic) => topic !== id));
      const experience = { ...this.form.controls.experience.value };
      delete experience[id];
      this.form.controls.experience.setValue(experience);
    } else if (selected.length < maximum) this.form.controls.topics.setValue([...selected, id]);
    else { this.error.set("Escolha até " + maximum + " assuntos. Desmarque um para trocar."); return; }
    this.answerChanged();
  }
  makePrimary(id: TopicId): void {
    this.form.controls.topics.setValue([id, ...this.draft().topics.filter((topic) => topic !== id)]);
    this.answerChanged();
  }
  chooseExperience(id: TopicId, level: TopicExperience): void {
    this.form.controls.experience.setValue({ ...this.draft().experience, [id]: level });
    this.answerChanged();
  }
  toggleAudience(id: AudienceId): void {
    const current = this.form.controls.audiences.value;
    const selected = current.filter((audience) => audience !== "UNKNOWN");
    if (id === "UNKNOWN") this.form.controls.audiences.setValue(current.includes("UNKNOWN") ? [] : ["UNKNOWN"]);
    else if (selected.includes(id)) this.form.controls.audiences.setValue(selected.filter((audience) => audience !== id));
    else if (selected.length < this.audienceLimit()) this.form.controls.audiences.setValue([...selected, id]);
    else { this.error.set("Escolha até " + this.audienceLimit() + " públicos. Desmarque um para trocar."); return; }
    this.answerChanged();
  }
  toggleBackground(id: BackgroundId): void {
    const selected = this.form.controls.backgrounds.value;
    if (selected.includes(id)) this.form.controls.backgrounds.setValue(selected.filter((item) => item !== id));
    else if (selected.length < this.backgroundLimit()) this.form.controls.backgrounds.setValue([...selected, id]);
    else { this.error.set("Escolha até " + this.backgroundLimit() + " áreas. Desmarque uma para trocar."); return; }
    this.answerChanged();
  }
  chooseCapacity(id: CapacityId): void { this.form.controls.capacity.setValue(id); this.answerChanged(); }
  chooseFormat(format: MeetingFormat): void {
    this.form.controls.format.setValue(format);
    if (format === "ONLINE") this.form.controls.cityId.setValue("");
    this.answerChanged();
  }
  chooseCadence(cadence: Cadence): void { this.form.controls.cadence.setValue(cadence); this.answerChanged(); }
  slotSelected(day: DayId, period: PeriodId): boolean { return this.draft().availability.some((slot) => slot.day === day && slot.period === period); }
  slotCount(day: DayId): number { return this.draft().availability.filter((slot) => slot.day === day).length; }
  toggleSlot(day: DayId, period: PeriodId): void {
    const slots = this.draft().availability;
    this.form.controls.availability.setValue(this.slotSelected(day, period) ? slots.filter((slot) => slot.day !== day || slot.period !== period) : [...slots, { day, period }]);
    this.answerChanged();
  }
  back(): void {
    if (this.celebrating() !== null) { this.celebrating.set(null); queueMicrotask(() => this.guide?.focusQuestion()); return; }
    this.selectStep(this.reviewing() ? LAST_STEP : Math.max(0, this.step() - 1));
  }
  next(): void {
    if (this.celebrating() !== null) { this.selectStep(this.step() + 1); return; }
    const validateAll = this.editing() || this.reviewing() || this.returnToReview;
    let invalidStep = -1;
    if (validateAll) invalidStep = this.steps.findIndex((_, step) => !stepIsComplete(this.draft(), step));
    else if (!stepIsComplete(this.draft(), this.step())) invalidStep = this.step();
    if (this.form.controls.projectName.invalid) invalidStep = 1;
    if (invalidStep >= 0) { this.showInvalidStep(invalidStep); return; }
    this.stopReaction();
    if (this.editing() || this.reviewing()) { this.finished.emit(structuredClone(this.draft())); return; }
    if (this.returnToReview) { this.returnToReview = false; this.reviewing.set(true); queueMicrotask(() => this.guide?.focusQuestion()); return; }
    if (this.step() === LAST_STEP) { this.reviewing.set(true); queueMicrotask(() => this.guide?.focusQuestion()); return; }
    // Ao fechar uma fase, o Lumen comemora antes da próxima pergunta.
    if (phaseOf(this.step() + 1) !== this.phase()) { this.celebrating.set(this.phase()); queueMicrotask(() => this.guide?.focusQuestion()); return; }
    this.selectStep(this.step() + 1);
  }
  private describeTopic(topic: TopicId, index: number): string {
    if (this.isStartup()) {
      const priority = index === 0 ? "Principal: " : "Também busca: ";
      return priority + topicLabel(topic);
    }
    const experience = this.draft().experience[topic] === "PRACTICAL" ? " (experiência prática)" : " (conhecimento para orientar)";
    return topicLabel(topic) + experience;
  }
  private showInvalidStep(step: number): void {
    this.selectStep(step);
    this.error.set([
      "Escolha o momento da ideia para continuar.",
      "Escolha uma área e use até 60 caracteres para o nome da ideia.",
      this.isStartup() ? "Escolha pelo menos uma necessidade." : "Escolha ao menos uma especialidade e indique seu tipo de experiência em cada uma.",
      this.isStartup() ? "Escolha o público e até 3 áreas que o seu time domina." : "Escolha seus públicos, até 2 áreas de formação ou experiência e quantas startups você topa acompanhar.",
      "Escolha a modalidade. Para encontros presenciais, informe a cidade.",
      "Escolha a frequência e pelo menos uma combinação de dia e período.",
    ][step]);
    queueMicrotask(() => this.errorSummary?.nativeElement.focus());
  }
  private answerChanged(): void {
    this.error.set("");
    this.stopReaction();
    if (!this.motion.allowed()) return;
    this.acknowledged.set(true);
    this.reactionTimer = setTimeout(() => this.acknowledged.set(false), 650);
  }
  private stopReaction(): void {
    clearTimeout(this.reactionTimer);
    this.acknowledged.set(false);
  }
}
