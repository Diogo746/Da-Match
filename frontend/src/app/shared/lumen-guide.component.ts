import { ChangeDetectionStrategy, Component, ElementRef, ViewChild, input } from "@angular/core";
import { LumenComponent, LumenPose } from "./lumen.component";
@Component({
  selector: "app-lumen-guide",
  standalone: true,
  imports: [LumenComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { "[class.stacked]": "stacked()", "[class.question-guide]": "!!question()" },
  templateUrl: "./lumen-guide.component.html",
  styleUrl: "./lumen-guide.component.css",
})
export class LumenGuideComponent {
  readonly message = input.required<string>();
  readonly question = input("");
  readonly questionId = input("lumen-question");
  readonly compact = input(false);
  readonly stacked = input(false);
  readonly pose = input<LumenPose>("welcome");
  readonly priority = input(false);
  @ViewChild("heading") private readonly heading?: ElementRef<HTMLElement>;
  focusQuestion(): void { this.heading?.nativeElement.focus(); }
}

