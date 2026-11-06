package br.senac.fullstack.auth.infrastructure.persistence.repository;

import br.senac.fullstack.auth.domain.entity.AuthSession;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;
import java.util.Optional;
import java.util.UUID;

public interface AuthSessionRepository extends JpaRepository<AuthSession, UUID> {
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select s from AuthSession s where s.id = :id")
    Optional<AuthSession> findLocked(@Param("id") UUID id);

    @Modifying
    @Query("delete from AuthSession s where s.absoluteExpiresAt < :now")
    void deleteExpired(@Param("now") Instant now);
}
