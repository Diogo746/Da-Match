package br.senac.fullstack.mentor.application.exception;

public class MentorNaoEncontradoException extends RuntimeException {
    public MentorNaoEncontradoException(String message) {
        super(message);
    }
}
