# Auditoria técnica — Backend Google Apps Script (Apple IAP)

Escopo auditado: `staging/GAS` (estado atual do código).

## A. Veredito executivo
- Status geral: **parcialmente pronto**.
- Risco para App Store: **alto**.
- Segurança da validação Apple: **parcial**.
- Restore: **parcial**.
- Expiração: **parcial**.

## B. Fluxo Apple atual encontrado no código
- Endpoints de backend:
  - `iap_apple_activate` -> `iapAppleActivate_`.
  - `iap_apple_restore` -> `iapAppleRestore_`.
  - `entitlements_status` -> `entitlementsStatus_`.
  - `iap_apple_notification` -> `iapAppleNotification_`.
- Entrada do backend em `doPost` e `doGet`.
- Produtos aceitos explicitamente:
  - `com.femflow.app.premium.monthly`
  - `com.femflow.app.personal.pro.monthly`
- Parâmetros aceitos no core de validação:
  - `productId`, `transactionId`, `originalTransactionId`, `signedPayload`, `receipt`, `expiresDate`, `environment/env`.
- Frontend (referência de chamada): `app/core/femflow-core.js` envia os campos acima em `iap_apple_activate` e lote em `iap_apple_restore`.

## C. O que já está correto
- Allowlist explícita dos product IDs Apple esperados.
- Bloqueio de `transactionId` inválido e conflitos de transação entre usuárias.
- Persistência server-side do estado de entitlement na planilha (`Iap*` + `LicencaAtiva` + `acesso_personal`).
- Cálculo de entitlement server-authoritative em `entitlements_status`.
- Aplicação de expiração Apple no cálculo de entitlement (`expiredByDate`).
- Endpoint de notificação com checagens estruturais de payload (tipos/eventos, produto permitido, ambiente, bundle e consistência com `originalTransactionId` da linha).
- Job de reconciliação (`reconcileAppleSubscriptions_`) para revalidar periodicamente e ajustar status.

## D. Gaps críticos
- Não há verificação criptográfica real de assinatura JWS da Apple (o código apenas decodifica e valida consistência de cabeçalho/payload).
- Em fallback com `signedPayload`, o backend pode marcar compra como válida sem prova criptográfica (nível `pragmatic`, razão `decoded_without_cryptographic_verification`).
- `entitlements_status` aplica expiração Apple, mas `validar` retorna `ativa` usando regra diferente (`isVip ? true : entitlements.acesso_app`); há superfície de divergência de autorização entre endpoints de sessão e entitlement.
- Não há uso de App Store Server API (consultas por `originalTransactionId`, histórico transacional, status canônico de assinatura).
- Não há validação explícita de subscription group.
- Restore depende do app enviar `transactions[]` ativas; o backend não reconstrói restore sozinho a partir de `originalTransactionId` sem evidência transacional.
- Notificação sem usuária mapeada por `originalTransactionId` retorna `ok` com `notification_user_not_found` (não cria vínculo nem fila de reprocessamento).

## E. Riscos de segurança
- Risco de forja parcial de entitlement quando fluxo aceita apenas `signedPayload` decodificável sem validação criptográfica.
- Risco de aceitar restore por lote enviado pelo cliente com evidência insuficiente em cenários sem `receipt` válido.
- Endpoint legada `upgrade` ainda permite elevar `LicencaAtiva` com token estático conhecido no código.
- Evidência (`receipt`, `signedPayload`) é armazenada em planilha em texto JSON; superfície de exposição operacional caso acesso à planilha seja amplo.

## F. Riscos de rejeição na App Store
- Validação server-side não criptográfica para JWS (ponto sensível em revisão, principalmente com auto-renewables).
- Possível inconsistência entre estado de sessão (`validar`) e estado de entitlement (`entitlements_status`).
- Restore parcialmente dependente do cliente (ao invés de reconstrução canônica do histórico da Apple no backend).
- Ausência de verificação explícita de subscription group.

