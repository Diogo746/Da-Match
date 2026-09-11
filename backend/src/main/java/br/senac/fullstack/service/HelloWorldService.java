package br.senac.fullstack.service;

import br.senac.fullstack.dto.HelloWorldDTO;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.time.Instant;

@Service
public class HelloWorldService {

    @Value("${spring.application.name:fullstack-api}")
    private String applicationName;

    @Value("${app.environment:development}")
    private String environment;

    public HelloWorldDTO getGreeting(String name) {
        String recipient = (name == null || name.isBlank()) ? "Mundo" : name.trim();
        return new HelloWorldDTO(
            "Olá, " + recipient + "! Bem-vindo à Unidade de Extensão Fullstack Senac 2026.2.",
            applicationName,
            environment,
            Instant.now()
        );
    }
}
