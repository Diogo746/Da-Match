package br.senac.fullstack.salvos.application.service;

import br.senac.fullstack.descoberta.api.mapper.DescobertaMapper;
import br.senac.fullstack.descoberta.application.service.ElegibilidadeDescobertaService;
import br.senac.fullstack.descoberta.domain.FiltrosDescoberta;
import br.senac.fullstack.descoberta.domain.PerfilDescoberta;
import br.senac.fullstack.descoberta.infrastructure.query.DescobertaQueryRepository;
import br.senac.fullstack.salvos.api.dto.EstadoSalvoResponse;
import br.senac.fullstack.salvos.api.dto.PaginaSalvosResponse;
import br.senac.fullstack.salvos.domain.entity.PerfilSalvo;
import br.senac.fullstack.salvos.infrastructure.persistence.repository.PerfilSalvoRepository;
import br.senac.fullstack.shared.enums.TipoUsuario;
import br.senac.fullstack.shared.security.ResourceAccess;
import br.senac.fullstack.usuario.infrastructure.persistence.repository.UsuarioRepository;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Isolation;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.NoSuchElementException;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
public class SalvosService {
    private final ResourceAccess access;
    private final UsuarioRepository usuarios;
    private final PerfilSalvoRepository salvos;
    private final DescobertaQueryRepository perfis;
    private final ElegibilidadeDescobertaService elegibilidade;
    private final DescobertaMapper mapper;

    public SalvosService(ResourceAccess access, UsuarioRepository usuarios, PerfilSalvoRepository salvos,
            DescobertaQueryRepository perfis, ElegibilidadeDescobertaService elegibilidade, DescobertaMapper mapper) {
        this.access = access;
        this.usuarios = usuarios;
        this.salvos = salvos;
        this.perfis = perfis;
        this.elegibilidade = elegibilidade;
        this.mapper = mapper;
    }

    @Transactional(readOnly = true, isolation = Isolation.REPEATABLE_READ)
    public PaginaSalvosResponse listar(Map<String, List<String>> parametros) {
        var titular = access.currentParticipant();
        var tipo = destino(titular.getTipoUsuario());
        FiltrosDescoberta.validarParametros(parametros, Set.of("pagina", "tamanho"));
        var filtros = FiltrosDescoberta.ler(parametros, tipo);
        if ((long) filtros.pagina() * filtros.tamanho() > Integer.MAX_VALUE) {
            throw new IllegalArgumentException("Página inválida.");
        }
        var pagina = salvos.findByUsuarioIdAndTipoPerfil(titular.getId(), tipo,
                PageRequest.of(filtros.pagina(), filtros.tamanho(), Sort.by(Sort.Direction.DESC, "salvoEm", "id")));
        var visiveis = perfisVisiveis(tipo, pagina.map(PerfilSalvo::getPerfilId).getContent());
        var itens = pagina.stream().map(salvo -> new PaginaSalvosResponse.Item(salvo.getPerfilId(), salvo.getSalvoEm(),
                Optional.ofNullable(visiveis.get(salvo.getPerfilId())).map(mapper::toResponse).orElse(null))).toList();
        return new PaginaSalvosResponse(itens, filtros.pagina(), filtros.tamanho(), pagina.getTotalElements(), pagina.getTotalPages());
    }

    @Transactional(readOnly = true)
    public EstadoSalvoResponse estado(UUID perfilId, Map<String, List<String>> parametros) {
        var titular = access.currentParticipant();
        FiltrosDescoberta.validarParametros(parametros, Set.of());
        return new EstadoSalvoResponse(salvos.existsByUsuarioIdAndTipoPerfilAndPerfilId(titular.getId(),
                destino(titular.getTipoUsuario()), perfilId));
    }

    @Transactional
    public void salvar(UUID perfilId, Map<String, List<String>> parametros) {
        var titular = access.currentParticipant();
        FiltrosDescoberta.validarParametros(parametros, Set.of());
        var conta = usuarios.bloquearPorId(titular.getId())
                .filter(usuario -> usuario.getTipoUsuario() == titular.getTipoUsuario())
                .orElseThrow(() -> new AccessDeniedException("Acesso negado."));
        var tipo = destino(conta.getTipoUsuario());
        if (salvos.existsByUsuarioIdAndTipoPerfilAndPerfilId(conta.getId(), tipo, perfilId)) {
            return;
        }
        if (!perfisVisiveis(tipo, List.of(perfilId)).containsKey(perfilId)) {
            throw new NoSuchElementException("Perfil indisponível.");
        }
        salvos.save(new PerfilSalvo(conta, tipo, perfilId, Instant.now()));
    }

    @Transactional
    public void remover(UUID perfilId, Map<String, List<String>> parametros) {
        var titular = access.currentParticipant();
        FiltrosDescoberta.validarParametros(parametros, Set.of());
        var conta = usuarios.bloquearPorId(titular.getId())
                .filter(usuario -> usuario.getTipoUsuario() == titular.getTipoUsuario())
                .orElseThrow(() -> new AccessDeniedException("Acesso negado."));
        salvos.deleteByUsuarioIdAndTipoPerfilAndPerfilId(conta.getId(), destino(conta.getTipoUsuario()), perfilId);
    }

    private Map<UUID, PerfilDescoberta> perfisVisiveis(TipoUsuario tipo, List<UUID> ids) {
        return perfis.consultarPorIds(tipo, FiltrosDescoberta.ler(Map.of(), tipo), ids).stream()
                .map(quiz -> elegibilidade.avaliar(quiz, tipo)).flatMap(Optional::stream)
                .collect(Collectors.toMap(PerfilDescoberta::id, Function.identity()));
    }

    private TipoUsuario destino(TipoUsuario tipo) {
        return tipo == TipoUsuario.STARTUP ? TipoUsuario.MENTOR : TipoUsuario.STARTUP;
    }
}
