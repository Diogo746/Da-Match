import { Injectable, signal } from "@angular/core";
import { ProfileDraft, SessionProfile, profileIsComplete } from "./profile.models";

@Injectable({ providedIn: "root" })
export class ProfileSessionStore {
  private readonly current = signal<SessionProfile | null>(null);
  readonly profile = this.current.asReadonly();

  save(name: string, answers: ProfileDraft): void {
    if (!profileIsComplete(answers)) throw new Error("Perfil incompleto");
    const copy = structuredClone(answers);
    copy.projectName = copy.projectName.trim().slice(0, 60);
    this.current.set({
      name: name.trim(),
      displayName: copy.kind === "STARTUP" ? copy.projectName || `Ideia de ${name.trim().split(" ")[0]}` : name.trim(),
      answers: copy,
    });
  }

  clear(): void {
    this.current.set(null);
  }
}
