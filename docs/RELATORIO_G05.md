# Relatório G05 — Personagens, equipamentos e animações

**Projeto:** Sotomar/Fímbria · Godot 4.6.3<br>
**Escopo:** pacote de arte de combate e cena isolada de revisão. A cena principal, o tabuleiro e as regras JavaScript foram preservados.

## Entrega

- **2 personagens:** Wayfarer (reutilizada de G03) e o inimigo original Saqueador Musgoso.
- **10 folhas de ação novas**, cada uma com quatro direções × quatro quadros de 128×160 RGBA: 80 quadros da Wayfarer e 80 do Saqueador.
- Wayfarer: idle e walk reutilizados de G03, mais **attack, hurt, defend, cast e death** em quatro direções. SpriteFrames: 28 animações direcionais.
- Saqueador Musgoso: **idle, walk, attack, hurt e death** em quatro direções. SpriteFrames: 20 animações direcionais.
- **2 folhas de equipamento** (espada e broquel), com quatro posições direcionais cada. SpriteFrames: oito animações estáticas direcionais.
- **6 efeitos nativos 2D** desacoplados dos personagens: corte físico, impacto, bloqueio de escudo, flash de dano, marcador de derrota e liberação de feitiço.
- Eventos de animação registrados por quadro: impacto de ataque (quadro 2), liberação/conjuração (2), bloqueio (2), dano recebido (1) e derrota (3).

## Camadas e sincronização

Espada e broquel são folhas RGBA próprias, anexadas como `AnimatedSprite2D` ao rig da Wayfarer. No idle, as camadas seguem orientação, escala e transformação do rig; alterná-las não muda sua posição nem a célula lógica. Para ataque, defesa e conjuração, a arte do personagem já inclui o equipamento na pose. Nessas ações, as camadas estáticas ficam ocultas para evitar duplicar armas ou escudos. Essa composição híbrida foi escolhida após a revisão das poses; extrair e animar os objetos separadamente produziria recortes e alinhamentos frágeis nesta etapa.

O catálogo descreve os slots futuros `weapon`, `shield`, `helmet` e `armor`. Apenas espada e broquel foram produzidos. Ainda não há troca de armadura/ capacete nem combinação de armas alternativas.

## Ferramentas e revisão

- Fontes geradas foram preservadas em [`godot/art/source/generated_g05/`](../godot/art/source/generated_g05/). Inclui a primeira fonte de derrota da Wayfarer e uma revisão completa v2; ambas foram mantidas, e a exportação usa a v2.
- O exportador detecta os quatro sprites por transparência quando a separação entre poses é clara e usa divisão proporcional como fallback. Isso resolveu uma fonte de defesa que tinha margens irregulares e era cortada em quadrantes uniformes.
- 10 folhas de ação normalizadas em 512×640; folhas de equipamento 512×160.
- Pranchas estáticas e quatro GIFs estão em [`godot/reviews/g05/`](../godot/reviews/g05/review_index.json). São ferramentas de revisão e não uma aprovação de fluidez no motor.
- Cena interativa: [`godot/scenes/combat_art_demo.tscn`](../godot/scenes/combat_art_demo.tscn).

## Testes

| Verificação | Resultado |
|---|---|
| G02B `test_iso_board.gd` | **20 passaram** |
| G03 `test_art_pack_g03.gd` | **8 passaram** |
| G04 `test_art_pack_g04.py` | **8 passaram** |
| G05 `test_combat_art_g05.gd` | **4 grupos de verificações passaram**: SpriteFrames, quadros/FPS/eventos, rig/equipamento/profundidade e efeitos |
| G05 `test_art_pack_g05.py` | **6 passaram**: PNGs, transparência, quadros, fontes, catálogo, GIFs/pranchas |
| Godot 4.6.3 importação headless | **Passou**, código 0 |
| Cena `combat_art_demo.tscn` headless | **Passou**, sem erros no log, código 0 |
| `git diff --check` | **Passou** |

**46 verificações automatizadas anteriores e novas passaram** (20 + 8 + 8 + 4 + 6). A inicialização headless e a importação também foram executadas separadamente.

## Classificação

- **IMPLEMENTADO:** ações e equipamentos listados, seis efeitos, eventos por quadro, catálogos e cena demonstrativa.
- **TESTADO:** carregamento dos recursos, quatro direções, dimensões, alfa, pivôs, quadros, FPS, loops, eventos, camadas sem alteração da célula e execução headless.
- **VALIDADO:** referências Godot e fontes/exportações resolvem; pivô `(64,152)` em todas as folhas de personagem; ordem de profundidade deriva da célula registrada; projeto original segue isolado.
- **PENDENTE:** inspeção da cena em Godot Desktop e aprovação artística/fluidez. As pranchas estáticas foram inspecionadas e os GIFs foram gerados como referência; nenhum deles substitui o renderizador e o tempo real do Godot. Mudanças de pose e escala precisam ser julgadas em playback.
- **FALHOU:** nenhum item ao final da rodada. Um erro inicial de tipagem na cena e um atlas com margem irregular foram corrigidos e revalidados.

Nenhuma arte recebeu aprovação definitiva. Não há uso de recursos oficiais de Dofus.

## Abrir no Godot Desktop

1. Importe `godot/project.godot` no Project Manager.
2. Abra `scenes/combat_art_demo.tscn` e execute a cena atual (F6).
3. Controles: `Tab` alterna personagem; setas esquerda/direita, orientação; `1` idle, `2` walk, `3` attack, `4` hurt, `5` defend, `6` cast, `7` defeat; `G` alterna espada/escudo; `F` avança os efeitos; `Espaço` repete a ação.
4. O Saqueador não possui conjuração/defesa. Ao escolher essas ações nele, a demonstração usa ataque/recebimento de dano, respectivamente.

## Próxima missão recomendada

Revisão no Godot Desktop com capturas da cena e playback das oito orientações de ataque/dano/defesa/derrota; ajustar os quadros que mostrarem saltos de escala ou corte. Depois da aprovação visual, produzir uma versão modular das camadas de arma para as poses de ataque e testar um equipamento alternativo.
