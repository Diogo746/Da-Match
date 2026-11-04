package br.senac.fullstack.startup.api.controller;

import br.senac.fullstack.startup.api.dto.ConviteStartupResponse;
import br.senac.fullstack.startup.api.dto.CriarConviteStartupRequest;
import br.senac.fullstack.startup.api.dto.PaginaConvitesStartupResponse;
import br.senac.fullstack.startup.application.service.ConviteStartupService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/startups")
public class ConviteStartupController {
    private final ConviteStartupService service;

    public ConviteStartupController(ConviteStartupService service) {
        this.service = service;
    }

    @PostMapping(value = "/{startupId}/convites", consumes = MediaType.APPLICATION_JSON_VALUE)
    @ResponseStatus(HttpStatus.CREATED)
    public ConviteStartupResponse criar(@PathVariable("startupId") UUID startupId,
            @RequestBody @Valid CriarConviteStartupRequest request) {
        return service.criar(startupId, request);
    }

    @GetMapping("/{startupId}/convites")
    public PaginaConvitesStartupResponse enviados(@PathVariable("startupId") UUID startupId,
            @RequestParam(name = "pagina", defaultValue = "0") int pagina,
            @RequestParam(name = "tamanho", defaultValue = "20") int tamanho) {
        return service.enviados(startupId, pagina, tamanho);
    }

    @GetMapping("/convites/me")
    public PaginaConvitesStartupResponse recebidos(@RequestParam(name = "pagina", defaultValue = "0") int pagina,
            @RequestParam(name = "tamanho", defaultValue = "20") int tamanho) {
        return service.recebidos(pagina, tamanho);
    }

    @GetMapping("/convites/{conviteId}")
    public ConviteStartupResponse consultar(@PathVariable("conviteId") UUID conviteId) {
        return service.consultar(conviteId);
    }

    @GetMapping("/{startupId}/convites/solicitacoes/{solicitacaoId}")
    public ConviteStartupResponse solicitacao(@PathVariable("startupId") UUID startupId,
            @PathVariable("solicitacaoId") UUID solicitacaoId) {
        return service.consultarSolicitacao(startupId, solicitacaoId);
    }

    @PatchMapping(value = "/convites/{conviteId}/aceite", consumes = MediaType.APPLICATION_JSON_VALUE)
    public ConviteStartupResponse aceitar(@PathVariable("conviteId") UUID conviteId,
            @RequestBody(required = false) Map<String, Object> body) {
        semCampos(body);
        return service.aceitar(conviteId);
    }

    @PatchMapping(value = "/convites/{conviteId}/recusa", consumes = MediaType.APPLICATION_JSON_VALUE)
    public ConviteStartupResponse recusar(@PathVariable("conviteId") UUID conviteId,
            @RequestBody(required = false) Map<String, Object> body) {
        semCampos(body);
        return service.recusar(conviteId);
    }

    @PatchMapping(value = "/{startupId}/convites/{conviteId}/cancelamento", consumes = MediaType.APPLICATION_JSON_VALUE)
    public ConviteStartupResponse cancelar(@PathVariable("startupId") UUID startupId,
            @PathVariable("conviteId") UUID conviteId, @RequestBody(required = false) Map<String, Object> body) {
        semCampos(body);
        return service.cancelar(startupId, conviteId);
    }

    private void semCampos(Map<String, Object> body) {
        if (body != null && !body.isEmpty()) {
            throw new IllegalArgumentException("Esta ação não recebe campos de negócio.");
        }
    }
}
