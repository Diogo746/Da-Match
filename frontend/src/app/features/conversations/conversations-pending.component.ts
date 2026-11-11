import { Component } from "@angular/core";
import { RouterLink } from "@angular/router";
@Component({selector:"app-conversations-pending",imports:[RouterLink],template:`
<p class="eyebrow">SUA REDE</p><h1>Conversas</h1>
<p>Em breve, você poderá enviar mensagens às suas conexões aceitas.</p>
<a routerLink="/">Voltar para descobrir</a>`})
export class ConversationsPendingComponent {}
