import { ChangeDetectionStrategy, Component, ElementRef, afterRenderEffect, computed, inject, signal, viewChild } from "@angular/core";
import { ActivatedRoute, Router, RouterLink } from "@angular/router";
import { toSignal } from "@angular/core/rxjs-interop";
import { CONVERSATIONS, MENTOR, STARTUP } from "../../core/conversations.gateway";
import { IconComponent } from "../../shared/icon.component";

@Component({
  selector:"app-conversations", imports:[RouterLink,IconComponent],
  templateUrl:"./conversations.component.html", styleUrl:"./conversations.component.css",
  changeDetection:ChangeDetectionStrategy.OnPush,
})
export class ConversationsComponent {
  readonly chat = inject(CONVERSATIONS);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly params = toSignal(this.route.queryParamMap,{initialValue:this.route.snapshot.queryParamMap});
  readonly requested = computed(() => this.params().get("com"));
  readonly selected = computed(() => this.chat.contacts().find(p => p.id === this.requested()));
  readonly entries = computed(() => this.chat.messages(this.selected()?.id ?? ""));
  readonly drafts = signal<Record<string,string>>({});
  readonly draftKey = computed(() => this.chat.viewer() + "/" + this.selected()?.id);
  readonly draft = computed(() => this.drafts()[this.draftKey()] ?? "");
  readonly log = viewChild<ElementRef<HTMLElement>>("log");
  readonly startup = STARTUP;
  readonly mentor = MENTOR;
  private readonly stamp = new Intl.DateTimeFormat("pt-BR",{ day:"2-digit",month:"2-digit",hour:"2-digit",minute:"2-digit" });
  constructor() {
    afterRenderEffect(() => { this.entries(); const log = this.log()?.nativeElement; if (log) log.scrollTop = log.scrollHeight; });
  }
  date(at: number) { return this.stamp.format(at); }
  write(text:string) { this.drafts.update(d => ({...d,[this.draftKey()]:text})); }
  send() { if (this.chat.send(this.selected()?.id ?? "",this.draft())) this.write(""); }
  switch(id:string) {
    const previous = this.chat.viewer();
    const counterpart = this.selected()?.id;
    this.chat.switchViewer(id);
    void this.router.navigate(["/conversas"],{queryParams: counterpart === id ? {com:previous} : {}});
  }
}
