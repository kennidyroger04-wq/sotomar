# Relatório G09B — consolidação e entrega Web

**Data da verificação:** 2026-10-14<br>
**Branch revisada:** `main`<br>
**Remoto:** `origin` → `https://github.com/kennidyroger04-wq/sotomar.git`

## Estado do Git e escopo preservado

Antes da consolidação, `main` estava em `1c48d2d00f23fa6985f59cc9bf30ec248a580cc2`, igual ao único head retornado por `git ls-remote --heads origin`. `git fetch origin --prune` terminou sem avançar nem remover uma branch. As alterações locais G01–G09 consistiam em código original modificado, workflow/configuração nova, projeto Godot, testes, scripts, documentação e evidências visuais. Foram preservadas para commit.

**Estado final do envio:** os commits `b626dfb` (projeto G01–G09) e `a393f86` (relatório G09B e procedimento) foram enviados com sucesso a `origin/main`. Em seguida, `48d8a64` adicionou evidências visuais novas de persistência; seu push falhou porque o Git não obteve autenticação HTTPS (`could not read Username`). `gh auth status` confirmou que o `GH_TOKEN` presente nesta sessão é inválido; seu valor não foi lido nem registrado. O ref local de acompanhamento `origin/main` continua em `a393f86`, portanto o head local está adiante e as duas capturas recém-geradas ainda não estão no GitHub. Após restabelecer autenticação GitHub, conclua com `git push origin main`; não use force push. O comando remoto falhou também ao consultar `ls-remote`, então o hash remoto foi confirmado pela última vez no push bem-sucedido para `a393f86`.

O inventário pré-commit encontrou **487 arquivos de projeto**, excluindo `.git`, `build/web/` e `godot/.godot/`. Inclui código, 140 PNGs, 16 áudios OGG, fontes/recursos Godot, 11 GIFs de revisão, capturas, relatórios, testes e ferramentas. `build/web/` (build gerada) e `godot/.godot/` (cache/importação) estão no `.gitignore` e foram excluídos do escopo. A varredura de nomes e padrões de chave não encontrou credenciais; os nomes dos bindings Firebase aparecem apenas no workflow e na documentação.

## Pipeline Web

**IMPLEMENTADO:** `.github/workflows/godot-web.yml` instala Godot 4.6.3 e templates correspondentes, importa o projeto, exporta `build/web/`, valida o conteúdo e oferece o artefato `sotomar-fimbria-web` por sete dias. As actions checkout/cache/upload e Firebase deploy agora usam SHA completos. O job tem somente `contents: read`.

**IMPLEMENTADO:** eventos `push` em `main` e `pull_request` só constroem e armazenam o artefato. O passo Firebase exige simultaneamente `workflow_dispatch`, `publish=true` e `refs/heads/main`. A configuração Firebase serve somente `build/web/`; o conteúdo-fonte e os assets de autoria permanecem fora do pacote publicado. Não foi iniciado deploy.

**TESTADO localmente:** o workflow e os bindings são verificados por `godot/tests/test_publish_g09.py`; a exportação real passa por `tools/validate_g09_web_export.py`. O push que publicou `a393f86` deve iniciar o job `Godot Web build`, mas o status do Actions não pôde ser consultado (API respondeu HTTP 403); a geração/transferência do artefato no GitHub está **PENDENTE de confirmação**. A build local está validada.

**PENDENTE:** a API GitHub GraphQL respondeu HTTP 403 nesta sessão. Não foi possível confirmar via API a visibilidade atual do repositório nem consultar status de Actions. A fonte não foi tornada pública ou alterada. Confirme **Settings → General → Danger Zone → Private** antes de distribuir. O site Web é público quando publicado, embora o repositório possa continuar privado.

## Firebase Spark

**PENDENTE:** nenhum projeto Hosting, site, conta de serviço, segredo do GitHub ou variável `FIREBASE_PROJECT_ID` foi criado. Não houve publicação nem custo iniciado.

