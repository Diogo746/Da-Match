package br.senac.fullstack.auth.infrastructure.persistence.repository;

import br.senac.fullstack.auth.domain.entity.AuthRefreshToken;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;

public interface AuthRefreshTokenRepository extends JpaRepository<AuthRefreshToken, String> {
    @Modifying
    @Query("delete from AuthRefreshToken t where t.session.absoluteExpiresAt < :now")
    void deleteExpired(@Param("now") Instant now);
}
