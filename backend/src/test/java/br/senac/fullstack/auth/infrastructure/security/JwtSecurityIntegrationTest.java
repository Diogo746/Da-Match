package br.senac.fullstack.auth.infrastructure.security;

import br.senac.fullstack.auth.domain.entity.AuthSession;
import br.senac.fullstack.auth.infrastructure.persistence.repository.AuthRefreshTokenRepository;
import br.senac.fullstack.auth.infrastructure.persistence.repository.AuthSessionRepository;
import br.senac.fullstack.shared.enums.TipoUsuario;
import br.senac.fullstack.usuario.domain.entity.Usuario;
import br.senac.fullstack.usuario.infrastructure.persistence.repository.UsuarioRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.http.Cookie;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.mock.web.MockHttpSession;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import java.security.KeyPair;
import java.time.Clock;
import java.time.Instant;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.Callable;
import java.util.concurrent.Executors;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest(properties = {
        "spring.datasource.url=jdbc:h2:mem:jwt-security;MODE=PostgreSQL;DB_CLOSE_DELAY=-1",
        "app.security.auth-mode=JWT", "app.security.jwt.issuer=test-issuer",
        "app.security.jwt.audience=test-audience", "app.security.jwt.active-key-id=test",
        "app.security.cookies.secure=true"
})
@AutoConfigureMockMvc
class JwtSecurityIntegrationTest {
    private static final KeyPair KEYS = JwtTokenCodecTest.keys(2048);
    private static final Instant START = Instant.parse("2026-11-05T18:00:00Z");
    @Autowired private MockMvc mvc;
    @Autowired private ObjectMapper mapper;
    @Autowired private UsuarioRepository users;
    @Autowired private AuthSessionRepository sessions;
    @Autowired private AuthRefreshTokenRepository refreshTokens;
    @Autowired private PasswordEncoder encoder;
    @Autowired private JwtTokenCodec codec;
    @MockBean(name = "jwtClock") private Clock clock;
    private Usuario user;

    @DynamicPropertySource
    static void keys(DynamicPropertyRegistry registry) {
        registry.add("app.security.jwt.private-key", () -> JwtTokenCodecTest.encode(KEYS.getPrivate().getEncoded()));
        registry.add("app.security.jwt.public-keys.test", () -> JwtTokenCodecTest.encode(KEYS.getPublic().getEncoded()));
    }

    @BeforeEach
    void prepare() {
        when(clock.instant()).thenReturn(START);
        refreshTokens.deleteAll();
        sessions.deleteAll();
        users.deleteAll();
        user = users.saveAndFlush(new Usuario("Pessoa Ficticia", "jwt@example.test",
                encoder.encode("senha-ficticia-123"), TipoUsuario.STARTUP));
    }

    @Test
    void loginUsesSecureHttpOnlyCookiesAndNoHttpSessionOrPayloadTokens() throws Exception {
        var login = login();
        assertThat(login.getRequest().getSession(false)).isNull();
        assertThat(login.getResponse().getHeaders("Set-Cookie")).noneMatch(value -> value.startsWith("JSESSIONID="));
        assertThat(login.getResponse().getHeader(JwtCookies.MODE_HEADER)).isEqualTo("JWT");
        assertThat(login.getResponse().getHeader(JwtCookies.EXPIRY_HEADER)).isEqualTo(START.plusSeconds(900).toString());
        assertThat(login.getResponse().getContentAsString()).doesNotContain("token", "senha", "credential", "sid");
        assertThat(login.getResponse().getCookie(JwtCookies.ACCESS).isHttpOnly()).isTrue();
        assertThat(login.getResponse().getCookie(JwtCookies.ACCESS).getSecure()).isTrue();
        assertThat(login.getResponse().getCookie(JwtCookies.REFRESH).getPath()).isEqualTo("/api/v1/auth");
        assertThat(login.getResponse().getHeaders("Set-Cookie")).anySatisfy(value ->
                assertThat(value).contains("DAMATCH-ACCESS=", "SameSite=Lax", "Secure", "HttpOnly", "Path=/"));
        Cookie access = cookie(login, JwtCookies.ACCESS);
        mvc.perform(get("/api/v1/auth/me").cookie(access)).andExpect(status().isOk())
                .andExpect(jsonPath("id").value(user.getId().toString()));
        var stored = refreshTokens.findAll().getFirst().getTokenHash();
        assertThat(stored).hasSize(64).doesNotContain(cookie(login, JwtCookies.REFRESH).getValue());
        mvc.perform(get("/api/v1/mentores/me").cookie(access)).andExpect(status().isForbidden());
    }

