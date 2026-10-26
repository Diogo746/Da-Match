package br.senac.fullstack.perfilmatch.domain;

import br.senac.fullstack.mentor.domain.Mentor;
import br.senac.fullstack.startup.domain.Startup;
import br.senac.fullstack.shared.enums.TipoUsuario;
import br.senac.fullstack.perfilmatch.domain.CodigosPerfilMatch.Momento;
import br.senac.fullstack.perfilmatch.domain.CodigosPerfilMatch.Setor;
import br.senac.fullstack.perfilmatch.domain.CodigosPerfilMatch.Topico;
import br.senac.fullstack.perfilmatch.domain.CodigosPerfilMatch.Experiencia;
import br.senac.fullstack.perfilmatch.domain.CodigosPerfilMatch.Publico;
import br.senac.fullstack.perfilmatch.domain.CodigosPerfilMatch.Formacao;
import br.senac.fullstack.perfilmatch.domain.CodigosPerfilMatch.Capacidade;
import br.senac.fullstack.perfilmatch.domain.CodigosPerfilMatch.Formato;
import br.senac.fullstack.perfilmatch.domain.CodigosPerfilMatch.Frequencia;
import jakarta.persistence.CollectionTable;
import jakarta.persistence.Column;
import jakarta.persistence.ElementCollection;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.MapKeyColumn;
import jakarta.persistence.MapKeyEnumerated;
import jakarta.persistence.OneToOne;
import jakarta.persistence.OrderColumn;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.Check;

import java.time.Instant;
import java.util.ArrayList;
import java.util.EnumMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Entity
@Table(name = "perfil_match")
@Check(constraints = "(startup_id is not null and mentor_id is null and kind = 'STARTUP') or "
        + "(mentor_id is not null and startup_id is null and kind = 'MENTOR')")
@Getter
@Setter
public class PerfilMatch {
    public static final String VERSION = "damatch-profile-v3";
    private static final List<String> CITIES = List.of("PE_RECIFE", "PE_OLINDA", "PE_JABOATAO", "PE_CARUARU",
            "PB_JOAO_PESSOA", "BA_SALVADOR", "CE_FORTALEZA", "RN_NATAL");

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @OneToOne
    @JoinColumn(name = "startup_id", unique = true)
    private Startup startup;

    @OneToOne
    @JoinColumn(name = "mentor_id", unique = true)
    private Mentor mentor;

    @Column(nullable = false, length = 40)
    private String questionnaireVersion;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private TipoUsuario kind;

    @Column(nullable = false, length = 60)
    private String projectName = "";

    @ElementCollection
    @CollectionTable(name = "perfil_match_momento", joinColumns = @JoinColumn(name = "perfil_match_id"))
    @OrderColumn(name = "ordem")
    @Enumerated(EnumType.STRING)
    @Column(name = "codigo", nullable = false)
    private List<Momento> moments = new ArrayList<>();

    @ElementCollection
    @CollectionTable(name = "perfil_match_setor", joinColumns = @JoinColumn(name = "perfil_match_id"))
    @OrderColumn(name = "ordem")
    @Enumerated(EnumType.STRING)
    @Column(name = "codigo", nullable = false)
    private List<Setor> sectors = new ArrayList<>();

    @ElementCollection
    @CollectionTable(name = "perfil_match_topico", joinColumns = @JoinColumn(name = "perfil_match_id"))
    @OrderColumn(name = "ordem")
    @Enumerated(EnumType.STRING)
    @Column(name = "codigo", nullable = false)
    private List<Topico> topics = new ArrayList<>();

    @ElementCollection
    @CollectionTable(name = "perfil_match_publico", joinColumns = @JoinColumn(name = "perfil_match_id"))
    @OrderColumn(name = "ordem")
    @Enumerated(EnumType.STRING)
    @Column(name = "codigo", nullable = false)
    private List<Publico> audiences = new ArrayList<>();

    @ElementCollection
    @CollectionTable(name = "perfil_match_formacao", joinColumns = @JoinColumn(name = "perfil_match_id"))
    @OrderColumn(name = "ordem")
    @Enumerated(EnumType.STRING)
    @Column(name = "codigo", nullable = false)
    private List<Formacao> backgrounds = new ArrayList<>();

