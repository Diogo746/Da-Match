package br.senac.fullstack.auth.infrastructure.security;

import br.senac.fullstack.shared.enums.TipoUsuario;
import br.senac.fullstack.usuario.domain.entity.Usuario;
import br.senac.fullstack.usuario.infrastructure.persistence.repository.UsuarioRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.core.env.Environment;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.security.KeyPair;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT, properties = {
        "spring.datasource.url=jdbc:h2:mem:vercel-security;MODE=PostgreSQL;DB_CLOSE_DELAY=-1",
        // The test resource replaces application.yml, including its profile group.
        "spring.profiles.group.vercel=prod",
        "app.security.cors.allowed-origins=https://frontend.example.test",
        "app.security.jwt.issuer=test-issuer", "app.security.jwt.audience=test-audience",
        "app.security.jwt.active-key-id=test"
})
@ActiveProfiles("vercel")
class VercelSecurityIntegrationTest {
    private static final KeyPair KEYS = JwtTokenCodecTest.keys(2048);
    @LocalServerPort private int port;
    @Autowired private Environment environment;
    @Autowired private UsuarioRepository users;
    @Autowired private PasswordEncoder encoder;
    @Autowired private ObjectMapper mapper;

    @DynamicPropertySource
    static void keys(DynamicPropertyRegistry registry) {
        registry.add("app.security.jwt.private-key", () -> JwtTokenCodecTest.encode(KEYS.getPrivate().getEncoded()));
        registry.add("app.security.jwt.public-keys.test", () -> JwtTokenCodecTest.encode(KEYS.getPublic().getEncoded()));
    }

    @Test
    void realServletUsesJwtCookiesRefreshAndRevocationWithoutJsessionid() throws Exception {
        users.saveAndFlush(new Usuario("Pessoa Ficticia", "wire-jwt@example.test",
                encoder.encode("senha-ficticia-123"), TipoUsuario.STARTUP));
        assertThat(environment.getActiveProfiles()).contains("vercel", "prod");
        assertThat(environment.getProperty("server.shutdown")).isEqualTo("graceful");
        assertThat(environment.getProperty("spring.datasource.hikari.maximum-pool-size")).isEqualTo("4");
        assertThat(environment.getProperty("server.forward-headers-strategy")).isEqualTo("none");
        try (HttpClient client = HttpClient.newHttpClient()) {
            String base = "http://localhost:" + port;
            var csrf = client.send(HttpRequest.newBuilder(URI.create(base + "/csrf")).GET().build(),
                    HttpResponse.BodyHandlers.ofString());
            String csrfPair = pair(csrf, "XSRF-TOKEN");
            String csrfValue = mapper.readTree(csrf.body()).get("token").asText();
            var login = client.send(HttpRequest.newBuilder(URI.create(base + "/api/v1/auth/login"))
                    .header("Cookie", csrfPair).header("X-XSRF-TOKEN", csrfValue).header("Content-Type", "application/json")
                    .POST(HttpRequest.BodyPublishers.ofString(mapper.writeValueAsString(
                            Map.of("email", "wire-jwt@example.test", "senha", "senha-ficticia-123")))).build(),
                    HttpResponse.BodyHandlers.ofString());
            assertThat(login.statusCode()).isEqualTo(200);
            assertThat(login.headers().allValues("set-cookie")).noneMatch(value -> value.startsWith("JSESSIONID="));
            assertThat(login.headers().allValues("set-cookie")).anySatisfy(value ->
                    assertThat(value).contains("DAMATCH-ACCESS=", "Secure", "HttpOnly", "SameSite=Lax"));
            String access = pair(login, JwtCookies.ACCESS);
            String refresh = pair(login, JwtCookies.REFRESH);
            var me = client.send(HttpRequest.newBuilder(URI.create(base + "/api/v1/auth/me"))
                    .header("Cookie", access).GET().build(), HttpResponse.BodyHandlers.ofString());
            assertThat(me.statusCode()).isEqualTo(200);
            var nextCsrf = client.send(HttpRequest.newBuilder(URI.create(base + "/csrf")).GET().build(),
                    HttpResponse.BodyHandlers.ofString());
            var renewed = client.send(HttpRequest.newBuilder(URI.create(base + "/api/v1/auth/refresh"))
                    .header("Cookie", refresh + "; " + pair(nextCsrf, "XSRF-TOKEN"))
                    .header("X-XSRF-TOKEN", mapper.readTree(nextCsrf.body()).get("token").asText())
                    .POST(HttpRequest.BodyPublishers.noBody()).build(), HttpResponse.BodyHandlers.ofString());
            assertThat(renewed.statusCode()).isEqualTo(204);
            var logout = client.send(HttpRequest.newBuilder(URI.create(base + "/api/v1/auth/logout"))
                    .header("Cookie", pair(renewed, JwtCookies.REFRESH) + "; " + pair(nextCsrf, "XSRF-TOKEN"))
                    .header("X-XSRF-TOKEN", mapper.readTree(nextCsrf.body()).get("token").asText())
                    .POST(HttpRequest.BodyPublishers.noBody()).build(), HttpResponse.BodyHandlers.ofString());
            assertThat(logout.statusCode()).isEqualTo(204);
            var revoked = client.send(HttpRequest.newBuilder(URI.create(base + "/api/v1/auth/me"))
                    .header("Cookie", access).GET().build(), HttpResponse.BodyHandlers.ofString());
            assertThat(revoked.statusCode()).isEqualTo(401);
        }
    }

    private static String pair(HttpResponse<String> response, String name) {
        return response.headers().allValues("set-cookie").stream().filter(value -> value.startsWith(name + "="))
                .findFirst().orElseThrow().split(";", 2)[0];
    }
}
