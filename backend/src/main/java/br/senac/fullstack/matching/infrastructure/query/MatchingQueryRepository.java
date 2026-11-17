package br.senac.fullstack.matching.infrastructure.query;

import br.senac.fullstack.descoberta.domain.FiltrosDescoberta;
import br.senac.fullstack.descoberta.infrastructure.query.DescobertaQueryRepository;
import br.senac.fullstack.mentor.domain.Mentor;
import br.senac.fullstack.perfilmatch.domain.PerfilMatch;
import br.senac.fullstack.shared.enums.TipoUsuario;
import br.senac.fullstack.startup.domain.Startup;
import jakarta.persistence.EntityManager;
import org.springframework.stereotype.Repository;

import java.util.NoSuchElementException;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Repository
public class MatchingQueryRepository {
    private final EntityManager entities;
    private final DescobertaQueryRepository descoberta;

    public MatchingQueryRepository(EntityManager entities, DescobertaQueryRepository descoberta) {
        this.entities = entities;
        this.descoberta = descoberta;
    }

    public List<PerfilMatch> publicados(TipoUsuario tipo, UUID id) {
        return descoberta.consultar(tipo, FiltrosDescoberta.ler(Map.of(), tipo), id);
    }

    public Startup startup(UUID id) {
        Startup startup = entities.find(Startup.class, id);
        if (startup == null) {
            throw new NoSuchElementException();
        }
        return startup;
    }

    public Mentor mentorDaConta(UUID usuarioId) {
        return entities.createQuery("select m from Mentor m where m.usuario.id = :usuarioId", Mentor.class)
                .setParameter("usuarioId", usuarioId).setMaxResults(1).getResultList().stream()
                .findFirst().orElseThrow(NoSuchElementException::new);
    }
}
