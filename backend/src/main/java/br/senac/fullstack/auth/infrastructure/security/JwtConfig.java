package br.senac.fullstack.auth.infrastructure.security;

import br.senac.fullstack.auth.application.service.JwtSessionService;
import br.senac.fullstack.shared.security.SecurityProperties;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.boot.web.servlet.FilterRegistrationBean;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.time.Clock;
import java.time.ZoneId;

@Configuration
@ConditionalOnProperty(name = "app.security.auth-mode", havingValue = "JWT")
@EnableConfigurationProperties(JwtProperties.class)
public class JwtConfig {
    @Bean
    public Clock jwtClock() {
        return Clock.system(ZoneId.of("America/Sao_Paulo"));
    }

    @Bean
    public JwtTokenCodec jwtTokenCodec(JwtProperties properties, @Qualifier("jwtClock") Clock clock) {
        return new JwtTokenCodec(properties, clock);
    }

    @Bean
    public JwtCookies jwtCookies(SecurityProperties properties) {
        return new JwtCookies(properties);
    }

    @Bean
    public JwtAuthenticationFilter jwtAuthenticationFilter(JwtTokenCodec codec, JwtSessionService sessions,
                                                           JwtCookies cookies, ObjectMapper mapper) {
        return new JwtAuthenticationFilter(codec, sessions, cookies, mapper);
    }

    @Bean
    public FilterRegistrationBean<JwtAuthenticationFilter> jwtFilterRegistration(JwtAuthenticationFilter filter) {
        var registration = new FilterRegistrationBean<>(filter);
        registration.setEnabled(false);
        return registration;
    }
}
