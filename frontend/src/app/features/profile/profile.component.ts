import { ChangeDetectionStrategy, Component, ElementRef, ViewChild, inject, signal } from "@angular/core";
import { RouterLink } from "@angular/router";
import { ProfileDraft, cadenceLabel, cityLabel, momentLabel, sectorLabel, slotLabel, topicLabel } from "../../core/profile.models";
import { ProfileSessionStore } from "../../core/profile-session.store";
import { ProfileSetupComponent } from "./profile-setup.component";
import { ProfilePreviewComponent } from "./profile-preview.component";
import { LumenComponent } from "../../shared/lumen.component";
import { IconComponent } from "../../shared/icon.component";

@Component({
  selector: "app-profile",
  standalone: true,
  imports: [RouterLink, ProfileSetupComponent, ProfilePreviewComponent, LumenComponent, IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: "./profile.component.html",
  styleUrl: "./profile.component.css",
  host: { "[class.mentor-deep]": "session.profile()?.answers?.kind === 'MENTOR'", "[class.startup-deep]": "session.profile()?.answers?.kind === 'STARTUP'" },
})
export class ProfileComponent {
  readonly session = inject(ProfileSessionStore);
  readonly editing = signal(false);
  readonly startStep = signal(0);
  readonly notice = signal("");
  readonly momentLabel = momentLabel;
  readonly cadenceLabel = cadenceLabel;
  readonly slotLabel = slotLabel;
  readonly sectorLabel = sectorLabel;
  readonly topicLabel = topicLabel;
  readonly cityLabel = cityLabel;
  readonly formatLabels = { ONLINE: "Online", PRESENCIAL: "Presencial", AMBOS: "Online ou presencial", "": "A definir" };

  @ViewChild("profileHeading") set profileHeading(heading: ElementRef<HTMLElement> | undefined) {
    heading?.nativeElement.focus();
  }

  edit(step = 0): void {
    this.startStep.set(step);
    this.notice.set("");
    this.editing.set(true);
  }

  save(answers: ProfileDraft): void {
    this.session.save(this.session.profile()!.name, answers);
    this.editing.set(false);
    this.notice.set("Alterações salvas. Suas indicações foram atualizadas.");
  }

  cancel(): void {
    this.editing.set(false);
    this.notice.set("");
  }

  clear(): void {
    this.session.clear();
    this.editing.set(false);
    this.notice.set("");
  }
}
