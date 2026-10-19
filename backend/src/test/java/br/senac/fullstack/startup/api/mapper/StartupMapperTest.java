package br.senac.fullstack.startup.api.mapper;

import br.senac.fullstack.startup.api.dto.MembroStartupResponse;
import br.senac.fullstack.startup.api.dto.StartupResponse;
import br.senac.fullstack.startup.domain.MembroStartup;
import br.senac.fullstack.startup.domain.Startup;
import br.senac.fullstack.startup.domain.enums.PapelMembroStartup;
import br.senac.fullstack.startup.domain.enums.StatusValidacao;
import br.senac.fullstack.shared.enums.TipoUsuario;
import br.senac.fullstack.usuario.domain.entity.Usuario;
import org.junit.jupiter.api.Test;
import org.mapstruct.factory.Mappers;

import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;

class StartupMapperTest {

    private final StartupMapper startupMapper = Mappers.getMapper(StartupMapper.class);

    @Test
    void deveMapearStartupEMembrosSemDadosSensiveisDoUsuario() {
        UUID startupId = UUID.randomUUID();
        UUID usuarioId = UUID.randomUUID();
        Usuario usuario = new Usuario(
                "Fundadora de Teste",
                "fundadora.teste@example.com",
                "senha-codificada",
                TipoUsuario.STARTUP
        );
        usuario.setId(usuarioId);

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

        MembroStartup membro = new MembroStartup();
        membro.setId(UUID.randomUUID());
        membro.setStartup(startup);
        membro.setUsuario(usuario);
        membro.setPapelMembro(PapelMembroStartup.FUNDADOR);
        membro.setDataEntrada(LocalDate.of(2026, 10, 19));
        startup.getMembros().add(membro);

        StartupResponse response = startupMapper.toResponse(startup);
        MembroStartupResponse membroResponse = response.membros().getFirst();

        assertEquals(startupId, response.id());
        assertEquals("Startup de Teste", response.nomeProvisorio());
        assertEquals(Instant.parse("2026-10-19T12:00:00Z"), response.dataCriacao());
        assertEquals(usuarioId, membroResponse.usuarioId());
        assertEquals("Fundadora de Teste", membroResponse.nomeUsuario());
        assertEquals(PapelMembroStartup.FUNDADOR, membroResponse.papelMembro());
    }
}
