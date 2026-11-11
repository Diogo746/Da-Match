import { Component, signal } from "@angular/core";
import { LumenComponent, LumenPose } from "../../shared/lumen.component";
import { RouterLink } from "@angular/router";
@Component({selector:"app-lumen-preview",imports:[LumenComponent, RouterLink],template:`
<a class="back-link" routerLink="/">← Descobrir</a><p class="eyebrow">ESTÚDIO DO LUMEN</p><h1>Lumen em movimento</h1>
<div class="stage">@for (entry of frame(); track entry.id) { <app-lumen [pose]="entry.pose"/> }</div>
<div class="controls">@for (choice of choices; track choice.pose) {
<button class="button button-secondary" type="button" [attr.aria-pressed]="frame()[0].pose === choice.pose" (click)="play(choice.pose)">{{choice.label}}</button>
}</div><p aria-live="polite">{{caption()}}</p>`,
styles:`:host{display:block;max-width:680px}.eyebrow{margin-top:25px}.stage{display:grid;place-items:center;height:clamp(230px,40vh,370px);background:var(--surface-alt);border:1px solid var(--border);border-radius:20px;--lumen-size:clamp(150px,26vh,240px)}.controls{display:flex;flex-wrap:wrap;gap:10px;margin-top:16px}.controls [aria-pressed=true]{outline:2px solid var(--teal)}`})
export class LumenPreviewComponent {
  readonly choices = [{pose:"welcome",label:"Receber",caption:"Lumen chega e acena."},{pose:"curious",label:"Perguntar",caption:"Lumen abre uma das patas para ouvir sua resposta."},{pose:"presenting",label:"Apresentar",caption:"Lumen indica as opções ao lado."},{pose:"confirmed",label:"Confirmar",caption:"Lumen fecha os olhos e aproxima as patas."},{pose:"waving",label:"Acenar",caption:"Lumen inclina a cabeça e cumprimenta."},{pose:"thinking",label:"Pensar",caption:"Lumen inclina a cabeça e leva a pata ao rosto."},{pose:"complete",label:"Comemorar",caption:"Lumen faz um pequeno arco e abre as asas."}] as const;
  readonly frame = signal([{id:0,pose:"welcome" as LumenPose}]);
  caption(){ return this.choices.find(c => c.pose === this.frame()[0].pose)?.caption; }
  play(pose:LumenPose){this.frame.update(([last])=>[{id:last.id+1,pose}]);}
}
