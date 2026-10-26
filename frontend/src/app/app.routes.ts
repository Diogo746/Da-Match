import { Routes } from "@angular/router";
import { ExploreComponent } from "./features/explore/explore.component";
import { AboutComponent } from "./features/about/about.component";
import { ProfileComponent } from "./features/profile/profile.component";
import { authGuard, demoProfileGuard, mentorGuard, startupGuard } from "./core/auth.guard";
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
    loadComponent: () => import("./features/register/register.component").then(module => module.RegisterComponent),
    title: "Cadastro | DaMatch",
  },
  { path: "solicitar-acesso", redirectTo: "cadastro", pathMatch: "full" },
  { path: "meu-perfil", component: ProfileComponent, canActivate: [demoProfileGuard], title: "Meu perfil | DaMatch" },
  { path: "entrar", loadComponent: () => import("./features/auth/login.component").then(module => module.LoginComponent), title: "Entrar | DaMatch" },
  { path: "conta", loadComponent: () => import("./features/auth/account.component").then(module => module.AccountComponent), canActivate: [authGuard], title: "Minha conta | DaMatch" },
  { path: "mentor/perfil", loadComponent: () => import("./features/profile/mentor-profile.component").then(module => module.MentorProfileComponent), canActivate: [mentorGuard], title: "Perfil de mentor | DaMatch" },
  { path: "mentor/questionario", loadComponent: () => import("./features/profile/questionnaire.component").then(module => module.QuestionnaireComponent), canActivate: [mentorGuard], data: { kind: "MENTOR" }, title: "Questionário | DaMatch" },
  { path: "startup/perfil/:startupId/questionario", loadComponent: () => import("./features/profile/questionnaire.component").then(module => module.QuestionnaireComponent), canActivate: [startupGuard], data: { kind: "STARTUP" }, title: "Questionário | DaMatch" },
  { path: "startup/perfil", loadComponent: () => import("./features/profile/startup-profile.component").then(module => module.StartupProfileComponent), canActivate: [startupGuard], title: "Minha startup | DaMatch" },
  {
    path: "como-funciona",
    component: AboutComponent,
    title: "Como funciona | DaMatch",
  },
  { path: "**", redirectTo: "" },
];
