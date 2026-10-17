import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  ViewChild,
  inject,
  signal,
} from "@angular/core";
import { RouterLink } from "@angular/router";
import {
  ProfilesStore,
  DemoProfile,
  ProfileKind,
} from "../../core/profiles.store";
import { IconComponent } from "../../shared/icon.component";
@Component({
  selector: "app-profile-dialog",
  standalone: true,
  imports: [RouterLink, IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: "./profile-dialog.component.html",
  styleUrl: "./profile-dialog.component.css",
})
export class ProfileDialogComponent {
  readonly store = inject(ProfilesStore);
  readonly selected = signal<DemoProfile | null>(null);
  @ViewChild("profileDialog", { static: true })
  private dialog!: ElementRef<HTMLDialogElement>;
  label(kind: ProfileKind): string {
    return { MENTOR: "Mentor", STARTUP: "Startup em ideação" }[kind];
  }
  open(profile: DemoProfile): void {
    this.selected.set(profile);
    setTimeout(() => this.dialog.nativeElement.showModal());
  }
  close(): void {
    this.dialog.nativeElement.close();
  }
}
