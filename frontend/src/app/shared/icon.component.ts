import { ChangeDetectionStrategy, Component, input } from "@angular/core";
const paths = {
  moon: "M20.8 13.1A9 9 0 0 1 10.9 3.2a9 9 0 1 0 9.9 9.9Z",
  sun: "M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8ZM12 2v2m0 16v2M2 12h2m16 0h2M4.9 4.9l1.4 1.4m11.4 11.4 1.4 1.4M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4",
  compass: "M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18Zm4 5-3 5-5 3 3-5 5-3Z",
  bookmark: "M6 4h12v17l-6-4-6 4V4Z",
  network:
    "M9 6h6M6 9v6m12-6v6M9 18h6M3 3h6v6H3V3Zm12 0h6v6h-6V3ZM3 15h6v6H3v-6Zm12 0h6v6h-6v-6Z",
  spark: "m12 3 2.5 6.5L21 12l-6.5 2.5L12 21l-2.5-6.5L3 12l6.5-2.5L12 3Z",
  arrow: "M4 12h15m-6-6 6 6-6 6",
  search: "M10.5 3a7.5 7.5 0 1 0 0 15 7.5 7.5 0 0 0 0-15ZM16 16l5 5",
  pin: "M18 10c0 5-6 11-6 11s-6-6-6-11a6 6 0 1 1 12 0ZM12 7a3 3 0 1 0 0 6 3 3 0 0 0 0-6Z",
  check: "m5 12 4 4L19 6",
  close: "m6 6 12 12M6 18 18 6",
  clock: "M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18ZM12 7v5l3 2",
  shield: "m12 3 8 3v6c0 5-8 9-8 9s-8-4-8-9V6l8-3Zm-4 9 3 3 5-5",
} as const;
@Component({
  selector: "app-icon",
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template:
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path [attr.d]="path()" /></svg>',
  styles:
    ":host{display:inline-flex;width:20px;height:20px;flex-shrink:0;align-items:center}svg{width:100%;height:100%}",
})
export class IconComponent {
  readonly name = input<keyof typeof paths>("arrow");
  path(): string {
    return paths[this.name()];
  }
}
