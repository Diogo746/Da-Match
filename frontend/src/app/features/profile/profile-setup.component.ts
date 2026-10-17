import { AfterViewInit, ChangeDetectionStrategy, Component, DestroyRef, ElementRef, OnInit, ViewChild, computed, inject, input, output, signal } from "@angular/core";
import { toSignal } from "@angular/core/rxjs-interop";
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from "@angular/forms";
import { CADENCES, CITIES, DAYS, FORMATS, MOMENTS, PERIODS, PROFILE_STEPS, SECTORS, TOPICS, AvailabilitySlot, Cadence, DayId, MeetingFormat, MomentId, PeriodId, ProfileDraft, ProfileKind, SectorId, TopicExperience, TopicId, cadenceLabel, cityLabel, emptyProfile, momentLabel, sectorLabel, slotLabel, stepIsComplete, topicLabel } from "../../core/profile.models";
import { MotionStore } from "../../core/motion.store";
import { IconComponent } from "../../shared/icon.component";
import { LumenGuideComponent } from "../../shared/lumen-guide.component";
import { LumenPose } from "../../shared/lumen.component";
import { ProfilePreviewComponent } from "./profile-preview.component";

@Component({
  selector: "app-profile-setup",
  standalone: true,
  imports: [ReactiveFormsModule, IconComponent, LumenGuideComponent, ProfilePreviewComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: "./profile-setup.component.html",
  styleUrl: "./profile-setup.component.css",
  host: { "[class.mentor-deep]": "kind() === 'MENTOR'", "[class.startup-deep]": "kind() === 'STARTUP'" },
})
export class ProfileSetupComponent implements OnInit, AfterViewInit {
  private readonly motion = inject(MotionStore);
  readonly kind = input<ProfileKind>("STARTUP");
  readonly name = input("");
  readonly initial = input<ProfileDraft | null>(null);
  readonly editing = input(false);
  readonly startStep = input(0);
  readonly finished = output<ProfileDraft>();
  readonly cancelled = output<void>();
  readonly step = signal(0);
  readonly reviewing = signal(false);
  readonly error = signal("");
  readonly acknowledged = signal(false);
  readonly activeDay = signal<DayId>("MON");
  readonly sectors = SECTORS;
  readonly moments = MOMENTS;
  readonly topics = TOPICS;
  readonly formats = FORMATS;
  readonly days = DAYS;
  readonly periods = PERIODS;
  readonly cities = CITIES;
  readonly cadences = CADENCES;
  readonly steps = PROFILE_STEPS;
  readonly topicLabel = topicLabel;
  readonly slotLabel = slotLabel;
  readonly form = new FormGroup({
    kind: new FormControl<ProfileKind>("STARTUP", { nonNullable: true }),
    moments: new FormControl<MomentId[]>([], { nonNullable: true }),
    sectors: new FormControl<SectorId[]>([], { nonNullable: true }),
    topics: new FormControl<TopicId[]>([], { nonNullable: true }),
    experience: new FormControl<Partial<Record<TopicId, TopicExperience>>>({}, { nonNullable: true }),
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
  readonly activeDayLabel = computed(() => DAYS.find((day) => day.id === this.activeDay())!.full);
  readonly title = computed(() => this.reviewing() ? "Seu perfil ficou assim. Vamos conferir?" : [
    this.isStartup() ? "O que você já tem da sua ideia?" : "Em quais momentos da ideação você pode ajudar?",
    this.isStartup() ? "Em qual setor sua ideia se encaixa?" : "Em quais setores você tem experiência?",
    this.isStartup() ? "O que mais ajudaria sua ideia agora?" : "Em quais assuntos você pode orientar?",
    "Como você prefere conversar?",
    "Quando cabe uma boa conversa?",
  ][this.step()]);
  readonly message = computed(() => this.reviewing() ? "Confira suas respostas. Você pode ajustar qualquer etapa antes de concluir." : [
    this.isStartup() ? "Escolha o que melhor descreve seu ponto de partida." : "Escolha os momentos em que você costuma orientar. Pode marcar mais de um.",
    this.isStartup() ? "Uma área já ajuda. Tudo bem se você ainda estiver descobrindo." : "Escolha até três setores, ou indique uma atuação geral.",
    this.isStartup() ? "Escolha sua prioridade. Uma segunda necessidade é opcional." : "Até três especialidades. Depois, conte como você conhece cada uma.",
    "Escolha o que funciona para você. Os detalhes serão combinados na conversa.",
    "Escolha uma frequência e marque os períodos de cada dia em que você pode conversar.",
  ][this.step()]);
  readonly pose = computed<LumenPose>(() => {
    if (this.reviewing()) return "complete";
    if (this.acknowledged() && this.motion.allowed()) return "confirmed";
    return (["curious", "thinking", "presenting", "curious", "thinking"] as LumenPose[])[this.step()];
  });
  readonly summary = computed(() => [
    { step: 0, title: "Momento da ideia", value: this.draft().moments.map(momentLabel).join(" · ") },
    { step: 1, title: "Setor e apresentação", value: [this.draft().projectName, ...this.draft().sectors.map(sectorLabel)].filter(Boolean).join(" · ") },
    { step: 2, title: this.isStartup() ? "Necessidades" : "Especialidades", value: this.draft().topics.map((topic, index) => this.isStartup() ? (index === 0 ? "Principal: " : "Também busca: ") + topicLabel(topic) : topicLabel(topic) + (this.draft().experience[topic] === "PRACTICAL" ? " (experiência prática)" : " (conhecimento para orientar)")).join(" · ") },
    { step: 3, title: "Encontro", value: (FORMATS.find((format) => format.id === this.draft().format)?.label ?? "") + (this.draft().cityId ? " · " + cityLabel(this.draft().cityId) : "") },
    { step: 4, title: "Agenda", value: cadenceLabel(this.draft().cadence) + " · " + this.draft().availability.map(slotLabel).join("; ") },
  ]);
  @ViewChild(LumenGuideComponent) private readonly guide?: LumenGuideComponent;
  @ViewChild("errorSummary") private readonly errorSummary?: ElementRef<HTMLElement>;
  private returnToReview = false;
  private reactionTimer?: ReturnType<typeof setTimeout>;

  constructor() { inject(DestroyRef).onDestroy(() => this.stopReaction()); }
  ngOnInit(): void {
    this.form.reset(structuredClone(this.initial() ?? emptyProfile(this.kind())));
    if (this.editing()) this.step.set(Math.max(0, Math.min(4, this.startStep())));
    this.activeDay.set(this.draft().availability[0]?.day ?? "MON");
  }
  ngAfterViewInit(): void { if (this.editing()) this.guide?.focusQuestion(); }
  selectStep(step: number): void {
    if (this.reviewing()) this.returnToReview = true;
    this.stopReaction();
    this.error.set("");
    this.reviewing.set(false);
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
    const selected = this.form.controls.sectors.value.filter((sector) => sector !== "GENERAL");
    if (this.isStartup() || id === "GENERAL") this.form.controls.sectors.setValue([id]);
    else if (selected.includes(id)) this.form.controls.sectors.setValue(selected.filter((sector) => sector !== id));
    else if (selected.length < 3) this.form.controls.sectors.setValue([...selected, id]);
    else { this.error.set("Escolha até três setores. Desmarque um para trocar."); return; }
    this.answerChanged();
  }
  toggleTopic(id: TopicId): void {
    const selected = this.form.controls.topics.value;
    const maximum = this.isStartup() ? 2 : 3;
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
  back(): void { this.selectStep(this.reviewing() ? 4 : Math.max(0, this.step() - 1)); }
  next(): void {
    const validateAll = this.editing() || this.reviewing() || this.returnToReview;
    let invalidStep = -1;
    if (validateAll) invalidStep = this.steps.findIndex((_, step) => !stepIsComplete(this.draft(), step));
    else if (!stepIsComplete(this.draft(), this.step())) invalidStep = this.step();
    if (this.form.controls.projectName.invalid) invalidStep = 1;
    if (invalidStep >= 0) { this.showInvalidStep(invalidStep); return; }
    this.stopReaction();
    if (this.editing() || this.reviewing()) { this.finished.emit(structuredClone(this.draft())); return; }
    if (this.returnToReview) { this.returnToReview = false; this.reviewing.set(true); queueMicrotask(() => this.guide?.focusQuestion()); return; }
    if (this.step() < 4) this.selectStep(this.step() + 1);
    else { this.reviewing.set(true); queueMicrotask(() => this.guide?.focusQuestion()); }
  }
  private showInvalidStep(step: number): void {
    this.selectStep(step);
    this.error.set([
      "Escolha o momento da ideia para continuar.",
      "Escolha um setor e use até 60 caracteres para o nome da ideia.",
      this.isStartup() ? "Escolha pelo menos uma necessidade." : "Escolha ao menos uma especialidade e indique seu tipo de experiência em cada uma.",
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

