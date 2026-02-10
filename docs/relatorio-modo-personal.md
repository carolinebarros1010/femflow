# Relatório técnico — funcionamento do **Modo Personal**

## 1) Objetivo do modo

O **Modo Personal** é um estado de navegação/execução no frontend que muda a regra de acesso ao treino para priorizar um plano personalizado.

Ele **não é o mesmo que ter direito ao personal**. O sistema separa:

- **Direito de acesso**: `femflow_has_personal`
- **Modo ativo na sessão**: `femflow_mode_personal`

A regra canônica usada no app é:

```js
const personal = hasPersonal && modePersonal;
```

Ou seja, só entra em modo personal quando a usuária **tem direito** e o modo foi **explicitamente ativado**.

---

## 2) Origem dos dados e persistência

### 2.1. Direito personal (`has_personal`)

Ao carregar perfil (`validar`), o core normaliza várias possíveis chaves de resposta e grava `femflow_has_personal` no `localStorage`.

Fontes aceitas:

- `acessos.personal`
- `r.personal`
- `r.Personal`
- `r.has_personal`
- `r.hasPersonal`
- ou VIP (`produto === "vip"`)

### 2.2. Modo personal (`mode_personal`)

Na Home, o modo é protegido:

- se **não** tem direito personal, força `femflow_mode_personal = "false"`;
- se tem direito, inicializa em `false` caso ainda não exista.

Isso evita “travar” modo personal ligado para quem não deveria.

---

## 3) Como o modo é ativado/desativado

## 3.1. Ativação

Na Home, ao clicar no card `personal` **desbloqueado**:

1. mostra toast “Modo Personal ativado”;
2. grava `femflow_mode_personal = "true"`;
3. roteia para `flowcenter.html`.

## 3.2. Desativação

O modo é desativado quando:

- clica em card normal de treino (qualquer ênfase não personal) → `femflow_mode_personal = "false"`;
- escolhe coach FollowMe → `false`;
- seleciona “Monte seu treino” → `false`;
- perfil sem direito personal ao sincronizar Home → `false` (forçado).

---

## 4) Efeito na navegação

O router global adiciona `?personal=1` automaticamente quando `femflow_mode_personal === "true"`.

Isso garante que a intenção de navegação em modo personal acompanhe os redirecionamentos entre telas.

---

## 5) Efeito no FlowCenter

No FlowCenter:

- calcula `personal = hasPersonal && modePersonal`;
- considera treino liberado quando `personal || acessoAtivo || freeOkUI`;
- botão principal “Treinar” dá **prioridade absoluta** ao personal:
  - se `personal === true`, envia direto para `treino.html` sem exigir ênfase normal.

Além disso, ao buscar prévia de próximo treino (`listarExerciciosDia`), envia `personal` no payload para o motor.

---

## 6) Efeito na página de Treino (`treino.html`)

Existe middleware de acesso por URL direta:

- valida sessão (`id` + `produto`);
- se **não** estiver em personal:
  - exige ciclo configurado;
  - exige ênfase (ou flag endurance).

Quando `personal === true`, esse bloqueio de ciclo/ênfase é flexibilizado para permitir o fluxo personalizado.

---

## 7) Resumo operacional (passo a passo)

1. Backend marca direito personal (`acessos.personal`) ou VIP.
2. Front grava `femflow_has_personal`.
3. Usuária ativa card Personal na Home.
4. Front grava `femflow_mode_personal = true`.
5. Router passa a anexar `?personal=1`.
6. FlowCenter calcula `personal = hasPersonal && modePersonal`.
7. Botão Treinar segue rota prioritária para treino em modo personal.
8. Ao trocar para treinos comuns, modo personal é desligado.

---

## 8) Conclusão

O modo personal foi implementado com separação correta entre **autorização** e **estado de uso**. Isso reduz bugs de permissão, evita acesso indevido por cache/localStorage legado e mantém a experiência previsível ao alternar entre personal e treinos padrão.

A combinação `hasPersonal && modePersonal` é a peça central de segurança e comportamento do fluxo.