    @ElementCollection
    @CollectionTable(name = "perfil_match_experiencia", joinColumns = @JoinColumn(name = "perfil_match_id"))
    @MapKeyEnumerated(EnumType.STRING)
    @MapKeyColumn(name = "topico")
    @Enumerated(EnumType.STRING)
    @Column(name = "experiencia", nullable = false)
    private Map<Topico, Experiencia> experience = new EnumMap<>(Topico.class);

    @Enumerated(EnumType.STRING)
    private Capacidade capacity;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Formato format;

    @Column(nullable = false, length = 40)
    private String cityId = "";

    @ElementCollection
    @CollectionTable(name = "perfil_match_agenda", joinColumns = @JoinColumn(name = "perfil_match_id"))
    @OrderColumn(name = "ordem")
    private List<AgendaPerfilMatch> availability = new ArrayList<>();

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Frequencia cadence;

    @Column(nullable = false)
    private boolean accepting = true;

    @Column(nullable = false)
    private Instant updatedAt;

    public void validar(TipoUsuario expected) {
        require(VERSION.equals(questionnaireVersion), "Versão do questionário inválida.");
        require(kind == expected && (kind == TipoUsuario.STARTUP || kind == TipoUsuario.MENTOR),
                "Tipo do perfil inválido.");
        boolean startupProfile = kind == TipoUsuario.STARTUP;
        validarQuantidades(startupProfile);
        validarSelecoesEspeciais(startupProfile);
        validarCamposDoTipo(startupProfile);
        validarEncontro();
        validarLista(availability, 21);
        require(availability.stream().allMatch(slot -> slot.getDay() != null && slot.getPeriod() != null),
                "Agenda inválida.");
    }

    private void validarQuantidades(boolean startupProfile) {
        validarLista(moments, startupProfile ? 1 : 4);
        validarLista(sectors, startupProfile ? 2 : 5);
        validarLista(topics, startupProfile ? 2 : 6);
        validarLista(audiences, startupProfile ? 2 : 4);
        validarLista(backgrounds, startupProfile ? 3 : 2);
    }

    private void validarSelecoesEspeciais(boolean startupProfile) {
        Setor exclusive = startupProfile ? Setor.DISCOVERING : Setor.GENERAL;
        require(!sectors.contains(startupProfile ? Setor.GENERAL : Setor.DISCOVERING), "Setor inválido.");
        require(!sectors.contains(exclusive) || sectors.size() == 1, "Setor exclusivo.");
        require(!audiences.contains(Publico.UNKNOWN) || startupProfile && audiences.size() == 1,
                "Público desconhecido exclusivo de startup.");
        require(startupProfile || !backgrounds.contains(Formacao.STUDENT), "Formação inválida.");
    }

    private void validarCamposDoTipo(boolean startupProfile) {
        require(experience != null, "Experiência obrigatória.");
        if (startupProfile) {
            require(experience.isEmpty() && capacity == null && accepting, "Campos exclusivos de mentor.");
        } else {
            require(capacity != null && experience.keySet().equals(new java.util.HashSet<>(topics))
                    && experience.values().stream().allMatch(java.util.Objects::nonNull),
                    "Informe capacidade e experiência por especialidade.");
            require(projectName != null && projectName.isEmpty(), "Nome de projeto exclusivo de startup.");
        }
        require(projectName != null && projectName.length() <= 60, "Nome da ideia inválido.");
    }

    private void validarEncontro() {
        require(format != null && cadence != null && cityId != null, "Formato e frequência obrigatórios.");
        require(cityId.isEmpty() || CITIES.contains(cityId), "Cidade inválida.");
        require(format != Formato.PRESENCIAL || !cityId.isEmpty(), "Informe a cidade.");
        require(format != Formato.ONLINE || cityId.isEmpty(), "Encontros online não usam cidade.");
    }

    private static void validarLista(List<?> values, int maximum) {
        require(values != null && !values.isEmpty() && values.size() <= maximum, "Quantidade inválida.");
        require(values.stream().allMatch(java.util.Objects::nonNull)
                && values.stream().distinct().count() == values.size(), "Valores nulos ou repetidos.");
    }

    private static void require(boolean valid, String message) {
        if (!valid) {
            throw new IllegalArgumentException(message);
        }
    }
}
