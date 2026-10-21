import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  ViewChild,
  computed,
  inject,
  signal,
} from "@angular/core";
import { toSignal } from "@angular/core/rxjs-interop";
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
  validMentorBiography,
} from "../../core/registration.gateway";
import { REGISTRATION_MODE } from "../../core/registration.config";
import { ProfileKind } from "../../core/profiles.store";
import { IconComponent } from "../../shared/icon.component";
import { ProfileSessionStore } from "../../core/profile-session.store";
import { ProfileDraft } from "../../core/profile.models";
import { ProfileSetupComponent } from "../profile/profile-setup.component";
import { ProfileCompleteComponent } from "../profile/profile-complete.component";
import { LumenGuideComponent } from "../../shared/lumen-guide.component";
import { MentorRegistrationCompleteComponent } from "./mentor-registration-complete.component";

const API_ERRORS = {
  INVALID_INPUT: "Confira os dados do cadastro. O servidor não aceitou o preenchimento enviado.",
  DUPLICATE_EMAIL: "Este e-mail já está cadastrado. Use outro e-mail ou confira sua conta com a equipe.",
  UNSUPPORTED_PROFILE: "O cadastro conectado está disponível apenas para mentores nesta etapa.",
  CONNECTION_ERROR: "Não foi possível conectar ao servidor. Confira se o backend está em execução e tente novamente.",
  CSRF_ERROR: "Não foi possível validar a proteção do envio. Atualize a página e tente novamente.",
  SERVER_ERROR: "O servidor está indisponível para iniciar o cadastro. Tente novamente mais tarde.",
  INVALID_RESPONSE: "O servidor não enviou a proteção esperada. O cadastro não foi enviado. Confira a configuração com a equipe.",
  UNCONFIRMED: "Não foi possível confirmar o resultado do envio. A conta pode ter sido criada. Confira com a equipe antes de cadastrar novamente.",
} as const;

@Component({
  selector: "app-register",
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, IconComponent, ProfileSetupComponent, ProfileCompleteComponent, LumenGuideComponent, MentorRegistrationCompleteComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: "./register.component.html",
  styleUrl: "./register.component.css",
  host: { "[class.mentor-deep]": "isMentor()", "[class.startup-deep]": "!isMentor()" },
})
export class RegisterComponent {
  private readonly gateway = inject(RegistrationGateway);
  readonly apiMode = (inject(REGISTRATION_MODE, { optional: true }) ?? "DEMO") === "API";
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
    tipoUsuario: new FormControl<ProfileKind>(this.apiMode ? "MENTOR" : "STARTUP", {
      nonNullable: true,
      validators: [Validators.required],
    }),
    demoConsent: new FormControl(false, {
      nonNullable: true,
      validators: this.apiMode ? [] : [Validators.requiredTrue],
    }),
    biografia: new FormControl("", { nonNullable: true }),
    linkedin: new FormControl("", { nonNullable: true }),
    instagram: new FormControl("", { nonNullable: true }),
  }, { validators: (form) => {
    if (form.get("tipoUsuario")?.value !== "MENTOR") return null;
    return validMentorBiography(form.get("biografia")?.value ?? "") ? null : { mentorBiography: true };
  } });
  private readonly selectedKind = toSignal(this.form.controls.tipoUsuario.valueChanges, { initialValue: this.form.controls.tipoUsuario.value });
  readonly biography = toSignal(this.form.controls.biografia.valueChanges, { initialValue: "" });
  readonly isMentor = computed(() => this.selectedKind() === "MENTOR");
  readonly kinds: { value: ProfileKind; title: string; description: string }[] =
    [
      {
        value: "STARTUP" as const,
        title: "Startup em ideação",
        description:
          "Tenho uma ideia e busco orientação para os primeiros passos.",
      },
      {
        value: "MENTOR" as const,
        title: "Mentor",
        description:
          "Quero orientar projetos e compartilhar minha experiência.",
      },
    ].filter((kind) => !this.apiMode || kind.value === "MENTOR");
  readonly loading = signal(false);
  readonly error = signal("");
  readonly uncertain = signal(false);
  readonly receipt = signal<RegistrationReceipt | null>(null);
  readonly passwordVisible = signal(false);
  @ViewChild("receiptHeading") private readonly receiptHeading?: ElementRef<HTMLElement>;
  @ViewChild("errorSummary") private readonly errorSummary?: ElementRef<HTMLElement>;

  invalid(field: "nome" | "email" | "senha" | "demoConsent" | "biografia"): boolean {
    if (field === "biografia") return this.form.controls.biografia.touched && this.form.hasError("mentorBiography");
    return (
      this.form.controls[field].touched && this.form.controls[field].invalid
    );
  }

  togglePassword(): void {
    this.passwordVisible.update((visible) => !visible);
  }

  async submit(): Promise<void> {
    if (this.loading() || this.receipt() || this.uncertain()) return;
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
      const request = { nome, email, senha };
      const input = tipoUsuario === "MENTOR"
        ? { ...request, mentor: {
          biografia: this.form.controls.biografia.value,
          linkedin: this.form.controls.linkedin.value,
          instagram: this.form.controls.instagram.value,
        } }
        : request;
      const result = await firstValueFrom(
        this.gateway.register(tipoUsuario, input),
      );
      this.form.controls.senha.reset();
      this.passwordVisible.set(false);
      this.receipt.set(result);
      setTimeout(() => this.receiptHeading?.nativeElement.focus());
    } catch (error: unknown) {
      this.showError(error);
      setTimeout(() => this.errorSummary?.nativeElement.focus());
    } finally {
      this.loading.set(false);
    }
  }

  private showError(error: unknown): void {
    if (this.apiMode) {
      const code = error instanceof RegistrationError ? error.code : "SERVER_ERROR";
      this.uncertain.set(code === "UNCONFIRMED");
      if (this.uncertain()) this.form.controls.senha.reset();
      this.error.set(API_ERRORS[code]);
      return;
    }
    this.error.set(error instanceof RegistrationError && error.code === "DUPLICATE_EMAIL"
      ? "Este e-mail já foi usado nesta demonstração. Teste com outro e-mail fictício ou recarregue a página para reiniciar."
      : "Não foi possível concluir o teste. Confira os dados e tente novamente.");
  }

  restart(): void {
    this.profileReady.set(false);
    this.session.clear();
    this.receipt.set(null);
    this.error.set("");
    this.uncertain.set(false);
    this.passwordVisible.set(false);
    this.form.reset({ tipoUsuario: this.apiMode ? "MENTOR" : "STARTUP", demoConsent: false });
  }

  completeProfile(answers: ProfileDraft): void {
    const receipt = this.receipt();
    if (receipt?.mode !== "DEMO" || answers.kind !== receipt.tipoUsuario) return;
    this.session.save(receipt.nome, answers);
    this.profileReady.set(true);
  }
}
