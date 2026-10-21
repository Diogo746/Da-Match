import { provideHttpClient } from "@angular/common/http";
import { HttpErrorResponse } from "@angular/common/http";
import { TestBed } from "@angular/core/testing";
import { provideRouter, Router } from "@angular/router";
import { of, throwError } from "rxjs";
import { beforeEach, expect, it, vi } from "vitest";
import { LoginComponent } from "./login.component";
import { AccountComponent } from "./account.component";
import { AuthService } from "../../core/auth.service";
import { AuthStateStore } from "../../core/auth-state.store";
import { REGISTRATION_MODE } from "../../core/registration.config";

const user = { id: "ficticio", nome: "Pessoa Teste", email: "test@example.test", tipoUsuario: "MENTOR" as const };
let auth: { login: ReturnType<typeof vi.fn>; logout: ReturnType<typeof vi.fn> };
let navigate: ReturnType<typeof vi.spyOn>;

beforeEach(() => {
  auth = { login: vi.fn(() => of(user)), logout: vi.fn(() => of(undefined)) };
  TestBed.configureTestingModule({ imports: [LoginComponent, AccountComponent], providers: [
    provideHttpClient(), provideRouter([]), { provide: AuthService, useValue: auth },
    { provide: REGISTRATION_MODE, useValue: "API" },
  ] });
  navigate = vi.spyOn(TestBed.inject(Router), "navigateByUrl").mockResolvedValue(true);
});

it("submits login, clears the password and navigates to the account", async () => {
  const fixture = TestBed.createComponent(LoginComponent);
  fixture.detectChanges();
  fixture.componentInstance.form.setValue({ email: user.email, senha: "ficticia" });
  await fixture.componentInstance.submit();
  expect(auth.login).toHaveBeenCalledWith(user.email, "ficticia");
  expect(fixture.componentInstance.form.controls.senha.value).toBe("");
  expect(navigate).toHaveBeenCalledWith("/conta");
  expect(fixture.componentInstance.loading()).toBe(false);
  fixture.detectChanges();
  expect(fixture.nativeElement.querySelector("#login-password").type).toBe("password");
});

it.each([401, 403, 500])("shows a safe login failure for %s and allows retry", async (status) => {
  auth.login.mockReturnValue(throwError(() => new HttpErrorResponse({ status })));
  const fixture = TestBed.createComponent(LoginComponent);
  fixture.componentInstance.form.setValue({ email: user.email, senha: "ficticia" });
  await fixture.componentInstance.submit();
  fixture.detectChanges();
  expect(fixture.nativeElement.querySelector("[role=alert]").textContent)
    .toContain(status === 401 ? "E-mail ou senha inválidos" : "Não foi possível");
  expect(fixture.componentInstance.loading()).toBe(false);
  expect(navigate).not.toHaveBeenCalled();
});

it("does not submit invalid or already pending login forms", async () => {
  const fixture = TestBed.createComponent(LoginComponent);
  await fixture.componentInstance.submit();
  fixture.componentInstance.form.setValue({ email: user.email, senha: "ficticia" });
  fixture.componentInstance.loading.set(true);
  await fixture.componentInstance.submit();
  expect(auth.login).not.toHaveBeenCalled();
});

it("renders a separate demo page without sending credentials", async () => {
  TestBed.resetTestingModule();
  TestBed.configureTestingModule({ imports: [LoginComponent], providers: [
    provideRouter([]), { provide: AuthService, useValue: auth },
    { provide: REGISTRATION_MODE, useValue: "DEMO" },
  ] });
  const fixture = TestBed.createComponent(LoginComponent);
  fixture.detectChanges();
  expect(fixture.nativeElement.textContent).toContain("demonstração");
  fixture.componentInstance.form.setValue({ email: user.email, senha: "ficticia" });
  await fixture.componentInstance.submit();
  expect(auth.login).not.toHaveBeenCalled();
});

it("shows the authenticated account and logs out", async () => {
  const fixture = TestBed.createComponent(AccountComponent);
  TestBed.inject(AuthStateStore).setUser(user);
  fixture.detectChanges();
  expect(fixture.nativeElement.textContent).toContain(user.nome);
  await fixture.componentInstance.logout();
  expect(auth.logout).toHaveBeenCalledOnce();
  expect(navigate).toHaveBeenCalledWith("/entrar");
  expect(fixture.componentInstance.loading()).toBe(false);
});

it("prevents concurrent logout and explains a failed logout", async () => {
  const fixture = TestBed.createComponent(AccountComponent);
  fixture.componentInstance.loading.set(true);
  await fixture.componentInstance.logout();
  expect(auth.logout).not.toHaveBeenCalled();
  fixture.componentInstance.loading.set(false);
  auth.logout.mockReturnValue(throwError(() => new Error("offline")));
  await fixture.componentInstance.logout();
  fixture.detectChanges();
  expect(fixture.nativeElement.querySelector("[role=alert]").textContent).toContain("Não foi possível concluir a saída");
  expect(fixture.componentInstance.loading()).toBe(false);
});
