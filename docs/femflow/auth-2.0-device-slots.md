# FemFlow Auth 2.0 — DeviceSlots (2 dispositivos)

## 1) Estrutura de planilha (Alunas)

### Situação atual
Hoje a autenticação usa colunas legadas únicas:
- `DeviceId`
- `SessionToken`
- `SessionExpira`

Essas colunas estão no header oficial e são usadas por `_fazerLogin` e `_assertSession_` no backend GAS.

### Proposta (Auth 2.0)
Adicionar colunas novas (sem remover imediatamente as antigas para migração segura):
- `Devices` (JSON string) — lista de sessões por device
- `AuthVersion` (string/int) — ex.: `2`
- `LastAuthMigrationAt` (datetime) — auditoria opcional

#### Formato de `Devices`
```json
[
  {
    "deviceId": "abc-123",
    "sessionToken": "uuid-1",
    "lastActive": "2026-02-14T10:00:00Z",
    "expira": "2026-03-14T10:00:00Z"
  }
]
```

### Observações de schema
- Manter `DeviceId/SessionToken/SessionExpira` durante a transição para não quebrar clientes legados.
- Em Auth 2.0, a fonte de verdade passa a ser `Devices`.
- Configurar constante global: `DEVICE_SLOTS = 2`.

---

## 2) Migração de dados antigos

### Estratégia recomendada: migração progressiva (lazy + batch)
1. **Lazy migration no login**:
   - Se `Devices` vazio e existir sessão legado (`DeviceId` + `SessionToken` + `SessionExpira`), converter para array com 1 item.
2. **Batch opcional (script administrativo)**:
   - Percorrer linhas e pré-migrar todos os registros com dados legados.

### Regra de conversão legado → novo
Se houver:
- `DeviceId` preenchido
- `SessionToken` preenchido
- `SessionExpira` válido

Criar:
```json
[
  {
    "deviceId": "<DeviceId>",
    "sessionToken": "<SessionToken>",
    "lastActive": "<now ISO>",
    "expira": "<SessionExpira ISO>"
  }
]
```

### Compatibilidade durante migração
- `_assertSession_` deve aceitar tanto `Devices` quanto legado (fallback), priorizando `Devices`.
- Ao autenticar com sucesso via legado, salvar imediatamente em `Devices`.

---

## 3) Alterações em `_assertSession_`

### Objetivo
Validar sessão por **par** `(deviceId, sessionToken)` dentro de `Devices` e checar expiração individual.

### Fluxo proposto
1. Validar `id` e `sessionToken` obrigatórios.
2. Carregar usuária por `id`.
3. `devices = parseDevices(row[COL_DEVICES])`.
4. Executar `devices = limparDevicesExpirados(devices)`.
5. Procurar entrada com:
   - `d.sessionToken === token`
   - e, se `deviceId` vier no payload, `d.deviceId === deviceId`
6. Se não achar, fallback legado (fase de transição).
7. Se achou e não expirou:
   - atualizar `lastActive` daquele device.
   - persistir array normalizado.
   - retornar `{ ok: true }`.

### Contratos de erro
- token inexistente/fora do device: `Sessão inválida`
- expirado: `Sessão expirada`
- mismatch de device: `Sessão bloqueada`

---

## 4) Alterações em `_fazerLogin`

### Objetivo
Trocar lock absoluto por slots (`DEVICE_SLOTS = 2`) com política LRU.

### Fluxo proposto
1. Validar credenciais (igual hoje).
2. Carregar `devices` e limpar expirados.
3. Se `deviceId` já existe:
   - renovar `sessionToken` e `expira` (+30 dias)
   - atualizar `lastActive`
4. Se `deviceId` novo e `devices.length < DEVICE_SLOTS`:
   - adicionar novo item
5. Se `deviceId` novo e slots cheios:
   - remover `device` mais antigo (`lastActive` menor)
   - adicionar novo item
6. Persistir `Devices`.
7. (Transição) opcionalmente espelhar em colunas legadas o device mais recente.

### Resposta recomendada de login
```json
{
  "status": "ok",
  "id": "...",
  "sessionToken": "...",
  "deviceId": "...",
  "sessionExpira": "...",
  "slots": {
    "limit": 2,
    "used": 2
  },
  "evictedDeviceId": "old-device-optional"
}
```

---

## 5) Validação de sessão por device

### Regra canônica
Sessão válida se:
- `sessionToken` existe em `Devices`
- pertence ao `deviceId` enviado (quando enviado)
- `expira > now`

### Pontos adicionais
- Rejeitar token sem par de device quando houver mismatch explícito.
- Aceitar ausência de `deviceId` apenas em endpoints de migração/legado (curto prazo).
- Em cada chamada autenticada, atualizar `lastActive` (throttle opcional: ex. a cada 60s para reduzir escrita).

---

## 6) Implementação de LRU (Least Recently Used)

### Definição
O device com `lastActive` mais antigo é desalocado quando entrar um terceiro.

### Funções sugeridas
- `parseDevices_(raw)`
- `serializeDevices_(arr)`
- `limparDevicesExpirados_(devices, now)`
- `atualizarLastActive_(devices, deviceId, now)`
- `removerDeviceAntigo_(devices)`
- `upsertDeviceSession_(devices, deviceId, token, expira, now, slots)`

