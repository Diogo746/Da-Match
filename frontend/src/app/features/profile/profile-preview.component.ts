import { ChangeDetectionStrategy, Component, computed, input } from "@angular/core";
import { ProfileDraft, sectorLabel, topicLabel, cityLabel, momentLabel, cadenceLabel, FORMATS } from "../../core/profile.models";
import { IconComponent } from "../../shared/icon.component";
@Component({
  selector: "app-profile-preview",
  standalone: true,
  imports: [IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: "./profile-preview.component.html",
  styleUrl: "./profile-preview.component.css",
})
export class ProfilePreviewComponent {
  readonly name = input("");
  readonly draft = input.required<ProfileDraft>();
  readonly sectorLabel = sectorLabel;
  readonly tone = computed(() => this.draft().kind === "MENTOR" ? "mentor-deep" : "startup-deep");
  readonly displayName = computed(() => this.draft().kind === "STARTUP" ? this.draft().projectName.trim() || "Sua ideia começa aqui" : this.name() || "Seu perfil de mentor");
  readonly initials = computed(() => this.displayName().split(" ").filter(Boolean).slice(0, 2).map((word) => word[0]).join("").toLocaleUpperCase("pt-BR"));
  readonly focus = computed(() => this.draft().topics.length ? this.draft().topics.map(topicLabel).join(" · ") : "Seu próximo passo ganha forma aqui");
  readonly moment = computed(() => this.draft().moments.length ? this.draft().moments.map(momentLabel).join(" · ") : "Seu momento aparece aqui");
  readonly schedule = computed(() => this.draft().availability.length ? this.draft().availability.length + " janelas · " + cadenceLabel(this.draft().cadence) : "Sua disponibilidade aparece aqui");
  readonly location = computed(() => {
    const format = this.draft().format;
    if (!format) return "Sua forma de conversar";
    if (format === "PRESENCIAL") return this.draft().cityId ? "Presencial · " + cityLabel(this.draft().cityId) : "Presencial · escolha a cidade";
    return FORMATS.find((item) => item.id === format)!.label;
  });
}

