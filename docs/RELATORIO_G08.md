# Relatório G08 — Integração visual e mapas jogáveis

**Projeto:** Sotomar/Fímbria
**Motor:** Godot 4.6.3
**Data:** 2026-10-14
**Branch/commit de trabalho:** `main` / `1c48d2d` (sem commit G08)
**Entrada normal:** `godot/scenes/character_select.tscn` → personagem selecionado → `godot/scenes/main.tscn`

## Resumo

A cena principal agora inicia em Caieira (MAP_01), usando os tiles e props ilustrados já disponíveis. O caminho continua pela tela de escolha existente e preserva o Guerreiro e a Wayfarer. Dois portais funcionam para mapas da mesma base canônica: MAP_02 (Terraços das Roças) e MAP_04 (Trilha do Lenhador/Carroçal), com retornos funcionais.

Os mapas ativos usam as dimensões e posições que já estão nos dados JavaScript: MAP_01 12×10, MAP_02 12×9 e MAP_04 12×9. MAP_01 cresceu em relação ao tabuleiro G01 de 10×10 e usa seu layout original completo. A referência de 28×24 para uma vila principal continua maior; não acrescentei área vazia nem mudei coordenadas canônicas para atingir esse número. Essa expansão requer uma proposta espacial para as ruas, limites e portais antes de adicionar células.

## Estado dos entregáveis

| Item | Estado | Evidência/limite |
|---|---|---|
| MAP_01 na cena principal após escolher o personagem | **IMPLEMENTADO** | A cena principal carrega o mapa por ID `MAP_01`; não há uma segunda entrada de jogo. |
| Terreno e props G03/G04 em uso | **IMPLEMENTADO** | 23 fontes no TileSet; grama, terra, caminhos, água/transições, árvore e rocha são usados nas áreas. |
| Dimensões variáveis e conversão de grade | **IMPLEMENTADO** | Largura/altura vêm do catálogo; seleção, limites e BFS recebem as dimensões do mapa ativo. |
| Guerreiro e Wayfarer | **TESTADO** | Seleção, persistência e troca no ator foram cobertas por G06/G08; ambos também aparecem em capturas Chromium. |
| Bloqueios e profundidade | **TESTADO** | Dados de bloqueio são usados pelo pathfinding; atores e props compartilham `x + y + 1` como chave de profundidade. |
| MAP_01 ↔ MAP_02 | **TESTADO** | IDs `EXIT_MAP01_MAP02` e `EXIT_MAP02_MAP01`, destinos e entradas originais. |
| MAP_01 ↔ MAP_04 | **TESTADO** | `EXIT_CARROCAL` e `EXIT_MAP04_MAP01` preservam destinos e entradas originais. |
| NPCs canônicos de MAP_01 | **IMPLEMENTADO** | Mira, Lia, Nilo e Bram aparecem nos pontos do banco JavaScript, usando marcadores temporários. Ainda não há interação. |
| MAP_05/06 e demais mapas | **PENDENTE** | Saídas mantêm seus IDs e destinos; as áreas ainda não estão no catálogo Godot desta missão. |
| Arte de casas, alvenaria, muros e NPCs | **PENDENTE** | São placeholders identificados; árvore e rocha usam PNGs ilustrados existentes. |
| Capturas reais em Chromium | **VALIDADO** | Capturas desktop e mobile simuladas foram geradas e inspecionadas. Isso não equivale à aprovação artística final nem a um teste em aparelho físico. |
| Exportação Web atualizada | **TESTADO** | Build abre no Chromium sem erros de console ou requisições. |
| JavaScript original | **FALHOU** | A suíte parou na validação de assets Kenney ausentes; nenhum arquivo JS original foi alterado nesta missão. |

## Matriz de integração de dados e recursos

