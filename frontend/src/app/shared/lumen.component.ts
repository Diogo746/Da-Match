import { ChangeDetectionStrategy, Component, computed, input } from "@angular/core";
import rig from "./lumen-rig.json";
export type LumenPose = keyof typeof rig;
let instance = 0;
@Component({
  selector: "app-lumen",
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: "./lumen.component.html",
  styleUrl: "./lumen.component.css",
})
export class LumenComponent {
  readonly compact = input(false);
  readonly pose = input<LumenPose>("welcome");
  readonly drawing = computed(() => rig[this.pose()]);
  readonly prefix = "lumen-rig-" + (++instance) + "-";
  id(part: string) { return this.prefix + part; }
  ref(part: string) { return "url(#" + this.id(part) + ")"; }
  readonly priority = input(false);
}

