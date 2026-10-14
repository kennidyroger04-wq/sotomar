# Relatório da Missão G06 — personagens e seleção

Projeto Godot 4.6.3, branch local atual `main`. A cena principal de entrada agora é a seleção de personagem. O jogo JavaScript e o salvamento JavaScript não foram alterados nesta missão.

## Resultados

| Critério | Estado | Evidência |
|---|---|---|
| Guerreiro masculino original | **IMPLEMENTADO** | Sete folhas de ação e dois equipamentos em `godot/assets/`; fontes master editáveis em `godot/art/source/generated_g06/`. |
| 112 quadros, orientações, animações e pivô | **TESTADO** | 28 animações direcionais, quatro quadros cada, `SpriteFrames` Godot e checagens Pillow de alpha, baseline y=152 e quadros diferentes. |
| Wayfarer feminina preservada | **VALIDADO** | Arquivos e IDs G03/G05 continuam nos mesmos caminhos; recursos G05 carregam sem renomeação. |
| Seleção inicial e retorno visual | **IMPLEMENTADO** | `godot/scenes/character_select.tscn`; mouse, setas/A-D, Enter/Espaço, cartões com idle animado e botão de entrada. |
| Persistência local | **TESTADO** | `CharacterRoster` lê/grava o ID em `user://character_selection.cfg`; teste cria uma instância nova e recupera a opção salva. |
| Troca do ator no protótipo | **TESTADO** | Guerreiro e Wayfarer substituem o sprite do ator G01 no mesmo nó e célula lógica. Grade, caminho, obstáculos e ordenação continuam com o controlador existente. |
| Camadas de espada/escudo | **IMPLEMENTADO** | Folhas com quatro direções e componente sincronizado `equipment_rig_g06.gd`; segue a regra híbrida de esconder overlays nas ações compostas. |
| Comparação com inimigo | **IMPLEMENTADO** | `character_compare_g06.tscn` mostra os dois protagonistas e o Saqueador Musgoso; alterna ação/orientação simultaneamente e permite inspecionar overlays com G. |
| Qualidade artística final | **PENDENTE** | As pranchas/GIFs foram compostas e inspecionadas estaticamente. Não houve execução gráfica/captura real do renderer Godot neste ambiente; não declaro aprovação de arte final. |

## Testes

As suítes anteriores G01–G05 foram executadas novamente e passaram: 46 verificações. G06 adiciona oito grupos de testes GDScript e 29 verificações raster/metadados em Python; todos passaram, totalizando 83 verificações reportadas. Também passam a importação pelo editor e inicializações headless da seleção, do protótipo principal e da cena de comparação. As imagens listadas abaixo são composições de revisão, não capturas reais do renderer do jogo.

Comandos reproduzíveis a partir da raiz do repositório:

```sh
godot --headless --editor --path godot --quit
godot --headless --path godot --script res://tools/build_character_resources_g06.gd
godot --headless --path godot --script res://tests/test_iso_board.gd
godot --headless --path godot --script res://tests/test_art_pack_g03.gd
python3 godot/tests/test_art_pack_g04.py
godot --headless --path godot --script res://tests/test_combat_art_g05.gd
python3 godot/tests/test_art_pack_g05.py
godot --headless --path godot --script res://tests/test_characters_g06.gd
python3 godot/tests/test_art_pack_g06.py
python3 godot/tools/review_characters_g06.py
```

## Revisão visual

- Comparação masculina/feminina: [`hero_comparison.png`](../godot/reviews/g06/hero_comparison.png).
- Todas as ações masculinas: [`male_all_animations.png`](../godot/reviews/g06/male_all_animations.png).
- Prévia da seleção: [`selection_preview.png`](../godot/reviews/g06/selection_preview.png).
- Equipamentos: [`male_equipment_catalog.png`](../godot/reviews/g06/male_equipment_catalog.png).
- Personagens no tabuleiro: [`characters_on_map.png`](../godot/reviews/g06/characters_on_map.png).
- GIFs por ação e índice técnico: `godot/reviews/g06/`.

## Abrir no Windows

1. Instale/abra Godot 4.6.3 e importe `godot/project.godot` no Project Manager.
2. Clique em **Run Project (F5)**. A seleção inicial carrega a opção salva, e pode ser trocada antes de entrar. Use os botões dos cartões ou ←/→ / A-D; Enter/Espaço confirma.
3. No mapa, clique esquerdo seleciona uma célula; botão direito caminha; setas/WASD movem uma célula por vez. O rosto do personagem muda ao caminhar.
4. Para comparar personagens, abra `godot/scenes/character_compare_g06.tscn` e execute a cena atual (F6). Setas mudam orientação; 1–7 mudam a ação; G liga/desliga as camadas de equipamento.
5. A preferência local pertence ao diretório `user://` do Godot e não toca os saves do JavaScript.

## Limitações e escopo

- A comparação técnica confirma recursos, transformações e carregamento; ainda é necessária inspeção na janela desktop Godot para enquadramento e revisão artística final.
- Sword/shield são os únicos equipamentos produzidos. Capacete e armadura permanecem slots planejados.
- Eventos de animação estão no manifesto como marcadores visuais; não integram lógica de combate.
- Combate, inventário, missões e salvamento JavaScript permanecem fora da migração.
