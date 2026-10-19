package br.senac.fullstack.startup.application.service;

import br.senac.fullstack.startup.api.dto.AdicionarMembroStartupRequest;
import br.senac.fullstack.startup.api.dto.CriarStartupRequest;
import br.senac.fullstack.startup.api.dto.MembroStartupResponse;
import br.senac.fullstack.startup.api.dto.StartupResponse;
import br.senac.fullstack.startup.api.mapper.StartupMapper;
import br.senac.fullstack.startup.domain.MembroStartup;
import br.senac.fullstack.startup.domain.Startup;
import br.senac.fullstack.startup.domain.enums.PapelMembroStartup;
import br.senac.fullstack.startup.infrastructure.persistence.repository.MembroStartupRepository;
import br.senac.fullstack.startup.infrastructure.persistence.repository.StartupRepository;
import br.senac.fullstack.shared.enums.TipoUsuario;
import br.senac.fullstack.usuario.application.service.UsuarioService;
import br.senac.fullstack.usuario.domain.entity.Usuario;
import br.senac.fullstack.usuario.infrastructure.persistence.repository.UsuarioRepository;
import jakarta.transaction.Transactional;
import org.springframework.stereotype.Service;

import java.time.Clock;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.List;
import java.util.NoSuchElementException;
import java.util.UUID;

@Service
public class StartupService {

    private static final ZoneId PLATFORM_TIME_ZONE = ZoneId.of("America/Sao_Paulo");
    private static final Clock PLATFORM_CLOCK = Clock.system(PLATFORM_TIME_ZONE);

    private final StartupRepository startupRepository;
    private final MembroStartupRepository membroRepository;
    private final UsuarioRepository usuarioRepository;
    private final UsuarioService usuarioService;
    private final StartupMapper startupMapper;

    public StartupService(
            StartupRepository startupRepository,
            MembroStartupRepository membroRepository,
            UsuarioRepository usuarioRepository,
            UsuarioService usuarioService,
            StartupMapper startupMapper
    ) {
        this.startupRepository = startupRepository;
        this.membroRepository = membroRepository;
        this.usuarioRepository = usuarioRepository;
        this.usuarioService = usuarioService;
        this.startupMapper = startupMapper;
    }

    @Transactional
    public StartupResponse criarStartup(CriarStartupRequest request) {
        validarRequestCriacao(request);

        Usuario fundador = usuarioService.criarConta(
                request.fundador().nome(),
                request.fundador().email(),
                request.fundador().senha(),
                TipoUsuario.STARTUP
        );
        Startup startup = new Startup();
        startup.setNomeProvisorio(normalizarTextoObrigatorio(request.nomeProvisorio(), "nome provisório"));
        startup.setPitchCurto(normalizarTextoObrigatorio(request.pitchCurto(), "pitch curto"));
        startup.setProblemaCentral(normalizarTextoObrigatorio(request.problemaCentral(), "problema central"));
        startup.setSolucaoProposta(normalizarTextoObrigatorio(request.solucaoProposta(), "solução proposta"));
        startup.setPublicoAlvo(normalizarTextoObrigatorio(request.publicoAlvo(), "público-alvo"));
        startup.setModeloDeNegocio(normalizarTextoObrigatorio(request.modeloDeNegocio(), "modelo de negócio"));
        startup.setStatusValidacao(request.statusValidacao());
        startup.setDataCriacao(Instant.now(PLATFORM_CLOCK));

        Startup startupSalva = startupRepository.save(startup);
        adicionarMembroInterno(startupSalva, fundador, PapelMembroStartup.FUNDADOR);

        return startupMapper.toResponse(startupSalva);
    }

    @Transactional
    public List<StartupResponse> listarStartups() {
        return startupRepository.findAll().stream()
                .map(startupMapper::toResponse)
                .toList();
    }

    @Transactional
    public StartupResponse buscarStartupPorId(UUID startupId) {
        return startupMapper.toResponse(buscarStartup(startupId));
    }

    @Transactional
    public MembroStartupResponse adicionarMembro(
            UUID startupId,
            AdicionarMembroStartupRequest request
    ) {
        if (request == null || request.usuarioId() == null || request.papelMembro() == null) {
            throw new IllegalArgumentException("Usuário e papel do membro são obrigatórios.");
        }

        Startup startup = buscarStartup(startupId);
        Usuario usuario = buscarUsuario(request.usuarioId());

        if (possuiMembro(startup, usuario.getId())) {
            throw new IllegalStateException("O usuário já pertence a esta startup.");
        }

        MembroStartup membro = adicionarMembroInterno(startup, usuario, request.papelMembro());
        return startupMapper.toResponse(membro);
    }

    @Transactional
    public List<MembroStartupResponse> listarMembros(UUID startupId) {
        return buscarStartup(startupId).getMembros().stream()
                .map(startupMapper::toResponse)
                .toList();
    }

    @Transactional
    public void removerMembro(UUID startupId, UUID usuarioId) {
        Startup startup = buscarStartup(startupId);
        MembroStartup membro = startup.getMembros().stream()
                .filter(item -> item.getUsuario().getId().equals(usuarioId))
                .findFirst()
                .orElseThrow(() -> new NoSuchElementException("O usuário não pertence a esta startup."));

        if (startup.getMembros().size() == 1) {
            throw new IllegalStateException("A startup deve possuir ao menos um membro.");
        }

        boolean unicoFundador = membro.getPapelMembro() == PapelMembroStartup.FUNDADOR
                && startup.getMembros().stream()
                .filter(item -> item.getPapelMembro() == PapelMembroStartup.FUNDADOR)
                .count() == 1;

        if (unicoFundador) {
            throw new IllegalStateException("A startup deve possuir ao menos um fundador.");
        }

        startup.getMembros().remove(membro);
    }

    private MembroStartup adicionarMembroInterno(
            Startup startup,
            Usuario usuario,
            PapelMembroStartup papelMembro
    ) {
        MembroStartup membro = new MembroStartup();
        membro.setStartup(startup);
        membro.setUsuario(usuario);
        membro.setPapelMembro(papelMembro);
        membro.setDataEntrada(LocalDate.now(PLATFORM_TIME_ZONE));

        startup.getMembros().add(membro);
        return membroRepository.save(membro);
    }

    private Startup buscarStartup(UUID startupId) {
        if (startupId == null) {
            throw new IllegalArgumentException("O identificador da startup é obrigatório.");
        }

        return startupRepository.findById(startupId)
                .orElseThrow(() -> new NoSuchElementException("Startup não encontrada."));
    }

    private Usuario buscarUsuario(UUID usuarioId) {
        return usuarioRepository.findById(usuarioId)
                .orElseThrow(() -> new NoSuchElementException("Usuário não encontrado."));
    }

    private boolean possuiMembro(Startup startup, UUID usuarioId) {
        return startup.getMembros().stream()
                .anyMatch(membro -> membro.getUsuario().getId().equals(usuarioId));
    }

    private void validarRequestCriacao(CriarStartupRequest request) {
        if (request == null || request.fundador() == null || request.statusValidacao() == null) {
            throw new IllegalArgumentException("Fundador e status de validação são obrigatórios.");
        }
    }

    private String normalizarTextoObrigatorio(String valor, String nomeCampo) {
        if (valor == null || valor.isBlank()) {
            throw new IllegalArgumentException("O campo " + nomeCampo + " é obrigatório.");
        }

        return valor.strip();
    }
}
