import { ChangeDetectionStrategy, Component, input } from "@angular/core";

@Component({
  selector: "app-lumen",
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<span class="lumen-art" [class.compact]="compact()" aria-hidden="true">
    <img src="assets/lumen.png" width="1374" height="1145" alt="" decoding="async" draggable="false" />
  </span>`,
  styleUrl: "./lumen.component.css",
})
export class LumenComponent {
  readonly compact = input(false);
}
