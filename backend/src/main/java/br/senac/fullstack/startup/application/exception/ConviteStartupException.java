package br.senac.fullstack.startup.application.exception;

public class ConviteStartupException extends RuntimeException {
    public enum Codigo {
        CONVITE_PENDENTE, JA_INTEGRANTE, CONVITE_INDISPONIVEL, CONVITE_FINALIZADO,
        SOLICITACAO_DIVERGENTE, CONVITE_EXPIRADO, CONVITE_OBRIGATORIO, DESTINATARIO_INDISPONIVEL
    }

    private final Codigo codigo;

    public ConviteStartupException(Codigo codigo) {
        super(codigo.name());
        this.codigo = codigo;
    }

    public Codigo getCodigo() {
        return codigo;
    }
}
