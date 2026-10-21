package br.senac.fullstack.startup.application.service;

import br.senac.fullstack.startup.api.dto.AdicionarMembroStartupRequest;
import br.senac.fullstack.startup.api.dto.CriarStartupRequest;
import br.senac.fullstack.startup.api.dto.MembroStartupResponse;
import br.senac.fullstack.startup.api.dto.StartupResponse;
import br.senac.fullstack.startup.api.mapper.StartupMapper;
import br.senac.fullstack.startup.domain.MembroStartup;
import br.senac.fullstack.startup.domain.Startup;
import br.senac.fullstack.startup.domain.enums.PapelMembroStartup;
import br.senac.fullstack.startup.domain.enums.StatusValidacao;
import br.senac.fullstack.startup.infrastructure.persistence.repository.MembroStartupRepository;
import br.senac.fullstack.startup.infrastructure.persistence.repository.StartupRepository;
import br.senac.fullstack.shared.enums.TipoUsuario;
import br.senac.fullstack.shared.security.ResourceAccess;
import br.senac.fullstack.usuario.api.dto.CadastrarUsuarioRequest;
import br.senac.fullstack.usuario.application.service.UsuarioService;
import br.senac.fullstack.usuario.domain.entity.Usuario;
import br.senac.fullstack.usuario.infrastructure.persistence.repository.UsuarioRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Captor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.NoSuchElementException;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertSame;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class StartupServiceTest {

    @Mock
    private StartupRepository startupRepository;

    @Mock
    private MembroStartupRepository membroRepository;

    @Mock
    private UsuarioRepository usuarioRepository;

    @Mock
    private UsuarioService usuarioService;

    @Mock
    private StartupMapper startupMapper;

    @Mock
    private ResourceAccess resourceAccess;

    @InjectMocks
    private StartupService startupService;

    @Captor
    private ArgumentCaptor<Startup> startupCaptor;

    @Captor
    private ArgumentCaptor<MembroStartup> membroCaptor;

    @Test
    void deveCriarStartupComCriadoraComoFundadora() {
        Usuario fundadora = usuario(UUID.randomUUID(), "Fundadora Da Match");
        StartupResponse response = startupResponse(UUID.randomUUID());

        when(usuarioService.criarConta(
                "Fundadora Da Match",
                "fundadora@example.com",
                "senha-teste-123",
                TipoUsuario.STARTUP
        )).thenReturn(fundadora);
        when(startupRepository.save(any(Startup.class))).thenAnswer(invocation -> {
            Startup startup = invocation.getArgument(0);
            startup.setId(UUID.randomUUID());
            return startup;
        });
        when(membroRepository.save(any(MembroStartup.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));
        when(startupMapper.toResponse(any(Startup.class))).thenReturn(response);

        StartupResponse startupCriada = startupService.criarStartup(criarRequest());

        verify(startupRepository).save(startupCaptor.capture());
        verify(membroRepository).save(membroCaptor.capture());
        Startup startupSalva = startupCaptor.getValue();
        MembroStartup membroSalvo = membroCaptor.getValue();
        assertSame(response, startupCriada);
        assertEquals("Da Match", startupSalva.getNomeProvisorio());
        assertEquals("Conecta startups e mentores.", startupSalva.getPitchCurto());
        assertNotNull(startupSalva.getDataCriacao());
        assertEquals(fundadora, membroSalvo.getUsuario());
        assertEquals(PapelMembroStartup.FUNDADOR, membroSalvo.getPapelMembro());
        assertNotNull(membroSalvo.getDataEntrada());
    }

    @Test
    void deveListarStartupsMapeadas() {
        Startup primeira = startup(UUID.randomUUID());
        Startup segunda = startup(UUID.randomUUID());
        StartupResponse primeiraResponse = startupResponse(primeira.getId());
        StartupResponse segundaResponse = startupResponse(segunda.getId());
        when(startupRepository.findAll()).thenReturn(List.of(primeira, segunda));
        when(startupMapper.toResponse(primeira)).thenReturn(primeiraResponse);
        when(startupMapper.toResponse(segunda)).thenReturn(segundaResponse);

        assertEquals(List.of(primeiraResponse, segundaResponse), startupService.listarStartups());
    }

    @Test
    void deveBuscarStartupPorId() {
        UUID startupId = UUID.randomUUID();
        Startup startup = startup(startupId);
        StartupResponse response = startupResponse(startupId);
        when(startupRepository.findById(startupId)).thenReturn(Optional.of(startup));
        when(startupMapper.toResponse(startup)).thenReturn(response);

        assertSame(response, startupService.buscarStartupPorId(startupId));
    }

    @Test
    void deveRejeitarBuscaComIdNuloOuStartupInexistente() {
        assertThrows(IllegalArgumentException.class, () -> startupService.buscarStartupPorId(null));

        UUID startupId = UUID.randomUUID();
        when(startupRepository.findById(startupId)).thenReturn(Optional.empty());

        assertThrows(NoSuchElementException.class, () -> startupService.buscarStartupPorId(startupId));
    }

    @Test
    void deveAdicionarMembroExistente() {
        UUID startupId = UUID.randomUUID();
        UUID usuarioId = UUID.randomUUID();
        Startup startup = startup(startupId);
        Usuario usuario = usuario(usuarioId, "Novo Membro");
        MembroStartupResponse response = membroResponse(usuarioId, PapelMembroStartup.REPRESENTANTE);
        when(startupRepository.findById(startupId)).thenReturn(Optional.of(startup));
        when(usuarioRepository.findById(usuarioId)).thenReturn(Optional.of(usuario));
        when(membroRepository.save(any(MembroStartup.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));
        when(startupMapper.toResponse(any(MembroStartup.class))).thenReturn(response);

        MembroStartupResponse membroAdicionado = startupService.adicionarMembro(
                startupId,
                new AdicionarMembroStartupRequest(usuarioId, PapelMembroStartup.REPRESENTANTE)
        );

        assertSame(response, membroAdicionado);
        assertEquals(1, startup.getMembros().size());
        assertEquals(usuario, startup.getMembros().getFirst().getUsuario());
        assertEquals(PapelMembroStartup.REPRESENTANTE, startup.getMembros().getFirst().getPapelMembro());
    }

    @Test
    void deveRejeitarDadosInvalidosAoAdicionarMembro() {
        UUID startupId = UUID.randomUUID();
        UUID usuarioId = UUID.randomUUID();
        AdicionarMembroStartupRequest membroSemUsuario =
                new AdicionarMembroStartupRequest(null, PapelMembroStartup.MEMBRO);
        AdicionarMembroStartupRequest membroSemPapel =
                new AdicionarMembroStartupRequest(usuarioId, null);

        assertThrows(IllegalArgumentException.class, () -> startupService.adicionarMembro(startupId, null));
        assertThrows(
                IllegalArgumentException.class,
                () -> startupService.adicionarMembro(startupId, membroSemUsuario)
        );
        assertThrows(
                IllegalArgumentException.class,
                () -> startupService.adicionarMembro(startupId, membroSemPapel)
        );
        verifyNoInteractions(startupRepository, usuarioRepository, membroRepository);
    }

    @Test
    void deveRejeitarMembroDuplicadoEUsuarioOuStartupInexistentes() {
        UUID startupId = UUID.randomUUID();
        UUID usuarioId = UUID.randomUUID();
        Startup startup = startup(startupId);
        startup.getMembros().add(membro(startup, usuarioId, PapelMembroStartup.MEMBRO));
        when(startupRepository.findById(startupId)).thenReturn(Optional.of(startup));
        when(usuarioRepository.findById(usuarioId)).thenReturn(Optional.of(usuario(usuarioId, "Membro")));
        AdicionarMembroStartupRequest membroDuplicado =
                new AdicionarMembroStartupRequest(usuarioId, PapelMembroStartup.MEMBRO);

        assertThrows(
                IllegalStateException.class,
                () -> startupService.adicionarMembro(startupId, membroDuplicado)
        );
        verify(membroRepository, never()).save(any());

        UUID startupInexistenteId = UUID.randomUUID();
        UUID usuarioDaStartupInexistenteId = UUID.randomUUID();
        AdicionarMembroStartupRequest membroDaStartupInexistente =
                new AdicionarMembroStartupRequest(usuarioDaStartupInexistenteId, PapelMembroStartup.MEMBRO);
        when(startupRepository.findById(startupInexistenteId)).thenReturn(Optional.empty());
        assertThrows(
                NoSuchElementException.class,
                () -> startupService.adicionarMembro(startupInexistenteId, membroDaStartupInexistente)
        );

        UUID usuarioInexistenteId = UUID.randomUUID();
        AdicionarMembroStartupRequest membroInexistente =
                new AdicionarMembroStartupRequest(usuarioInexistenteId, PapelMembroStartup.MEMBRO);
        when(usuarioRepository.findById(usuarioInexistenteId)).thenReturn(Optional.empty());
        assertThrows(
                NoSuchElementException.class,
                () -> startupService.adicionarMembro(startupId, membroInexistente)
        );
    }

    @Test
    void deveListarMembrosMapeados() {
        UUID startupId = UUID.randomUUID();
        Startup startup = startup(startupId);
        MembroStartup primeiro = membro(startup, UUID.randomUUID(), PapelMembroStartup.FUNDADOR);
        MembroStartup segundo = membro(startup, UUID.randomUUID(), PapelMembroStartup.MEMBRO);
        startup.getMembros().addAll(List.of(primeiro, segundo));
        MembroStartupResponse primeiroResponse = membroResponse(
                primeiro.getUsuario().getId(),
                PapelMembroStartup.FUNDADOR
        );
        MembroStartupResponse segundoResponse = membroResponse(
                segundo.getUsuario().getId(),
                PapelMembroStartup.MEMBRO
        );
        when(startupRepository.findById(startupId)).thenReturn(Optional.of(startup));
        when(startupMapper.toResponse(primeiro)).thenReturn(primeiroResponse);
        when(startupMapper.toResponse(segundo)).thenReturn(segundoResponse);

        assertEquals(List.of(primeiroResponse, segundoResponse), startupService.listarMembros(startupId));
    }

    @Test
    void deveRemoverMembroQueNaoEUnicoFundador() {
        UUID startupId = UUID.randomUUID();
        UUID fundadorId = UUID.randomUUID();
        UUID membroId = UUID.randomUUID();
        Startup startup = startup(startupId);
        startup.getMembros().add(membro(startup, fundadorId, PapelMembroStartup.FUNDADOR));
        startup.getMembros().add(membro(startup, membroId, PapelMembroStartup.MEMBRO));
        when(startupRepository.findById(startupId)).thenReturn(Optional.of(startup));

        startupService.removerMembro(startupId, membroId);

        assertEquals(1, startup.getMembros().size());
        assertEquals(fundadorId, startup.getMembros().getFirst().getUsuario().getId());
    }

    @Test
    void deveImpedirRemocaoDoUltimoMembroEDoUnicoFundador() {
        UUID startupId = UUID.randomUUID();
        UUID fundadorId = UUID.randomUUID();
        Startup startupComUmMembro = startup(startupId);
        startupComUmMembro.getMembros().add(membro(startupComUmMembro, fundadorId, PapelMembroStartup.FUNDADOR));
        when(startupRepository.findById(startupId)).thenReturn(Optional.of(startupComUmMembro));

        assertThrows(IllegalStateException.class, () -> startupService.removerMembro(startupId, fundadorId));

        UUID outroMembroId = UUID.randomUUID();
        Startup startupComFundadorUnico = startup(startupId);
        startupComFundadorUnico.getMembros().add(membro(
                startupComFundadorUnico,
                fundadorId,
                PapelMembroStartup.FUNDADOR
        ));
        startupComFundadorUnico.getMembros().add(membro(
                startupComFundadorUnico,
                outroMembroId,
                PapelMembroStartup.MEMBRO
        ));
        when(startupRepository.findById(startupId)).thenReturn(Optional.of(startupComFundadorUnico));

        assertThrows(IllegalStateException.class, () -> startupService.removerMembro(startupId, fundadorId));
        assertEquals(2, startupComFundadorUnico.getMembros().size());
    }

    @Test
    void deveRejeitarRemocaoDeUsuarioQueNaoPertenceAStartup() {
        UUID startupId = UUID.randomUUID();
        UUID usuarioInexistenteId = UUID.randomUUID();
        Startup startup = startup(startupId);
        startup.getMembros().add(membro(startup, UUID.randomUUID(), PapelMembroStartup.FUNDADOR));
        when(startupRepository.findById(startupId)).thenReturn(Optional.of(startup));

        assertThrows(
                NoSuchElementException.class,
                () -> startupService.removerMembro(startupId, usuarioInexistenteId)
        );
    }

    @Test
    void deveRejeitarCriacaoSemDadosObrigatorios() {
        CriarStartupRequest startupSemFundadora =
                criarRequest(null, StatusValidacao.APENAS_IDEIA, "Da Match");
        CriarStartupRequest startupSemStatus =
                criarRequest(cadastrarFundadora(), null, "Da Match");
        CriarStartupRequest startupComNomeEmBranco =
                criarRequest(cadastrarFundadora(), StatusValidacao.APENAS_IDEIA, " ");

        assertThrows(IllegalArgumentException.class, () -> startupService.criarStartup(null));
        assertThrows(
                IllegalArgumentException.class,
                () -> startupService.criarStartup(startupSemFundadora)
        );
        assertThrows(
                IllegalArgumentException.class,
                () -> startupService.criarStartup(startupSemStatus)
        );

        when(usuarioService.criarConta(any(), any(), any(), any())).thenReturn(usuario(UUID.randomUUID(), "Fundadora"));
        assertThrows(
                IllegalArgumentException.class,
                () -> startupService.criarStartup(startupComNomeEmBranco)
        );
    }

    private CriarStartupRequest criarRequest() {
        return criarRequest(cadastrarFundadora(), StatusValidacao.APENAS_IDEIA, "  Da Match  ");
    }

    private CriarStartupRequest criarRequest(
            CadastrarUsuarioRequest fundadora,
            StatusValidacao statusValidacao,
            String nomeProvisorio
    ) {
        return new CriarStartupRequest(
                fundadora,
                nomeProvisorio,
                "Conecta startups e mentores.",
                "Falta de conexões qualificadas.",
                "Uma plataforma de recomendação.",
                "Startups em ideação.",
                "SaaS",
                statusValidacao
        );
    }

    private CadastrarUsuarioRequest cadastrarFundadora() {
        return new CadastrarUsuarioRequest(
                "Fundadora Da Match",
                "fundadora@example.com",
                "senha-teste-123"
        );
    }

    private Startup startup(UUID startupId) {
        Startup startup = new Startup();
        startup.setId(startupId);
        startup.setNomeProvisorio("Startup de Teste");
        startup.setPitchCurto("Pitch de teste");
        startup.setProblemaCentral("Problema de teste");
        startup.setSolucaoProposta("Solução de teste");
        startup.setPublicoAlvo("Público de teste");
        startup.setModeloDeNegocio("SaaS");
        startup.setStatusValidacao(StatusValidacao.APENAS_IDEIA);
        startup.setDataCriacao(Instant.parse("2026-10-19T12:00:00Z"));
        return startup;
    }

    private Usuario usuario(UUID usuarioId, String nome) {
        Usuario usuario = new Usuario();
        usuario.setId(usuarioId);
        usuario.setNome(nome);
        return usuario;
    }

    private MembroStartup membro(Startup startup, UUID usuarioId, PapelMembroStartup papelMembro) {
        MembroStartup membro = new MembroStartup();
        membro.setStartup(startup);
        membro.setUsuario(usuario(usuarioId, "Membro de Teste"));
        membro.setPapelMembro(papelMembro);
        membro.setDataEntrada(LocalDate.of(2026, 10, 19));
        return membro;
    }

    private StartupResponse startupResponse(UUID startupId) {
        return new StartupResponse(
                startupId,
                "Startup de Teste",
                "Pitch de teste",
                "Problema de teste",
                "Solução de teste",
                "Público de teste",
                "SaaS",
                StatusValidacao.APENAS_IDEIA,
                Instant.parse("2026-10-19T12:00:00Z"),
                List.of()
        );
    }

    private MembroStartupResponse membroResponse(UUID usuarioId, PapelMembroStartup papelMembro) {
        return new MembroStartupResponse(
                UUID.randomUUID(),
                usuarioId,
                "Membro de Teste",
                papelMembro,
                LocalDate.of(2026, 10, 19)
        );
    }
}