| Mapa/recurso | Fonte original | Uso atual no Godot | Estado |
|---|---|---|---|
| MAP_01 — Caieira, 12×10 | `js/data/map01-visual.js`, `js/data/fimbria-runtime.js`, `js/data/npcs.js` | Terreno, caminhos, água bloqueada, 21 props, quatro NPCs em (1,1), (6,1), (6,4), (1,6), spawn (6,5), saídas para MAP_02 e MAP_04 | **IMPLEMENTADO** |
| MAP_02 — Terraços das Roças, 12×9 | `js/data/map02-visual.js`, `js/data/fimbria-runtime.js` | Terreno e caminhos, 22 props, spawn e retorno canônicos | **IMPLEMENTADO** |
| MAP_04 — Trilha do Lenhador, 12×9 | `js/data/map04-visual.js`, `js/data/fimbria-runtime.js` | Terreno e caminhos, 33 props, entrada/retorno de Carroçal; destinos MAP_05/06 identificados | **IMPLEMENTADO** |
| MAP_03, MAP_05–MAP_11 | módulos visuais/runtime JavaScript | Permanecem na fonte original, sem novas cenas Godot | **PENDENTE** |
| Tiles de grama/terra/pedra/água, caminhos e transições | PNGs editáveis sob `godot/art/source/` e `godot/assets/tiles/terrain/g03/` | TileSet isométrico usado nas cinco TileMapLayers | **IMPLEMENTADO** |
| Árvore e rocha | `godot/assets/props/g03/` | Sprites PNG com transparência e pivô nos pés/base | **IMPLEMENTADO** |
| Casas, alvenaria, muros e NPCs | Sem sprites de produção correspondentes no catálogo Godot existente | Desenho provisório/identificado, sem alterar colisões ou posições canônicas | **PENDENTE** |
| Personagens | recursos existentes G05/G06 | Carregados pelo ator da cena principal conforme a seleção | **IMPLEMENTADO** |

O catálogo Godot é uma cópia gerada dos dados fonte, não uma segunda autoria de coordenadas. Para atualizar ou conferir a cópia:

```sh
node tools/sync_godot_map_registry.js
node tools/sync_godot_map_registry.js --check
```

Os IDs de TileSet 0–5 mantêm os significados estáveis de grama, terra, caminho, pedra, água e variação de grama. A biblioteca foi substituída por PNGs ilustrados G03 e ampliada para 23 fontes. Texturas de 128×80 continuam alinhadas a células lógicas 64×32 com escala 0,5 e origem de textura `(0, -8)`.

## Mudanças jogáveis desde G07

1. Após escolher um protagonista, o jogo entra em Caieira em vez do tabuleiro de prova 10×10.
2. O chão agora usa os tiles ilustrados e a composição de MAP_01, com árvores e rochas originais disponíveis. Casas, muros, alvenaria e quatro marcadores de NPC são placeholders.
3. A posição lógica inicial é (6,5). Trilhas e bloqueios seguem os dados originais; água bloqueada não aceita movimento.
4. Ao alcançar (11,5), `EXIT_MAP01_MAP02` leva aos Terraços das Roças e pode retornar a Caieira.
5. Ao alcançar (6,9), `EXIT_CARROCAL` leva à Trilha do Lenhador; o portal de retorno leva de volta à entrada prevista em MAP_01.
6. Toque duplo move o personagem; o botão de confirmação permanece disponível após a seleção. Arrastar e pinçar controlam a câmera. A câmera acompanha o personagem quando a área excede o enquadramento.
7. MAP_02 e MAP_04 são jogáveis como áreas de exploração. Combate, conversas, inventário e missões ainda não foram migrados.

## Testes automatizados e inicialização

**TESTADO:** 126 verificações nomeadas G01–G08 passaram: 82 verificações em GDScript e 44 testes Python de recursos G04–G06. Além disso, passaram três verificações estruturais da exportação Web, uma verificação de sincronização do catálogo e quatro cenários de benchmark.

**TESTADO:** as cenas de seleção e principal iniciam em headless. A importação pelo editor, o TileSet e o pacote Web terminam sem erros. O fluxo Chromium escolheu a Wayfarer em desktop e o Guerreiro em mobile simulado; percorreu MAP_01 ↔ MAP_02 e MAP_01 ↔ MAP_04, além de testar seleção/movimento por toque e mudança retrato/paisagem. Não houve erro de console, erro de página ou requisição falha.

**FALHOU — suíte JavaScript original:** 362 verificações passaram antes de `node js/tests/run-tests.js` parar em `js/tests/run-tests.js:501`, no teste `Visual V4 manifest...`. A checagem encontrou 11 arquivos referenciados ausentes em `assets/vendor/kenney/`:

- `assets/vendor/kenney/sketch-town/Tiles/grass_center_E.png`
- `assets/vendor/kenney/sketch-town/Tiles/dirt_center_E.png`
- `assets/vendor/kenney/sketch-town/Tiles/grass_path_E.png`
- `assets/vendor/kenney/sketch-town/Tiles/water_center_E.png`
- `assets/vendor/kenney/isometric-landscape/PNG/landscapeTiles_043.png`
- `assets/vendor/kenney/sketch-town/Tiles/tree_single_E.png`
- `assets/vendor/kenney/sketch-town/Tiles/rocks_grass_E.png`
- `assets/vendor/kenney/sketch-town/Tiles/building_centerBeige_E.png`
- `assets/vendor/kenney/sketch-town/Tiles/bridge_E.png`
- `assets/vendor/kenney/sketch-town/Tiles/castle_wall_E.png`
- `assets/vendor/kenney/isometric-buildings/PNG/buildingTiles_032.png`

