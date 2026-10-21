package br.senac.fullstack.startup.infrastructure.persistence.repository;

import br.senac.fullstack.shared.enums.TipoUsuario;
import br.senac.fullstack.startup.domain.MembroStartup;
import br.senac.fullstack.startup.domain.Startup;
import br.senac.fullstack.startup.domain.enums.PapelMembroStartup;
import br.senac.fullstack.startup.domain.enums.StatusValidacao;
import br.senac.fullstack.usuario.domain.entity.Usuario;
import br.senac.fullstack.usuario.infrastructure.persistence.repository.UsuarioRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.dao.DataIntegrityViolationException;

import java.time.Instant;
import java.time.LocalDate;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;

@DataJpaTest
@ActiveProfiles("test")
class StartupRepositoryTest {

    @Autowired
    private StartupRepository startupRepository;

    @Autowired
    private MembroStartupRepository membroStartupRepository;

    @Autowired
    private UsuarioRepository usuarioRepository;

    @Test
    void deveImpedirMembroDuplicadoNoBancoMesmoSemPassarPeloServico() {
        Usuario usuario = usuarioRepository.saveAndFlush(new Usuario(
                "Pessoa Ficticia", "duplicado@example.test", "hash-ficticio", TipoUsuario.STARTUP));
        Startup startup = startupRepository.saveAndFlush(startup());
        MembroStartup first = new MembroStartup(null, startup, usuario,
                PapelMembroStartup.FUNDADOR, LocalDate.of(2026, 10, 20));
        membroStartupRepository.saveAndFlush(first);
        MembroStartup duplicate = new MembroStartup(null, startup, usuario,
                PapelMembroStartup.MEMBRO, LocalDate.of(2026, 10, 20));
        assertThrows(DataIntegrityViolationException.class, () -> membroStartupRepository.saveAndFlush(duplicate));
    }

    @Test
    void devePersistirStartupComMembro() {
        Usuario usuario = usuarioRepository.saveAndFlush(new Usuario(
                "Fundadora de Teste",
                "fundadora.persistencia@example.com",
                "senha-codificada",
                TipoUsuario.STARTUP
        ));
        Startup startup = startup();
        MembroStartup membro = new MembroStartup();
        membro.setStartup(startup);
        membro.setUsuario(usuario);
        membro.setPapelMembro(PapelMembroStartup.FUNDADOR);
        membro.setDataEntrada(LocalDate.of(2026, 10, 19));
        startup.getMembros().add(membro);

        Startup startupSalva = startupRepository.saveAndFlush(startup);

        assertNotNull(startupSalva.getId());
        assertEquals(1, membroStartupRepository.count());
        MembroStartup membroSalvo = membroStartupRepository.findAll().getFirst();
        assertEquals(startupSalva.getId(), membroSalvo.getStartup().getId());
        assertEquals(usuario.getId(), membroSalvo.getUsuario().getId());
        assertEquals(PapelMembroStartup.FUNDADOR, membroSalvo.getPapelMembro());
    }

    private Startup startup() {
        Startup startup = new Startup();
        startup.setNomeProvisorio("Startup de Persistência");
        startup.setPitchCurto("Pitch de persistência");
        startup.setProblemaCentral("Problema de persistência");
        startup.setSolucaoProposta("Solução de persistência");
        startup.setPublicoAlvo("Público de teste");
        startup.setModeloDeNegocio("SaaS");
        startup.setStatusValidacao(StatusValidacao.APENAS_IDEIA);
        startup.setDataCriacao(Instant.parse("2026-10-19T12:00:00Z"));
        return startup;
    }
}
