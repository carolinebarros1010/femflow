# Fluxo do App — trial_app, acesso_app, vip

Este documento descreve o fluxo de acesso do app (PWA/PlayStore/AppStore), diferenciando **trial_app**, **acesso_app** (Hotmart) e **vip**.

## 1) Origem do produto (coluna F)

- **trial_app**: gerado automaticamente quando a pessoa cria conta pelo app/PWA (cadastro direto no app).
- **acesso_app**: vindo de compra Hotmart (integração Hotmart → Apps Script).
- **vip**: definido manualmente na planilha na coluna **Produto**.

## 2) trial_app (3 dias)

### ✅ O que libera
- Muscular
- Esportes
- Casa

### ❌ O que NÃO libera
- Personal
- FollowMe

### ⏱️ Duração
- 3 dias a partir da DataCompra.

### 🔒 Após expirar
- Licença fica inativa
- Ao clicar em card muscular/esportes/casa → redireciona para checkout Hotmart

Checkout: https://pay.hotmart.com/E102962105N

## 3) acesso_app (Hotmart)

### ✅ O que libera
- Muscular
- Esportes
- Casa

### ❌ O que NÃO libera
- Personal
- FollowMe

### ⏱️ Duração
- 30 dias (padrão do backend)

## 4) vip

### ✅ O que libera
- Tudo (inclui Personal + FollowMe)

### ⏱️ Duração
- Sem expiração (ignora validação de tempo e ativa)

### ✅ Indicador visual
- Badge “VIP” discreto aparece no topo das páginas do app

## 5) Fluxo de bloqueio (cards)

Quando o usuário está **trial_app expirado**:
- Clique em cards musculares/esportes/casa → abre checkout Hotmart.
- Personal e FollowMe continuam bloqueados.

## 6) Observações

- A coluna **Produto (F)** é a chave principal do fluxo.
- É possível usar o pré-cadastro (nome/e-mail Hotmart) para migrar manualmente usuários de trial → acesso_app.