## G. Arquivos e funções relevantes encontrados
- `staging/GAS/Post.gs`: roteamento actions IAP Apple.
- `staging/GAS/Get.gs`: `validar` e `entitlements_status` via GET.
- `staging/GAS/IapApple.gs`:
  - `_validateAppleTransactionServerSide_`
  - `_verifyReceiptWithApple_`
  - `_persistAppleValidationToRow_`
  - `iapAppleActivate_`
  - `iapAppleRestore_`
  - `_parseAppleNotificationPayload_`
  - `_validateParsedAppleNotification_`
  - `iapAppleNotification_`
  - `reconcileAppleSubscriptions_`
  - `computeEntitlementsFromRow_`
  - `entitlementsStatus_`
- `staging/GAS/Header.gs`: schema principal (`Produto`, `LicencaAtiva`, `acesso_personal` etc.).
- `staging/GAS/LegacyFemFlow.gs`: `legacyUpgrade_` (bypass legada de licença).

## H. Tabela problema -> impacto -> correção recomendada
1) **Sem verificação criptográfica JWS** -> aceitação de payload potencialmente forjável -> implementar verificação de assinatura/cadeia Apple fora do GAS puro (serviço dedicado) e usar resultado assinado internamente.

2) **Fallback pragmático sem prova forte** -> entitlement indevido em edge cases -> exigir `verifyReceipt` válido ou validação App Store Server API antes de `active`.

3) **Divergência validar vs entitlements_status** -> usuário pode ver estado inconsistente -> unificar fonte de autorização no backend (mesma função de entitlement para login/validar/sessão).

4) **Restore dependente do cliente** -> recomposição frágil em reinstalação/dispositivo novo -> restore server-driven por `originalTransactionId` + consulta canônica Apple.

5) **Sem validação de subscription group** -> risco de produto fora do grupo afetar acesso -> validar `subscriptionGroupIdentifier` pela fonte oficial Apple.

6) **Endpoint legada de upgrade ativo** -> escalonamento manual indevido -> remover/bloquear `upgrade` em produção para apps iOS.

## I. Prioridade de correção
- **P0**
  - Verificação criptográfica real da origem Apple (JWS/ASSA).
  - Bloquear ativação `active` quando não houver validação forte.
  - Remover/fechar `legacyUpgrade_` no ambiente de produção.
- **P1**
  - Unificar autorização entre `validar` e `entitlements_status`.
  - Restore server-driven com `originalTransactionId`.
  - Aplicar checagem de subscription group.
- **P2**
  - Melhorar trilha de auditoria e retenção segura de evidências.
  - Tratar notificações órfãs com fila de reconciliação tardia.

## J. Conclusão final
O backend atual já possui estrutura relevante (endpoints dedicados, persistência server-side, receipt validation legado e notificação S2S), porém **ainda não está pronto** para ser considerado robusto em auto-renewable subscriptions Apple sob critérios estritos de segurança/compliance: falta validação criptográfica forte e há dependência parcial de payload do cliente para conceder entitlement.

## K. Prompt de implementação
"Implemente hardening completo do backend Apple IAP em `staging/GAS` com foco em auto-renewable subscriptions. Requisitos obrigatórios:
1) substituir aceitação pragmática de `signedPayload` por validação criptográfica real (JWS + cadeia) via serviço confiável, mantendo GAS como orquestrador;
2) exigir validação forte (Apple Server API/verifyReceipt válido) antes de marcar `entitlementStatus=active`;
3) unificar autorização para login/validar/entitlements_status usando uma única função de entitlement server-authoritative;
4) implementar restore server-driven por `originalTransactionId`, sem depender de lista ativa enviada pelo cliente;
5) validar `bundleId`, ambiente e `subscriptionGroupIdentifier` para os SKUs `com.femflow.app.premium.monthly` e `com.femflow.app.personal.pro.monthly`;
6) desativar endpoint legacy `upgrade` para iOS produção;
7) manter idempotência, trilha de auditoria e reconciliação periódica, com testes de compra, expiração, upgrade/downgrade, restore e notificação." 
