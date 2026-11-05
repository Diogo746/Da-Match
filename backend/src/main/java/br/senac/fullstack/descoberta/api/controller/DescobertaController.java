package br.senac.fullstack.descoberta.api.controller;

import br.senac.fullstack.descoberta.api.dto.PaginaPerfisDescobertaResponse;
import br.senac.fullstack.descoberta.api.dto.PerfilDescobertaResponse;
import br.senac.fullstack.descoberta.application.service.DescobertaService;
import br.senac.fullstack.shared.enums.TipoUsuario;
import org.springframework.util.MultiValueMap;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/descoberta")
public class DescobertaController {
    private final DescobertaService service;

    public DescobertaController(DescobertaService service) {
        this.service = service;
    }

    @GetMapping("/mentores")
    public PaginaPerfisDescobertaResponse mentores(@RequestParam MultiValueMap<String, String> parametros) {
        return service.listar(TipoUsuario.MENTOR, parametros);
    }

    @GetMapping("/startups")
    public PaginaPerfisDescobertaResponse startups(@RequestParam MultiValueMap<String, String> parametros) {
        return service.listar(TipoUsuario.STARTUP, parametros);
    }

    @GetMapping("/mentores/{mentorId}")
    public PerfilDescobertaResponse mentor(@PathVariable("mentorId") UUID id,
            @RequestParam MultiValueMap<String, String> parametros) {
        return service.detalhar(TipoUsuario.MENTOR, id, parametros);
    }

    @GetMapping("/startups/{startupId}")
    public PerfilDescobertaResponse startup(@PathVariable("startupId") UUID id,
            @RequestParam MultiValueMap<String, String> parametros) {
        return service.detalhar(TipoUsuario.STARTUP, id, parametros);
    }
}