O restante dessa suíte não executou. Os PNGs G03/G04 que já estão no projeto Godot não foram usados para mascarar essa falha do projeto JavaScript.

## Tamanhos e desempenho medidos

O benchmark cria células no TileMapLayer e calcula uma rota BFS sem obstáculos. Os tempos abaixo são desta VM, em modo headless; representam o código de construção síncrona e o pathfinding, não FPS nem carregamento em aparelho móvel.

| Cenário | Células | Construção do TileMapLayer | BFS até o canto oposto | Estado |
|---|---:|---:|---:|---|
| 16×16 | 256 | 0,464 ms | 0,507 ms | **TESTADO** |
| 24×20 | 480 | 0,388 ms | 0,822 ms | **TESTADO** |
| 30×24 | 720 | 0,755 ms | 1,196 ms | **TESTADO** |
| 40×40 (somente estresse) | 1.600 | 1,571 ms | 2,836 ms | **TESTADO** |

O monitor de memória reportou cerca de 37,2–37,9 MB para o processo Godot completo ao longo dos cenários; não isola memória do mapa. O valor `fps_headless=1` do monitor não mede a renderização do jogo e foi descartado como métrica de FPS. FPS, memória por mapa, GPU, desempenho sustentado e consumo em Android/iOS continuam **PENDENTES**.

O build Web contém `index.wasm` de 37.700.666 bytes e `index.pck` de 6.593.992 bytes, além do runtime e arquivos auxiliares: **44.626.153 bytes** (aproximadamente 42,6 MiB; diretório arredonda para 43 MiB) no diretório `build/web/`. Não foi medido em rede móvel real.

## Capturas Chromium

As capturas são imagens reais do Chromium com canvas WebGL/SwiftShader. Mobile é emulação de viewport/toque, não aparelho físico.

- Seleção e MAP_01 em desktop 1280×720: `reports/g08/chromium-desktop-1280x720-selection.png`, `reports/g08/chromium-desktop-1280x720-map01.png`
- Transição para MAP_02 e retorno: `reports/g08/chromium-desktop-map02.png`, `reports/g08/chromium-desktop-map01-from-map02.png`
- Transição Carroçal e retorno: `reports/g08/chromium-desktop-map04.png`, `reports/g08/chromium-desktop-map01-from-map04.png`
- Seleção/movimento por toque em 390×844: `reports/g08/chromium-mobile-touch-selection.png`, `reports/g08/chromium-mobile-touch-move.png`
- Enquadramento mobile 390×844 e 844×390: `reports/g08/chromium-mobile-portrait-390x844-map01.png`, `reports/g08/chromium-mobile-landscape-844x390-map.png`
- Teste de zoom de câmera desktop: `reports/g08/chromium-desktop-camera-zoom.png`

As imagens foram inspecionadas para enquadramento, tiles, props, seleção e visibilidade do personagem. A composição está tecnicamente utilizável para revisão; não declaro aprovação de direção artística final.

## Executar no computador

Com Godot 4.6.3 e Python 3 instalados, abra `godot/project.godot` no Godot Desktop e execute o projeto. A cena normal continua sendo a seleção de personagem; escolha o Guerreiro ou a Wayfarer para abrir MAP_01. No navegador local, exporte o preset `Web` e sirva a pasta produzida:

```sh
godot --headless --path godot --export-release Web "$PWD/build/web/index.html"
python3 tools/serve_web.py --host 127.0.0.1 --port 8000
```

Depois abra `http://127.0.0.1:8000/`. Para testar um celular na mesma rede local, use `--host 0.0.0.0` e acesse o IP do computador; isso não substitui testes em aparelhos Android/iOS reais.

## Limitações e próximo passo

**PENDENTE:** testes em telefone real; arte própria de casas, muros, alvenaria e NPCs; interação dos NPCs; mapas MAP_03 e MAP_05–MAP_11; teste de desempenho/FPS em hardware real. As saídas existentes para MAP_05/06 continuam identificadas na Trilha do Lenhador e não abrem áreas fictícias.

A próxima missão recomendada é aprovar em aparelho real o enquadramento e os marcadores temporários, depois produzir os sprites definitivos de casas/NPCs e planejar como expandir Caieira para a referência de 28×24 sem deslocar os pontos canônicos atuais.
