package br.senac.fullstack.perfilmatch.api.controller;

import br.senac.fullstack.perfilmatch.api.dto.PerfilMatchResponse;
import br.senac.fullstack.perfilmatch.api.dto.SalvarPerfilMatchRequest;
import br.senac.fullstack.perfilmatch.application.service.PerfilMatchService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

@RestController
public class PerfilMatchController {
    private final PerfilMatchService service;

    public PerfilMatchController(PerfilMatchService service) {
        this.service = service;
    }

    @GetMapping("/api/v1/startups/{startupId}/perfil-match")
    public ResponseEntity<PerfilMatchResponse> consultarStartup(@PathVariable("startupId") UUID id) {
        return service.consultarStartup(id).map(ResponseEntity::ok).orElseGet(() -> ResponseEntity.noContent().build());
    }

    @PutMapping("/api/v1/startups/{startupId}/perfil-match")
    public PerfilMatchResponse salvarStartup(@PathVariable("startupId") UUID id,
                                            @Valid @RequestBody SalvarPerfilMatchRequest request) {
        return service.salvarStartup(id, request);
    }

    @GetMapping("/api/v1/mentores/{mentorId}/perfil-match")
    public ResponseEntity<PerfilMatchResponse> consultarMentor(@PathVariable("mentorId") UUID id) {
        return service.consultarMentor(id).map(ResponseEntity::ok).orElseGet(() -> ResponseEntity.noContent().build());
    }

    @PutMapping("/api/v1/mentores/{mentorId}/perfil-match")
    public PerfilMatchResponse salvarMentor(@PathVariable("mentorId") UUID id,
                                           @Valid @RequestBody SalvarPerfilMatchRequest request) {
        return service.salvarMentor(id, request);
    }
}
