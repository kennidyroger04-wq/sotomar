# Catálogo de assets G05

IDs lógicos estáveis para integração futura; o gameplay não os consome nesta missão.

## Personagens

- `character.wayfarer.g05` — base conservada: `res://assets/characters/wayfarer_v1/wayfarer_v1.png`; recurso `res://resources/combat/wayfarer_combat_g05.tres`.
- `character.moss_raider.g05` — novo inimigo original; recurso `res://resources/combat/moss_raider_combat_g05.tres`.

Animações: `character.<id>.<idle|walk|attack|hurt|defend|cast|death>.<se|sw|nw|ne>`. A disponibilidade por personagem, o FPS, loop, caminho, pivô e regiões constam em [`godot/resources/combat/combat_art_g05.json`](../godot/resources/combat/combat_art_g05.json). Quadros 128×160, pivô `(64,152)`; a Wayfarer conserva idle/walk G03.

Ações novas da Wayfarer: `attack`, `hurt`, `defend`, `cast`, `death`. Ações do Saqueador: `idle`, `walk`, `attack`, `hurt`, `death`. Cada folha tem 4 quadros por direção.

## Equipamento

| ID | PNG | Camada/recurso |
|---|---|---|
| `equipment.wayfarer.sword.basic` | `res://assets/equipment/g05/wayfarer_sword_idle.png` | arma, quatro direções |
| `equipment.wayfarer.shield.buckler` | `res://assets/equipment/g05/wayfarer_shield_idle.png` | escudo, quatro direções |

As duas folhas têm canvas de quadro 128×160 e 4 orientações. Recurso: `res://resources/combat/wayfarer_equipment_g05.tres`. O demo usa os overlays no idle; as poses de ataque/defesa têm o item co-renderizado, portanto esconde a camada neutra. Slots planejados: arma, escudo, capacete e armadura; somente arma/escudo foram produzidos.

## Efeitos nativos

IDs: `fx.g05.physical_slash`, `impact`, `shield_block`, `damage_flash`, `defeat_marker`, `spell_release`. Implementados com desenho 2D em `res://scripts/combat_fx_g05.gd`, sem spritesheet externo e sem dependência das regras de combate.

Eventos são dados visuais por quadro no catálogo JSON, por exemplo `event.wayfarer.attack.impact = frame 2`. Eles não alteram o estado do jogo.

## Fontes e exportações

- Masters raster gerados para G05: 12 arquivos em `godot/art/source/generated_g05/`; `wayfarer_death_master.png` é a primeira tentativa mantida como histórico de origem, e `wayfarer_death_master_v2.png` é a fonte exportada após corrigir margem/corte.
- 10 folhas de personagem (512×640) e 2 folhas de equipamento (512×160) em `godot/assets/characters/*_g05/` e `godot/assets/equipment/g05/`.
- Regerar PNGs: `python3 godot/tools/build_combat_art_g05.py`.
- Regerar SpriteFrames no Godot: `godot --headless --editor --path godot --quit`, depois `godot --headless --path godot --script res://tools/build_combat_resources_g05.gd`.
- Regerar pranchas/GIFs: `python3 godot/tools/review_combat_art_g05.py`.

Status do pacote: **tecnicamente testado; revisão artística e playback Godot pendentes**.
