import { inject } from "@angular/core";
import { REGISTRATION_MODE } from "../../core/registration.config";

export function loadExploreComponent() {
  return inject(REGISTRATION_MODE) === "API"
    ? import("./api-discovery.component").then(module => module.ApiDiscoveryComponent)
    : import("./demo-explore.component").then(module => module.DemoExploreComponent);
}
