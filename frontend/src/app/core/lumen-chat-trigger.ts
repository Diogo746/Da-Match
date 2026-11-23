import { Injectable } from "@angular/core";
import { Subject } from "rxjs";

export interface LumenRecommendation {
  startupId: string;
  mentorId: string;
  mentorName: string;
}

@Injectable({ providedIn: "root" })
export class LumenChatTrigger {
  private readonly requests = new Subject<{ button: HTMLElement; recommendation?: LumenRecommendation }>();
  readonly openings = this.requests.asObservable();
  open(event: Event, recommendation?: LumenRecommendation): void {
    if (event.currentTarget instanceof HTMLElement) this.requests.next({ button: event.currentTarget, recommendation });
  }
}
