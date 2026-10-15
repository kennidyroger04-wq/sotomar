# Missão 19 — exportação Web e Firebase Hosting

## Estado inicial

- **Branch base:** `operation/g18d-sprite-factory`.
- **HEAD conferido com o remoto:** `f1cafb3304a81509d6d9c5c45c6683e7a1effb0d`.
- **Estado do checkout:** limpo antes do trabalho. As branches anteriores foram preservadas; o trabalho da Missão 19 está em `operation/mission-19-firebase`.
- **Engine:** Godot `4.6.3.stable.official.7d41c59c4`.
- **Projeto:** `godot/project.godot`; cena de inicialização `res://scenes/character_select.tscn`.
- **Código:** GDScript; não há `.csproj`, `.gdextension` ou addons instalados.
- **Renderização:** `gl_compatibility`; preset Web com threads desativadas e sem dependência de `SharedArrayBuffer`/isolamento COOP/COEP. A entrada por toque e o ajuste da viewport Web já estavam configurados.
- **Hosting encontrado:** workflow pinado em Godot 4.6.3 e `firebase.json` já existiam. Não havia `.firebaserc`. O workflow anterior só aceitava publicação manual em `main`, que não continha G18D.
- **Recursos:** o preset empacota recursos do Godot e exclui fontes, testes, documentação e cenas de demonstração. Não encontrei plugins nativos nem dependência externa carregada pelo runtime Web.

## Trabalho desta missão

- **IMPLEMENTADO:** `.firebaserc` define `sotomar-eaf2c` como projeto padrão.
- **IMPLEMENTADO:** `firebase.json` publica exclusivamente `build/web/`, sem rewrite genérico. MIME de WASM e PCK são definidos explicitamente; `index.html` revalida e os arquivos de runtime têm cache de uma hora. O cache anterior de um ano com `immutable` foi removido porque os nomes de saída do Godot são fixos entre builds.
- **IMPLEMENTADO:** o workflow continua compilando em push de `main` e pull request, e agora permite escolher o branch numa execução manual. O deploy live requer simultaneamente `workflow_dispatch` e `publish=true`; nenhuma atualização de branch publica automaticamente. O destino está fixado a `sotomar-eaf2c` e a única credencial usada é a secret `FIREBASE_SERVICE_ACCOUNT`.
- **IMPLEMENTADO:** teste de contrato do workflow/configuração Hosting e smoke test Chromium de inicialização, arquivos Web e viewports mobile.
- **NÃO INCLUÍDO NA PUBLICAÇÃO:** projeto-fonte, masters artísticos, testes, documentação e caches do editor. O HTML, WASM, PCK, JavaScript e ícones do build são públicos e baixáveis pelo navegador, como esperado para um jogo Web; a configuração mantém privado o checkout GitHub, não os dados necessários para o cliente executar o jogo.
- **SEM MUDANÇAS:** sistemas, regras, dados, narrativa e assets do jogo.

## Resultados

| Item | Estado | Evidência |
|---|---|---|
| Importação do projeto | **PASSOU** | `godot --headless --editor --path godot --import --quit` |
| Exportação Web Godot 4.6.3 | **PASSOU** | `godot --headless --path godot --export-release Web "$PWD/build/web/index.html"` |
| Integridade do export | **PASSOU** | 9 arquivos, 53.962.639 bytes (51,46 MiB); WASM/PCK assinados e não vazios; sem fonte `.gd`, cena ou arquivo de autoria no diretório publicado |
| Regressão GDScript | **PASSOU** | 18 scripts, 1.803 verificações; execução em Godot headless |
| Testes Python | **PASSOU** | 6 scripts, incluindo arte, export e configuração de publicação |
| Testes JavaScript auxiliares | **PASSOU** | 7 scripts de paridade/catálogos/mapas/quests/inventário de sistemas |
| Cena de seleção e mapa | **PASSOU** | Inicialização headless de `character_select.tscn` e `main.tscn` |
| Inicialização Web local | **PASSOU** | Chromium/SwiftShader carregou canvas, `index.js`, `index.wasm` e `index.pck` com HTTP 200, sem erro JS, console ou rede |
| Redimensionamento | **PASSOU** | 360×800, 390×844, 844×390 e 1280×720; capturas e resultado em `reports/mission19/` |
| Suíte JavaScript original | **FALHOU — preexistente** | `node js/tests/run-tests.js` para em `js/tests/run-tests.js:501` ao verificar PNG Kenney ausente; 362 verificações haviam passado em execuções anteriores. A suíte não foi modificada nem ocultada nesta missão. |
| Firebase CLI / acesso ao projeto | **NÃO EXECUTADO** | CLI e identidade Google/Firebase não estavam disponíveis no ambiente. O estado de runtime não fornece secrets, variáveis nem identidade GCP. |
| GitHub secrets/variables | **PENDENTE DE CONFIRMAÇÃO** | `gh secret list` e `gh variable list` receberam HTTP 403 na API; os nomes/valores não foram revelados nem puderam ser confirmados. |
| Publicação Firebase | **PREPARADO, MAS NÃO PUBLICADO** | Nenhum deploy foi iniciado. A checagem HTTPS foi bloqueada pelo proxy HTTP 403, portanto não se pode afirmar que a URL esteja no ar. |
| Safari/iPhone real | **PENDENTE DE TESTE MANUAL** | Chromium móvel emulado não substitui Safari num dispositivo iOS real. |

## Compatibilidade e limites

O preset é single-thread e usa o renderer Compatibility, a via WebGL apropriada ao export Godot Web em Safari/iOS recente. Não precisa de cabeçalhos de isolamento cross-origin. O resultado Chromium confirma que a build inicia e responde a mudanças de viewport, mas não comprova compatibilidade física com todas as versões de iOS, memória disponível ou gestos de toque do Safari.

O bundle tem 51,46 MiB. Relatórios anteriores registraram a cota histórica Spark de 10 GB de armazenamento e 360 MB/dia de transferência (aproximadamente sete downloads integrais por dia nesse tamanho). A cota atual não foi consultada nesta sessão; confirme no Console Firebase antes de divulgar a URL. Nada nesta missão ativa Blaze, faturamento, domínio personalizado ou outro produto Firebase.

## Uma sequência para desbloquear a publicação

1. No [Google Cloud Console](https://console.cloud.google.com/), selecione o projeto `sotomar-eaf2c`, confira o plano Spark e crie uma conta de serviço exclusiva para deploy com `Firebase Hosting Admin` (`roles/firebasehosting.admin`). Gere uma chave JSON e mantenha-a local.
2. Em `github.com/kennidyroger04-wq/sotomar`, abra **Settings → Secrets and variables → Actions → New repository secret**. Cadastre o nome `FIREBASE_SERVICE_ACCOUNT` e o conteúdo JSON; não cadastre a chave em arquivo ou variável do workflow. Se esse secret já existir, não o substitua sem necessidade.
3. Abra **Actions → Godot Web build → Run workflow**, selecione `operation/mission-19-firebase`, marque `publish` e inicie. Aguarde a exportação, validação e etapa **Publish to Firebase Hosting** ficarem verdes.
4. Só após sucesso, acesse `https://sotomar-eaf2c.web.app`, confirme a página e entre no jogo. Depois faça o mesmo num iPhone com Safari. A URL secundária é `https://sotomar-eaf2c.firebaseapp.com`.

O workflow também pode ser executado com `publish` desmarcado para criar apenas um artefato de teste. A publicação é manual e não exige `FIREBASE_PROJECT_ID` como variável, pois o ID está fixado no código versionado.
