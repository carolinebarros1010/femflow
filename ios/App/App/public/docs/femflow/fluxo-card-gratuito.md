# Fluxo do card gratuito no app FemFlow

Este documento descreve o fluxo interno do **card gratuito** dentro do app (home + flowcenter), desde a leitura do perfil até a liberação do card e a validação de validade.

## Visão geral do fluxo

1. **Perfil é carregado do backend** e o objeto `free_access` é persistido no `localStorage`.
2. **Catálogo de cards é montado**, avaliando se cada card tem acesso pelo produto pago ou via `free_access`.
3. **Card gratuito aparece desbloqueado** e recebe o badge “Gratuito”.
4. **Clique em card gratuito segue o fluxo normal** (não cai no bloqueio).
5. **FlowCenter valida a vigência** do acesso gratuito (data + ênfase).

---

## 1) Persistência do `free_access`

Quando o app sincroniza o perfil, ele grava o objeto `free_access` (vindo do backend) no `localStorage` como `femflow_free_access`.

**Onde acontece:** `femflow/app/js/home.js` na função `persistPerfil`.

```js
localStorage.setItem(
  "femflow_free_access",
  perfil.free_access ? JSON.stringify(perfil.free_access) : ""
);
```

Esse objeto é o insumo principal para liberar cards gratuitos.

---

## 1.1) A home faz sync automaticamente?

Sim. A Home chama o backend para validar o perfil e, em seguida, chama `persistPerfil`, que grava `free_access` no `localStorage`.  
Se você alterou o `FreeEnabled`/`FreeEnfases`/`FreeUntil` no backend, é preciso abrir a Home novamente ou recarregar a página para forçar esse sync e atualizar o `free_access` no navegador.

Resumo do fluxo:

1. **Home busca o perfil atualizado** via endpoint de validação.
2. **`persistPerfil` grava** o campo `free_access` no `localStorage`.
3. **Catálogo é montado** usando esses dados para decidir `locked`/`isFree`.

---

## 1.2) Como confirmar se o sync aconteceu

Se o card gratuito não liberar, confirme se o `free_access` realmente foi gravado no navegador.

1. Abra o DevTools → Application/Storage → Local Storage.
2. Verifique se **`femflow_free_access`** está preenchido (não vazio).
3. Se estiver vazio, faça **reload na Home** para forçar a sincronização.

Exemplo esperado (em `localStorage`):

```json
{"enabled":true,"enfases":["militar"],"until":"2026-01-20"}
```

Se estiver vazio (`""`), o app não recebeu `free_access` e manterá os cards **locked**.

---

## 2) Avaliação de acesso gratuito no catálogo

Ao montar o catálogo, o app:

- Lê `femflow_free_access` do `localStorage`.
- Constrói um objeto `perfil` com `free_access`.
- Para cada card, calcula se o usuário acessa por produto pago **ou** por `free_access`.

**Regra canônica:**

```js
const podeAcessarFree =
  perfil.free_access?.enabled === true &&
  freeAccessEnfases.includes(enfase);
```

Resultado da avaliação:

- `locked: false` se tiver acesso pago **ou** gratuito.
- `isFree: true` se **não** tiver acesso pago, mas tiver acesso via `free_access`.

---

## 3) Exibição do badge “Gratuito”

Quando `isFree === true`, o card recebe um badge visual.

```js
const freeBadge = p.isFree ? '<span class="badge-free">Gratuito</span>' : "";
```

Isso é inserido no HTML do card, deixando o status evidente no app.

---

## 4) Clique em card gratuito

Quando um card está **desbloqueado** (`locked: false`), o clique segue o fluxo normal de treino.

Quando está **bloqueado**, o app mostra um toast de “Plano necessário”.

Portanto, **card gratuito funciona exatamente como um card pago**, desde que `locked` esteja `false`.

---

## 5) Validação no FlowCenter

No `flowcenter.js`, o app confirma se o acesso gratuito ainda está válido:

- `enabled === true`
- `until` é uma data futura
- `enfase` está presente em `free_access.enfases`

Exemplo da regra:

```js
const freeEnabled = perfil.free_access?.enabled === true;
const freeUntil   = perfil.free_access?.until ? new Date(perfil.free_access.until) : null;
const freeValido  = freeEnabled && freeUntil && freeUntil >= new Date();
const freeEnfases = (perfil.free_access?.enfases || []).map(e => e.toLowerCase());
```

---

## Campos de origem no backend (planilha)

Os campos de controle do acesso gratuito estão definidos no GAS, com as colunas:

- **FreeEnabled**
- **FreeEnfases**
- **FreeUntil**

O backend é responsável por converter esses valores para o objeto `free_access` consumido pelo app.

---

## Como preencher os campos (para funcionar no app)

O app só libera o card gratuito quando recebe `free_access` com **estrutura correta**. Para evitar problemas como
`TRUE / militar / 20/01/2026` não funcionar, siga este padrão no backend (planilha → objeto):

**Contrato esperado pelo app:**

```json
{
  "enabled": true,
  "enfases": ["militar"],
  "until": "2026-01-20"
}
```

### ✅ FreeEnabled
- Deve virar **booleano** `true` no objeto `free_access.enabled`.
- Evite deixar como texto literal sem conversão (ex.: `"TRUE"` string).

### ✅ FreeEnfases
- Deve virar **array** de strings no objeto `free_access.enfases`.
- As strings precisam coincidir exatamente com a `enfase` do card (ex.: `militar`).
- O app aplica `toLowerCase()`, então mantenha tudo em minúsculas no backend para evitar divergências.

### ✅ FreeUntil
- Deve virar uma **data interpretável pelo `new Date()` do JavaScript**.
- Prefira formato ISO: `YYYY-MM-DD` (ex.: `2026-01-20`), que é estável.
- Formatos como `20/01/2026` podem falhar dependendo de como o backend envia o valor.

**Checklist rápido quando não funciona:**
1. `enabled` está realmente `true` (booleano), não string?
2. `enfases` está vindo como array e contém a ênfase exata do card?
3. `until` está num formato parseável por `new Date()` (ISO recomendado)?

---

## Sobre `trial_app` e bloqueios

O produto `trial_app` **não bloqueia por si só** quando o card está desbloqueado via `free_access`.  
Ele só entra no fluxo de bloqueio quando o card continua **locked**. Nesse caso, o app abre o link de acesso ao app para categorias específicas.  

Ou seja:
- Se o `free_access` estiver válido, o card fica **unlocked** e funciona normalmente.
- Se o `free_access` estiver inválido (ou mal formatado), o card fica **locked** e o `trial_app` vai cair no bloqueio.

---

## Resumo em uma linha

O card gratuito é liberado quando o backend envia `free_access` com `enabled=true`, `enfases` contendo o card, e `until` válido; o app desbloqueia o card, exibe o badge e permite o acesso normal.
