import { HttpErrorResponse } from "@angular/common/http";
import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from "@angular/core";
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from "@angular/forms";
import { RouterLink } from "@angular/router";
import { firstValueFrom } from "rxjs";
import { AuthStateStore } from "../../core/auth-state.store";
import { STARTUP_FIELDS, STARTUP_STATUS_LABELS, StartupProfile, StartupValidationStatus } from "../../core/startup.models";
import { StartupService } from "../../core/startup.service";

@Component({
  selector: "app-startup-profile",
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: "./startup-profile.component.html",
  styleUrl: "./startup-profile.component.css",
})
export class StartupProfileComponent implements OnInit {
  readonly state = inject(AuthStateStore);
  private readonly startups = inject(StartupService);
  private readonly records = signal<StartupProfile[]>([]);
  readonly profiles = computed(() => this.records().filter(profile => this.belongsToSession(profile)));
  readonly selectedId = signal("");
  readonly profile = computed(() => this.profiles().find(profile => profile.id === this.selectedId()) ?? null);
  readonly canEdit = computed(() => this.profile()?.membros.some(member =>
    member.usuarioId === this.state.user()?.id && ["FUNDADOR", "REPRESENTANTE"].includes(member.papelMembro)) ?? false);
  readonly fields = STARTUP_FIELDS;
  readonly statusLabels = STARTUP_STATUS_LABELS;
  readonly statuses = Object.entries(STARTUP_STATUS_LABELS);
  readonly loading = signal(false);
  readonly loaded = signal(false);
  readonly busy = signal(false);
  readonly editing = signal(false);
  readonly uncertain = signal(false);
  readonly error = signal("");
  readonly message = signal("");
  readonly form = new FormGroup({
    nomeProvisorio: this.textControl(255), pitchCurto: this.textControl(255),
    problemaCentral: this.textControl(5000), solucaoProposta: this.textControl(5000),
    publicoAlvo: this.textControl(255), modeloDeNegocio: this.textControl(255),
    statusValidacao: new FormControl<StartupValidationStatus>("APENAS_IDEIA", { nonNullable: true,
      validators: [Validators.required, Validators.pattern(/^(APENAS_IDEIA|PESQUISA_MERCADO)$/)] }),
  });

  ngOnInit(): void { void this.load(); }

  async load(): Promise<void> {
    if (this.loading() || this.busy() || this.state.user()?.tipoUsuario !== "STARTUP") return;
    const actorId = this.state.user()?.id;
    this.loading.set(true);
    this.error.set("");
    this.message.set("");
    try {
      const profiles = await firstValueFrom(this.startups.mine());
      if (actorId !== this.state.user()?.id || profiles.some(profile => !this.belongsToSession(profile)) ||
          new Set(profiles.map(profile => profile.id)).size !== profiles.length) throw new Error("Resposta inválida.");
      this.records.set(profiles);
      this.selectedId.set(profiles.find(profile => profile.id === this.selectedId())?.id ?? profiles[0]?.id ?? "");
      this.uncertain.set(false);
      this.loaded.set(true);
      this.cancel();
    } catch (error: unknown) {
      this.records.set([]);
      this.editing.set(false);
      this.form.reset();
      this.showError(error, false);
    } finally { this.loading.set(false); }
  }

  select(id: string): void {
    if (this.busy() || this.loading() || this.editing() || this.uncertain() || !this.profiles().some(profile => profile.id === id)) return;
    this.selectedId.set(id);
    this.error.set("");
    this.message.set("");
  }

  edit(): void {
    if (!this.canEdit() || this.busy() || this.loading() || this.uncertain()) return;
    this.cancel();
    this.message.set("");
    this.error.set("");
    this.editing.set(true);
  }

  cancel(): void {
    if (this.busy()) return;
    const profile = this.profile();
    this.form.reset(profile ?? {});
    this.editing.set(false);
  }

  invalid(field: keyof typeof this.form.controls): boolean {
    const control = this.form.controls[field];
    return control.touched && control.invalid;
  }

  async save(): Promise<void> {
    const profile = this.profile();
    if (!profile || !this.editing() || !this.canEdit() || this.busy() || this.loading() || this.uncertain()) return;
    this.form.markAllAsTouched();
    this.error.set("");
    this.message.set("");
    if (this.form.invalid) { this.error.set("Revise os campos indicados antes de salvar."); return; }
    const actorId = this.state.user()?.id;
    this.busy.set(true);
    try {
      const saved = await firstValueFrom(this.startups.update(profile.id, this.form.getRawValue()));
      if (actorId !== this.state.user()?.id || saved.id !== profile.id || !this.belongsToSession(saved)) throw new Error("Resposta inválida.");
      this.records.update(profiles => profiles.map(item => item.id === saved.id ? saved : item));
      this.form.reset(saved);
      this.editing.set(false);
      this.message.set("Dados da startup salvos com sucesso.");
    } catch (error: unknown) { this.showError(error, true); }
    finally { this.busy.set(false); }
  }

  private belongsToSession(profile: StartupProfile): boolean {
    const user = this.state.user();
    return user?.tipoUsuario === "STARTUP" && profile.membros.some(member => member.usuarioId === user.id);
  }

  private textControl(maxLength: number): FormControl<string> {
    return new FormControl("", { nonNullable: true,
      validators: [Validators.required, Validators.pattern(/\S/), Validators.maxLength(maxLength)] });
  }

  private showError(error: unknown, write: boolean): void {
    if (error instanceof HttpErrorResponse) {
      if (error.status === 401) {
        this.records.set([]);
        this.form.reset();
        this.editing.set(false);
        this.state.setUser(null);
        this.error.set("Sua sessão expirou. Entre novamente para continuar.");
        return;
      }
      if (error.status === 403) {
        this.error.set("Sem permissão ou proteção do envio expirada. Recarregue para conferir seu acesso."); return;
      }
      if (error.status === 404) {
        this.records.set([]);
        this.editing.set(false);
        this.form.reset();
        this.error.set("A startup não está disponível. Recarregue para conferir seus vínculos."); return;
      }
      if (error.status === 400) { this.error.set("O servidor não aceitou os dados. Revise o preenchimento."); return; }
    }
    this.uncertain.set(write || this.uncertain());
    this.error.set(write
      ? "Não foi possível confirmar a alteração. Recarregue os dados para conferir o resultado antes de editar novamente."
      : "Não foi possível carregar suas startups. Tente recarregar os dados.");
  }
}
