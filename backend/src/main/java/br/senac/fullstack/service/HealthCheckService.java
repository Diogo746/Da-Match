package br.senac.fullstack.service;

import br.senac.fullstack.dto.HealthStatusDTO;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.lang.management.ManagementFactory;
import java.time.Instant;

@Service
public class HealthCheckService {

    @Value("${spring.application.name:fullstack-api}")
    private String applicationName;

    @Value("${app.environment:development}")
    private String environment;

    public HealthStatusDTO checkHealth() {
        long uptime = ManagementFactory.getRuntimeMXBean().getUptime();
        return new HealthStatusDTO(
            "UP",
            applicationName,
            environment,
            Instant.now(),
            uptime
        );
    }
}
