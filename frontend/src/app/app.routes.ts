import { Routes } from "@angular/router";
import { ExploreComponent } from "./features/explore/explore.component";
import { AccessComponent } from "./features/access/access.component";
import { AboutComponent } from "./features/about/about.component";
export const routes: Routes = [
  { path: "", component: ExploreComponent, title: "Descobrir | DaMatch" },
  {
    path: "salvos",
    component: ExploreComponent,
    data: { savedOnly: true },
    title: "Perfis salvos | DaMatch",
  },
  {
    path: "solicitar-acesso",
    component: AccessComponent,
    title: "Solicitar acesso | DaMatch",
  },
  {
    path: "como-funciona",
    component: AboutComponent,
    title: "Como funciona | DaMatch",
  },
  { path: "**", redirectTo: "" },
];
