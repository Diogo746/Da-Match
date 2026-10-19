package br.senac.fullstack.startup.application.service;

import br.senac.fullstack.startup.api.dto.CriarStartupRequest;
import br.senac.fullstack.startup.api.mapper.StartupMapper;
import br.senac.fullstack.startup.domain.MembroStartup;
import br.senac.fullstack.startup.domain.Startup;
import br.senac.fullstack.startup.domain.enums.PapelMembroStartup;
import br.senac.fullstack.startup.domain.enums.StatusValidacao;
import br.senac.fullstack.startup.infrastructure.persistence.repository.MembroStartupRepository;
import br.senac.fullstack.startup.infrastructure.persistence.repository.StartupRepository;
import br.senac.fullstack.shared.enums.TipoUsuario;
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

import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
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

    @InjectMocks
    private StartupService startupService;

    @Captor
    private ArgumentCaptor<Startup> startupCaptor;

    @Captor
    private ArgumentCaptor<MembroStartup> membroCaptor;

    @Test
    void deveCriarStartupComCriadorComoFundador() {
        UUID fundadorId = UUID.randomUUID();
        Usuario fundador = new Usuario();
        fundador.setId(fundadorId);

        when(usuarioService.criarConta(
                "Fundadora Da Match",
                "fundadora@example.com",
                "senha-teste-123",
                TipoUsuario.STARTUP
        )).thenReturn(fundador);
        when(startupRepository.save(any(Startup.class))).thenAnswer(invocation -> {
            Startup startup = invocation.getArgument(0);
            startup.setId(UUID.randomUUID());
            return startup;
        });
        when(membroRepository.save(any(MembroStartup.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));
        startupService.criarStartup(criarRequest());

        verify(startupRepository).save(startupCaptor.capture());
        verify(membroRepository).save(membroCaptor.capture());
        verify(usuarioService).criarConta(
                "Fundadora Da Match",
                "fundadora@example.com",
                "senha-teste-123",
                TipoUsuario.STARTUP
        );

        Startup startupCriada = startupCaptor.getValue();
        MembroStartup membroCriado = membroCaptor.getValue();
        assertEquals("Da Match", startupCriada.getNomeProvisorio());
        assertNotNull(startupCriada.getDataCriacao());
        assertEquals(fundador, membroCriado.getUsuario());
        assertEquals(PapelMembroStartup.FUNDADOR, membroCriado.getPapelMembro());
    }

    @Test
    void naoDeveRemoverOUnicoMembroDaStartup() {
        UUID startupId = UUID.randomUUID();
        UUID usuarioId = UUID.randomUUID();
        Startup startup = new Startup();
        startup.setId(startupId);
        startup.getMembros().add(criarMembro(startup, usuarioId, PapelMembroStartup.FUNDADOR));

        when(startupRepository.findById(startupId)).thenReturn(Optional.of(startup));

        assertThrows(
                IllegalStateException.class,
                () -> startupService.removerMembro(startupId, usuarioId)
        );
        assertEquals(1, startup.getMembros().size());
    }

    @Test
    void deveRemoverUmMembroQueNaoEUnicoFundador() {
        UUID startupId = UUID.randomUUID();
        UUID fundadorId = UUID.randomUUID();
        UUID membroId = UUID.randomUUID();
        Startup startup = new Startup();
        startup.setId(startupId);
        startup.getMembros().add(criarMembro(startup, fundadorId, PapelMembroStartup.FUNDADOR));
        startup.getMembros().add(criarMembro(startup, membroId, PapelMembroStartup.MEMBRO));

        when(startupRepository.findById(startupId)).thenReturn(Optional.of(startup));

        startupService.removerMembro(startupId, membroId);

        assertEquals(1, startup.getMembros().size());
        assertEquals(fundadorId, startup.getMembros().getFirst().getUsuario().getId());
    }

    private CriarStartupRequest criarRequest() {
        return new CriarStartupRequest(
                new CadastrarUsuarioRequest(
                        "Fundadora Da Match",
                        "fundadora@example.com",
                        "senha-teste-123"
                ),
                "  Da Match  ",
                "Conecta startups e mentores.",
                "Falta de conexões qualificadas.",
                "Uma plataforma de recomendação.",
                "Startups em ideação.",
                "SaaS",
                StatusValidacao.APENAS_IDEIA
        );
    }

    private MembroStartup criarMembro(
            Startup startup,
            UUID usuarioId,
            PapelMembroStartup papel
    ) {
        Usuario usuario = new Usuario();
        usuario.setId(usuarioId);

        MembroStartup membro = new MembroStartup();
        membro.setStartup(startup);
        membro.setUsuario(usuario);
        membro.setPapelMembro(papel);
        return membro;
    }
}
