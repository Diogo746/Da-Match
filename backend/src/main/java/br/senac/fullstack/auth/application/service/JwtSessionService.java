package br.senac.fullstack.auth.application.service;

import br.senac.fullstack.auth.domain.JwtCredentials;
import br.senac.fullstack.auth.domain.JwtIdentity;
import br.senac.fullstack.auth.domain.entity.AuthRefreshToken;
import br.senac.fullstack.auth.domain.entity.AuthSession;
import br.senac.fullstack.auth.infrastructure.persistence.repository.AuthRefreshTokenRepository;
import br.senac.fullstack.auth.infrastructure.persistence.repository.AuthSessionRepository;
import br.senac.fullstack.auth.infrastructure.security.JwtProperties;
import br.senac.fullstack.auth.infrastructure.security.JwtSecrets;
import br.senac.fullstack.auth.infrastructure.security.JwtTokenCodec;
import br.senac.fullstack.auth.infrastructure.security.UsuarioPrincipal;
import br.senac.fullstack.usuario.domain.entity.Usuario;
import br.senac.fullstack.usuario.infrastructure.persistence.repository.UsuarioRepository;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Clock;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.UUID;

@Service
@ConditionalOnProperty(name = "app.security.auth-mode", havingValue = "JWT")
public class JwtSessionService {
    private final AuthSessionRepository sessions;
    private final AuthRefreshTokenRepository refreshTokens;
    private final UsuarioRepository users;
    private final JwtProperties properties;
    private final JwtTokenCodec codec;
    private final Clock clock;

    public JwtSessionService(AuthSessionRepository sessions, AuthRefreshTokenRepository refreshTokens,
                             UsuarioRepository users, JwtProperties properties, JwtTokenCodec codec,
                             @Qualifier("jwtClock") Clock clock) {
        this.sessions = sessions;
        this.refreshTokens = refreshTokens;
        this.users = users;
        this.properties = properties;
        this.codec = codec;
        this.clock = clock;
    }

    @Transactional
    public JwtCredentials login(UUID userId, String previousRefreshToken) {
        revokeKnownToken(previousRefreshToken);
        Instant now = now();
        refreshTokens.deleteExpired(now);
        sessions.deleteExpired(now);
        Usuario user = users.findById(userId).orElseThrow(JwtSecrets::denied);
        AuthSession session = new AuthSession();
        session.setId(UUID.randomUUID());
        session.setUsuario(user);
        session.setCredentialStamp(stamp(user));
        session.setCreatedAt(now);
        session.setAbsoluteExpiresAt(now.plus(properties.getAbsoluteTtl()));
        session.setRefreshExpiresAt(now.plus(properties.getRefreshTtl()));
        sessions.save(session);
        return issue(session, now);
    }

    @Transactional(readOnly = true)
    public UsuarioPrincipal authenticate(JwtIdentity identity) {
        AuthSession session = sessions.findById(identity.sessionId()).orElseThrow(JwtSecrets::denied);
        if (!session.getUsuario().getId().equals(identity.userId()) || !valid(session, now())
                || identity.expiresAt().isAfter(session.getAbsoluteExpiresAt())) {
            throw JwtSecrets.denied();
        }
        Usuario user = session.getUsuario();
        return new UsuarioPrincipal(user.getId(), user.getNome(), user.getEmail(), "", user.getTipoUsuario());
    }

    @Transactional(noRollbackFor = BadCredentialsException.class)
    public JwtCredentials refresh(String token) {
        UUID sessionId = JwtSecrets.sessionId(token);
        AuthSession session = sessions.findLocked(sessionId).orElseThrow(JwtSecrets::denied);
        AuthRefreshToken stored = refreshTokens.findById(JwtSecrets.hash(token)).orElseThrow(JwtSecrets::denied);
        if (!stored.getSession().getId().equals(sessionId)) {
            throw JwtSecrets.denied();
        }
        Instant now = now();
        if (stored.getUsedAt() != null || !valid(session, now)) {
            session.setRevokedAt(now);
            throw JwtSecrets.denied();
        }
        stored.setUsedAt(now);
        session.setRefreshExpiresAt(earlier(now.plus(properties.getRefreshTtl()), session.getAbsoluteExpiresAt()));
        return issue(session, now);
    }

    @Transactional
    public void revoke(String token) {
        revokeKnownToken(token);
    }

    private void revokeKnownToken(String token) {
        if (token == null) {
            return;
        }
        try {
            UUID id = JwtSecrets.sessionId(token);
            sessions.findLocked(id).ifPresent(session -> refreshTokens.findById(JwtSecrets.hash(token))
                    .filter(stored -> stored.getSession().getId().equals(id))
                    .ifPresent(stored -> session.setRevokedAt(now())));
        } catch (BadCredentialsException exception) {
            // Logout also clears malformed/expired cookies without disclosing their existence.
        }
    }

    @Transactional
    public void revokeAccess(JwtIdentity identity) {
        if (identity != null) {
            sessions.findLocked(identity.sessionId())
                    .filter(session -> session.getUsuario().getId().equals(identity.userId()))
                    .ifPresent(session -> session.setRevokedAt(now()));
        }
    }

    private JwtCredentials issue(AuthSession session, Instant now) {
        String refresh = JwtSecrets.refreshToken(session.getId());
        AuthRefreshToken stored = new AuthRefreshToken();
        stored.setTokenHash(JwtSecrets.hash(refresh));
        stored.setSession(session);
        refreshTokens.save(stored);
        Instant expiresAt = earlier(now.plus(properties.getAccessTtl()), session.getAbsoluteExpiresAt());
        return new JwtCredentials(codec.issue(session.getUsuario().getId(), session.getId(), expiresAt), refresh, expiresAt);
    }

    private boolean valid(AuthSession session, Instant now) {
        return session.getRevokedAt() == null && session.getRefreshExpiresAt().isAfter(now)
                && session.getAbsoluteExpiresAt().isAfter(now)
                && session.getCredentialStamp().equals(stamp(session.getUsuario()));
    }

    private static String stamp(Usuario user) {
        return JwtSecrets.hash(user.getSenha() + "|" + user.getTipoUsuario().name());
    }

    private Instant now() {
        return clock.instant().truncatedTo(ChronoUnit.SECONDS);
    }

    private static Instant earlier(Instant first, Instant second) {
        return first.isBefore(second) ? first : second;
    }
}
