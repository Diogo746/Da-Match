import { ChangeDetectionStrategy, Component, input } from "@angular/core";
import { LumenComponent } from "./lumen.component";

@Component({
  selector: "app-lumen-guide",
  standalone: true,
  imports: [LumenComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { "[class.stacked]": "stacked()" },
  template: `<app-lumen [compact]="compact()" />
    <div class="speech">
      <span class="speaker">Lumen <span>· seu guia</span></span>
      <p class="speech-text">{{ message() }}</p>
    </div>`,
  styles: `
    :host{display:flex;align-items:center;gap:16px;min-width:0}
    app-lumen{width:var(--lumen-size,80px)}
    .speech{position:relative;min-width:0;max-width:var(--lumen-speech-width,380px);padding:12px 15px;background:var(--lumen-bubble-bg);border:1px solid var(--lumen-bubble-border);border-radius:14px;box-shadow:0 3px 14px var(--shadow-soft)}
    .speech::before{content:"";position:absolute;width:10px;height:10px;left:-6px;top:26px;background:var(--lumen-bubble-bg);border-left:1px solid var(--lumen-bubble-border);border-bottom:1px solid var(--lumen-bubble-border);transform:rotate(45deg)}
    .speaker{display:block;color:var(--text-primary);font-size:10px;font-weight:650;margin-bottom:5px}
    .speaker>span{color:var(--muted);font-weight:400}
    p{font-size:12px;line-height:1.75;color:var(--lumen-bubble-text);margin:0}
    .speech-text{animation:speech-enter 180ms ease-out both}
    :host(.stacked){flex-direction:column;gap:18px}
    :host(.stacked) .speech::before{left:calc(50% - 5px);top:-6px;transform:rotate(135deg)}
    @keyframes speech-enter{from{opacity:0}to{opacity:1}}
    @media(max-width:500px){:host{gap:12px}.speech{padding:11px 12px}p{font-size:11px}:host(.stacked){flex-direction:row;--lumen-size:78px}:host(.stacked) .speech::before{left:-6px;top:26px;transform:rotate(45deg)}}
    @media(prefers-reduced-motion:reduce){.speech-text{animation:none}}
  `,
})
export class LumenGuideComponent {
  readonly message = input.required<string>();
  readonly compact = input(false);
  readonly stacked = input(false);
}
