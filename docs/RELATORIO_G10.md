# Missão G10 — primeiro combate tático

Data: 2026-10-14. Projeto Godot 4.6.3, branch `main` no checkout de trabalho.

## Resultado

| Critério | Estado | Evidência |
|---|---|---|
| `ENC_01` integrado à exploração de MAP_02 | IMPLEMENTADO, TESTADO | `MAP_02` usa a composição original de uma unidade `CRE_CASCUDO_DE_CAL`; botão e marcador iniciam a batalha. Teste GDScript e navegação Web. |
| Regras de turno, movimento, ataque, dano, defesa e IA | IMPLEMENTADO, TESTADO | 21 verificações G10 e 22 assertions JavaScript de paridade. |
| Vitória, retorno à exploração, derrota e nova tentativa | IMPLEMENTADO, TESTADO | Cobertura GDScript; Chromium confirmou a vitória e o retorno ao MAP_02 na mesma posição. Derrota e retry são cobertos headless. |
| UI touch e export Web | IMPLEMENTADO, TESTADO | Export Godot Web, verificações de artefato e execução em Chromium desktop e emulando viewport/touch mobile. O overlay/tileboard tem escala própria em retrato. |
| Qualidade gráfica | VALIDADO no Chromium | Inspecionadas capturas reais do renderer Web listadas abaixo. Não é aprovação final de arte: o Cascudo é placeholder e o equilíbrio é provisório. |
| Paridade do código JavaScript do jogo | TESTADO | Fixtures reproduzem regras originais sem editar o runtime JS. Suíte JS integral ainda bloqueada pelos assets Kenney ausentes, descrita abaixo. |

## Escopo e comportamento

- O combate começa em `ENC_01`, encontro comum no MAP_02 já definido no runtime original, com exatamente um `CRE_CASCUDO_DE_CAL`. Não foi introduzido o Moss Raider G05: ele é recurso artístico, não criatura desta composição.
- O tabuleiro é uma projeção tática 2D isométrica própria, 8×6. A grade lógica e custo de caminho não dependem do tamanho do sprite. Obstáculos, movimento por PM, alcance Manhattan, iniciativa e prioridade de caminho da IA têm regras determinísticas.
- O personagem selecionado usa as animações existentes de G05/G06 para caminhar, atacar, defender, sofrer dano e morrer. O Cascudo usa desenho procedural temporário pois a criatura não possui sprite canônico.
- O botão **Investigar Cascudo-de-cal** está disponível durante a exploração do MAP_02; tocar no marcador também inicia a batalha. Depois da vitória, o mapa e personagem são restaurados na célula corrente e o encontro fica resolvido durante a sessão. Derrota deixa uma ação de reinício.
- Dados HP 70, PA 6, PM 3, agilidade 5 e estatísticas do personagem vêm das referências/runtime existentes. O runtime JavaScript marca o balanceamento da criatura como `provisionalBalance`; nenhum valor foi aprovado como balanceamento definitivo.
- A suíte JavaScript anterior define sistemas adicionais como Avanço/Cruz/Lança e efeitos. Eles não foram simulados sem correspondência na integração. O protótipo usa `Golpe Pesado` e `Fortificar`; saves/recompensas/progressão do resultado do combate ainda não fazem parte desta missão.

## Arquivos principais

- `godot/scripts/combat_rules_g10.gd`: caminho, movimento, iniciativa e regras compatíveis.
- `godot/scripts/combat_board_g10.gd`: projeção, tabuleiro, alcance visual, personagem e placeholder da criatura.
- `godot/scripts/combat_overlay_g10.gd`: interface, turnos, ações, IA e resultados.
- `godot/scripts/encounter_marker_g10.gd` e `godot/scripts/game_controller.gd`: ponto de início e integração/retorno na exploração.
- `godot/resources/combat/g10_parity_fixtures.json`: exemplos comuns de regras.
- `godot/tests/test_combat_g10.gd` e `godot/tests/test_combat_parity_g10.js`: testes de integração e comparação com os módulos JS originais.

