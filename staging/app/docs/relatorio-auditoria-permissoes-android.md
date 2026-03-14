# Auditoria técnica de permissões Android (Capacitor) — FemFlow

## 1) Escopo e método

Auditoria realizada sobre os itens solicitados:

- `android/app/src/main/AndroidManifest.xml`
- `android/app/src/debug/AndroidManifest.xml`
- `android/app/src/release/AndroidManifest.xml` (se existir)
- `android/app/src/main/res/xml/*`
- possíveis permissões injetadas por plugins Capacitor

### Resultado de disponibilidade dos arquivos Android

No estado atual deste repositório, o diretório `android/` **não está presente** no workspace versionado.

Impacto:

- Não é possível listar permissões reais efetivamente declaradas no Manifest Android do app.
- Não é possível confirmar `<queries>`, `<uses-feature>` e configurações em `res/xml` do projeto Android final.

Ainda assim, foi feita auditoria dos artefatos disponíveis que influenciam permissões:

- dependências Capacitor declaradas (`package.json` / `package-lock.json`)
- configuração Capacitor (`capacitor.config.ts`)
- uso de APIs/requests de permissão no JavaScript da aplicação

---

## 2) Inventário de permissões encontradas

### 2.1 `<uses-permission>`

**Nenhuma permissão Android foi encontrada diretamente no repositório auditado**, pois os manifests Android não estão disponíveis no diretório versionado.

### 2.2 `<uses-feature>`

**Nenhuma declaração identificável** (mesmo motivo acima: ausência de `android/`).

### 2.3 `<queries>` (Android 11+)

**Nenhuma declaração identificável** (mesmo motivo acima: ausência de `android/`).

### 2.4 Permissões implícitas por plugins

Pelas dependências atuais, há somente os pacotes base do Capacitor:

- `@capacitor/android`
- `@capacitor/cli`
- `@capacitor/core`
- `@capacitor/ios`

Não há plugins oficiais comuns que adicionam permissões sensíveis (ex.: `@capacitor/camera`, `@capacitor/geolocation`, `@capacitor/push-notifications`, `@capacitor/filesystem`, etc.).

Conclusão prática: **não há evidência de injeção de permissões sensíveis por plugins adicionais** no estado atual das dependências.

---

## 3) Classificação por permissão (A/B/C/D)

> Como o Manifest Android final não está no repositório, a classificação abaixo considera o estado inferido por dependências e código JavaScript disponível.

| Permissão | Situação atual | Classe | Origem provável | App usa de fato? | Risco Play | Pode remover? | Ação recomendada |
|---|---|---|---|---|---|---|---|
| `android.permission.INTERNET` | Provável no template padrão Android/Capacitor | A) Essencial | Manifest base Android | Sim (app web faz chamadas API) | Baixo | Não | Manter |
| `android.permission.ACCESS_NETWORK_STATE` | Possível em templates/dependências Android | B) Condicional | Manifest base/lib Android | Não confirmado sem `android/` | Baixo | Talvez | Confirmar no Manifest final e remover se não usado |
| `android.permission.POST_NOTIFICATIONS` | Não identificado por plugin/dependência atual | B) Condicional | Só seria necessário para push/notificação nativa Android 13+ | Parcial (há Notification API web, não plugin nativo) | Médio se declarado sem uso | Sim, se declarado | Não declarar no Android Manifest enquanto não houver feature nativa |
| `READ_EXTERNAL_STORAGE` | Não identificado | C) Desnecessária (estado atual) | Plugins de arquivos/câmera (não presentes) | Não evidenciado | Alto se desnecessária | Sim | Garantir ausência no Manifest final |
| `WRITE_EXTERNAL_STORAGE` | Não identificado | C) Desnecessária (estado atual) | Legado (evitar) | Não evidenciado | Alto (especialmente em APIs modernas) | Sim | Garantir ausência |
| `CAMERA` | Não identificado | B) Condicional | Plugin Camera (não presente) | Não evidenciado | Médio/Alto se sem uso | Sim, se declarado | Só declarar ao implementar captura nativa |
| `RECORD_AUDIO` | Não identificado | C) Desnecessária (estado atual) | Plugins de mídia (não presentes) | Não evidenciado | Alto se sem uso | Sim | Garantir ausência |
| `ACCESS_FINE_LOCATION` | Não identificado | C) Desnecessária (estado atual) | Plugin de geolocalização (não presente) | Não evidenciado | Alto | Sim | Garantir ausência |
| `ACCESS_COARSE_LOCATION` | Não identificado | C) Desnecessária (estado atual) | Plugin de geolocalização (não presente) | Não evidenciado | Alto | Sim | Garantir ausência |
| `READ_CONTACTS` | Não identificado | C) Desnecessária (estado atual) | Plugin de contatos (não presente) | Não evidenciado | Alto | Sim | Garantir ausência |
| `FOREGROUND_SERVICE` | Não identificado | B/C Condicional | Serviços em foreground | Não evidenciado | Médio/Alto se sem justificativa | Sim, se sem feature | Não declarar sem caso de uso explícito |
| `SYSTEM_ALERT_WINDOW` | Não identificado | C) Desnecessária (estado atual) | Overlays especiais | Não evidenciado | Muito alto | Sim | Garantir ausência |
| `QUERY_ALL_PACKAGES` | Não identificado | C) Desnecessária (estado atual) | Visibilidade ampla de pacotes | Não evidenciado | Muito alto (política restrita) | Sim | Garantir ausência absoluta |

