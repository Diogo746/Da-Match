import { ChangeDetectionStrategy, Component, input, model } from "@angular/core";
import { MentorAvailability, MentorPeriod } from "../core/mentor.models";

@Component({
  selector: "app-mentor-availability",
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <fieldset [disabled]="disabled()">
      <legend>Disponibilidade semanal</legend>
      <p>Selecione pelo menos um período. Os horários seguem o fuso de São Paulo.</p>
      @for (day of days; track day.value) {
        <div class="day"><span>{{ day.label }}</span><div class="periods">
          @for (period of periods; track period.value) {
            <label><input type="checkbox" [checked]="selected(day.value, period.value)"
              [attr.aria-label]="day.label + ', ' + period.label"
              (change)="toggle(day.value, period.value, $event)" />{{ period.label }}</label>
          }
        </div></div>
      }
    </fieldset>`,
  styles: `fieldset{border:1px solid var(--border);border-radius:16px;padding:16px;margin:20px 0}legend{font-weight:700;padding:0 6px}p{font-size:.85rem;margin-bottom:14px}.day{display:flex;flex-wrap:wrap;justify-content:space-between;gap:8px;padding:8px 0}.periods{display:flex;flex-wrap:wrap;gap:12px}label{display:flex;align-items:center;gap:5px;font-size:.85rem}input{accent-color:var(--accent)}`,
})
export class MentorAvailabilityComponent {
  readonly value = model<MentorAvailability[]>([]);
  readonly disabled = input(false);
  readonly days = [
    { value: 1, label: "Segunda-feira" }, { value: 2, label: "Terça-feira" },
    { value: 3, label: "Quarta-feira" }, { value: 4, label: "Quinta-feira" },
    { value: 5, label: "Sexta-feira" }, { value: 6, label: "Sábado" }, { value: 7, label: "Domingo" },
  ];
  readonly periods: { value: MentorPeriod; label: string }[] = [
    { value: "MANHA", label: "Manhã" }, { value: "TARDE", label: "Tarde" }, { value: "NOITE", label: "Noite" },
  ];

  selected(day: number, period: MentorPeriod): boolean {
    return this.value().some(item => item.diaSemana === day && item.periodo === period);
  }

  toggle(day: number, period: MentorPeriod, event: Event): void {
    if (this.disabled()) return;
    const remaining = this.value().filter(item => item.diaSemana !== day || item.periodo !== period);
    this.value.set((event.target as HTMLInputElement).checked
      ? [...remaining, { diaSemana: day, periodo: period }] : remaining);
  }
}
