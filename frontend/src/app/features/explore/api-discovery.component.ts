import { HttpErrorResponse } from "@angular/common/http";
import { ChangeDetectionStrategy, Component, DestroyRef, ElementRef, OnInit, ViewChild,
  computed, effect, inject, signal, untracked } from "@angular/core";
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from "@angular/forms";
import { ActivatedRoute, Router, RouterLink } from "@angular/router";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { firstValueFrom } from "rxjs";
import { AuthStateStore } from "../../core/auth-state.store";
import { AuthService } from "../../core/auth.service";
import { DiscoveryService } from "../../core/discovery.service";
import { DiscoveryPage, DiscoveryProfile, DiscoveryQuery, EMPTY_DISCOVERY_QUERY,
  discoveryParams, discoverySectors, readDiscoveryQuery } from "../../core/discovery.models";
import { CITIES, FORMATS, TOPICS, cityLabel, sectorLabel, topicLabel } from "../../core/profile.models";
import { IconComponent } from "../../shared/icon.component";

interface CatalogResult { key: string; loading: boolean; error: string; page: DiscoveryPage | null; }
interface DetailResult { key: string; loading: boolean; error: string; profile: DiscoveryProfile | null; }

@Component({
  selector: "app-api-discovery",
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: "./api-discovery.component.html",
  styleUrl: "./api-discovery.component.css",
})
export class ApiDiscoveryComponent implements OnInit {
  readonly state = inject(AuthStateStore);
  private readonly auth = inject(AuthService);
  private readonly discovery = inject(DiscoveryService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private readonly params = signal(this.route.snapshot.queryParamMap);
  readonly savedOnly = this.route.snapshot.data["savedOnly"] === true;
  readonly sessionStatus = signal<"loading" | "ready" | "error">("loading");
  private readonly restoreErrorSession = signal(-1);
  readonly target = computed(() => {
    const role = this.state.user()?.tipoUsuario;
    if (role === "STARTUP") return "MENTOR" as const;
    if (role === "MENTOR") return "STARTUP" as const;
    return null;
  });
  readonly queryState = computed(() => {
    try { return { query: readDiscoveryQuery(this.params(), this.target() ?? "MENTOR"), error: "" }; }
    catch { return { query: null, error: "Os filtros ou a página no endereço são inválidos. Limpe a pesquisa para continuar." }; }
  });
  private readonly key = computed(() => JSON.stringify([this.state.revision(), this.target(),
    this.params().keys.map(name => [name, this.params().getAll(name)])]));
  private readonly result = signal<CatalogResult | null>(null);
  private readonly detailResult = signal<DetailResult | null>(null);
  readonly catalog = computed(() => this.result()?.key === this.key() ? this.result() : null);
  readonly detail = computed(() => this.detailResult()?.key === this.key() ? this.detailResult() : null);
  readonly sessionError = computed(() => this.sessionStatus() === "error" && this.restoreErrorSession() === this.state.revision());
  readonly sectors = computed(() => discoverySectors(this.target() ?? "MENTOR"));
  readonly topics = TOPICS;
  readonly formats = FORMATS;
  readonly cities = CITIES;
  readonly sectorLabel = sectorLabel;
  readonly topicLabel = topicLabel;
  readonly cityLabel = cityLabel;
  readonly form = new FormGroup({
    busca: new FormControl("", { nonNullable: true, validators: [Validators.maxLength(100)] }),
    setor: new FormControl("", { nonNullable: true }), topico: new FormControl("", { nonNullable: true }),
    formato: new FormControl("", { nonNullable: true }), cidade: new FormControl("", { nonNullable: true }),
  });
  @ViewChild("profileDialog", { static: true }) private dialog?: ElementRef<HTMLDialogElement>;
  @ViewChild("dialogClose", { static: true }) private dialogClose?: ElementRef<HTMLButtonElement>;
  @ViewChild("reloadButton") private reloadButton?: ElementRef<HTMLButtonElement>;
  private listRevision = 0;
  private detailRevision = 0;
  private restoreRevision = 0;
  private destroyed = false;
  private opener: HTMLElement | null = null;

  constructor() {
    effect(() => {
      const key = this.key();
      const status = this.sessionStatus();
      const target = this.target();
      const query = this.queryState().query;
      const restoreSessionChanged = this.restoreErrorSession() !== this.state.revision();
      untracked(() => {
        this.listRevision++;
        this.invalidateDetail();
        this.result.set(null);
        this.form.reset(query ?? EMPTY_DISCOVERY_QUERY);
        if (status === "error" && target && restoreSessionChanged) {
          this.sessionStatus.set("ready");
          return;
        }
        if (status === "ready" && target && query && !this.savedOnly) void this.load(key);
      });
    });
    this.destroyRef.onDestroy(() => {
      this.destroyed = true;
      this.restoreRevision++;
      this.listRevision++;
      this.invalidateDetail();
    });
  }
  ngOnInit(): void {
    this.route.queryParamMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(params => this.params.set(params));
    if (this.savedOnly) this.sessionStatus.set("ready");
    else void this.restoreSession();
  }
  async restoreSession(): Promise<void> {
    const revision = ++this.restoreRevision;
    const session = this.state.revision();
    this.sessionStatus.set("loading");
    try {
      await firstValueFrom(this.auth.me());
      if (!this.destroyed && revision === this.restoreRevision) this.sessionStatus.set("ready");
    } catch (error: unknown) {
      if (this.destroyed || revision !== this.restoreRevision) return;
      if (error instanceof HttpErrorResponse && error.status === 401) {
        if (this.state.revision() === session) this.state.setUser(null);
        this.sessionStatus.set("ready");
      } else if (this.state.revision() !== session) {
        this.sessionStatus.set("ready");
      } else {
        this.restoreErrorSession.set(session);
        this.sessionStatus.set("error");
      }
    }
  }
  async load(key = this.key()): Promise<void> {
    const target = this.target();
    const query = this.queryState().query;
    if (this.destroyed || this.sessionStatus() !== "ready" || !target || !query || this.savedOnly) return;
    const revision = ++this.listRevision;
    this.invalidateDetail();
    this.result.set({ key, loading: true, error: "", page: null });
    try {
      const page = await firstValueFrom(this.discovery.list(target, query));
      if (this.current(key) && revision === this.listRevision) this.result.set({ key, loading: false, error: "", page });
    } catch (error: unknown) {
      if (this.current(key) && revision === this.listRevision) {
        this.result.set({ key, loading: false, error: this.errorMessage(error), page: null });
      }
    }
  }
  async search(): Promise<void> {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    const query = this.queryState().query ?? EMPTY_DISCOVERY_QUERY;
    await this.navigate({ ...query, ...this.form.getRawValue(), busca: this.form.controls.busca.value.trim(), pagina: 0 } as DiscoveryQuery);
  }
  async clear(): Promise<void> { await this.navigate({ ...EMPTY_DISCOVERY_QUERY }); }
  async page(index: number): Promise<void> {
    const query = this.queryState().query;
    if (query && Number.isInteger(index) && index >= 0) await this.navigate({ ...query, pagina: index });
  }
  async open(profile: DiscoveryProfile, event?: Event): Promise<void> {
    const target = this.target();
    if (!target || !this.catalog()?.page?.itens.some(item => item.id === profile.id)) return;
    const key = this.key();
    const revision = ++this.detailRevision;
    this.opener = event?.currentTarget instanceof HTMLElement ? event.currentTarget : null;
    this.detailResult.set({ key, loading: true, error: "", profile: null });
    this.dialog?.nativeElement.showModal();
    this.dialogClose?.nativeElement.focus();
    try {
      const detail = await firstValueFrom(this.discovery.detail(target, profile.id));
      if (this.current(key) && revision === this.detailRevision) {
        this.detailResult.set({ key, loading: false, error: "", profile: detail });
      }
    } catch (error: unknown) {
      if (this.current(key) && revision === this.detailRevision) {
        this.detailResult.set({ key, loading: false, error: this.errorMessage(error, true), profile: null });
        // Remove the obsolete card when a fresh detail can no longer be disclosed.
        this.result.set(null);
      }
    }
  }
  dismiss(): void { this.dialog?.nativeElement.close(); }
  detailClosed(): void {
    this.detailRevision++;
    this.detailResult.set(null);
    if (this.opener?.isConnected) this.opener.focus();
    else if (this.opener) this.reloadButton?.nativeElement.focus();
    this.opener = null;
  }
  formatLabel(value: string): string {
    if (value === "AMBOS") return "Online ou presencial";
    return value === "ONLINE" ? "Online" : "Presencial";
  }
  private current(key: string): boolean { return !this.destroyed && key === this.key(); }
  private invalidateDetail(): void {
    this.detailRevision++;
    this.detailResult.set(null);
    if (this.dialog?.nativeElement.open) this.dialog.nativeElement.close();
    this.opener = null;
  }
  private async navigate(query: DiscoveryQuery): Promise<void> {
    const key = this.key();
    try {
      const changed = await this.router.navigate([], { relativeTo: this.route, queryParams: discoveryParams(query) });
      if (changed && key === this.key()) await this.load();
    } catch {
      if (this.current(key)) this.result.set({ key, loading: false, error: "Não foi possível atualizar a pesquisa. Tente novamente.", page: null });
    }
  }
  private errorMessage(error: unknown, detail = false): string {
    if (error instanceof HttpErrorResponse) {
      if (error.status === 401) return "Sua sessão expirou. Entre novamente para consultar os perfis.";
      if (error.status === 403) return "Sua conta não pode consultar esses perfis. Confira sua sessão e tente novamente.";
      if (error.status === 404 && detail) return "Este perfil não está disponível. Feche o detalhe e atualize a pesquisa.";
      if (error.status === 400) return "A pesquisa não foi aceita. Confira os filtros ou limpe a pesquisa.";
    }
    return "Não foi possível consultar os perfis. Tente novamente.";
  }
}
