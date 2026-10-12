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
  AccessGateway,
  AccessReceipt,
  AccessRequestError,
} from "../../core/access.gateway";
import { ProfileKind } from "../../core/profiles.store";
import { IconComponent } from "../../shared/icon.component";
@Component({
  selector: "app-access",
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: "./access.component.html",
  styleUrl: "./access.component.css",
})
export class AccessComponent {
  private readonly gateway = inject(AccessGateway);
  readonly form = new FormGroup({
    name: new FormControl("", {
      nonNullable: true,
      validators: [
        Validators.required,
        Validators.maxLength(120),
        Validators.pattern(/\S/),
      ],
    }),
    email: new FormControl("", {
      nonNullable: true,
      validators: [
        Validators.required,
        Validators.email,
        Validators.maxLength(254),
      ],
    }),
    kind: new FormControl<ProfileKind>("STARTUP", {
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
        title: "Startup",
        description: "Quero encontrar apoio para meu negócio.",
      },
      {
        value: "MENTOR",
        title: "Mentor",
        description: "Quero compartilhar minha experiência.",
      },
      {
        value: "INVESTIDOR",
        title: "Investidor",
        description: "Quero conhecer novos negócios.",
      },
    ];
  readonly loading = signal(false);
  readonly error = signal("");
  readonly receipt = signal<AccessReceipt | null>(null);
  @ViewChild("receiptHeading") private receiptHeading?: ElementRef<HTMLElement>;
  @ViewChild("errorSummary") private errorSummary?: ElementRef<HTMLElement>;
  invalid(field: "name" | "email" | "demoConsent"): boolean {
    return (
      this.form.controls[field].touched && this.form.controls[field].invalid
    );
  }
  async submit(): Promise<void> {
    if (this.loading()) return;
    this.error.set("");
    this.form.controls.name.setValue(this.form.controls.name.value.trim());
    this.form.controls.email.setValue(this.form.controls.email.value.trim());
    this.form.markAllAsTouched();
    if (this.form.invalid) {
      this.error.set("Confira os campos indicados antes de continuar.");
      setTimeout(() => this.errorSummary?.nativeElement.focus());
      return;
    }
    this.loading.set(true);
    try {
      const { name, email, kind } = this.form.getRawValue();
      this.receipt.set(
        await firstValueFrom(this.gateway.submit({ name, email, kind })),
      );
      setTimeout(() => this.receiptHeading?.nativeElement.focus());
    } catch (error: unknown) {
      this.error.set(
        error instanceof AccessRequestError && error.code === "DUPLICATE_EMAIL"
          ? "Já existe uma solicitação para este e-mail nesta demonstração. Use outro e-mail fictício para testar."
          : "Não foi possível enviar. Confira os dados e tente novamente.",
      );
      setTimeout(() => this.errorSummary?.nativeElement.focus());
    } finally {
      this.loading.set(false);
    }
  }
  restart(): void {
    this.receipt.set(null);
    this.error.set("");
    this.form.reset({ kind: "STARTUP", demoConsent: false });
  }
}