### Algoritmo de remoção
1. Ordenar por `lastActive` ascendente.
2. Remover índice 0.
3. Retornar `{ devicesAtualizados, removido }`.

---

## 7) Compatibilidade com `acesso_app`, `personal`, `followme`, `free_access`

Esses flags são de autorização de conteúdo/plano e **não** de sessão. Portanto:
- manter cálculo atual de perfil/acessos inalterado;
- isolar mudança apenas na camada de autenticação;
- garantir que endpoints que já dependem de `_assertSession_` continuem retornando o mesmo shape de dados.

### Regras práticas
- Não alterar lógica de `Get.gs` para `free_access`.
- Não alterar regras de produto/plano em `Hotmart.gs` (`acesso_app`/`treino_personal`).
- Apenas substituir internamente a validação de sessão e login.

---

## Backend (GAS) — plano objetivo de modificação

### Arquivos impactados
- `Header.gs`
  - adicionar constantes e colunas `Devices/AuthVersion/LastAuthMigrationAt`
- `Senha.gs`
  - refatorar `_fazerLogin`
  - refatorar `_assertSession_`
  - adicionar funções utilitárias de Devices/LRU
  - ajustar `resetDevice_` para limpar apenas o device atual (novo endpoint de logout recomendado)
- `AuxLogica.gs`
  - manter chamadas a `_assertSession_` (assinatura compatível)

### Novas funções pedidas
- `atualizarLastActive(deviceId)`
- `limparDevicesExpirados()`
- `removerDeviceAntigo()`

> Sugestão técnica: implementar versões internas puras (`*_`) para manipular arrays e wrappers que persistem em planilha.

---

## Front-end — plano de atualização

### `app/core/femflow-core.js`
1. `FEMFLOW.post()`
   - manter envio de `sessionToken` obrigatório
   - enviar `deviceId` como contexto do slot
2. `FEMFLOW.clearSession()`
   - limpar apenas `femflow_session_token`
   - manter `femflow_device_id` para identidade estável do aparelho
3. Fluxo de login
   - usar token retornado pelo backend sem assumir unicidade global por usuário

### Resultado esperado no front
- troca de celular não bloqueia definitivamente;
- login em 2 dispositivos permitido;
- 3º login desloga implicitamente o mais antigo.

---

## Plano de implementação (fases)

### Fase 0 — Preparação
- adicionar colunas e constantes
- publicar código com fallback legado

### Fase 1 — Dual-read / dual-write
- login escreve em `Devices`
- `_assertSession_` lê `Devices` primeiro e legado como fallback

### Fase 2 — Migração massiva
- rodar script de migração em lote
- medir % de contas migradas

### Fase 3 — Endurecimento
- desativar fallback legado por feature flag
- manter colunas legadas por janela de segurança

### Fase 4 — Limpeza final
- remover dependências de `DeviceId/SessionToken/SessionExpira` no backend
- opcional: manter colunas apenas históricas

---

## Checklist de migração

- [ ] Criar colunas `Devices`, `AuthVersion`, `LastAuthMigrationAt`
- [ ] Definir `DEVICE_SLOTS = 2`
- [ ] Implementar parser/serializer resilientes de `Devices`
- [ ] Refatorar `_fazerLogin` com LRU
- [ ] Refatorar `_assertSession_` com validação por par device/token
- [ ] Implementar limpeza automática de expirados no login/assert
- [ ] Implementar logout do device atual (remoção seletiva)
- [ ] Adicionar logs de auditoria (evicção, expiração, migração)
- [ ] Validar compatibilidade com `acesso_app/personal/followme/free_access`
- [ ] Executar rollout gradual (staging → produção)

---

## Riscos e mitigação

1. **Risco: perda de sessão em massa por parse JSON inválido**
   - Mitigação: parser tolerante + fallback legado durante rollout.

2. **Risco: excesso de writes no Sheets por update de `lastActive`**
   - Mitigação: throttle de atualização (ex.: 60s).

3. **Risco: cliente antigo sem `deviceId` consistente**
   - Mitigação: manter geração/persistência estável no front e fallback temporário.

4. **Risco: corrida de login simultâneo (duas abas/dispositivos)**
   - Mitigação: lock curto (PropertiesService/LockService) ao atualizar `Devices`.

5. **Risco: regressão em produtos/acessos**
   - Mitigação: não tocar regras de plano; testes focados na camada auth.

---

## Casos de teste mínimos (staging)

1. Login no Device A → ok.
2. Login no Device B → ok.
3. Login no Device C → A (LRU) removido.
4. Requisição autenticada com token de A → denied.
5. Requisição de B/C → ok.
6. Logout em B → C segue válido.
7. Sessão expirada em C → denied + remoção automática.
8. Usuária com conta antiga (legado) faz login → migra sem bloqueio.
9. Fluxos `acesso_app`, `personal`, `followme`, `free_access` mantêm comportamento.

---

## Versão proposta

**FemFlow Auth 2.0 — DeviceSlots(2) com LRU + sessão por device/token + migração retrocompatível.**
