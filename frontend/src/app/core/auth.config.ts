import { InjectionToken } from "@angular/core";
import { environment } from "../../environments/environment";

// Empty means same-origin/proxy. Configure an exact API origin at build time for cross-origin deployments.
export const API_BASE_URL = new InjectionToken<string>("apiBaseUrl", {
  providedIn: "root",
  factory: () => environment.apiBaseUrl.replace(/\/$/, ""),
});