---

## 4) Runtime permission em JavaScript (Capacitor)

Foram feitas buscas por chamadas de plugins Capacitor (`requestPermissions`, `checkPermissions`, imports `@capacitor/*` no código da app).

Resultado:

- Não foram encontradas chamadas de runtime permission via plugins Capacitor no código da aplicação.
- Há uso de `Notification.requestPermission()` da Web Notification API (contexto web/PWA), que não equivale diretamente a uma permissão Android nativa de plugin.

---

## 5) Lista total de permissões (estado auditável atual)

Como os manifests Android não estão versionados no workspace:

- **Total confirmado no Manifest Android:** indeterminado (não auditável no estado atual).
- **Total inferido estritamente necessário:** `INTERNET`.
- **Total de permissões sensíveis identificadas por dependências/plugins atuais:** nenhuma.

---

## 6) Permissões potencialmente removíveis

Com base no estado atual (sem plugins nativos sensíveis):

- Remover/evitar, se aparecerem no Manifest gerado: `READ_EXTERNAL_STORAGE`, `WRITE_EXTERNAL_STORAGE`, `CAMERA`, `RECORD_AUDIO`, `ACCESS_FINE_LOCATION`, `ACCESS_COARSE_LOCATION`, `READ_CONTACTS`, `FOREGROUND_SERVICE` (se não houver serviço real), `SYSTEM_ALERT_WINDOW`, `QUERY_ALL_PACKAGES`, `POST_NOTIFICATIONS` (se não houver push nativo).

---

## 7) Play Console: Data Safety e justificativas

### Permissões que costumam exigir atenção forte (se existirem)

- `ACCESS_FINE_LOCATION` / `ACCESS_COARSE_LOCATION`
- `READ_CONTACTS`
- `RECORD_AUDIO`
- `CAMERA`
- `POST_NOTIFICATIONS` (quando aplicável para push nativo)
- `QUERY_ALL_PACKAGES`
- `SYSTEM_ALERT_WINDOW`

### Estado do FemFlow (com base no que foi possível auditar)

- Não há evidência de plugins que forcem essas permissões hoje.
- O maior risco atual é **operacional**: ausência do diretório Android no repositório impede validação final antes de submissão.

---

## 8) Manifest “enxuto ideal” (proposta)

Quando o `android/` estiver disponível, objetivo inicial recomendado:

- Manter apenas o mínimo necessário para o app funcionar.
- Base sugerida para app web encapsulado sem features nativas sensíveis:

```xml
<manifest ...>
  <uses-permission android:name="android.permission.INTERNET" />
  <!-- evitar permissões extras sem feature nativa comprovada -->
  <application ...>
    ...
  </application>
</manifest>
```

Se algum plugin sensível for adicionado no futuro, incluir somente as permissões estritamente vinculadas à feature entregue ao usuário, com justificativa técnica e política da Play documentadas.

---

## 9) Próximos passos obrigatórios para fechamento da auditoria

1. Gerar/sincronizar `android/` e versionar ao menos:
   - `android/app/src/main/AndroidManifest.xml`
   - `android/app/src/debug/AndroidManifest.xml` (se existir)
   - `android/app/src/release/AndroidManifest.xml` (se existir)
   - `android/app/src/main/res/xml/*`
2. Reexecutar auditoria sobre os manifests reais.
3. Validar merge de manifests por variante (debug/release) para detectar permissões herdadas de bibliotecas.
4. Só então concluir checklist de submissão Play com risco baixo de rejeição por permissão excessiva.