    @Test
    void csrfStillProtectsLoginRefreshAndLogout() throws Exception {
        mvc.perform(post("/api/v1/auth/login").contentType("application/json").content(credentials()))
                .andExpect(status().isForbidden());
        var login = login();
        mvc.perform(post("/api/v1/auth/refresh").cookie(cookie(login, JwtCookies.REFRESH)))
                .andExpect(status().isForbidden());
        mvc.perform(post("/api/v1/auth/logout").cookie(cookie(login, JwtCookies.ACCESS), cookie(login, JwtCookies.REFRESH)))
                .andExpect(status().isForbidden());
        mvc.perform(get("/api/v1/auth/me").cookie(cookie(login, JwtCookies.ACCESS))).andExpect(status().isOk());
    }

    @Test
    void expiredAccessCanBeRenewedOnceAndReuseRevokesTheEntireFamily() throws Exception {
        var login = login();
        Cookie oldAccess = cookie(login, JwtCookies.ACCESS);
        Cookie oldRefresh = cookie(login, JwtCookies.REFRESH);
        when(clock.instant()).thenReturn(START.plusSeconds(901));
        mvc.perform(get("/api/v1/auth/me").cookie(oldAccess)).andExpect(status().isUnauthorized())
                .andExpect(header().string(JwtCookies.MODE_HEADER, "JWT"));
        var renewal = write("/api/v1/auth/refresh", oldRefresh);
        assertThat(renewal.getResponse().getStatus()).isEqualTo(204);
        assertThat(renewal.getResponse().getHeaders("Set-Cookie"))
                .noneMatch(value -> value.startsWith("XSRF-TOKEN="));
        Cookie newAccess = cookie(renewal, JwtCookies.ACCESS);
        assertThat(cookie(renewal, JwtCookies.REFRESH).getValue()).isNotEqualTo(oldRefresh.getValue());
        mvc.perform(get("/api/v1/auth/me").cookie(newAccess)).andExpect(status().isOk());
        assertThat(write("/api/v1/auth/refresh", oldRefresh).getResponse().getStatus()).isEqualTo(401);
        mvc.perform(get("/api/v1/auth/me").cookie(newAccess)).andExpect(status().isUnauthorized());
        assertThat(write("/api/v1/auth/refresh", cookie(renewal, JwtCookies.REFRESH)).getResponse().getStatus())
                .isEqualTo(401);
    }

    @Test
    void logoutRevokesAccessAndRefreshImmediatelyAndClearsCookies() throws Exception {
        var login = login();
        var logout = write("/api/v1/auth/logout", cookie(login, JwtCookies.ACCESS), cookie(login, JwtCookies.REFRESH));
        assertThat(logout.getResponse().getStatus()).isEqualTo(204);
        assertThat(logout.getResponse().getHeaders("Set-Cookie")).anySatisfy(value ->
                assertThat(value).contains("DAMATCH-ACCESS=", "Max-Age=0", "HttpOnly", "Secure", "SameSite=Lax"));
        assertThat(logout.getResponse().getHeaders("Set-Cookie")).anySatisfy(value ->
                assertThat(value).contains("DAMATCH-REFRESH=", "Max-Age=0", "Path=/api/v1/auth"));
        mvc.perform(get("/api/v1/auth/me").cookie(cookie(login, JwtCookies.ACCESS))).andExpect(status().isUnauthorized());
        assertThat(write("/api/v1/auth/refresh", cookie(login, JwtCookies.REFRESH)).getResponse().getStatus()).isEqualTo(401);
        assertThat(write("/api/v1/auth/logout").getResponse().getStatus()).isEqualTo(204);
    }

