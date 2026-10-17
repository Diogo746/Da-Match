import { ProfileKind } from "./profile.models";

export type ProfileTone = "mentor-deep" | "mentor-soft" | "startup-deep" | "startup-soft";
// O identificador mantém a variação visual estável ao filtrar ou reordenar o catálogo.
export function profileTone(kind: ProfileKind, id: string): ProfileTone {
  const parity = [...id].reduce((sum, character) => sum + character.charCodeAt(0), 0) % 2;
  return (kind === "MENTOR" ? "mentor-" : "startup-") + (parity ? "soft" : "deep") as ProfileTone;
}

