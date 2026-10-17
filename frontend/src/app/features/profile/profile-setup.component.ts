import { AfterViewInit, ChangeDetectionStrategy, Component, ElementRef, OnInit, ViewChild, computed, input, output, signal } from "@angular/core";
import { toSignal } from "@angular/core/rxjs-interop";
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from "@angular/forms";
import { CITIES, DAYS, FORMATS, PERIODS, SECTORS, TOPICS, DayId, MeetingFormat, PeriodId, ProfileDraft, ProfileKind, SectorId, TopicId, emptyProfile, profileIsComplete, stepIsComplete } from "../../core/profile.models";
import { IconComponent } from "../../shared/icon.component";
import { LumenGuideComponent } from "../../shared/lumen-guide.component";
import { ProfilePreviewComponent } from "./profile-preview.component";

@Component({
  selector: "app-profile-setup",
  standalone: true,
  imports: [ReactiveFormsModule, IconComponent, LumenGuideComponent, ProfilePreviewComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: "./profile-setup.component.html",
  styleUrl: "./profile-setup.component.css",
})
export class ProfileSetupComponent implements OnInit, AfterViewInit {
  readonly kind = input<ProfileKind>("STARTUP");
  readonly name = input("");
  readonly initial = input<ProfileDraft | null>(null);
  readonly editing = input(false);
  readonly startStep = input(0);
  readonly finished = output<ProfileDraft>();
  readonly cancelled = output<void>();
  readonly step = signal(0);
  readonly error = signal("");
  readonly sectors = SECTORS;
  readonly topics = TOPICS;
  readonly formats = FORMATS;
  readonly days = DAYS;
  readonly periods = PERIODS;
  readonly cities = CITIES;
  readonly steps = ["Setor", "Objetivos", "Modalidade", "Agenda"];
  readonly form = new FormGroup({
    kind: new FormControl<ProfileKind>("STARTUP", { nonNullable: true }),
    sectors: new FormControl<SectorId[]>([], { nonNullable: true, validators: Validators.required }),
    topics: new FormControl<TopicId[]>([], { nonNullable: true, validators: Validators.required }),
    format: new FormControl<MeetingFormat | "">("", { nonNullable: true, validators: Validators.required }),
    cityId: new FormControl("", { nonNullable: true }),
    days: new FormControl<DayId[]>([], { nonNullable: true, validators: Validators.required }),
    periods: new FormControl<PeriodId[]>([], { nonNullable: true, validators: Validators.required }),
    accepting: new FormControl(true, { nonNullable: true }),
    projectName: new FormControl("", { nonNullable: true, validators: Validators.maxLength(60) }),
  });
  private readonly changes = toSignal(this.form.valueChanges, { initialValue: this.form.value });
  readonly draft = computed(() => { this.changes(); return this.form.getRawValue(); });
  readonly completed = computed(() => [0, 1, 2, 3].filter((step) => stepIsComplete(this.draft(), step)).length);
  readonly isStartup = computed(() => this.kind() === "STARTUP");
  readonly title = computed(() => [
    this.isStartup() ? "Em qual setor sua ideia se encaixa?" : "Em quais setores você tem experiência?",
    this.isStartup() ? "O que mais ajudaria sua ideia agora?" : "Em que você pode abrir caminhos?",
    "Como você prefere conversar?",
    "Quando cabe uma boa conversa?",
  ][this.step()]);
  readonly message = computed(() => [
    this.editing() ? "Atualize só o que mudou. O restante do seu perfil fica como está." : "Vamos montar seu perfil em quatro passos. Comece pelo seu setor.",
    this.isStartup() ? "Qual apoio faria mais diferença para sua ideia agora?" : "Em quais temas sua experiência pode ajudar uma startup?",
    "Você prefere uma conversa online ou presencial?",
    this.editing() ? "Escolha sua disponibilidade atual. Você pode mudar quando precisar." : "Falta pouco. Quais dias e períodos costumam funcionar para você?",
  ][this.step()]);
  @ViewChild("questionHeading") private readonly questionHeading?: ElementRef<HTMLElement>;
  @ViewChild("errorSummary") private readonly errorSummary?: ElementRef<HTMLElement>;

  ngOnInit(): void {
    this.form.reset(structuredClone(this.initial() ?? emptyProfile(this.kind())));
    if (this.editing()) this.step.set(Math.max(0, Math.min(3, this.startStep())));
  }

  ngAfterViewInit(): void {
    if (this.editing()) this.questionHeading?.nativeElement.focus();
  }

  selectStep(step: number): void {
    this.error.set("");
    this.step.set(step);
    this.questionHeading?.nativeElement.focus();
  }

  selectSector(id: SectorId): void {
    this.error.set("");
    if (this.isStartup() || id === "GENERAL") { this.form.controls.sectors.setValue([id]); return; }
    const selected = this.form.controls.sectors.value.filter((sector) => sector !== "GENERAL");
    if (selected.includes(id)) this.form.controls.sectors.setValue(selected.filter((sector) => sector !== id));
    else if (selected.length < 2) this.form.controls.sectors.setValue([...selected, id]);
    else this.error.set("Escolha até dois setores. Desmarque um para trocar.");
  }

  toggleTopic(id: TopicId): void {
    this.error.set("");
    const selected = this.form.controls.topics.value;
    const maximum = this.isStartup() ? 2 : 3;
    if (selected.includes(id)) this.form.controls.topics.setValue(selected.filter((topic) => topic !== id));
    else if (selected.length < maximum) this.form.controls.topics.setValue([...selected, id]);
    else this.error.set(`Escolha até ${maximum} assuntos. Desmarque um para trocar.`);
  }

  chooseFormat(format: MeetingFormat): void {
    this.form.controls.format.setValue(format);
    if (format === "ONLINE") this.form.controls.cityId.setValue("");
    this.error.set("");
  }

  toggleDay(day: DayId): void {
    const selected = this.form.controls.days.value;
    this.form.controls.days.setValue(selected.includes(day) ? selected.filter((item) => item !== day) : [...selected, day]);
    this.error.set("");
  }

  togglePeriod(period: PeriodId): void {
    const selected = this.form.controls.periods.value;
    this.form.controls.periods.setValue(selected.includes(period) ? selected.filter((item) => item !== period) : [...selected, period]);
    this.error.set("");
  }

  back(): void {
    this.error.set("");
    this.step.update((step) => Math.max(0, step - 1));
    this.questionHeading?.nativeElement.focus();
  }

  next(): void {
    let invalidStep: number | undefined;
    if (this.editing()) {
      invalidStep = [0, 1, 2, 3].find((step) => !stepIsComplete(this.draft(), step));
    } else if (!stepIsComplete(this.draft(), this.step())) {
      invalidStep = this.step();
    }
    if (this.form.controls.projectName.invalid) invalidStep = 0;
    if (invalidStep !== undefined) {
      this.step.set(invalidStep);
      this.error.set(["Escolha um setor e use até 60 caracteres para o nome da ideia.", "Escolha pelo menos um assunto para continuar.", "Escolha a modalidade. Para encontros presenciais, informe a cidade.", "Escolha pelo menos um dia e um período."][this.step()]);
      queueMicrotask(() => this.errorSummary?.nativeElement.focus());
      return;
    }
    this.error.set("");
    if (this.editing()) {
      this.finished.emit(structuredClone(this.draft()));
    } else if (this.step() < 3) {
      this.step.update((step) => step + 1);
      this.questionHeading?.nativeElement.focus();
    } else if (profileIsComplete(this.draft())) this.finished.emit(structuredClone(this.draft()));
  }
}
