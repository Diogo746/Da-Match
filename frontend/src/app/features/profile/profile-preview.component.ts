import { ChangeDetectionStrategy, Component, computed, input } from "@angular/core";
import { ProfileDraft, sectorLabel, topicLabel, cityLabel, FORMATS } from "../../core/profile.models";
import { IconComponent } from "../../shared/icon.component";

@Component({
  selector: "app-profile-preview",
  standalone: true,
  imports: [IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <article class="preview" aria-label="Prévia do seu perfil">
      <div class="preview-cover"><span>BOAS CONEXÕES COMEÇAM AQUI</span><app-icon name="network" /></div>
      <div class="preview-body">
        <span class="preview-avatar" aria-hidden="true">{{ initials() }}</span>
        <span class="preview-kind">{{ draft().kind === 'STARTUP' ? 'Startup · Ideação' : 'Mentor' }}</span>
        <h3>{{ displayName() }}</h3>
        <p>{{ draft().kind === 'STARTUP' ? 'Uma ideia encontrando seu caminho.' : 'Experiência para abrir novos caminhos.' }}</p>
        <div class="preview-tags">
          @for (sector of draft().sectors; track $index) { <span>{{ sectorLabel(sector) }}</span> }
          @if (!draft().sectors.length) { <span class="placeholder">Seu setor</span> }
        </div>
        <div class="preview-detail"><app-icon name="spark" /><span>{{ focus() }}</span></div>
        <div class="preview-detail"><app-icon name="pin" /><span>{{ location() }}</span></div>
        <div class="preview-detail"><app-icon name="clock" /><span>{{ draft().days.length && draft().periods.length ? 'Disponibilidade adicionada' : 'Sua disponibilidade aparece aqui' }}</span></div>
      </div>
    </article>`,
  styles: `
    :host{display:block}.preview{background:var(--surface);border:1px solid var(--border);border-radius:18px;overflow:hidden;box-shadow:0 12px 32px var(--shadow-card)}.preview-cover{display:flex;align-items:center;justify-content:space-between;background:linear-gradient(125deg,var(--preview-cover-start),var(--preview-cover-end));padding:22px 20px 35px;gap:16px}.preview-cover span{font-size:9px;letter-spacing:1.4px;font-weight:700;max-width:145px;line-height:1.7}.preview-cover app-icon{width:30px;height:30px;color:var(--teal)}.preview-body{padding:0 20px 23px;position:relative}.preview-avatar{display:grid;place-items:center;width:52px;height:52px;border:4px solid var(--surface);border-radius:15px;background:var(--navy);color:#c8eddd;font-size:18px;font-weight:700;margin-top:-26px}.preview-kind{display:block;font-size:10px;color:var(--muted);margin-top:12px}.preview h3{font-size:20px;letter-spacing:-.6px;line-height:1.3;margin:7px 0 6px}.preview p{font-size:11px;color:var(--muted);line-height:1.7;margin:0}.preview-tags{display:flex;gap:5px;flex-wrap:wrap;margin:17px 0 22px}.preview-tags span{font-size:10px;padding:5px 8px;border-radius:6px;background:var(--tag-bg);color:var(--tag-text)}.preview-tags .placeholder{border:1px dashed var(--field-border);background:transparent;color:var(--muted)}.preview-detail{display:flex;gap:8px;align-items:flex-start;margin-top:13px;font-size:11px;line-height:1.65;color:var(--text-soft)}.preview-detail app-icon{width:15px;height:15px;margin-top:1px}`,
})
export class ProfilePreviewComponent {
  readonly name = input("");
  readonly draft = input.required<ProfileDraft>();
  readonly sectorLabel = sectorLabel;
  readonly displayName = computed(() => this.draft().kind === "STARTUP" ? this.draft().projectName.trim() || "Sua ideia começa aqui" : this.name() || "Seu perfil de mentor");
  readonly initials = computed(() => this.displayName().split(" ").filter(Boolean).slice(0, 2).map((word) => word[0]).join("").toLocaleUpperCase("pt-BR"));
  readonly focus = computed(() => this.draft().topics.length ? this.draft().topics.map(topicLabel).join(" · ") : "Seu próximo passo ganha forma aqui");
  readonly location = computed(() => {
    const format = this.draft().format;
    if (!format) return "Sua forma de conversar";
    if (format === "PRESENCIAL") return this.draft().cityId ? `Presencial · ${cityLabel(this.draft().cityId)}` : "Presencial · escolha a cidade";
    return FORMATS.find((item) => item.id === format)!.label;
  });
}
