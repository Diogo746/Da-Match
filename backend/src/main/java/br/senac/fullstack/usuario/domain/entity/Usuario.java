package br.senac.fullstack.usuario.domain.entity;


import br.senac.fullstack.shared.enums.TipoUsuario;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;


import java.util.UUID;

@Entity
@Table(name = "usuario")
@NoArgsConstructor
@AllArgsConstructor
@Getter
@Setter
public final class Usuario {
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

    public Usuario(String nome, String email, String senha,  TipoUsuario tipo_usuario) {
        this.nome = nome;
        this.email = email;
        this.senha = senha;
        this.tipo_usuario = tipo_usuario;
    }


}
