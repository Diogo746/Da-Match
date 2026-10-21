import { Routes } from "@angular/router";
import { ExploreComponent } from "./features/explore/explore.component";
import { RegisterComponent } from "./features/register/register.component";
import { AboutComponent } from "./features/about/about.component";
import { ProfileComponent } from "./features/profile/profile.component";
export const routes: Routes = [
  { path: "", component: ExploreComponent, title: "Descobrir | DaMatch" },
  {
    path: "salvos",
    component: ExploreComponent,
    data: { savedOnly: true },
    title: "Perfis salvos | DaMatch",
  },
  {
    path: "cadastro",
    component: RegisterComponent,
    title: "Cadastro | DaMatch",
  },
  { path: "solicitar-acesso", redirectTo: "cadastro", pathMatch: "full" },
  { path: "meu-perfil", component: ProfileComponent, title: "Meu perfil | DaMatch" },
  {
    path: "como-funciona",
    component: AboutComponent,
    title: "Como funciona | DaMatch",
  },
  { path: "**", redirectTo: "" },
];
