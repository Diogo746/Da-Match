package br.senac.fullstack.startup.api.controller;

import br.senac.fullstack.startup.api.dto.AtualizarStatusPerfilStartupRequest;
import br.senac.fullstack.startup.api.dto.PublicacaoStartupResponse;
import br.senac.fullstack.startup.application.service.PublicacaoStartupService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/startups/{startupId}/status")
public class PublicacaoStartupController {
    private final PublicacaoStartupService service;

    public PublicacaoStartupController(PublicacaoStartupService service) {
        this.service = service;
    }

    @GetMapping
    public PublicacaoStartupResponse consultar(@PathVariable("startupId") UUID startupId) {
        return service.consultar(startupId);
    }

    @PatchMapping
    public PublicacaoStartupResponse atualizar(@PathVariable("startupId") UUID startupId,
            @Valid @RequestBody AtualizarStatusPerfilStartupRequest request) {
        return service.atualizar(startupId, request);
    }
}
