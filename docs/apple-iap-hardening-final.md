# Apple IAP Hardening Final — FemFlow

## 1. Resumo executivo
Foram aplicados ajustes finais de hardening para reduzir risco de rejeição Apple sem alterar a arquitetura principal (iOS via Apple IAP; Android/Web via Hotmart). O foco foi transparência do paywall iOS, anti-steering, neutralização de superfícies comerciais externas no iOS e reforço pragmático de validações/logs no backend de notifications.

## 2. Ajustes aplicados
- **Paywall iOS**: inclusão explícita dos preços oficiais (`R$ 69,90 por mês` e `R$ 249,90 por mês`), copy de renovação automática/cancelamento Apple ID e links visíveis para Termos e Política.
- **Anti-steering iOS (frontend)**: bloqueio centralizado de links externos comerciais (Hotmart, checkout/pay, WhatsApp comercial) em `FEMFLOW.openExternal`.
- **Superfícies externas no bundle iOS**: hardening no carregamento para ocultar links comerciais externos quando em iOS nativo e redirecionamento defensivo já existente em páginas legadas de ebooks.
- **WhatsApp comercial legado**: pontos em `flowcenter` e `treino` agora passam por `FEMFLOW.openExternal`, ficando cobertos pelo bloqueio iOS.
- **Apple notifications (GAS)**:
  - parsing estruturado de JWS (header + payload);
  - validação de envelope (formato, `alg`, `typ`, `kid`, presença `x5c`, assinatura presente como chunk);
  - rejeição explícita quando envelope/payload falha;
  - idempotência por `notificationId` mantida;
  - logs de rejeição e processamento enriquecidos.
- **Observabilidade**: contexto padronizado de logs incluindo `source`, `productId`, `status`, `reason` além de `userId`, `transactionId`, `originalTransactionId`, `correlationId`, `validationLevel`, `validationMethod`.

## 3. Áreas endurecidas
1. UI/UX de assinatura iOS (transparência App Store).
2. Saídas externas comerciais no iOS nativo.
3. Páginas legadas com potencial de CTA externo.
4. Endpoint `iap_apple_notification` com validações estruturais mais rígidas.
5. Logs de activate/restore/notification/reconcile para auditoria e troubleshooting.

## 4. Riscos removidos
- Ambiguidade de preço/período no paywall iOS.
- Falta de texto explícito sobre renovação automática e cancelamento Apple ID.
- Exposição de saídas comerciais externas em caminhos legados no iOS.
- Aceitação permissiva de notification sem validação mínima de envelope JWS.
- Menor rastreabilidade operacional por logs incompletos.

## 5. Riscos remanescentes
- **Limitação técnica do GAS**: não há verificação criptográfica completa da assinatura JWS + cadeia Apple (OCSP/PKI completa) no stack atual. O hardening implementado é **pragmático/estrutural**, não criptográfico pleno.
- Dependência de configuração de produtos/metadata em App Store Connect para aderência final de review.
- Necessidade de validação E2E em TestFlight com notificações reais de ambiente Apple.

## 6. O que já está pronto para TestFlight
- Fluxo de compra iOS via IAP preservado.
- Fluxo de restore preservado.
- Paywall iOS com transparência mínima exigida.
- Bloqueio anti-steering reforçado no app iOS.
- Backend com rejeição explícita de payload inválido de notification.
- Observabilidade suficiente para triagem de incidentes em beta.

## 7. O que ainda falta para App Store
1. Validar em TestFlight eventos reais de lifecycle (SUBSCRIBED, DID_RENEW, EXPIRED, REFUND/REVOKE).
2. Confirmar metadata legal e links em App Store Connect (Terms/Privacy) alinhados com os links in-app.
3. (Opcional recomendado) Evoluir verificação JWS para serviço/verificador externo com validação criptográfica completa de cadeia Apple.

## 8. Veredito final
**Pronto para TestFlight com baixo risco de rejeição por steering/transparência de assinatura.**

Para submissão final App Store, o ponto residual principal é a ausência de verificação criptográfica completa de JWS no GAS puro, já documentada e mitigada por validações estruturais, consistência de payload, idempotência e logging reforçado.
