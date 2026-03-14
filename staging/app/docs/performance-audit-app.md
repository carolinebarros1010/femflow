# Auditoria de Performance do `app/` (FemFlow)

## Escopo e método
Esta auditoria cobriu o diretório `app/` com foco em gargalos de carregamento inicial, peso de assets, bloqueio da thread principal, volume de chamadas de rede e estratégias de cache. A análise foi feita por inspeção de HTML/CSS/JS, inventário de tamanhos de arquivos e identificação de padrões de carregamento.

---

## Diagnóstico executivo (resumo)

1. **Há muito JavaScript carregado no caminho crítico** (principalmente em `home`, `flowcenter`, `treino`), incluindo arquivos grandes e vários scripts externos, em parte sem `defer`.
2. **O peso de mídia está alto**: vídeos e imagens somam dezenas de MB no pacote `app/`, com vários JPEG/PNG pesados.
3. **Renderização inicial da Home tende a ser cara** por montar muitas rails/cards de uma vez, com thumbs em background e sem lazy por interseção.
4. **Service Worker usa cache-first amplo**, o que ajuda offline, mas pode aumentar risco de staleness e não separa bem versões de dados dinâmicos.
5. **Existem oportunidades claras de quick wins**: code splitting por rota, lazy render de rails, migração de imagens para WebP/AVIF responsivo, e redução de scripts bloqueantes.

---

## Achados detalhados

### 1) JavaScript e bloqueio de carregamento

- `home.js` tem **2055 linhas** e ~66 KB; `flowcenter.js` ~76 KB; `treino.js` ~80 KB; `core/femflow-core.js` ~60 KB. Esse conjunto representa custo de parse/compile/exec perceptível em mobile intermediário.
- Várias páginas ainda têm scripts sem `defer/async` (ex.: `flowcenter.html` e `treino.html` com muitos scripts externos e internos em sequência), elevando TTI/TBT.
- `flowcenter.html` e `treino.html` carregam múltiplos SDKs Firebase compat + scripts de domínio, potencialmente antes do usuário precisar de todas as features.

**Impacto provável:** piora de tempo para interação, especialmente em Android de entrada e redes 4G instáveis.

### 2) Peso de assets (imagens, vídeos, ebooks)

- `app/` está em torno de **49 MB** no total.
- Pastas de maior impacto:
  - `app/assets`: ~24.44 MB
  - `app/ebooks`: ~16.09 MB
  - `app/css/cards`: ~6.88 MB
  - `app/assets/icons`: ~5.03 MB
- Vídeos de hero por idioma estão em ~5.4 MB cada (`heropt.mp4`, `heroen.mp4`, `herofr.mp4`) — aproximadamente **16 MB** somados.
- Há imagens de capa/cards com arquivos acima de 1 MB e vários PNGs de ícones/logos onde WebP/AVIF poderia reduzir bastante.

**Impacto provável:** first load mais lento, maior consumo de dados e atraso em LCP/INP em rede móvel.

### 3) Home: custo de renderização e download indireto

- A Home monta várias seções/rails (personal, followme, muscular, esportes, casa, planilhas, ebooks) com múltiplos cards.
- Os cards usam `background-image` via estilo inline (`--thumb-url`) e são renderizados em lote (`innerHTML`), favorecendo bursts de requests de imagens ao entrar na tela.
- Não há estratégia explícita de **lazy render por viewport** (ex.: IntersectionObserver para cada rail) nem limitação de cards iniciais acima da dobra.

**Impacto provável:** aumento de trabalho de layout/pintura e competições por banda logo no início.

### 4) Service Worker / cache

- O Service Worker usa cache-first para arquivos locais com atualização silenciosa. É útil para offline, mas:
  - pode manter recursos antigos por mais tempo em cenários de atualização frequente;
  - não diferencia fortemente static immutable vs. conteúdo sem versão explícita;
  - pré-cache inclui conjunto considerável de páginas/scripts.
- Há versionamento manual via `CACHE_NAME`, mas faltam políticas mais granulares (ex.: stale-while-revalidate para estáticos, network-first para HTML principal).

**Impacto provável:** risco de inconsistência de versão e dificuldade de debugging de “app desatualizado”.

### 5) Manifests e consistência de metadados

- O `manifest.json` declara screenshots com `src` `.png`, porém `type` como `image/webp`.
- Inconsistências de metadados não travam performance sozinhas, mas prejudicam qualidade de distribuição PWA e podem gerar fallback/rewrites desnecessários.

---

## Priorização de melhorias (alto impacto → baixo esforço primeiro)

### Prioridade P0 (fazer já)

1. **Aplicar `defer`/`async` em scripts bloqueantes** nas rotas críticas (`flowcenter.html`, `treino.html`, `evolucao.html`, `body_insight.html`).
2. **Lazy loading de rails/cards da Home**:
   - render inicial só da primeira rail + skeleton das demais;
   - carregar restante por `IntersectionObserver`.
3. **Compressão e normalização de imagens principais**:
   - converter capas/cards para WebP/AVIF;
   - criar versões responsivas (ex.: 320/640/960) com `srcset` quando aplicável.
4. **Reduzir peso dos vídeos hero**:
   - transcodificar para bitrate menor (mobile-first);
   - considerar poster estático e download progressivo apenas após interação.

### Prioridade P1

5. **Code splitting por rota**:
   - separar bundles por página (home vs treino vs flowcenter) para evitar parse de JS não usado.
6. **Adiar SDKs não críticos**:
   - carregar Firebase módulos apenas quando necessários na rota/ação.
7. **Revisar estratégia de cache SW por tipo de recurso**:
   - HTML: network-first com fallback;
   - JS/CSS versionados: stale-while-revalidate;
   - imagens grandes: cache com limite e expiração.

### Prioridade P2

8. **Instrumentação real-user monitoring (RUM)** com Web Vitals (LCP, INP, CLS, TTFB) por página.
9. **Orçamento de performance** no CI (falhar build se asset exceder limite).
10. **Limpeza de assets redundantes** (ícones e formatos duplicados onde não agregam valor).

---

## Plano prático de execução (2 semanas)

### Semana 1
- Dia 1-2: `defer/async` + lazy rails home.
- Dia 3-4: otimização de imagens/cards (WebP/AVIF + tamanhos responsivos).
- Dia 5: otimização dos 3 vídeos hero + poster.

### Semana 2
- Dia 1-2: code splitting por rota.
- Dia 3: refino de SW cache strategies.
- Dia 4: adicionar RUM + dashboards por rota.
- Dia 5: validação final em 4G (Android real + iOS).

---

## Metas objetivas recomendadas

- **LCP Home (4G / mid-tier Android):** < 2.8s
- **INP p75:** < 200ms
- **JS transfer inicial por rota crítica:** reduzir 30–45%
- **Peso de imagens em Home (primeira dobra):** < 350 KB
- **Tempo para primeira interação útil:** reduzir 25–40%

---

## Riscos e observações

- Alterações agressivas em SW podem causar comportamento de atualização inesperado; fazer rollout em fases.
- Compressão de mídia precisa preservar legibilidade visual de capas e marca.
- Code splitting exige atenção a dependências globais (`window.FEMFLOW`, idioma, auth).

---

## Conclusão
O FemFlow já tem boas bases (PWA, cache local e organização por páginas), mas o `app/` ainda carrega mais JS e mídia do que o ideal no caminho crítico. O maior ganho de velocidade virá de: **(1) remover bloqueio de scripts, (2) lazy render/lazy load na Home, (3) reduzir o peso de imagens e vídeos, (4) modularizar carregamento por rota**.
