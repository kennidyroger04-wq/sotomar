# Auditoria de integridade — Sotomar/Fímbria

## Escopo e referência

- Branch analisada: `main`.
- Commit local e remoto: `1c48d2d00f23fa6985f59cc9bf30ec248a580cc2` (`Add files via upload`).
- Raiz: `/workspace/sotomar`; `main` acompanha `origin/main` após corrigir o refspec local de busca.
- Na revalidação de 2026-10-14, `git remote -v`, `git ls-remote --heads origin` e `git fetch origin --prune` confirmaram apenas `main` no mesmo SHA. Alterações locais de auditoria foram preservadas antes do fetch em `/tmp/sotomar-mission00e-preserve/` e continuam no checkout.
- O arquivo ZIP original não está disponível neste ambiente. A indicação de aproximadamente 751 arquivos é apenas uma referência de comparação.

## Inventário do projeto versionado

O commit contém **79 arquivos**, em **11 diretórios**, totalizando **3.598.687 bytes**. Extensões: 56 `.js`, 2 `.html`, 2 `.css`, 16 `.ogg`, 1 `.png` e 2 `.txt`. Foram calculados SHA-256 para todos os arquivos e não há grupos duplicados. Não há arquivos vazios ou arquivos acima de 50 MB. O maior é `menu/sotomar-fimbria-menu.png` (2.761.887 bytes).

Dos 19 arquivos classificados pelo inventário como prováveis assets, 17 são recursos binários (16 sons OGG e a imagem do menu) e 2 são licenças. Os caminhos exatos dos recursos visuais ainda ausentes estão em [`ASSETS_AUSENTES.md`](ASSETS_AUSENTES.md). O manifesto completo, que também inclui os arquivos locais desta auditoria, está em [`../reports/repository_manifest.json`](../reports/repository_manifest.json); ele não inclui a si próprio.

Não há JSON de aplicação nem manifesto de dependências (`package.json`, lockfile ou configuração de build). Os dados e mapas são módulos JavaScript.

## Sistemas encontrados

- Aplicação web estática em `index.html`, com menu e telas de exploração e combate.
- Dados canônicos/runtime, onze layouts `map01` a `map11`, portais e inspeções.
- Combate, IA, habilidades, efeitos, animações e encontro não letal da Sineira.
- Inventário, consumíveis, equipamento, economia, NPCs, missões e persistência local.
- Gerenciador de áudio e sons OGG locais.

O núcleo dos sistemas é executável em Node.js e é coberto pela suíte existente. A apresentação visual completa está incompleta por falta dos tiles e sprites referenciados.

## Referências, execução e testes

As referências `src`/`href` em `index.html`, os `url()` locais em CSS e os scripts carregados existem depois de corrigir os caminhos do fundo do menu e dos sons. Os manifestos de assets ainda apontam para **20 imagens ausentes** e **4 licenças ausentes**; ver o relatório detalhado. O servidor HTTP local respondeu `200` para a página, CSS e scripts; durante a carga do navegador, as imagens ausentes responderam `404`. O Chromium headless não concluiu `--dump-dom` antes do timeout, então não foi possível validar a interação visual no navegador.

Comando da suíte original: `node js/tests/run-tests.js`. Na reexecução de 2026-10-14, **362 verificações passaram**; o processo terminou com código 1 ao verificar existência de imagem em `js/tests/run-tests.js:501`. O runner interrompe nessa primeira asserção e não executa os casos posteriores; portanto não há resultado completo para todas as áreas neste checkout. A execução diagnóstica adaptada anterior registrou 420 aprovações e 3 falhas de recursos ausentes, mas não substitui o resultado da suíte original. O número histórico de 332 aprovações não foi reproduzido.

Validações adicionais passaram: JSON do manifesto é válido; HTML e CSS não têm caminhos locais inexistentes; as referências de áudio e menu agora resolvem para arquivos existentes; comparação do inventário consigo mesmo não encontrou diferenças.

Para iniciar o site, no diretório do projeto, execute `python3 -m http.server 8000 --bind 127.0.0.1` e acesse `http://127.0.0.1:8000/`. Revalidei por HTTP `200` para `/`, `/index.html`, o CSS do menu e `/js/main.js`. Isso comprova que a página e recursos textuais servem; o navegador visual não foi validado nesta missão. O HTTP não supre os sprites e tiles faltantes.

## Estado e próximos passos

**Integridade: PARCIAL.** Lógica e dados estão presentes. 362 verificações da suíte original passam até o primeiro teste de arquivo visual ausente; a execução integral **FALHOU** nesse ponto. Referências de HTML/CSS/áudio foram verificadas; sprites/tiles/licenças estão pendentes. Não há evidência de equivalência ao ZIP original, que não está disponível. A rotina segura de incorporação está em `tools/restore_assets.py`.

**Godot 4: PENDENTE para integração.** Os dados e sistemas em JavaScript podem orientar a migração, e os sons/menu podem ser reutilizados. Antes de migrar cenas que dependam de arte, recupere e valide as licenças, tiles e sprites. Não existe `project.godot` neste commit.

Correções locais pequenas nesta auditoria: `css/menu-sotomar.css`, `js/data/audio-assets.js` e as duas asserções de caminho correspondentes em `js/tests/run-tests.js`. As mudanças apontam para binários que já estavam versionados; nenhum asset foi copiado ou inventado.
