package br.senac.fullstack.auth.application.service;

import br.senac.fullstack.auth.api.dto.LoginRequest;
import br.senac.fullstack.auth.api.dto.UsuarioAtualResponse;
import br.senac.fullstack.auth.infrastructure.security.UsuarioPrincipal;
import br.senac.fullstack.auth.infrastructure.security.JwtCookies;
import br.senac.fullstack.auth.infrastructure.security.JwtSecrets;
import br.senac.fullstack.auth.domain.JwtIdentity;
import br.senac.fullstack.shared.security.SecurityErrors;
import br.senac.fullstack.shared.security.SecurityProperties;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseCookie;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.logout.SecurityContextLogoutHandler;
import org.springframework.security.web.authentication.session.ChangeSessionIdAuthenticationStrategy;
import org.springframework.security.web.context.SecurityContextRepository;
import org.springframework.security.web.csrf.CookieCsrfTokenRepository;
import org.springframework.stereotype.Service;
import org.springframework.beans.factory.ObjectProvider;

@Service
public class AuthService {
    private final AuthenticationManager authenticationManager;
    private final SecurityContextRepository contextRepository;
    private final CookieCsrfTokenRepository csrfRepository;
    private final SecurityProperties properties;
    private final ObjectProvider<JwtSessionService> jwtSessions;
    private final ObjectProvider<JwtCookies> jwtCookies;

    public AuthService(AuthenticationManager authenticationManager, SecurityContextRepository contextRepository,
                       CookieCsrfTokenRepository csrfRepository, SecurityProperties properties,
                       ObjectProvider<JwtSessionService> jwtSessions, ObjectProvider<JwtCookies> jwtCookies) {
        this.authenticationManager = authenticationManager;
        this.contextRepository = contextRepository;
        this.csrfRepository = csrfRepository;
        this.properties = properties;
        this.jwtSessions = jwtSessions;
        this.jwtCookies = jwtCookies;
    }

    public UsuarioAtualResponse login(LoginRequest body, HttpServletRequest request, HttpServletResponse response) {
        try {
            var authentication = authenticationManager.authenticate(
                    UsernamePasswordAuthenticationToken.unauthenticated(body.email(), body.senha()));
            if (properties.usesJwt()) {
                JwtCookies cookies = jwtCookies.getObject();
                UsuarioPrincipal principal = (UsuarioPrincipal) authentication.getPrincipal();
                cookies.write(response, jwtSessions.getObject().login(principal.getId(),
                        cookies.read(request, JwtCookies.REFRESH)));
            } else {
                new ChangeSessionIdAuthenticationStrategy().onAuthentication(authentication, request, response);
                response.setHeader(JwtCookies.MODE_HEADER, "SESSION");
            }
            var context = SecurityContextHolder.createEmptyContext();
            context.setAuthentication(authentication);
            SecurityContextHolder.setContext(context);
            contextRepository.saveContext(context, request, response);
            csrfRepository.saveToken(null, request, response);
            SecurityErrors.audit("login_success");
            return me();
        } catch (AuthenticationException exception) {
            SecurityErrors.audit("login_denied");
            throw exception;
        }
    }

    public UsuarioAtualResponse me() {
        UsuarioPrincipal principal = (UsuarioPrincipal) SecurityContextHolder.getContext()
                .getAuthentication().getPrincipal();
        return new UsuarioAtualResponse(principal.getId(), principal.getNome(),
                principal.getUsername(), principal.getTipoUsuario());
    }

    public void logout(HttpServletRequest request, HttpServletResponse response) {
        if (properties.usesJwt()) {
            JwtCookies cookies = jwtCookies.getObject();
            jwtSessions.getObject().revoke(cookies.read(request, JwtCookies.REFRESH));
            jwtSessions.getObject().revokeAccess((JwtIdentity) request.getAttribute(JwtCookies.IDENTITY_ATTRIBUTE));
            cookies.clear(response);
        }
        var authentication = SecurityContextHolder.getContext().getAuthentication();
        SecurityContextLogoutHandler handler = new SecurityContextLogoutHandler();
        handler.setSecurityContextRepository(contextRepository);
        handler.logout(request, response, authentication);
        csrfRepository.saveToken(null, request, response);
        response.addHeader(HttpHeaders.SET_COOKIE, ResponseCookie.from("JSESSIONID", "")
                .httpOnly(true).secure(properties.getCookies().isSecure())
                .sameSite(properties.getCookies().getSameSite()).path("/").maxAge(0).build().toString());
        SecurityErrors.audit("logout_success");
    }

    public void refresh(HttpServletRequest request, HttpServletResponse response) {
        if (!properties.usesJwt()) {
            throw JwtSecrets.denied();
        }
        JwtCookies cookies = jwtCookies.getObject();
        cookies.write(response, jwtSessions.getObject().refresh(cookies.read(request, JwtCookies.REFRESH)));
        SecurityErrors.audit("refresh_success");
    }
}
