# 06 — Especificação de Telas & Diretrizes de UI/UX

---

## 1. Mapa de Navegação da Aplicação (Sitemap)

* `/login` &rarr; Tela de Autenticação Centralizada.
* `/dashboard` &rarr; Painel Principal com métricas e atalhos rápidos.
* `/cadastros/novo` &rarr; Formulário de Inserção de Registros.
* `/cadastros/listar` &rarr; Tabela paginada com busca, ordenação e filtros.
* `/relatorios` &rarr; Central de Exportação de Dados (PDF/CSV).
* `/perfil` &rarr; Dados do Usuário Autenticado e Informações de Sessão.

---

## 2. Wireframes Estruturais & Layout dos Componentes

### 🖥️ Tela 01: Login (`/login`)
```
+-------------------------------------------------------+
|                 [ Logo da ONG Parceira ]              |
|                                                       |
|   Usuário (LDAP):  [___________________________]      |
|   Senha:           [___________________________]      |
|                                                       |
|                    [    Entrar no Sistema    ]        |
|                                                       |
|   (i) Autenticação segura integrada à rede Senac / ONG |
+-------------------------------------------------------+
```

### 🖥️ Tela 02: Dashboard Principal (`/dashboard`)
```
+-------------------------------------------------------------------------+
| [Logo] Sistema de Extensão               Olá, [Nome] (Gestor) | Sair   |
+-------------------------------------------------------------------------+
| [Menu]       |  [ Card 1: Atendimentos ]  [ Card 2: Saldo / Estoque ]    |
| - Início     |  Total: 142 famílias       Disponível: 85 cestas         |
| - Cadastros  +---------------------------------------------------------+
| - Relatórios |  Tabela de Atividades Recentes:                          |
| - Admin      |  Data       | Beneficiário    | Operador   | Status     |
|              |  04/09/2026 | Maria Silva     | Carlos (V) | Concluído  |
+--------------+---------------------------------------------------------+
```

---

## 3. Checklist de Acessibilidade (WCAG 2.1 AA)

- [ ] Contraste de texto mínimo de 4.5:1 para texto normal e 3:1 para texto grande.
- [ ] Todos os campos de formulário possuem `<label>` semanticamente associado via `for`/`id`.
- [ ] O sistema é 100% navegável utilizando apenas o teclado (<kbd>Tab</kbd>, <kbd>Enter</kbd>, <kbd>Esc</kbd>).
- [ ] Elementos interativos possuem estados visíveis de foco (`:focus-visible`).
