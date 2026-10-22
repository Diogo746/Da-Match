package br.senac.fullstack.shared.security;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.JdbcTemplate;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest(properties = {
        "spring.datasource.url=jdbc:h2:mem:hibernate-legacy;MODE=PostgreSQL;DB_CLOSE_DELAY=-1",
        "spring.jpa.hibernate.ddl-auto=update",
        "spring.sql.init.mode=always",
        "spring.sql.init.schema-locations=classpath:fixtures/legacy-mentor-schema.sql"
})
class HibernateLegacySchemaTest {
    @Autowired
    private JdbcTemplate jdbc;

    @Test
    void updatesExistingSchemaWithoutRemovingLegacyDataOrRequiringMigrationHistory() {
        assertThat(jdbc.queryForObject("SELECT biografia FROM mentor", String.class))
                .isEqualTo("Biografia ficticia preservada");
        assertThat(jdbc.queryForObject("SELECT COUNT(*) FROM usuario", Integer.class)).isEqualTo(1);
        assertThat(jdbc.queryForObject("SELECT status FROM mentor", String.class)).isEqualTo("RASCUNHO");
        assertThat(jdbc.queryForObject("""
                SELECT character_maximum_length FROM information_schema.columns
                WHERE table_name = 'MENTOR' AND column_name = 'BIOGRAFIA'
                """, Integer.class)).isEqualTo(1000);
        assertThat(jdbc.queryForObject("SELECT COUNT(*) FROM disponibilidade_mentor", Integer.class)).isZero();
        assertThat(jdbc.queryForObject("SELECT COUNT(*) FROM startup", Integer.class)).isZero();
        assertThat(jdbc.queryForObject("""
                SELECT COUNT(*) FROM information_schema.tables WHERE table_name = 'FLYWAY_SCHEMA_HISTORY'
                """, Integer.class)).isZero();
    }
}
