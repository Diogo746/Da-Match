import { ChangeDetectionStrategy, ChangeDetectorRef, Component, DestroyRef, ElementRef, Injector, computed, effect, inject, signal, viewChild } from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { HttpClient, HttpErrorResponse } from "@angular/common/http";
import { Subscription, timeout } from "rxjs";
import { API_REQUEST_TIMEOUT_MS } from "../../core/api-timeout";
import { TOPICS } from "../../core/profile.models";
import { LumenChatTrigger, LumenRecommendation } from "../../core/lumen-chat-trigger";
import { lumenReply } from "../../core/lumen-assistant";
import { helpTopics } from "../../core/lumen-topics";
import { REGISTRATION_MODE } from "../../core/registration.config";
import { AuthStateStore } from "../../core/auth-state.store";
import { IconComponent } from "../../shared/icon.component";
import { LumenComponent } from "../../shared/lumen.component";

interface Exchange {
  id: number;
  question: string;
  answer: string;
  online?: boolean;
  evidence?: string[];
}
@Component({
  selector: "app-lumen-chat", imports: [IconComponent, LumenComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: "./lumen-chat.component.html", styleUrl: "./lumen-chat.component.css",
})
export class LumenChatComponent {
  private readonly injector = inject(Injector);
  private readonly destroyRef = inject(DestroyRef);
  private request?: Subscription;
  private pendingId?: number;
  private readonly changes = inject(ChangeDetectorRef);
  private readonly dialog = viewChild.required<ElementRef<HTMLDialogElement>>("panel");
  private readonly field = viewChild.required<ElementRef<HTMLInputElement>>("field");
  private readonly log = viewChild<ElementRef<HTMLElement>>("log");
  private opener?: HTMLElement;
  private serial = 0;
  private readonly demo = inject(REGISTRATION_MODE) === "DEMO";
  private readonly identity = computed(() => this.state.user()?.id ?? "");
  private readonly state = inject(AuthStateStore);
  readonly draft = signal("");
  readonly exchanges = signal<Exchange[]>([]);
  readonly pending = signal(false);
  readonly opened = signal(false);
  readonly starters = helpTopics.slice(0, 4).map(topic => topic.prompt);
  constructor() {
    inject(LumenChatTrigger).openings.pipe(takeUntilDestroyed()).subscribe(({ button, recommendation }) => {
      this.show(button);
      if (recommendation) this.explain(recommendation);
    });
    effect(() => { this.identity(); this.reset(); });
  }
  reset() {
    this.request?.unsubscribe();
    this.pendingId = undefined;
    this.pending.set(false);
    this.exchanges.set([]);
    this.draft.set("");
  }

  private explain({ startupId, mentorId, mentorName }: LumenRecommendation): void {
    this.request?.unsubscribe();
    if (this.pendingId !== undefined) this.updateReply(this.pendingId, "Consulta interrompida.");
    const question = `Por que ${mentorName} foi recomendado para minha startup?`;
    const id = this.append(question, "Consultando as fichas da recomendação…", true);
    this.pendingId = id;
    this.pending.set(true);
    const path = `/api/v1/startups/${encodeURIComponent(startupId)}/recomendacoes/${encodeURIComponent(mentorId)}/explicacao`;
    this.request = this.injector.get(HttpClient).post<{ texto: string; referencias: string[] }>(path, null)
      .pipe(timeout(API_REQUEST_TIMEOUT_MS), takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: ({ texto, referencias }) => {
          const evidence = referencias.map(reference => reference === "AGENDA"
            ? "Agenda declarada em comum" : TOPICS.find(topic => topic.id === reference)?.label ?? reference);
          this.updateReply(id, texto, evidence);
        },
        error: (error: unknown) => {
          const message = error instanceof HttpErrorResponse && error.status === 404
            ? "Esta indicação não está mais disponível. Atualize suas recomendações."
            : "A explicação está indisponível agora. Você pode tentar novamente pelo cartão do mentor.";
          this.updateReply(id, message);
        },
      });
  }

  private updateReply(id: number, answer: string, evidence?: string[]): void {
    this.pendingId = undefined;
    this.pending.set(false);
    this.exchanges.update(history => history.map(item => item.id === id ? { ...item, answer, evidence } : item));
  }

  private append(question: string, answer: string, online = false): number {
    const next = { id: ++this.serial, question, answer, online };
    this.exchanges.update(history => [...history.slice(-29), next]);
    this.draft.set("");
    this.field().nativeElement.value = "";
    this.field().nativeElement.focus();
    requestAnimationFrame(() => { const log = this.log()?.nativeElement; if (log) log.scrollTop = log.scrollHeight; });
    return next.id;
  }
  show(button: HTMLElement) {
    this.opener = button;
    this.opened.set(true);
    this.changes.detectChanges();
    this.dialog().nativeElement.showModal();
    this.field().nativeElement.focus();
  }
  close() {
    this.dialog().nativeElement.close();
    this.opened.set(false);
    this.opener?.focus();
  }
  send(value: string) {
    const question = value.trim().slice(0, 360);
    if (!question) return;
    this.append(question, lumenReply(question, this.demo));
  }
}
