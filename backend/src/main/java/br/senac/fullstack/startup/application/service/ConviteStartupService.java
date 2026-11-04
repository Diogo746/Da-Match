package br.senac.fullstack.startup.application.service;

import br.senac.fullstack.shared.enums.TipoUsuario;
import br.senac.fullstack.shared.security.ResourceAccess;
import br.senac.fullstack.startup.api.dto.ConviteStartupResponse;
import br.senac.fullstack.startup.api.dto.CriarConviteStartupRequest;
import br.senac.fullstack.startup.api.dto.PaginaConvitesStartupResponse;
import br.senac.fullstack.startup.api.mapper.ConviteStartupMapper;
import br.senac.fullstack.startup.application.exception.ConviteStartupException;
import br.senac.fullstack.startup.application.exception.ConviteStartupException.Codigo;
import br.senac.fullstack.startup.domain.ConviteStartup;
import br.senac.fullstack.startup.domain.MembroStartup;
import br.senac.fullstack.startup.domain.Startup;
import br.senac.fullstack.startup.domain.enums.PapelMembroStartup;
import br.senac.fullstack.startup.domain.enums.StatusConviteStartup;
import br.senac.fullstack.startup.infrastructure.persistence.repository.ConviteStartupRepository;
import br.senac.fullstack.startup.infrastructure.persistence.repository.MembroStartupRepository;
import br.senac.fullstack.startup.infrastructure.persistence.repository.StartupRepository;
import br.senac.fullstack.usuario.domain.entity.Usuario;
import br.senac.fullstack.usuario.infrastructure.persistence.repository.UsuarioRepository;
import jakarta.transaction.Transactional;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.dao.DataIntegrityViolationException;
import org.hibernate.exception.ConstraintViolationException;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.Clock;
import java.time.Instant;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.HexFormat;
import java.util.NoSuchElementException;
import java.util.Locale;
import java.util.UUID;

@Service
@Transactional
public class ConviteStartupService {
    private final ConviteStartupRepository convites;
    private final StartupRepository startups;
    private final UsuarioRepository usuarios;
    private final MembroStartupRepository membros;
    private final ResourceAccess access;
    private final ConviteStartupMapper mapper;
    private final Clock clock;

    public ConviteStartupService(ConviteStartupRepository convites, StartupRepository startups,
            UsuarioRepository usuarios, MembroStartupRepository membros, ResourceAccess access,
            ConviteStartupMapper mapper, @Qualifier("conviteStartupClock") Clock clock) {
        this.convites = convites;
        this.startups = startups;
        this.usuarios = usuarios;
        this.membros = membros;
        this.access = access;
        this.mapper = mapper;
        this.clock = clock;
    }

    public ConviteStartupResponse criar(UUID startupId, CriarConviteStartupRequest request) {
        validar(request);
        UUID ator = access.currentStartupUserId();
        Startup startup = projeto(startupId);
        access.requireStartupManager(startup);
        Usuario emissor = usuarios.findById(ator).orElseThrow(NoSuchElementException::new);
        String hash = hash(startupId, request);
        var anterior = convites.findByEmissorIdAndSolicitacaoId(ator, request.solicitacaoId());
        if (anterior.isPresent()) {
            ConviteStartup convite = anterior.orElseThrow();
            if (!convite.getStartup().getId().equals(startupId) || !convite.getConteudoHash().equals(hash)) {
                throw new ConviteStartupException(Codigo.SOLICITACAO_DIVERGENTE);
            }
            return resposta(convite);
        }
        Usuario destinatario = usuarios.findByEmail(request.email())
                .filter(usuario -> usuario.getTipoUsuario() == TipoUsuario.STARTUP)
                .orElseThrow(() -> new ConviteStartupException(Codigo.DESTINATARIO_INDISPONIVEL));
        if (startup.getMembros().stream().anyMatch(m -> m.getUsuario().getId().equals(destinatario.getId()))) {
            throw new ConviteStartupException(Codigo.JA_INTEGRANTE);
        }
        Instant agora = clock.instant().truncatedTo(ChronoUnit.MICROS);
        if (convites.existePendente(startupId, destinatario.getId(), agora)) {
            throw new ConviteStartupException(Codigo.CONVITE_PENDENTE);
        }
        ConviteStartup convite = new ConviteStartup();
        convite.setStartup(startup);
        convite.setEmissor(emissor);
        convite.setDestinatario(destinatario);
        convite.setSolicitacaoId(request.solicitacaoId());
        convite.setConteudoHash(hash);
        convite.setPapelMembro(request.papelMembro());
        convite.setCriadoEm(agora);
        convite.setExpiraEm(agora.plus(7, ChronoUnit.DAYS));
        return resposta(persistir(convite));
    }

    public PaginaConvitesStartupResponse enviados(UUID startupId, int pagina, int tamanho) {
        PageRequest page = pagina(pagina, tamanho);
        access.requireStartupManager(projeto(startupId));
        return resposta(convites.listarDoProjeto(startupId, page));
    }

    public PaginaConvitesStartupResponse recebidos(int pagina, int tamanho) {
        PageRequest page = pagina(pagina, tamanho);
        return resposta(convites.listarRecebidos(access.currentStartupUserId(), page));
    }

    public ConviteStartupResponse consultar(UUID id) {
        UUID ator = access.currentStartupUserId();
        ConviteStartup convite = bloqueado(id);
        if (!convite.getDestinatario().getId().equals(ator)) {
            access.requireStartupManager(convite.getStartup());
        }
        return resposta(convite);
    }

