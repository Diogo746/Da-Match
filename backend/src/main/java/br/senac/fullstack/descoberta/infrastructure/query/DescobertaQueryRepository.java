package br.senac.fullstack.descoberta.infrastructure.query;

import br.senac.fullstack.descoberta.domain.FiltrosDescoberta;
import br.senac.fullstack.mentor.domain.enums.StatusPerfilMentor;
import br.senac.fullstack.perfilmatch.domain.CodigosPerfilMatch.Formato;
import br.senac.fullstack.perfilmatch.domain.PerfilMatch;
import br.senac.fullstack.shared.enums.TipoUsuario;
import br.senac.fullstack.startup.domain.enums.StatusPerfilStartup;
import jakarta.persistence.EntityManager;
import jakarta.persistence.criteria.CriteriaBuilder;
import jakarta.persistence.criteria.CriteriaQuery;
import jakarta.persistence.criteria.JoinType;
import jakarta.persistence.criteria.Predicate;
import jakarta.persistence.criteria.Root;
import org.springframework.stereotype.Repository;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Repository
public class DescobertaQueryRepository {
    private static final int LOTE = 128;
    private static final List<String> COLECOES = List.of("moments", "sectors", "topics", "audiences",
            "backgrounds", "experience", "availability");
    private final EntityManager entities;

    public DescobertaQueryRepository(EntityManager entities) {
        this.entities = entities;
    }

    public List<PerfilMatch> consultar(TipoUsuario tipo, FiltrosDescoberta filtros, UUID id) {
        CriteriaBuilder builder = entities.getCriteriaBuilder();
        CriteriaQuery<PerfilMatch> query = builder.createQuery(PerfilMatch.class);
        Root<PerfilMatch> root = query.from(PerfilMatch.class);
        String origem = tipo == TipoUsuario.MENTOR ? "mentor" : "startup";
        if (tipo == TipoUsuario.MENTOR) {
            var mentor = root.fetch(origem);
            mentor.fetch("usuario");
            mentor.fetch("disponibilidades", JoinType.LEFT);
        } else {
            root.fetch(origem);
        }
        List<Predicate> condicoes = new ArrayList<>();
        Object publicado = tipo == TipoUsuario.MENTOR ? StatusPerfilMentor.PUBLICADO : StatusPerfilStartup.PUBLICADO;
        condicoes.add(builder.equal(root.get(origem).get("status"), publicado));
        if (id != null) {
            condicoes.add(builder.equal(root.get(origem).get("id"), id));
        }
        filtrar(builder, root, filtros, condicoes);
        query.select(root).distinct(true).where(condicoes.toArray(Predicate[]::new));
        List<PerfilMatch> perfis = entities.createQuery(query).getResultList();
        carregarColecoes(perfis);
        return perfis;
    }

    private void filtrar(CriteriaBuilder builder, Root<PerfilMatch> root, FiltrosDescoberta filtros,
            List<Predicate> condicoes) {
        if (filtros.setor() != null) {
            condicoes.add(builder.isMember(filtros.setor(), root.get("sectors")));
        }
        if (filtros.topico() != null) {
            condicoes.add(builder.isMember(filtros.topico(), root.get("topics")));
        }
        if (!filtros.cidade().isEmpty()) {
            condicoes.add(builder.equal(root.get("cityId"), filtros.cidade()));
        }
        if (filtros.formato() != null) {
            var formato = root.get("format");
            condicoes.add(formato.in(filtros.formato(), Formato.AMBOS));
        }
    }

    private void carregarColecoes(List<PerfilMatch> perfis) {
        for (int inicio = 0; inicio < perfis.size(); inicio += LOTE) {
            List<UUID> ids = perfis.subList(inicio, Math.min(inicio + LOTE, perfis.size())).stream()
                    .map(PerfilMatch::getId).toList();
            for (String colecao : COLECOES) {
                CriteriaQuery<PerfilMatch> query = entities.getCriteriaBuilder().createQuery(PerfilMatch.class);
                Root<PerfilMatch> root = query.from(PerfilMatch.class);
                root.fetch(colecao, JoinType.LEFT);
                query.select(root).distinct(true).where(root.get("id").in(ids));
                entities.createQuery(query).getResultList();
            }
        }
    }
}