## Verificação automatizada

**TESTADO:** regressões executadas em Godot 4.6.3 headless, incluindo: grade/TileMap G01; pacote G03; arte G04; combate e imagens G05; seleção, sprites, ações e persistência G06; controles Web/touch G07; sincronização de mapas, MAP_01/MAP_02/MAP_04 e benchmark G08; NPCs G09; verificação de export e publicação gated G09; e G10. Todos os comandos terminaram aprovados, incluindo importação headless do editor e export Web.

**G10:** `godot --headless --path godot --script res://tests/test_combat_g10.gd` — 22 verificações aprovadas. `node godot/tests/test_combat_parity_g10.js` — 22 assertions aprovadas. Os casos cobrem ordem/empate de iniciativa, movimento, bloqueios, PA/PM, fórmula física/crit, ataque, fortificação/resistências, morte, escala/picking vertical, entrada a partir da cena principal, IA, vitória/retorno e derrota/retry.

**Web:** `godot --headless --path godot --export-release Web "$PWD/build/web/index.html"` concluiu. `python3 godot/tests/test_web_export_g07.py` passou 3 verificações. `python3 godot/tests/test_publish_g09.py` passou 8 verificações, incluindo exclusão do projeto privado do diretório exportável e trava contra publicação automática. `build/web` é artefato ignorado e não foi adicionado ao Git.

**Chromium:** Web export servido localmente em HTTP para inspeção, com SwiftShader. Fluxo desktop percorreu seleção, MAP_01, MAP_02, combate, movimento, ataque, dano inimigo, vitória e retorno. Erros de página e console: zero. Viewport/touch mobile carregou e aceitou seleção; erros de página, console ou requests: zero. Testes headless cobrem ações de toque diretamente. Isto não substitui teste físico em vários celulares.

**Suíte JavaScript original:** `node js/tests/run-tests.js` aprovou 362 verificações e terminou com código 1 na asserção `js/tests/run-tests.js:501`, que exige arquivos do pacote Kenney ausentes (`assets/vendor/kenney/...`). Código e testes JS originais permaneceram sem alteração. Não se deve interpretar os 362 checks prévios como aprovação da suíte completa.

## Capturas reais do Web export

Todas em `reports/g10/`; executadas por Chromium/WebGL software a 1280×720 (desktop) e viewport 390×844 com touch emulado (mobile):

- `01-character-select-desktop.png`, `02-exploration-map01-desktop.png`, `03-encounter-marker-map02-desktop.png`, `04-combat-enc01-desktop.png`.
- `05-character-select-mobile.png`, `06-exploration-mobile.png`, `13-encounter-mobile.png`, `14-combat-mobile.png`.
- `08-enemy-turn-desktop.png`, `10-combat-move-mode.png`, `11-first-browser-attack.png`, `09-victory-return-desktop.png`.

A captura final do MAP_02 mostra retorno após vitória e encerramento visual do overlay. As capturas verificam enquadramento e legibilidade no browser executado, não aprovam a arte provisória.

## Limites e próximos passos

- **PENDENTE:** assets Kenney para tornar verde a suíte JS inteira; não recuperados nem substituídos.
- **PENDENTE:** review de gameplay/balanceamento, sprites próprios do Cascudo e inspeção em celular físico.
- **PENDENTE:** persistir estado e recompensas de combate, ajustar/validar habilidades futuras conforme o domínio JS completo.
- **FALHOU:** suíte JS completa, exclusivamente devido aos arquivos declarados ausentes descritos acima.
- Nenhuma publicação externa foi feita. A versão Web exportada localmente não tem URL HTTPS pública.

## Git

As alterações G10 e relatório foram consolidadas em commit local após os dois commits de preparação G09B, que permanecem intactos. O resultado do push e do `git status` final é reportado na entrega desta missão; não houve reset ou force push.
