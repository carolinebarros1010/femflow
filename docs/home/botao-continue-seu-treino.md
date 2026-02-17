# Botão: Continue seu treino (`#btnFlow`)

## Onde fica
- Página: `app/home.html`
- Elemento: `<button id="btnFlow" class="home-btn">Continue seu treino</button>`

## Objetivo funcional
Levar a usuária da Home para o **Flow Center**, que é a tela que decide o próximo passo do treino com base no estado atual da conta, ciclo e programa.

## Clique: o que acontece imediatamente
No `onclick`, a Home executa:

```js
document.getElementById("btnFlow").onclick = () => FEMFLOW.router("flowcenter");
```

Ou seja, o botão não faz fetch diretamente; ele apenas dispara o roteamento.

## Roteamento (`FEMFLOW.router`)
`FEMFLOW.router("flowcenter")`:
1. Converte para `flowcenter.html`.
2. Se `localStorage.femflow_mode_personal === "true"`, adiciona `?personal=1`.
3. Redireciona com `location.href`.

## LocalStorage: impacto direto do botão
**Direto no clique:** nenhum `setItem/removeItem`.

**Indireto (após entrar no Flow Center):** o init do Flow Center sincroniza perfil e pode atualizar:
- `femflow_fase`
- `femflow_diaCiclo`
- `femflow_diaPrograma`
- `femflow_cycleLength`
- `femflow_enfase` (quando válida)
- `femflow_has_personal`
- `femflow_free_access`

Também pode ajustar chaves de endurance se detectar mudança de plano/token.

## Backend: o que é consultado ao continuar treino
No carregamento do Flow Center, entram chamadas de backend:

1. **Validação de perfil (`action=validar`)**
   - Fonte da verdade para fase, dia de ciclo, dia de programa, acessos e produto.
2. **Token de plano endurance (`action=endurance_plan_token`)** em cenários específicos
   - Usado para detectar atualização de plano e resetar cache/config local de endurance.

## Regras importantes relacionadas
- Se sessão estiver inválida (`blocked/denied`), limpa sessão e redireciona fluxo de autenticação.
- Se estiver sem conexão, pode cair em fallback com dados salvos no `localStorage`.
- O botão “Continue seu treino” não reinicia programa nem troca ênfase; isso acontece em outros fluxos (cards/modais).

## Resumo executivo
- **Função:** abrir Flow Center.
- **LocalStorage no clique:** não altera.
- **Backend no clique:** não chama.
- **Backend após navegação:** sim, sincroniza perfil/estado e aplica regras de acesso/progresso.
