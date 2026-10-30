package br.senac.fullstack.startup.application.service;

import br.senac.fullstack.shared.security.ResourceAccess;
import br.senac.fullstack.startup.api.dto.AtualizarStatusPerfilStartupRequest;
import br.senac.fullstack.startup.api.dto.PublicacaoStartupResponse;
import br.senac.fullstack.startup.api.mapper.StartupMapper;
import br.senac.fullstack.startup.application.exception.StartupIncompletaException;
import br.senac.fullstack.startup.domain.PendenciaPublicacaoStartup;
import br.senac.fullstack.startup.domain.Startup;
import br.senac.fullstack.startup.domain.enums.StatusPerfilStartup;
import br.senac.fullstack.startup.infrastructure.persistence.repository.StartupRepository;
import jakarta.transaction.Transactional;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.NoSuchElementException;
import java.util.UUID;

@Service
@Transactional
public class PublicacaoStartupService {
    private final StartupRepository startups;
    private final ResourceAccess access;
    private final AptidaoPublicacaoStartupService aptidao;
    private final StartupMapper mapper;

    public PublicacaoStartupService(StartupRepository startups, ResourceAccess access,
            AptidaoPublicacaoStartupService aptidao, StartupMapper mapper) {
        this.startups = startups;
        this.access = access;
        this.aptidao = aptidao;
        this.mapper = mapper;
    }

    public PublicacaoStartupResponse consultar(UUID startupId) {
        Startup startup = buscar(startupId);
        access.requireStartupMember(startup);
        return resposta(startup, access.canManageStartup(startup), aptidao.avaliar(startup));
    }

    public PublicacaoStartupResponse atualizar(UUID startupId, AtualizarStatusPerfilStartupRequest request) {
        Startup startup = buscar(startupId);
        access.requireStartupManager(startup);
        if (request == null || request.status() == null) {
            throw new IllegalArgumentException("O estado do perfil é obrigatório.");
        }
        List<PendenciaPublicacaoStartup> pendencias = aptidao.avaliar(startup);
        if (request.status() == StatusPerfilStartup.PUBLICADO && !pendencias.isEmpty()) {
            throw new StartupIncompletaException(pendencias);
        }
        startup.setStatus(request.status());
        return resposta(startup, true, pendencias);
    }

    private PublicacaoStartupResponse resposta(Startup startup, boolean podeGerenciar,
            List<PendenciaPublicacaoStartup> pendencias) {
        return mapper.toPublicacaoResponse(startup, pendencias.isEmpty(), podeGerenciar, pendencias);
    }

    private Startup buscar(UUID id) {
        if (id == null) {
            throw new IllegalArgumentException("O identificador da startup é obrigatório.");
        }
        return startups.findById(id).orElseThrow(() -> new NoSuchElementException("Startup não encontrada."));
    }
}
