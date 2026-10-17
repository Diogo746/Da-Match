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
import { MatchResult } from "../../core/matching.engine";
import { ProfileSessionStore } from "../../core/profile-session.store";
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
  readonly session = inject(ProfileSessionStore);
  readonly selected = signal<DemoProfile | null>(null);
  readonly matching = signal<MatchResult | null>(null);
  @ViewChild("profileDialog", { static: true })
  private readonly dialog!: ElementRef<HTMLDialogElement>;
  label(kind: ProfileKind): string {
    return { MENTOR: "Mentor", STARTUP: "Startup em ideação" }[kind];
  }
  open(profile: DemoProfile, matching: MatchResult | null = null): void {
    this.selected.set(profile);
    this.matching.set(matching);
    setTimeout(() => this.dialog.nativeElement.showModal());
  }
  close(): void {
    this.dialog.nativeElement.close();
  }
}
