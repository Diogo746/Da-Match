package br.senac.fullstack.startup.api.dto;

import br.senac.fullstack.startup.domain.enums.PapelMembroStartup;
import br.senac.fullstack.startup.domain.enums.StatusConviteStartup;

import java.time.Instant;
import java.util.UUID;

public record ConviteStartupResponse(UUID id, UUID startupId, String nomeStartup, String nomeConvidante,
        String nomeDestinatario, PapelMembroStartup papelMembro, StatusConviteStartup status,
        Instant criadoEm, Instant expiraEm) { }
