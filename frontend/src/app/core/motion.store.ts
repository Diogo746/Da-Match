import { DOCUMENT, DestroyRef, Injectable, computed, inject, signal } from "@angular/core";

@Injectable({ providedIn: "root" })
export class MotionStore {
  private readonly media = inject(DOCUMENT).defaultView?.matchMedia?.("(prefers-reduced-motion: reduce)");
  readonly paused = signal(false);
  private readonly reduced = signal(this.media?.matches ?? false);
  readonly allowed = computed(() => !this.paused() && !this.reduced());
  constructor() {
    const onChange = (event: MediaQueryListEvent) => this.reduced.set(event.matches);
    this.media?.addEventListener?.("change", onChange);
    inject(DestroyRef).onDestroy(() => this.media?.removeEventListener?.("change", onChange));
  }
}

