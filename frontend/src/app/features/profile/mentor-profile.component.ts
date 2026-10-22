import { HttpErrorResponse } from "@angular/common/http";
import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from "@angular/core";
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from "@angular/forms";
import { RouterLink } from "@angular/router";
import { firstValueFrom } from "rxjs";
import { AuthStateStore } from "../../core/auth-state.store";
import { MentorAvailability, MentorProfile, MentorStatus, validAvailability } from "../../core/mentor.models";
import { MentorService } from "../../core/mentor.service";
import { MentorAvailabilityComponent } from "../../shared/mentor-availability.component";

@Component({
  selector: "app-mentor-profile",
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, MentorAvailabilityComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: "./mentor-profile.component.html",
  styleUrl: "./mentor-profile.component.css",
})
export class MentorProfileComponent implements OnInit {
  readonly state = inject(AuthStateStore);
  private readonly mentors = inject(MentorService);
  readonly profile = signal<MentorProfile | null>(null);
  readonly availability = signal<MentorAvailability[]>([]);
  readonly loading = signal(false);
  readonly busy = signal(false);
  readonly error = signal("");
  readonly message = signal("");
  readonly statusLabels: Record<MentorStatus, string> = {
    RASCUNHO: "Rascunho", PUBLICADO: "Publicado", PAUSADO: "Pausado",
  };
  readonly form = new FormGroup({
    biografia: new FormControl("", { nonNullable: true, validators: [Validators.required,
      Validators.maxLength(1000), Validators.pattern(/\S/)] }),
    linkedin: new FormControl("", { nonNullable: true, validators: [Validators.maxLength(255)] }),
    instagram: new FormControl("", { nonNullable: true, validators: [Validators.maxLength(255)] }),
    site: new FormControl("", { nonNullable: true, validators: [Validators.maxLength(255)] }),
  });

  ngOnInit(): void { void this.load(); }

  async load(): Promise<void> {
    if (this.loading() || this.busy() || this.state.user()?.tipoUsuario !== "MENTOR") return;
    this.loading.set(true);
    this.error.set("");
    try { this.applyProfile(await firstValueFrom(this.mentors.me())); }
    catch (error: unknown) { this.showError(error, false); }
    finally { this.loading.set(false); }
  }

  async save(): Promise<void> {
    const profile = this.profile();
    if (!profile || this.busy() || this.loading() || !this.state.user()) return;
    this.error.set("");
    this.message.set("");
    this.form.markAllAsTouched();
    if (this.form.invalid || !validAvailability(this.availability())) {
      this.error.set("Revise os campos e selecione pelo menos um período de disponibilidade.");
      return;
    }
    this.busy.set(true);
    try {
      const values = this.form.getRawValue();
      this.applyProfile(await firstValueFrom(this.mentors.update(profile.id, {
        biografia: values.biografia.trim(), linkedin: values.linkedin.trim(),
        instagram: values.instagram.trim(), site: values.site.trim(), disponibilidades: this.availability(),
      })));
      this.message.set("Perfil salvo com sucesso.");
    } catch (error: unknown) { this.showError(error, true); }
    finally { this.busy.set(false); }
  }

  async changeStatus(status: MentorStatus): Promise<void> {
    const profile = this.profile();
    if (!profile || this.busy() || this.loading() || !this.state.user() || profile.status === status) return;
    this.error.set("");
    this.message.set("");
    if (this.form.dirty || JSON.stringify(this.availability()) !== JSON.stringify(profile.disponibilidades)) {
      this.error.set("Salve suas alterações antes de mudar a publicação do perfil.");
      return;
    }
    this.busy.set(true);
    try {
      this.applyProfile(await firstValueFrom(this.mentors.setStatus(profile.id, status)));
      this.message.set(`Estado do perfil: ${this.statusLabels[status]}.`);
    } catch (error: unknown) { this.showError(error, true); }
    finally { this.busy.set(false); }
  }

  private applyProfile(profile: MentorProfile): void {
    if (profile.usuarioId !== this.state.user()?.id) throw new Error("Perfil não pertence à sessão atual.");
    this.profile.set(profile);
    this.availability.set(profile.disponibilidades.map(item => ({ ...item })));
    this.form.reset({ biografia: profile.biografia, linkedin: profile.linkedin ?? "",
      instagram: profile.instagram ?? "", site: profile.site ?? "" });
  }

  private showError(error: unknown, write: boolean): void {
    if (error instanceof HttpErrorResponse) {
      if (error.status === 401) {
        this.profile.set(null);
        this.state.setUser(null);
        this.form.reset();
        this.availability.set([]);
        this.error.set("Sua sessão expirou. Entre novamente para continuar.");
        return;
      }
      if (error.status === 403) { this.error.set("Sem permissão ou proteção do envio expirada. Confira sua sessão antes de tentar novamente."); return; }
      if (error.status === 404) { this.profile.set(null); this.error.set("Não encontramos um perfil de mentor para esta conta."); return; }
      if (error.status === 400) { this.error.set("O servidor não aceitou os dados. Revise o preenchimento e a disponibilidade."); return; }
    }
    this.error.set(write
      ? "Não foi possível confirmar a alteração. Recarregue o perfil para conferir o resultado antes de enviar novamente."
      : "Não foi possível carregar o perfil. Tente novamente.");
  }
}
