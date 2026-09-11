package br.senac.fullstack.controller;

import br.senac.fullstack.dto.HealthStatusDTO;
import br.senac.fullstack.service.HealthCheckService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/health")
public class HealthCheckController {

    private final HealthCheckService healthCheckService;

    public HealthCheckController(HealthCheckService healthCheckService) {
        this.healthCheckService = healthCheckService;
    }

    @GetMapping
    public ResponseEntity<HealthStatusDTO> getHealth() {
        return ResponseEntity.ok(healthCheckService.checkHealth());
    }
}
