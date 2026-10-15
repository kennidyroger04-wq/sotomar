# Arte do protótipo

Este protótipo desenha gramado, caminho, árvore, rochas e personagem via GDScript. Ainda não contém imagens importadas. O layout preparado organiza PNGs e spritesheets por função:

- `tiles/terrain/` e `tiles/edges/` — chão e transições isométricas modulares.
- `props/` — árvores, rochas, construções e demais elementos de cenário.
- `characters/` — personagens, criaturas, direções e animações.
- `effects/`, `ui/` e `spritesheets/` — efeitos, interface e folhas de sprites reutilizáveis.
- `art/source/` na raiz do projeto Godot — fontes editáveis; `art/exports/` — exportações aprovadas.

Registre IDs estáveis, pivôs, tamanho lógico, metadados e licenças. O runtime deve referenciar IDs/recursos, não acoplar as regras a nomes de arquivos exportados.

G18C começa os originais em `props/g18c/`, `characters/cascudo_g18c/` e `characters/npc_mira_g18c/`; os masters de geração ficam em `art/source/generated_g18c/` com briefs e metadados em `resources/art/` e `resources/animations/`. Esses recursos não são considerados aprovados até revisão humana. Reexecute `godot --headless --path godot --script res://tools/build_creature_resources_g18c.gd` para reconstruir os SpriteFrames do Cascudo e da Mira após importar os PNGs.
