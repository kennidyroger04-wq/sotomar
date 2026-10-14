# Missão G01 — protótipo jogável Godot 4

## Entrega

- Projeto independente em `godot/`, com cena principal `scenes/main.tscn`.
- Tabuleiro lógico 10×10 e projeção isométrica feitos em `scripts/iso_board_logic.gd`.
- Chão quadriculado, caminho, obstáculos bloqueados com X, árvore, rocha, arbustos e personagem temporário desenhados via GDScript.
- Camadas separadas para chão/seleção, props com profundidade própria e atores. O personagem tem quatro orientações indicadas pelo rosto, animação procedural simples ao caminhar e z-index calculado da célula lógica.
- Pastas para PNGs, spritesheets, TileSets e fontes de arte. Não foram adicionadas imagens externas.

## Estado por critério

| Critério | Estado | Evidência |
|---|---|---|
| Projeção lógica/visual | **TESTADO** | Round-trip em cada uma das 100 células. |
| Seleção | **TESTADO** | Ponto dentro/fora do losango e evento de clique na cena. |
| Movimento determinístico | **TESTADO** | BFS com vizinhos em ordem fixa e movimento de uma célula na cena. |
| Bloqueios | **TESTADO** | Rota contorna bloqueio; destino bloqueado não é alcançado; cena recusa movimento. |
| Profundidade | **TESTADO** | Props e ator recebem z-index lógico; movimento recalcula o valor do ator. |
| Inicialização/importação | **TESTADO** | Varredura do editor, execução da cena por cinco frames e suite sem erros. |
| Aparência visual | **PENDENTE** | Não houve inspeção gráfica nem captura aprovada nesta missão. |
| Regras completas do jogo | **PENDENTE** | Combate, missões, inventário, portais e salvamento não foram migrados. |

## Comandos executados

Com Godot `4.6.3.stable.official.7d41c59c4`:

```sh
godot --headless --editor --path godot --quit
godot --headless --path godot --script res://tests/test_iso_board.gd
godot --headless --path godot --quit-after 5
```

Resultado: **11 verificações passaram**, editor/importação terminou com código 0 e a cena iniciou por cinco frames com código 0. Execução em modo headless valida scripts e lógica, não a composição visual.

## Limites e preservação

Este é um protótipo de cena, não uma migração do jogo. O terreno é desenhado por polígonos em camadas e ainda não usa `TileMapLayer`; a movimentação é local e não está ligada aos dados originais. O percurso por botão direito é limitado às células livres. A arte é placeholder e deve ser substituída apenas após revisão.

Nenhum arquivo JavaScript foi alterado nesta missão. O projeto abre pelo arquivo `godot/project.godot`; instruções de abertura e controles estão em [`../godot/README.md`](../godot/README.md).

Próxima etapa recomendada: inspecionar uma captura gráfica, ajustar escala/legibilidade e só então trocar o chão procedural por um `TileSet` modular original, preservando o contrato de grade já testado.
