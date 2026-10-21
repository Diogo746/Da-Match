package br.senac.fullstack.shared.security;

import br.senac.fullstack.shared.enums.TipoUsuario;
import br.senac.fullstack.usuario.domain.entity.Usuario;
import br.senac.fullstack.usuario.infrastructure.persistence.repository.UsuarioRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.core.env.Environment;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT, properties = {
        "spring.datasource.url=jdbc:h2:mem:production-security;MODE=PostgreSQL;DB_CLOSE_DELAY=-1",
        "app.security.cors.allowed-origins=https://frontend.example.test",
        "app.security.cookies.same-site=None",
        "server.servlet.session.cookie.same-site=None"
})
@ActiveProfiles("prod")
@AutoConfigureMockMvc
class ProductionSecurityTest {
    @LocalServerPort
    private int port;
    @Autowired
    private ObjectMapper mapper;
    @Autowired
    private UsuarioRepository users;
    @Autowired
    private PasswordEncoder encoder;
    @Autowired
    private MockMvc mvc;
    @Autowired
    private Environment environment;

    @Test
    void realServletSessionCookieIsSecureHttpOnlyAndClearedAtLogout() throws Exception {
        users.saveAndFlush(new Usuario("Conta Ficticia", "cookie@example.test",
                encoder.encode("senha-ficticia-123"), TipoUsuario.MENTOR));
        try (HttpClient client = HttpClient.newHttpClient()) {
            String base = "http://localhost:" + port;
            var token = client.send(HttpRequest.newBuilder(URI.create(base + "/csrf")).GET().build(),
                    HttpResponse.BodyHandlers.ofString());
            assertThat(token.statusCode()).isEqualTo(200);
            String csrfCookie = token.headers().allValues("set-cookie").getFirst();
            assertThat(csrfCookie).contains("Secure", "Path=/", "SameSite=None").doesNotContain("HttpOnly");
            String body = mapper.writeValueAsString(Map.of("email", "cookie@example.test", "senha", "senha-ficticia-123"));
            var login = client.send(HttpRequest.newBuilder(URI.create(base + "/api/v1/auth/login"))
                            .header("Cookie", csrfCookie.split(";")[0])
                            .header("X-XSRF-TOKEN", mapper.readTree(token.body()).get("token").asText())
                            .header("Content-Type", "application/json").POST(HttpRequest.BodyPublishers.ofString(body)).build(),
                    HttpResponse.BodyHandlers.ofString());
            assertThat(login.statusCode()).isEqualTo(200);
            String sessionCookie = login.headers().allValues("set-cookie").stream()
                    .filter(value -> value.startsWith("JSESSIONID=")).findFirst().orElseThrow();
            assertThat(sessionCookie).contains("Secure", "HttpOnly", "Path=/", "SameSite=None");
            String sessionPair = sessionCookie.split(";")[0];
            var refreshed = client.send(HttpRequest.newBuilder(URI.create(base + "/csrf"))
                    .header("Cookie", sessionPair).GET().build(), HttpResponse.BodyHandlers.ofString());
            String newCsrfPair = refreshed.headers().allValues("set-cookie").getFirst().split(";")[0];
            var logout = client.send(HttpRequest.newBuilder(URI.create(base + "/api/v1/auth/logout"))
                            .header("Cookie", sessionPair + "; " + newCsrfPair)
                            .header("X-XSRF-TOKEN", mapper.readTree(refreshed.body()).get("token").asText())
                            .POST(HttpRequest.BodyPublishers.noBody()).build(), HttpResponse.BodyHandlers.ofString());
            assertThat(logout.statusCode()).isEqualTo(204);
            assertThat(logout.headers().allValues("set-cookie")).anySatisfy(value ->
                    assertThat(value).contains("JSESSIONID=", "Max-Age=0", "HttpOnly", "Secure", "SameSite=None"));
            var after = client.send(HttpRequest.newBuilder(URI.create(base + "/api/v1/auth/me"))
                    .header("Cookie", sessionPair).GET().build(), HttpResponse.BodyHandlers.ofString());
            assertThat(after.statusCode()).isEqualTo(401);
        }
    }

    @Test
    void productionDisablesHelloAndSqlAndSchemaUpdatesAndOnlySendsHstsOnHttps() throws Exception {
        assertThat(environment.getProperty("spring.jpa.hibernate.ddl-auto")).isEqualTo("validate");
        assertThat(environment.getProperty("spring.jpa.show-sql")).isEqualTo("false");
        assertThat(environment.getProperty("spring.flyway.baseline-on-migrate")).isEqualTo("false");
        assertThat(environment.getProperty("management.endpoints.web.exposure.include")).isEqualTo("health");
        mvc.perform(get("/api/v1/hello").with(user("admin").roles("ADMIN"))).andExpect(status().isForbidden());
        mvc.perform(get("/api/v1/health").secure(true)).andExpect(status().isOk())
                .andExpect(header().exists("Strict-Transport-Security"));
        mvc.perform(get("/api/v1/health").header("X-Forwarded-Proto", "https")).andExpect(status().isOk())
                .andExpect(header().doesNotExist("Strict-Transport-Security"));
    }
}
