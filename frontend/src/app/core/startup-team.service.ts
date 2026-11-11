import { API_REQUEST_TIMEOUT_MS } from "./api-timeout";
import { HttpClient, HttpResponse } from "@angular/common/http";
import { Injectable, inject } from "@angular/core";
import { Observable, map, timeout } from "rxjs";
import { CreateInvitation, InvitationPage, StartupInvitation, readInvitation, readInvitationPage } from "./startup-team.models";

@Injectable({ providedIn: "root" })
export class StartupTeamService {
  private readonly http = inject(HttpClient);
  private readonly base = "/api/v1/startups";

  list(page: number, project?: string): Observable<InvitationPage> {
    const path = project === undefined ? "/convites/me" : `/${encodeURIComponent(project)}/convites`;
    return this.http.get<unknown>(`${this.base}${path}`, { params: { pagina: page, tamanho: 20 } })
      .pipe(timeout(API_REQUEST_TIMEOUT_MS), map(value => readInvitationPage(value, page, 20, project)));
  }

  create(project: string, request: CreateInvitation): Observable<StartupInvitation> {
    const body = { solicitacaoId: request.solicitacaoId, email: request.email.trim(), papelMembro: request.papelMembro };
    return this.http.post<unknown>(`${this.base}/${encodeURIComponent(project)}/convites`, body, { observe: "response" })
      .pipe(timeout(API_REQUEST_TIMEOUT_MS), map(response => {
        if (response.status !== 201) throw new Error("Emissão não confirmada.");
        const result = readInvitation(response.body, project);
        if (result.papelMembro !== body.papelMembro) throw new Error("Papel diferente do solicitado.");
        return result;
      }));
  }

  recover(project: string, requestId: string): Observable<StartupInvitation> {
    return this.http.get<unknown>(`${this.base}/${encodeURIComponent(project)}/convites/solicitacoes/${encodeURIComponent(requestId)}`)
      .pipe(timeout(API_REQUEST_TIMEOUT_MS), map(value => readInvitation(value, project)));
  }

  invitation(id: string, project: string): Observable<StartupInvitation> {
    return this.http.get<unknown>(`${this.base}/convites/${encodeURIComponent(id)}`)
      .pipe(timeout(API_REQUEST_TIMEOUT_MS), map(value => readInvitation(value, project, id)));
  }

  act(invitation: StartupInvitation, action: "accept" | "refuse" | "cancel"): Observable<StartupInvitation> {
    const prefix = action === "cancel" ? `/${encodeURIComponent(invitation.startupId)}` : "";
    const suffix = { accept: "aceite", refuse: "recusa", cancel: "cancelamento" }[action];
    const status = { accept: "ACEITO", refuse: "RECUSADO", cancel: "CANCELADO" }[action];
    return this.http.patch<unknown>(`${this.base}${prefix}/convites/${encodeURIComponent(invitation.id)}/${suffix}`, {})
      .pipe(timeout(API_REQUEST_TIMEOUT_MS), map(value => {
        const result = readInvitation(value, invitation.startupId, invitation.id);
        if (result.status !== status || result.papelMembro !== invitation.papelMembro) throw new Error("Ação não confirmada.");
        return result;
      }));
  }

  remove(project: string, userId: string): Observable<void> {
    return this.http.delete(`${this.base}/${encodeURIComponent(project)}/membros/${encodeURIComponent(userId)}`,
      { observe: "response", responseType: "text" }).pipe(timeout(API_REQUEST_TIMEOUT_MS), map((response: HttpResponse<string>) => {
      if (response.status !== 204) throw new Error("Remoção não confirmada.");
    }));
  }
}