    public ConviteStartupResponse consultarSolicitacao(UUID startupId, UUID solicitacaoId) {
        UUID ator = access.currentStartupUserId();
        access.requireStartupManager(projeto(startupId));
        ConviteStartup convite = convites.findByEmissorIdAndSolicitacaoId(ator, solicitacaoId)
                .filter(item -> item.getStartup().getId().equals(startupId))
                .orElseThrow(NoSuchElementException::new);
        return resposta(convite);
    }

    public ConviteStartupResponse aceitar(UUID id) {
        ConviteStartup convite = destinatario(id);
        if (convite.getStatus() == StatusConviteStartup.ACEITO) {
            return resposta(convite);
        }
        pendente(convite);
        Startup startup = convite.getStartup();
        boolean emissorAtual = convite.getEmissor().getTipoUsuario() == TipoUsuario.STARTUP
                && startup.getMembros().stream().anyMatch(m ->
                m.getUsuario().getId().equals(convite.getEmissor().getId())
                        && (m.getPapelMembro() == PapelMembroStartup.FUNDADOR
                        || m.getPapelMembro() == PapelMembroStartup.REPRESENTANTE));
        if (!emissorAtual || convite.getDestinatario().getTipoUsuario() != TipoUsuario.STARTUP) {
            throw new ConviteStartupException(Codigo.CONVITE_INDISPONIVEL);
        }
        if (startup.getMembros().stream().anyMatch(m ->
                m.getUsuario().getId().equals(convite.getDestinatario().getId()))) {
            throw new ConviteStartupException(Codigo.JA_INTEGRANTE);
        }
        MembroStartup membro = new MembroStartup();
        membro.setStartup(startup);
        membro.setUsuario(convite.getDestinatario());
        membro.setPapelMembro(convite.getPapelMembro());
        membro.setDataEntrada(LocalDate.now(clock));
        startup.getMembros().add(membro);
        membros.save(membro);
        convite.setStatus(StatusConviteStartup.ACEITO);
        return resposta(convite);
    }

    public ConviteStartupResponse recusar(UUID id) {
        return finalizar(destinatario(id), StatusConviteStartup.RECUSADO);
    }

    public ConviteStartupResponse cancelar(UUID startupId, UUID id) {
        access.requireStartupManager(projeto(startupId));
        ConviteStartup convite = convites.findById(id)
                .filter(item -> item.getStartup().getId().equals(startupId))
                .orElseThrow(NoSuchElementException::new);
        return finalizar(convite, StatusConviteStartup.CANCELADO);
    }

    private ConviteStartup destinatario(UUID id) {
        UUID ator = access.currentStartupUserId();
        ConviteStartup convite = bloqueado(id);
        if (!convite.getDestinatario().getId().equals(ator)) {
            throw new AccessDeniedException("Acesso negado.");
        }
        return convite;
    }

    private ConviteStartup bloqueado(UUID id) {
        UUID startupId = convites.findStartupId(id).orElseThrow(NoSuchElementException::new);
        projeto(startupId);
        return convites.findById(id).orElseThrow(NoSuchElementException::new);
    }

    private Startup projeto(UUID id) {
        return startups.findById(id).orElseThrow(NoSuchElementException::new);
    }

    private ConviteStartupResponse finalizar(ConviteStartup convite, StatusConviteStartup destino) {
        if (convite.getStatus() != destino) {
            pendente(convite);
            convite.setStatus(destino);
        }
        return resposta(convite);
    }

    private void pendente(ConviteStartup convite) {
        StatusConviteStartup status = convite.statusEm(clock.instant());
        if (status == StatusConviteStartup.EXPIRADO) {
            throw new ConviteStartupException(Codigo.CONVITE_EXPIRADO);
        }
        if (status != StatusConviteStartup.PENDENTE) {
            throw new ConviteStartupException(Codigo.CONVITE_FINALIZADO);
        }
    }

    private ConviteStartupResponse resposta(ConviteStartup convite) {
        return mapper.toResponse(convite, convite.statusEm(clock.instant()));
    }

    private ConviteStartup persistir(ConviteStartup convite) {
        try {
            return convites.saveAndFlush(convite);
        } catch (DataIntegrityViolationException exception) {
            // Different projects have different locks; the database also arbitrates the global request key.
            if (exception.getCause() instanceof ConstraintViolationException constraint
                    && constraint.getConstraintName() != null
                    && constraint.getConstraintName().toUpperCase(Locale.ROOT)
                    .contains("UK_CONVITE_EMISSOR_SOLICITACAO")) {
                throw new ConviteStartupException(Codigo.SOLICITACAO_DIVERGENTE);
            }
            throw exception;
        }
    }

    private PaginaConvitesStartupResponse resposta(Page<ConviteStartup> page) {
        return new PaginaConvitesStartupResponse(page.map(this::resposta).getContent(), page.getNumber(),
                page.getSize(), page.getTotalElements(), page.getTotalPages());
    }

    private PageRequest pagina(int pagina, int tamanho) {
        if (pagina < 0 || tamanho < 1 || tamanho > 50) {
            throw new IllegalArgumentException("Página inválida.");
        }
        return PageRequest.of(pagina, tamanho);
    }

    private void validar(CriarConviteStartupRequest request) {
        if (request == null || request.solicitacaoId() == null || request.email() == null
                || request.email().isBlank() || request.email().length() > 254 || !request.isPapelPermitido()) {
            throw new IllegalArgumentException("Convite inválido.");
        }
    }

    private String hash(UUID startupId, CriarConviteStartupRequest request) {
        String conteudo = startupId + "\n" + request.papelMembro() + "\n" + request.email();
        try {
            return HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256")
                    .digest(conteudo.getBytes(StandardCharsets.UTF_8)));
        } catch (NoSuchAlgorithmException exception) {
            throw new IllegalStateException("SHA-256 indisponível.", exception);
        }
    }
}
