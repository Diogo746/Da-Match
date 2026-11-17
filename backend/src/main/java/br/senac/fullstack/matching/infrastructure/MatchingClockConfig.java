package br.senac.fullstack.matching.infrastructure;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.time.Clock;
import java.time.ZoneId;

@Configuration
public class MatchingClockConfig {
    @Bean
    public Clock matchingClock() {
        return Clock.system(ZoneId.of("America/Sao_Paulo"));
    }
}
