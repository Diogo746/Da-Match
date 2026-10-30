package br.senac.fullstack.shared.security;

import br.senac.fullstack.shared.enums.TipoUsuario;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.env.Environment;
import org.springframework.core.env.Profiles;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.HeadersConfigurer.HstsConfig;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.context.HttpSessionSecurityContextRepository;
import org.springframework.security.web.context.SecurityContextRepository;
import org.springframework.security.web.csrf.CookieCsrfTokenRepository;
import org.springframework.security.web.csrf.CsrfTokenRequestAttributeHandler;
import org.springframework.security.web.header.writers.ReferrerPolicyHeaderWriter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import org.springframework.web.filter.CorsFilter;
import org.springframework.boot.web.servlet.FilterRegistrationBean;

import java.util.List;

@Configuration
@EnableWebSecurity
@EnableConfigurationProperties(SecurityProperties.class)
public class SecurityConfig {
    @Bean
    public SecurityFilterChain securityFilterChain(
            HttpSecurity http, CookieCsrfTokenRepository csrfRepository,
            SecurityContextRepository contextRepository,
            SecurityProperties properties, Environment environment, ObjectMapper mapper
    ) throws Exception {
        boolean production = environment.acceptsProfiles(Profiles.of("prod"));
        if (production && !properties.getCookies().isSecure()) {
            throw new IllegalStateException("Produção exige cookies Secure.");
        }
        return http
                .cors(Customizer.withDefaults())
                .csrf(csrf -> csrf.csrfTokenRepository(csrfRepository)
                        // JSON /csrf returns the raw cookie token; HTTP response compression remains disabled.
                        .csrfTokenRequestHandler(new CsrfTokenRequestAttributeHandler()))
                .securityContext(context -> context.securityContextRepository(contextRepository))
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.IF_REQUIRED)
                        .sessionFixation(fixation -> fixation.changeSessionId()))
                .requestCache(AbstractHttpConfigurer::disable)
                .formLogin(AbstractHttpConfigurer::disable)
                .httpBasic(AbstractHttpConfigurer::disable)
                .logout(AbstractHttpConfigurer::disable)
                .exceptionHandling(errors -> errors
                        .authenticationEntryPoint((request, response, exception) ->
                                SecurityErrors.write(response, HttpStatus.UNAUTHORIZED, mapper))
                        .accessDeniedHandler((request, response, exception) ->
                                SecurityErrors.write(response, HttpStatus.FORBIDDEN, mapper)))
                .headers(headers -> {
                    headers.frameOptions(frame -> frame.deny())
                            .contentSecurityPolicy(csp -> csp.policyDirectives("frame-ancestors 'none'"))
                            .referrerPolicy(referrer ->
                                    referrer.policy(ReferrerPolicyHeaderWriter.ReferrerPolicy.NO_REFERRER));
                    if (!production) {
                        headers.httpStrictTransportSecurity(HstsConfig::disable);
                    }
                })
                .authorizeHttpRequests(auth -> {
                    auth.requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()
                            .requestMatchers(HttpMethod.GET, "/csrf", "/api/v1/health").permitAll()
                            .requestMatchers(HttpMethod.POST, "/api/v1/auth/login").permitAll()
                            .requestMatchers(HttpMethod.POST, "/api/v1/mentores", "/api/v1/startups").anonymous()
                            .requestMatchers(HttpMethod.GET, "/api/v1/auth/me").authenticated()
                            .requestMatchers(HttpMethod.GET, "/api/v1/mentores/me")
                            .hasRole(TipoUsuario.MENTOR.name())
                            .requestMatchers(HttpMethod.GET, "/api/v1/mentores/*/perfil-match")
                            .hasRole(TipoUsuario.MENTOR.name())
                            .requestMatchers(HttpMethod.PUT, "/api/v1/mentores/*/perfil-match")
                            .hasRole(TipoUsuario.MENTOR.name())
                            .requestMatchers(HttpMethod.GET, "/api/v1/startups/*/perfil-match")
                            .hasRole(TipoUsuario.STARTUP.name())
                            .requestMatchers(HttpMethod.PUT, "/api/v1/startups/*/perfil-match")
                            .hasRole(TipoUsuario.STARTUP.name())
                            .requestMatchers(HttpMethod.POST, "/api/v1/auth/logout").authenticated()
                            .requestMatchers(HttpMethod.PATCH, "/api/v1/mentores/*", "/api/v1/mentores/*/status")
                            .hasRole(TipoUsuario.MENTOR.name())
                            .requestMatchers(HttpMethod.GET, "/api/v1/startups/me").hasRole(TipoUsuario.STARTUP.name())
                            .requestMatchers(HttpMethod.GET, "/api/v1/startups/*/status")
                            .hasRole(TipoUsuario.STARTUP.name())
                            .requestMatchers(HttpMethod.PATCH, "/api/v1/startups/*/status")
                            .hasRole(TipoUsuario.STARTUP.name())
                            .requestMatchers(HttpMethod.PATCH, "/api/v1/startups/*").hasRole(TipoUsuario.STARTUP.name())
                            .requestMatchers(HttpMethod.POST, "/api/v1/startups/*/membros")
                            .hasRole(TipoUsuario.STARTUP.name())
                            .requestMatchers(HttpMethod.DELETE, "/api/v1/startups/*/membros/*")
                            .hasRole(TipoUsuario.STARTUP.name())
                            .requestMatchers(HttpMethod.GET, "/api/v1/startups", "/api/v1/startups/*",
                                    "/api/v1/startups/*/membros").authenticated()
                            .requestMatchers(HttpMethod.GET, "/actuator/health", "/actuator/health/**")
                            .hasRole(TipoUsuario.ADMIN.name());
                    if (!production) {
                        auth.requestMatchers(HttpMethod.GET, "/api/v1/hello").permitAll();
                    }
                    auth.anyRequest().denyAll();
                }).build();
    }

    @Bean
    public CookieCsrfTokenRepository csrfTokenRepository(SecurityProperties properties) {
        // Clients obtain the header token from GET /csrf, without reading document.cookie.
        CookieCsrfTokenRepository repository = new CookieCsrfTokenRepository();
        repository.setCookieCustomizer(cookie -> cookie.path("/")
                .httpOnly(true)
                .secure(properties.getCookies().isSecure()).sameSite(properties.getCookies().getSameSite()));
        return repository;
    }

    @Bean
    public SecurityContextRepository securityContextRepository() {
        HttpSessionSecurityContextRepository repository = new HttpSessionSecurityContextRepository();
        repository.setDisableUrlRewriting(true);
        return repository;
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource(SecurityProperties properties) {
        CorsConfiguration configuration = new CorsConfiguration();
        configuration.setAllowedOrigins(properties.getCors().getAllowedOrigins());
        configuration.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
        configuration.setAllowedHeaders(List.of("Content-Type", "Accept", "X-XSRF-TOKEN"));
        configuration.setAllowCredentials(true);
        configuration.setMaxAge(600L);
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }

    @Bean
    public CorsFilter corsFilter(SecurityProperties properties, ObjectMapper mapper) {
        CorsFilter filter = new CorsFilter(corsConfigurationSource(properties));
        filter.setCorsProcessor(new JsonCorsProcessor(mapper));
        return filter;
    }

    @Bean
    public FilterRegistrationBean<CorsFilter> corsFilterRegistration(CorsFilter corsFilter) {
        FilterRegistrationBean<CorsFilter> registration = new FilterRegistrationBean<>(corsFilter);
        // Run only inside the security chain, after the security headers filter.
        registration.setEnabled(false);
        return registration;
    }
}
