# Relatório técnico — `DeviceId`, `SessionToken`, `SessionExpira`

## Escopo analisado
- Front-end web app (`app/core/femflow-core.js`, `app/js/anamnese.js`, `app/js/treino.js`, `app/js/followme_treino.js`).
- Back-end GAS em `staging/GAS` (`Header.gs`, `Senha.gs`, `AuxLogica.gs`, `Post.gs`, `Infraestrutura.gs`).

---

## 1) O que é cada campo

- **`DeviceId`**: identificador persistente do dispositivo/navegador atual.
  - É salvo no `localStorage` (`femflow_device_id`) e também no cookie `ff_device` para aumentar persistência.  
- **`SessionToken`**: token de sessão do login atual.
  - É gerado no backend com `Utilities.getUuid()` a cada login válido.
  - É salvo no `localStorage` (`femflow_session_token`).
- **`SessionExpira`**: data/hora de expiração da sessão.
  - É gerada no backend como `now + 30 dias`.
  - É gravada na planilha na coluna `SessionExpira` e enviada ao front no login.

---

## 2) Onde ficam armazenados (chaves e colunas)

## 2.1 Planilha (backend GAS)
`HEADER_ALUNAS` define as colunas:
- `DeviceId`
- `SessionToken`
- `SessionExpira`

Índices 0-based usados no código:
- `COL_DEVICE_ID = 22`
- `COL_SESSION_TOKEN = 23`
- `COL_SESSION_EXP = 24`

## 2.2 Front-end (browser storage)
Chaves usadas:
- `femflow_device_id`
- cookie `ff_device`
- `femflow_session_token`
- `femflow_session_expira` (salva no login)

Observação: no estado atual, `femflow_session_expira` é apenas armazenada; não há validação ativa no cliente antes de fazer requests.

---

## 3) Fluxo completo de ativação

## 3.1 Geração/descoberta do `DeviceId`
No front (`FEMFLOW.getDeviceId()`):
1. tenta `localStorage.femflow_device_id`;
2. tenta cookie `ff_device`;
3. se não houver, gera novo UUID e persiste em ambos.

## 3.2 Login e emissão de sessão
No backend (`_fazerLogin(data)`):
1. valida email/senha;
2. compara `deviceId` recebido com `DeviceId` salvo;
3. se houver outro dispositivo **e** sessão ativa não expirada, retorna `status: "blocked"`;
4. se permitido, cria novo `SessionToken` (UUID) e novo `SessionExpira` (+30 dias);
5. grava ambos na planilha e devolve no JSON.

## 3.3 Persistência no front após login
No front (`anamnese.js`):
1. envia `action: "login"`, `email`, `senha`, `deviceId`;
2. salva `sessionToken` em `femflow_session_token`;
3. salva `sessionExpira` em `femflow_session_expira`;
4. opcionalmente atualiza `femflow_device_id` se backend devolver outro.

## 3.4 Uso da sessão nas chamadas protegidas
No front (`FEMFLOW.post`):
- injeta automaticamente no payload:
  - `deviceId: FEMFLOW.getDeviceId()`
  - `sessionToken: FEMFLOW.getSessionToken()`

No backend (`_assertSession_`):
- valida id/token;
- valida expiração (`SessionExpira > now`);
- valida lock de dispositivo (`DeviceId` diferente -> bloqueia).

Se inválido, endpoints protegidos retornam `status: "denied"`.

---

## 4) Quando é ativado (gatilhos)

A proteção por sessão/device é ativada quando:
- usuário faz login (`action: "login"`), gerando token e expiração;
- endpoint chama `_assertSession_` antes de processar ação.

Atualmente confirmado em:
- `salvarTreino_`
- `salvarDescanso_`
- `salvarEvolucao_`

Ou seja: operações de treino/evolução dependem da sessão válida.

---

## 5) Bugs e fragilidades existentes (estado atual)

1. **`femflow_session_expira` não é usada no cliente para bloqueio preventivo**  
   O front armazena a data, mas não interrompe requests quando localmente já expirou.

2. **`clearSession()` remove apenas token, não remove `femflow_session_expira`**  
   Pode sobrar estado residual de expiração no navegador.

3. **Lock de dispositivo pode ser contornado quando `deviceId` chega vazio**  
   Em `_assertSession_`, o bloqueio de device só ocorre se `deviceDB && device && deviceDB !== device`; se `device` vier vazio, esse check não bloqueia.

4. **Dependência de tipo `Date` para sessão ativa no login**  
   Em `_fazerLogin`, `hasActiveSession` exige `expDB instanceof Date`; se a leitura vier como string/valor não-Date, o lock de sessão ativa pode falhar e permitir troca de device indevida.

5. **Cookie `ff_device` sem flag `Secure`**  
   O cookie é `SameSite=Lax`, mas não marca `Secure`, reduzindo robustez em cenário de HTTP não forçado para HTTPS (hardening recomendado).

---

## 6) Status geral

- Arquitetura base está correta (device lock + sessão + expiração no backend).
- Validação crítica existe no servidor para endpoints sensíveis.
- Principais melhorias necessárias são de **hardening** e **consistência do cliente** (uso de `sessionExpira` e limpeza completa de sessão).