    @Test
    void validAccessRestorationAndRefreshPreserveCsrfAcrossRequests() throws Exception {
        var login = login();
        Cookie access = cookie(login, JwtCookies.ACCESS);
        var token = csrf();
        mvc.perform(get("/api/v1/auth/me").cookie(access, token.cookie())).andExpect(status().isOk())
                .andExpect(result -> assertThat(result.getResponse().getHeaders("Set-Cookie"))
                        .noneMatch(value -> value.startsWith("XSRF-TOKEN=")));
        var renewed = mvc.perform(post("/api/v1/auth/refresh").cookie(access, cookie(login, JwtCookies.REFRESH), token.cookie())
                .header("X-XSRF-TOKEN", token.value())).andExpect(status().isNoContent()).andReturn();
        assertThat(renewed.getResponse().getHeaders("Set-Cookie")).noneMatch(value -> value.startsWith("XSRF-TOKEN="));
        mvc.perform(post("/api/v1/auth/logout").cookie(cookie(renewed, JwtCookies.ACCESS),
                cookie(renewed, JwtCookies.REFRESH), token.cookie()).header("X-XSRF-TOKEN", token.value()))
                .andExpect(status().isNoContent());
    }

    @Test
    void replacingLoginRevokesThePreviousCookieFamily() throws Exception {
        var first = login();
        var token = csrf();
        var second = mvc.perform(post("/api/v1/auth/login").cookie(token.cookie(), cookie(first, JwtCookies.REFRESH))
                .header("X-XSRF-TOKEN", token.value()).contentType("application/json").content(credentials()))
                .andExpect(status().isOk()).andReturn();
        mvc.perform(get("/api/v1/auth/me").cookie(cookie(first, JwtCookies.ACCESS))).andExpect(status().isUnauthorized());
        mvc.perform(get("/api/v1/auth/me").cookie(cookie(second, JwtCookies.ACCESS))).andExpect(status().isOk());
    }

    @Test
    void passwordAndRoleChangesInvalidateExistingAccessAndRenewal() throws Exception {
        var first = login();
        user.setSenha(encoder.encode("outra-senha-ficticia"));
        users.saveAndFlush(user);
        mvc.perform(get("/api/v1/auth/me").cookie(cookie(first, JwtCookies.ACCESS))).andExpect(status().isUnauthorized());
        assertThat(write("/api/v1/auth/refresh", cookie(first, JwtCookies.REFRESH)).getResponse().getStatus()).isEqualTo(401);
        user.setSenha(encoder.encode("senha-ficticia-123"));
        users.saveAndFlush(user);
        var second = login();
        user.setTipoUsuario(TipoUsuario.ADMIN);
        users.saveAndFlush(user);
        mvc.perform(get("/api/v1/auth/me").cookie(cookie(second, JwtCookies.ACCESS))).andExpect(status().isUnauthorized());
        assertThat(write("/api/v1/auth/refresh", cookie(second, JwtCookies.REFRESH)).getResponse().getStatus()).isEqualTo(401);
    }

    @Test
    void reflectsCurrentPublicAccountDataWithoutEmbeddingItInJwt() throws Exception {
        var login = login();
        user.setNome("Nome atualizado");
        users.saveAndFlush(user);
        mvc.perform(get("/api/v1/auth/me").cookie(cookie(login, JwtCookies.ACCESS))).andExpect(status().isOk())
                .andExpect(jsonPath("nome").value("Nome atualizado"));
    }

    @Test
    void rejectsIdleAndAbsoluteExpiryWithoutExtendingPastEightHours() throws Exception {
        var idle = login();
        when(clock.instant()).thenReturn(START.plusSeconds(1800));
        assertThat(write("/api/v1/auth/refresh", cookie(idle, JwtCookies.REFRESH)).getResponse().getStatus()).isEqualTo(401);
        when(clock.instant()).thenReturn(START);
        var login = login();
        UUID id = codec.verify(cookie(login, JwtCookies.ACCESS).getValue()).sessionId();
        AuthSession session = sessions.findById(id).orElseThrow();
        session.setAbsoluteExpiresAt(START.plusSeconds(950));
        sessions.saveAndFlush(session);
        when(clock.instant()).thenReturn(START.plusSeconds(900));
        var renewed = write("/api/v1/auth/refresh", cookie(login, JwtCookies.REFRESH));
        assertThat(renewed.getResponse().getStatus()).isEqualTo(204);
        assertThat(codec.verify(cookie(renewed, JwtCookies.ACCESS).getValue()).expiresAt()).isEqualTo(START.plusSeconds(950));
        when(clock.instant()).thenReturn(START.plusSeconds(950));
        assertThat(write("/api/v1/auth/refresh", cookie(renewed, JwtCookies.REFRESH)).getResponse().getStatus()).isEqualTo(401);
    }

