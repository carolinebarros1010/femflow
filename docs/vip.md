# Modo VIP — Fluxo e comportamento

Este documento descreve como o modo **VIP** funciona no FemFlow.

## 1) Como ativar
- Defina o campo **Produto** da aluna como `vip` na planilha principal (mesma coluna usada para `acesso_app`, `treino_personal`, etc.).

## 2) O que o VIP libera
- **Acesso total** a todos os treinos e áreas do app.
- **Não expira** por tempo (ignora regra de 30 dias).
- **Não bloqueia FollowMe** (acesso a todos os followme_*).
- **Libera Personal** (equivalente a `acesso_personal`).

## 3) Backend (Apps Script)
- No login, `vip` ignora:
  - expiração por data de compra
  - assinatura inativa
- Ainda respeita:
  - device lock
  - sessão única
- Retorna `personal: true` para VIP.

## 4) Front-end (app)
- `vip` é tratado como:
  - `ativa = true` (sempre ativo)
  - `has_personal = true`
- Desbloqueia:
  - catálogo completo na Home
  - fluxo do Flowcenter
  - FollowMe
  - páginas protegidas (ex.: respiração, evolução)

## 5) Indicador visual
- Quando `produto = vip`, o app mostra um badge discreto “VIP” no topo.
- Esse badge aparece nas páginas públicas do app que carregam o `femflow-core.js`.
