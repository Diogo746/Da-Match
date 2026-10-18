import { ChangeDetectionStrategy, Component, input } from "@angular/core";
export type LumenPose = "welcome" | "curious" | "thinking" | "presenting" | "confirmed" | "complete";
@Component({
  selector: "app-lumen",
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<span class="lumen-art" [class.compact]="compact()" [attr.data-pose]="pose()" aria-hidden="true">
    @for (current of [pose()]; track current) {
      <img [src]="'assets/lumen/' + current + '.png'" width="1254" height="1254" alt=""
        decoding="async" draggable="false" [attr.fetchpriority]="priority() ? 'high' : 'auto'" />
    }
  </span>`,
  styleUrl: "./lumen.component.css",
})
export class LumenComponent {
  readonly compact = input(false);
  readonly pose = input<LumenPose>("welcome");
  readonly priority = input(false);
}

