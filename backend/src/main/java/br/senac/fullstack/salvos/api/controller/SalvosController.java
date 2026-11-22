package br.senac.fullstack.salvos.api.controller;

import br.senac.fullstack.salvos.api.dto.EstadoSalvoResponse;
import br.senac.fullstack.salvos.api.dto.PaginaSalvosResponse;
import br.senac.fullstack.salvos.application.service.SalvosService;
import org.springframework.http.HttpStatus;
import org.springframework.util.MultiValueMap;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/salvos")
public class SalvosController {
    private final SalvosService service;

    public SalvosController(SalvosService service) {
        this.service = service;
    }

    @GetMapping
    public PaginaSalvosResponse listar(@RequestParam MultiValueMap<String, String> parametros) {
        return service.listar(parametros);
    }

    @GetMapping("/{perfilId}")
    public EstadoSalvoResponse estado(@PathVariable("perfilId") UUID perfilId,
            @RequestParam MultiValueMap<String, String> parametros) {
        return service.estado(perfilId, parametros);
    }

    @PutMapping("/{perfilId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void salvar(@PathVariable("perfilId") UUID perfilId,
            @RequestParam MultiValueMap<String, String> parametros) {
        service.salvar(perfilId, parametros);
    }

    @DeleteMapping("/{perfilId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void remover(@PathVariable("perfilId") UUID perfilId,
            @RequestParam MultiValueMap<String, String> parametros) {
        service.remover(perfilId, parametros);
    }
}
