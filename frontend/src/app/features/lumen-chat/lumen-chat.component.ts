import { ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, computed, effect, inject, signal, viewChild } from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { LumenChatTrigger } from "../../core/lumen-chat-trigger";
import { lumenReply } from "../../core/lumen-assistant";
import { helpTopics } from "../../core/lumen-topics";
import { REGISTRATION_MODE } from "../../core/registration.config";
import { AuthStateStore } from "../../core/auth-state.store";
import { IconComponent } from "../../shared/icon.component";
import { LumenComponent } from "../../shared/lumen.component";

interface Exchange { id: number; question: string; answer: string; }
@Component({
  selector: "app-lumen-chat", imports: [IconComponent, LumenComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: "./lumen-chat.component.html", styleUrl: "./lumen-chat.component.css",
})
export class LumenChatComponent {
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
  readonly opened = signal(false);
  readonly starters = helpTopics.slice(0, 4).map(topic => topic.prompt);
  constructor() {
    inject(LumenChatTrigger).openings.pipe(takeUntilDestroyed()).subscribe(button => this.show(button));
    effect(() => { this.identity(); this.reset(); });
  }
  reset() { this.exchanges.set([]); this.draft.set(""); }
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
    const next = { id: ++this.serial, question, answer: lumenReply(question, this.demo) };
    this.exchanges.update(history => [...history.slice(-29), next]);
    this.draft.set("");
    this.field().nativeElement.value = "";
    this.field().nativeElement.focus();
    requestAnimationFrame(() => { const log = this.log()?.nativeElement; if (log) log.scrollTop = log.scrollHeight; });
  }
}
