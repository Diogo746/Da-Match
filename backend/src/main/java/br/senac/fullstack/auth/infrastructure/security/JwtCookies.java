package br.senac.fullstack.auth.infrastructure.security;

import br.senac.fullstack.auth.domain.JwtCredentials;
import br.senac.fullstack.shared.security.SecurityProperties;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseCookie;

public final class JwtCookies {
    public static final String ACCESS = "DAMATCH-ACCESS";
    public static final String REFRESH = "DAMATCH-REFRESH";
    public static final String MODE_HEADER = "X-Auth-Mode";
    public static final String EXPIRY_HEADER = "X-Auth-Expires-At";
    public static final String IDENTITY_ATTRIBUTE = JwtCookies.class.getName() + ".identity";
    private final SecurityProperties properties;

    public JwtCookies(SecurityProperties properties) {
        this.properties = properties;
    }

    public String read(HttpServletRequest request, String name) {
        String value = null;
        if (request.getCookies() != null) {
            for (Cookie cookie : request.getCookies()) {
                if (name.equals(cookie.getName())) {
                    if (value != null) {
                        return null;
                    }
                    value = cookie.getValue();
                }
            }
        }
        return value;
    }

    public void write(HttpServletResponse response, JwtCredentials credentials) {
        cookie(response, ACCESS, credentials.accessToken(), "/", false);
        cookie(response, REFRESH, credentials.refreshToken(), "/api/v1/auth", false);
        response.setHeader(MODE_HEADER, "JWT");
        response.setHeader(EXPIRY_HEADER, credentials.accessExpiresAt().toString());
    }

    public void clear(HttpServletResponse response) {
        cookie(response, ACCESS, "", "/", true);
        cookie(response, REFRESH, "", "/api/v1/auth", true);
    }

    private void cookie(HttpServletResponse response, String name, String value, String path, boolean clear) {
        var builder = ResponseCookie.from(name, value).httpOnly(true)
                .secure(properties.getCookies().isSecure()).sameSite(properties.getCookies().getSameSite()).path(path);
        if (clear) {
            builder.maxAge(0);
        }
        response.addHeader(HttpHeaders.SET_COOKIE, builder.build().toString());
    }
}
