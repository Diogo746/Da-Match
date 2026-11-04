package br.senac.fullstack.startup.infrastructure;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.time.Clock;
import java.time.ZoneId;

@Configuration
public class ConviteStartupClockConfig {
    @Bean
    public Clock conviteStartupClock() {
        return Clock.system(ZoneId.of("America/Sao_Paulo"));
    }
}