    @Test
    void unknownRandomRefreshDoesNotRevokeALegitimateFamily() throws Exception {
        var login = login();
        UUID id = codec.verify(cookie(login, JwtCookies.ACCESS).getValue()).sessionId();
        var random = new Cookie(JwtCookies.REFRESH, JwtSecrets.refreshToken(id));
        assertThat(write("/api/v1/auth/refresh", random).getResponse().getStatus()).isEqualTo(401);
        mvc.perform(get("/api/v1/auth/me").cookie(cookie(login, JwtCookies.ACCESS))).andExpect(status().isOk());
    }

    @Test
    void doesNotFallBackToHttpSessionBearerHeaderOrDuplicateCookies() throws Exception {
        var login = login();
        var old = new MockHttpSession();
        var context = SecurityContextHolder.createEmptyContext();
        var principal = new UsuarioPrincipal(user.getId(), user.getNome(), user.getEmail(), "", user.getTipoUsuario());
        context.setAuthentication(UsernamePasswordAuthenticationToken.authenticated(principal, null, principal.getAuthorities()));
        old.setAttribute("SPRING_SECURITY_CONTEXT", context);
        mvc.perform(get("/api/v1/auth/me").session(old)).andExpect(status().isUnauthorized());
        mvc.perform(get("/api/v1/auth/me").header("Authorization", "Bearer " + cookie(login, JwtCookies.ACCESS).getValue()))
                .andExpect(status().isUnauthorized());
        mvc.perform(get("/api/v1/auth/me").cookie(cookie(login, JwtCookies.ACCESS), cookie(login, JwtCookies.ACCESS)))
                .andExpect(status().isUnauthorized());
        mvc.perform(get("/api/v1/health").cookie(new Cookie(JwtCookies.ACCESS, "invalid"))).andExpect(status().isOk());
    }

    @Test
    void concurrentRefreshIsSerializedAndReplayLeavesNoActiveFamily() throws Exception {
        var login = login();
        var csrf = csrf();
        Cookie refresh = cookie(login, JwtCookies.REFRESH);
        Callable<Integer> action = () -> mvc.perform(post("/api/v1/auth/refresh")
                .cookie(csrf.cookie(), refresh).header("X-XSRF-TOKEN", csrf.value())).andReturn().getResponse().getStatus();
        try (var executor = Executors.newFixedThreadPool(2)) {
            var first = executor.submit(action);
            var second = executor.submit(action);
            assertThat(java.util.List.of(first.get(), second.get())).containsExactlyInAnyOrder(204, 401);
        }
        mvc.perform(get("/api/v1/auth/me").cookie(cookie(login, JwtCookies.ACCESS))).andExpect(status().isUnauthorized());
    }

    private MvcResult login() throws Exception {
        var token = csrf();
        return mvc.perform(post("/api/v1/auth/login").cookie(token.cookie()).header("X-XSRF-TOKEN", token.value())
                .contentType("application/json").content(credentials())).andExpect(status().isOk()).andReturn();
    }

    private String credentials() throws Exception {
        return mapper.writeValueAsString(Map.of("email", user.getEmail(), "senha", "senha-ficticia-123"));
    }

    private MvcResult write(String path, Cookie... cookies) throws Exception {
        var token = csrf();
        var request = post(path).cookie(token.cookie()).header("X-XSRF-TOKEN", token.value());
        if (cookies.length > 0) {
            request.cookie(cookies);
        }
        return mvc.perform(request).andReturn();
    }

    private Csrf csrf() throws Exception {
        var result = mvc.perform(get("/csrf")).andExpect(status().isOk()).andReturn();
        return new Csrf(cookie(result, "XSRF-TOKEN"), mapper.readTree(result.getResponse().getContentAsString()).get("token").asText());
    }

    private static Cookie cookie(MvcResult result, String name) {
        return result.getResponse().getCookie(name);
    }

    private record Csrf(Cookie cookie, String value) {
    }
}
