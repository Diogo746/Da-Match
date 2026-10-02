package br.senac.fullstack.usuario.domain.entity;


import br.senac.fullstack.usuario.domain.enums.TipoUsuario;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.springframework.security.crypto.bcrypt.BCrypt;

import java.util.UUID;

@Entity
@Table(name = "usuario")
@NoArgsConstructor
@AllArgsConstructor
@Getter
@Setter
public class Usuario {
    @Id()
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    private UUID id_ldap;

    @Column(nullable = false)
    private String nome;

    @Column(unique = true, nullable = false)
    private String email;

    @Column(nullable = false)
    private String senha;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private TipoUsuario tipo_usuario;

    public Usuario(String nome, String email, String senha) {
        this.nome = nome;
        this.email = email;
        this.senha = hashSenha(senha);
    }


    private String hashSenha(String senha) {
        return BCrypt.hashpw(senha, BCrypt.gensalt());
    }

}
