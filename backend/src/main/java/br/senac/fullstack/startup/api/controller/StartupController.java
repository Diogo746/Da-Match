package br.senac.fullstack.startup.api.controller;

import br.senac.fullstack.startup.api.dto.AdicionarMembroStartupRequest;
import br.senac.fullstack.startup.api.dto.AtualizarStartupRequest;
import br.senac.fullstack.startup.api.dto.CriarStartupRequest;
import br.senac.fullstack.startup.api.dto.MembroStartupResponse;
import br.senac.fullstack.startup.api.dto.StartupResponse;
import br.senac.fullstack.startup.application.service.StartupService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/startups")
public class StartupController {

    private final StartupService startupService;

    public StartupController(StartupService startupService) {
        this.startupService = startupService;
    }

    @PostMapping(consumes = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<StartupResponse> criarStartup(
            @RequestBody @Valid CriarStartupRequest request
    ) {
        StartupResponse startupCriada = startupService.criarStartup(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(startupCriada);
    }

    @GetMapping
    public ResponseEntity<List<StartupResponse>> listarStartups() {
        return ResponseEntity.ok(startupService.listarStartups());
    }

    @GetMapping("/{startupId}")
    public ResponseEntity<StartupResponse> buscarStartupPorId(
            @PathVariable("startupId") UUID startupId
    ) {
        return ResponseEntity.ok(startupService.buscarStartupPorId(startupId));
    }

    @GetMapping("/me")
    public ResponseEntity<List<StartupResponse>> listarMinhasStartups() {
        return ResponseEntity.ok(startupService.listarMinhasStartups());
    }

    @PatchMapping(value = "/{startupId}", consumes = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<StartupResponse> atualizarStartup(
            @PathVariable("startupId") UUID startupId,
            @RequestBody @Valid AtualizarStartupRequest request
    ) {
        return ResponseEntity.ok(startupService.atualizarStartup(startupId, request));
    }

    @PostMapping(value = "/{startupId}/membros", consumes = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<MembroStartupResponse> adicionarMembro(
            @PathVariable("startupId") UUID startupId,
            @RequestBody @Valid AdicionarMembroStartupRequest request
    ) {
        MembroStartupResponse membroAdicionado = startupService.adicionarMembro(startupId, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(membroAdicionado);
    }

    @GetMapping("/{startupId}/membros")
    public ResponseEntity<List<MembroStartupResponse>> listarMembros(
            @PathVariable("startupId") UUID startupId
    ) {
        return ResponseEntity.ok(startupService.listarMembros(startupId));
    }

    @DeleteMapping("/{startupId}/membros/{usuarioId}")
    public ResponseEntity<Void> removerMembro(
            @PathVariable("startupId") UUID startupId,
            @PathVariable("usuarioId") UUID usuarioId
    ) {
        startupService.removerMembro(startupId, usuarioId);
        return ResponseEntity.noContent().build();
    }

}
