import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  ViewChild,
  inject,
  signal,
} from "@angular/core";
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from "@angular/forms";
import { RouterLink } from "@angular/router";
import { firstValueFrom } from "rxjs";
import {
  RegistrationGateway,
  RegistrationReceipt,
  RegistrationError,
} from "../../core/registration.gateway";
import { ProfileKind } from "../../core/profiles.store";
import { IconComponent } from "../../shared/icon.component";
import { ProfileSessionStore } from "../../core/profile-session.store";
import { ProfileDraft } from "../../core/profile.models";
import { ProfileSetupComponent } from "../profile/profile-setup.component";
import { ProfileCompleteComponent } from "../profile/profile-complete.component";
import { LumenGuideComponent } from "../../shared/lumen-guide.component";

@Component({
  selector: "app-register",
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, IconComponent, ProfileSetupComponent, ProfileCompleteComponent, LumenGuideComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: "./register.component.html",
  styleUrl: "./register.component.css",
})
export class RegisterComponent {
  private readonly gateway = inject(RegistrationGateway);
  readonly session = inject(ProfileSessionStore);
  readonly profileReady = signal(false);
  readonly form = new FormGroup({
    nome: new FormControl("", {
      nonNullable: true,
      validators: [
        Validators.required,
        Validators.minLength(4),
        Validators.pattern(/\S/),
      ],
    }),
    email: new FormControl("", {
      nonNullable: true,
      validators: [Validators.required, Validators.email],
    }),
    senha: new FormControl("", {
      nonNullable: true,
      validators: [
        Validators.required,
        Validators.minLength(6),
        Validators.pattern(/\S/),
      ],
    }),
    tipoUsuario: new FormControl<ProfileKind>("STARTUP", {
      nonNullable: true,
      validators: [Validators.required],
    }),
    demoConsent: new FormControl(false, {
      nonNullable: true,
      validators: [Validators.requiredTrue],
    }),
  });
  readonly kinds: { value: ProfileKind; title: string; description: string }[] =
    [
      {
        value: "STARTUP",
        title: "Startup em ideação",
        description:
          "Tenho uma ideia e busco orientação para os primeiros passos.",
      },
      {
        value: "MENTOR",
        title: "Mentor",
        description:
          "Quero orientar projetos e compartilhar minha experiência.",
      },
    ];
  readonly loading = signal(false);
  readonly error = signal("");
  readonly receipt = signal<RegistrationReceipt | null>(null);
  readonly passwordVisible = signal(false);
  @ViewChild("receiptHeading") private receiptHeading?: ElementRef<HTMLElement>;
  @ViewChild("errorSummary") private errorSummary?: ElementRef<HTMLElement>;

  invalid(field: "nome" | "email" | "senha" | "demoConsent"): boolean {
    return (
      this.form.controls[field].touched && this.form.controls[field].invalid
    );
  }

  togglePassword(): void {
    this.passwordVisible.update((visible) => !visible);
  }

  async submit(): Promise<void> {
    if (this.loading() || this.receipt()) return;
    this.error.set("");
    this.form.controls.nome.setValue(this.form.controls.nome.value.trim());
    this.form.controls.email.setValue(
      this.form.controls.email.value.trim().toLowerCase(),
    );
    this.form.markAllAsTouched();
    if (this.form.invalid) {
      this.error.set("Confira os campos indicados antes de continuar.");
      setTimeout(() => this.errorSummary?.nativeElement.focus());
      return;
    }
    this.loading.set(true);
    try {
      const { nome, email, senha, tipoUsuario } = this.form.getRawValue();
      const result = await firstValueFrom(
        this.gateway.register(tipoUsuario, { nome, email, senha }),
      );
      this.form.controls.senha.reset();
      this.passwordVisible.set(false);
      this.receipt.set(result);
      setTimeout(() => this.receiptHeading?.nativeElement.focus());
    } catch (error: unknown) {
      this.error.set(
        error instanceof RegistrationError && error.code === "DUPLICATE_EMAIL"
          ? "Este e-mail já foi usado nesta demonstração. Teste com outro e-mail fictício ou recarregue a página para reiniciar."
          : "Não foi possível concluir o teste. Confira os dados e tente novamente.",
      );
      setTimeout(() => this.errorSummary?.nativeElement.focus());
    } finally {
      this.loading.set(false);
    }
  }

  restart(): void {
    this.profileReady.set(false);
    this.session.clear();
    this.receipt.set(null);
    this.error.set("");
    this.passwordVisible.set(false);
    this.form.reset({ tipoUsuario: "STARTUP", demoConsent: false });
  }

  completeProfile(answers: ProfileDraft): void {
    const receipt = this.receipt();
    if (!receipt || answers.kind !== receipt.tipoUsuario) return;
    this.session.save(receipt.nome, answers);
    this.profileReady.set(true);
  }
}