A exportação atual é 42,61 MiB, menor que os 10 GB de armazenamento e a cota histórica de 360 MB/dia de transferência do Spark descritos pela documentação do Hosting. Oito downloads completos (cerca de 341 MiB) já aproximam a transferência diária dessa referência. O endpoint oficial retornou HTTP 403 para o ambiente, então essas cotas não foram confirmadas em tempo real; confira [quotas e preços do Hosting](https://firebase.google.com/docs/hosting/usage-quotas-pricing) e [planos Firebase](https://firebase.google.com/pricing) antes de usar. No Spark, tráfego além da franquia pode interromper o serviço; permaneça no Spark para evitar upgrade/cobrança.

Instruções tela a tela, role IAM mínima, bindings e ação de deploy autorizada estão em [ACESSO_WEB_G09.md](ACESSO_WEB_G09.md). A credencial de serviço precisa ser criada e cadastrada pelo proprietário; não deve ser enviada ao agente.

## Testes desta consolidação

**TESTADO — Godot/Web:** `node tools/sync_godot_map_registry.js --check`; importação headless Godot 4.6.3; regressões G01–G09 (grade/projeção, terreno, personagens e persistência local, combate artístico, touch/zoom, mapas e portais MAP_01/MAP_02/MAP_04, NPCs/conversas e publicação); benchmark dos mapas; exportação Web; validação dos 9 arquivos (44.675.674 bytes); abertura headless das cenas principal, seleção, comparação e demonstração de combate. Todos os comandos concluíram com sucesso. Os scripts Python executaram 17 casos (`unittest`), além das verificações com marcador `PASS` registradas nos próprios scripts.

**TESTADO — navegador local:** a exportação foi servida por `tools/serve_web.py`, abriu com HTTP 200 em Chromium/SwiftShader, carregou um canvas nas viewports 1280×720 e 390×844 e registrou zero erros de página, console ou requisições. A checagem de persistência selecionou a guerreira, entrou em MAP_01 e recarregou a página; a seleção voltou destacada após o reload. Capturas: [personagem em MAP_01 antes do reload](../reports/g09b/chromium-desktop-1280x720-map01-wayfarer-before-reload.png) e [seleção restaurada após reload](../reports/g09b/chromium-desktop-1280x720-selection-persists-after-reload.png). MAP_01, diálogos, transições MAP_02/MAP_04 e zoom também têm evidência de G09 (`reports/g09/` e [RELATORIO_G09.md](RELATORIO_G09.md)). Emulação Chromium não substitui telefone físico.

**FALHOU — suíte JS original:** `node js/tests/run-tests.js` executou 362 aprovações e parou em `js/tests/run-tests.js:501` quando não encontrou os 11 assets de terceiros Kenney descritos em [ASSETS_AUSENTES.md](ASSETS_AUSENTES.md). A execução não passou aos testes posteriores. Os caminhos de menu e sons foram corrigidos para a estrutura real existente, sem inventar ou gerar os assets faltantes.

## Classificação

| Resultado | Estado | Evidência |
|---|---|---|
| Projeto e alterações G01–G09 | **IMPLEMENTADO** | Código, recursos, testes, capturas e documentação preservados no checkout |
| Testes Godot e validação local Web | **TESTADO** | Comandos acima; export real validado |
| Carregamento Chromium desktop/mobile emulado | **VALIDADO** | HTTP 200, canvas presente, zero erro; não é teste físico |
| Privacidade atual do repositório | **PENDENTE** | API GitHub inacessível (403); confirmar nas configurações do GitHub |
| Workflow de CI executado no GitHub | **PENDENTE** | Depende do push; sem estado de Actions consultável nesta sessão |
| Projeto/credencial Firebase | **PENDENTE** | Precisa ser configurado pelo proprietário |
| Deploy HTTPS / URL real | **PENDENTE** | Nenhum deploy autorizado/executado; não existe URL validada |
| Suíte original JavaScript | **FALHOU** | 362 aprovados antes dos Kenney ausentes |

## Próximas ações operacionais

1. Confirmar que o repositório GitHub está **Private**.
2. Após o push, acompanhar **Actions → Godot Web build** e baixar/testar o artefato sem marcar `publish`.
3. Criar o projeto Firebase no Spark, habilitar Hosting, cadastrar a conta com `Firebase Hosting Admin`, secret `FIREBASE_SERVICE_ACCOUNT` e variable `FIREBASE_PROJECT_ID` conforme [ACESSO_WEB_G09.md](ACESSO_WEB_G09.md).
4. Somente quando quiser tornar o jogo público, abrir manualmente **Actions → Godot Web build → Run workflow** na branch `main`, marcar `publish` e executar. Depois valide `https://PROJECT_ID.web.app` em desktop e telefone real.
