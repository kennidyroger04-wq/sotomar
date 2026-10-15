# Fábrica de sprites 2D do Arco 1

## Fonte e saída

`godot/tools/sprite_factory/build_g18d.py` lê as definições JSON em `godot/art/source/sprite_factory/specs/`. Cada arquivo declara ID canônico, nome, texto canônico, proposta visual, família, paleta e módulo anatômico (`build`). Para uma espécie nova, copie um JSON, use um módulo existente ou implemente um módulo anatômico específico no renderizador. Os sete JSON de criaturas são entradas editáveis e também documentam de forma separada o que veio do cânone e o que é interpretação visual.

O renderizador desenha em Pillow a 2×, reduz uma vez com Lanczos e grava PNG RGBA. O resultado é determinístico para as mesmas especificações e versão do gerador. Não requer rede, API, Godot editor ou serviço pago para produzir os PNGs.

### Contrato do lote G18D

- Quadro: 192×224 px.
- Pivô nos pés: `(96, 214)`.
- Orientações: `front`, `left`, `back`, `right`.
- Ações: `idle`, `walk`, `attack`, `hurt`, `defeat`.
- 4 quadros por direção e ação; `idle`/`walk` em loop, ações de combate em reprodução única.
- Cada atlas: 768×896 px; colunas são orientações, linhas são índices de quadro.
- Escala no board: 0,5; offset vertical de −214 antes da escala, para assentar os pés no ponto da célula.

Os estados `NORMAL`, `MAREJADO`, `ORVALHADO` e `ENCHARCADO` continuam pertencendo ao modelo de combate. Eles resolvem para a arte da espécie base e não criam sprites que alterem regras ou estatísticas. Efeitos visuais próprios de estados permanecem pendentes até haver contrato visual canônico suficiente.

## Anatomias

Os módulos implementados são distintos: `beetle`, `forager`, `crest`, `spider`, `frog`, `slug` e `hound`. O módulo `humanoid` produz também as propostas dos NPCs Lia, Nilo e Bram com idle/walk, quatro direções e quatro quadros; Mira mantém sua fonte G18C existente. Cada módulo desenha a estrutura corporal, membros, cabeça e sinais visuais apropriados à proposta declarada. Os quadros de caminhada alteram apoio e balanço; ataques usam preparação/projeção; hurt tem recuo; defeat inclina a figura em torno do ponto de apoio. Essas poses são uma base procedural ilustrada, não um rig esquelético nem uma substituição de revisão artística.

O gerador recusa módulos desconhecidos e paletas incompletas. Para acrescentar uma família anatômica, adicionar um ramo de desenho próprio, declarar o módulo nos dados e expandir os testes de família e pose. Não mapear espécie nova para outra família por conveniência.

## Reproduzir

Na raiz do repositório:

```sh
python3 godot/tools/sprite_factory/build_g18d.py
godot --headless --editor --path godot --quit
godot --headless --path godot --script res://tools/sprite_factory/build_godot_resources.gd
python3 godot/tests/test_sprite_factory_g18d.py
godot --headless --path godot --script res://tests/test_sprite_factory_g18d.gd
```

Saídas:

- Masters: `godot/art/source/sprite_factory/creatures/<id>/`.
- Frames separados por ação/direção: `.../<id>/frames/<ação>/`.
- Especificações de entrada: `godot/art/source/sprite_factory/specs/<id>.json`.
- PNGs runtime: `godot/assets/characters/<id>_g18d/`.
- SpriteFrames: `godot/resources/animations/<id>_g18d.tres`.
- Metadados/proveniência: `godot/resources/art/<id>_g18d.json`.
- Contact sheets e GIFs: `reports/g18d/contact-sheets/` e `reports/g18d/gifs/`.
- Integridade da execução: `reports/g18d/sprite-factory-integrity.json`.

## Verificações automáticas

O teste Python detecta imagens vazias, quadros iguais, dimensões erradas, deslocamento grande da base, falta de fonte/atlas e famílias/silhuetas duplicadas. O teste Godot carrega cada SpriteFrames e checa todos os nomes de animação, quantidade/região de quadros, loop, pivô, escala lógica e integração na cena de combate. Essas verificações não avaliam expressão, apelo, continuidade refinada, desenho das mãos/patas nem aprovação humana. Contact sheets/GIFs são obrigatórios para revisão visual antes de promover uma arte a final.

## Engenharia reversa G06

O fluxo G06 é um adaptador de pranchas já desenhadas: `build_character_art_g06.py` divide e normaliza pixels; `build_character_resources_g06.gd` cria regiões SpriteFrames. Não existe rig ou gerador anatômico nas evidências revisadas. Essa abordagem segue útil quando outra prancha original já existe, mas a fábrica G18D fornece também o estágio anterior — fonte estruturada e poses anatômicas por espécie.

## Limites e extensão

- A qualidade é estilizada e procedural; não declarar arte final aprovada.
- O contrato não fixa a todos os seres a mesma ocupação visual. Pivô e posição lógica podem permanecer estáveis enquanto uma criatura especial excede uma célula.
- O módulo humanoide atual serve aos três NPCs principais com acessórios de proposta; protagonistas e Mira seguem seus assets/fontes G03–G06/G18C. Equipamento em avatar e camadas de armadura continuam pendentes.
- As famílias atuais não modelam rigs por partes; quadros são rasterizados completos a partir de código vetorial/Pillow. Uma futura mudança de proporção exige revisar contact sheets e estabilidade do pivô.
