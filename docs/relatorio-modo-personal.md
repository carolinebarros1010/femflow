# Modo Personal no FemFlow — documentação pormenorizada

## 1) Visão geral

O **Modo Personal** é uma combinação de duas condições independentes:

1. **Direito de acesso ao serviço Personal** (autorização): `femflow_has_personal`
2. **Modo Personal ligado na sessão atual** (intenção de uso): `femflow_mode_personal`

A regra canônica do app é:

```js
const personal = hasPersonal && modePersonal;
```

Ou seja: mesmo com direito ativo, a pessoa usuária só entra no fluxo personal quando o modo estiver explicitamente ligado. Esse desenho evita acesso indevido por estado legado em `localStorage`.

---

## 2) Modelo de estado (chaves e responsabilidades)

### 2.1 `femflow_has_personal` (direito)

- **Tipo**: string booleana (`"true"`/`"false"`)
- **Origem**: dados de perfil vindos do backend
- **Responsabilidade**: informar se a usuária pode usar recursos Personal

### 2.2 `femflow_mode_personal` (modo de navegação)

- **Tipo**: string booleana (`"true"`/`"false"`)
- **Origem**: interação de UI (principalmente Home)
- **Responsabilidade**: sinalizar que a usuária quer navegar no fluxo Personal agora

### 2.3 Regra de segurança

- Nunca usar apenas `femflow_mode_personal` para liberar acesso
- Nunca usar apenas `femflow_has_personal` para assumir intenção
- Sempre derivar:

```js
personal = hasPersonal && modePersonal
```

---

## 3) Origem dos dados: como o direito Personal é calculado

Quando o perfil é carregado/sincronizado, o core aceita múltiplas assinaturas de payload para robustez com versões de backend:

- `acessos.personal`
- `r.personal`
- `r.Personal`
- `r.has_personal`
- `r.hasPersonal`
- fallback VIP (`produto === "vip"`)

Depois normaliza para `femflow_has_personal = "true"|"false"`.

### Por que isso importa?

Esse normalizador reduz regressões quando a API muda naming (`snake_case`/`camelCase`) ou quando produtos VIP herdam acesso Personal por regra de negócio.

---

## 4) Inicialização e saneamento na Home

Ao persistir o perfil na Home, o app:

1. Recalcula `hasPersonal` com base em `acessos.personal` e VIP;
2. Grava `femflow_has_personal`;
3. Remove chave legada `femflow_personal`;
4. Faz **hardening do modo**:
   - se **não** tem direito Personal, força `femflow_mode_personal = "false"`;
   - se tem direito e a chave ainda não existe, inicializa como `"false"`.

Com isso, evita-se cenário de “modo preso em true” por cache antigo.

---

## 5) Ativação e desativação do modo

## 5.1 Ativação

Na Home, quando o card `personal` desbloqueado é acionado:

1. Exibe toast de confirmação;
2. Salva `femflow_mode_personal = "true"`;
3. Navega para `flowcenter.html`.

> Importante: não vai direto ao treino; o FlowCenter segue como orquestrador de contexto.

## 5.2 Desativação automática

O modo é desligado em ações de fluxo comum, por exemplo:

- seleção de ênfases não personal;
- fluxo FollowMe;
- fluxo “Monte seu treino”;
- alguns botões/ações de navegação que retomam treino padrão;
- sincronização da Home sem direito Personal (forçado para `false`).

---

## 6) Efeito no roteador global

O roteador (`FEMFLOW.router`) anexa `?personal=1` quando `femflow_mode_personal === "true"`.

### Objetivo

- Propagar a intenção de modo personal entre telas;
- Preservar contexto de navegação mesmo com redirects internos;
- Reduzir necessidade de cada tela reconstruir estado sozinha.

---

## 7) Efeito no FlowCenter (ponto central de decisão)

No FlowCenter, a sequência lógica é:

1. Ler `hasPersonal` e `modePersonal` do `localStorage`;
2. Derivar `personal = hasPersonal && modePersonal`;
3. Derivar `treinoAcessoOk = personal || acessoAtivo || freeOkUI`.

### Consequência prática

Se `personal === true`, o fluxo de treino fica liberado mesmo que outras condições do fluxo padrão (como combinação de acesso e contexto normal) não sejam as mesmas do caminho tradicional.

Além disso, requests que montam prévia e seleção de treino enviam sinalizadores de personal no payload, permitindo ao backend/motor ajustar regras.

---

## 8) Efeito na página de treino (`treino.html`)

Existe um middleware de proteção contra acesso direto por URL.

### Regras de validação

1. Confere sessão básica (`id` + `produto`);
2. Se **não** estiver em personal:
   - exige ciclo configurado;
   - exige ênfase selecionada (ou flag de endurance).

Quando `personal === true`, o bloqueio de ciclo/ênfase do caminho padrão é flexibilizado, mantendo apenas as proteções essenciais de sessão.

---

## 9) Fluxo ponta a ponta (sequência operacional)

1. Usuária autentica e perfil é sincronizado;
2. Sistema normaliza direito Personal e grava `femflow_has_personal`;
3. Home saneia/normaliza `femflow_mode_personal`;
4. Usuária clica no card Personal;
5. Home ativa `femflow_mode_personal = "true"` e roteia ao FlowCenter;
6. Router injeta `?personal=1` enquanto o modo estiver ativo;
7. FlowCenter calcula `personal = hasPersonal && modePersonal` e prioriza o caminho personal;
8. Treino aplica middleware compatível com esse contexto;
9. Ao voltar para fluxos não personal, a Home desliga o modo (`"false"`).

---

## 10) Casos de borda importantes

### 10.1 Usuária perde direito Personal no backend

- Na próxima sincronização de perfil, `femflow_has_personal` vira `"false"`;
- A Home força `femflow_mode_personal = "false"`.

### 10.2 `femflow_mode_personal` ficou `"true"` por histórico antigo

- Se não houver direito (`has_personal`), o hardening da Home corrige;
- O cálculo canônico no FlowCenter/Treino impede liberação indevida.

### 10.3 VIP sem flag explícita de personal

- VIP entra como `hasPersonal = true` por regra de produto.

---

## 11) Estratégia de troubleshooting (rápida)

Se “Modo Personal não está funcionando”, validar nesta ordem:

1. `localStorage.femflow_has_personal` está `"true"`?
2. `localStorage.femflow_mode_personal` está `"true"` após clicar no card?
3. URL contém `?personal=1` após navegar?
4. No FlowCenter, `personal` resultou em `true`?
5. Há alguma ação posterior desligando o modo para `false`?

Se qualquer etapa falhar, o problema costuma estar em:

- payload de perfil (direito não veio/veio em formato inesperado);
- fluxo de UI que sobrescreve modo para `false`;
- limpeza de storage entre páginas/sessões.

---

## 12) Resumo executivo

O Modo Personal do FemFlow foi implementado com separação correta entre **autorização** e **estado de uso**. A combinação `hasPersonal && modePersonal` é o ponto de controle central para segurança e previsibilidade do comportamento. Essa arquitetura reduz bugs de permissão, protege contra estado legado em cache e facilita manutenção evolutiva do fluxo.
