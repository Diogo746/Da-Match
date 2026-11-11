import { Injectable } from "@angular/core";
import { Subject } from "rxjs";

@Injectable({ providedIn: "root" })
export class LumenChatTrigger {
  private readonly requests = new Subject<HTMLElement>();
  readonly openings = this.requests.asObservable();
  open(event: Event): void {
    if (event.currentTarget instanceof HTMLElement) this.requests.next(event.currentTarget);
  }
}
