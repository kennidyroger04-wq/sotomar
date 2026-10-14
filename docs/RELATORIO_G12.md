# Relatório G12 — mapas restantes do Arco 1

**Estado:** IMPLEMENTADO e TESTADO tecnicamente; validação visual humana PENDENTE.
**Branch:** `operation/g12-g17`
**Base da missão:** checkpoint G11B `4ab3e72868f2962d563cad509aa0276a562b70d6`.
**Versão:** Godot 4.6.3 stable.

## Implementado

- O adaptador `tools/sync_godot_map_registry.js` agora deriva o catálogo de todos os IDs canônicos e exige que cada módulo visual e mapa runtime correspondente exista, com identidade e dimensões iguais.
- O catálogo Godot passou a conter MAP_01–MAP_11: os onze mapas canônicos, com IDs, nomes, dimensões, pisos, props, bloqueios, reservas, spawns, NPCs e saídas de origem. MAP_01/MAP_02/MAP_04 mantêm os dados anteriores.
- A cena principal renderiza as dimensões e os props de cada mapa usando suas camadas e o sistema de profundidade já existente. Os mapas MAP_03 e MAP_09 são renderizáveis, mas continuam sem saída porque a fonte runtime não define portais para eles.
- Saídas com `requiresFlag` agora respeitam `world_flags`; MAP_05↔MAP_07 permanece fechada sem `FLAG_ESCADA_MARCO_PRUMO_UNLOCKED`. A flag pode ser fornecida via `set_world_flag` para futura integração com quests.
- O catálogo derivado de encontros foi regenerado para refletir que os onze mapas estão disponíveis no catálogo; isso não cria encontros ativos: o catálogo mantém 2 encontros jogáveis provisórios e 10 pendentes.
- A exportação Web foi refeita em `build/web`; a pasta permanece artefato local ignorado pelo Git.

## Dados canônicos e limites

- Nenhuma fonte JavaScript canônica foi editada.
- MAP_03 segue sem portais; a fonte registra a topologia/acesso como pendente.
- MAP_09 segue sem portais; não foi inventado um vínculo a MAP_07, apesar da referência de conexão no metadata, pois o runtime e o visual não fornecem saída correspondente.
- MAP_06 não foi ligado a MAP_07: o layout original registra ausência de conexão.
- A rota existente MAP_05↔MAP_07 preserva o requisito `FLAG_ESCADA_MARCO_PRUMO_UNLOCKED`.
- As dimensões originais foram mantidas (entre 9×8 e 12×10); nenhuma foi expandida.
- MAP_03, MAP_09 e os outros mapas que não estavam no início normal permanecem visíveis via catálogo/renderizador; o fluxo de jogo não ganha um portal artificial para alcançá-los.

## Verificação

**Aprovado:**

- `node tools/sync_godot_map_registry.js --check`
- `node godot/tests/test_maps_g12.js`: paridade dos onze mapas, nomes/dimensões, bloqueios, spawns, saídas e flags; BFS em grade de cada spawn até cada portal; destino de cada portal dentro dos limites e desobstruído; caminho por grafo respeita a flag; MAP_03/MAP_09 não recebem navegação inventada; texturas de props referenciadas existem.
- `godot --headless --path godot --script res://tests/test_maps_g08.gd`: regressões G08 e transições MAP_01→MAP_02/MAP_04→MAP_05→MAP_07 (bloqueio e desbloqueio sintético)→MAP_08→MAP_10→MAP_11 e retorno aprovados.
- `godot --headless --path godot --script res://tests/test_maps_g12.gd`: os onze mapas renderizaram pela cena principal com contagem de células de terreno, props/NPCs, colisões e apenas portais existentes.
- Regressões G01–G11: tabuleiro, arte G03–G06, touch G07, NPC G09, publicação gated, mapas G08, benchmark, combate/paridade G10 e catálogo/encontros G11 aprovados. G10: 22 testes; o relatório G11 original aprovou 25, e o teste G11 agora contém 26 verificações ao incluir a conexão de eventos G13.
- Importação headless Godot, inicialização das cenas de seleção e principal, exportação Web Release e `tools/validate_g09_web_export.py build/web` aprovados.
- Catálogo G11 foi inicialmente apontado como desatualizado depois de atualizar sua dependência (o mapa registry); regenerado com o gerador oficial, e `--check`, paridade e 26 testes G11 passaram na última regressão depois da conexão G13; no checkpoint G12, a repetição havia aprovado as 25 verificações G11 vigentes então.
- `git diff --check` aprovado.

**Não validado nesta missão:** aparência visual por captura/inspeção humana e execução em aparelho físico. A exportação Web foi estruturalmente validada, não publicada.

## Resultado Web local

`build/web` contém os nove arquivos exportados pelo Godot (inclui HTML, JS, WASM, PCK e assets auxiliares); WASM tem cerca de 37,7 MB. A exportação não inclui fontes GDScript como arquivos separados. A checagem estrutural passou. Não foi gerada nem validada URL HTTPS.

## Próxima dependência

G13 deve auditar quest IDs, objetivos, pré-requisitos, eventos e diálogos diretamente na fonte JavaScript antes de conectar `set_world_flag` e eventos de combate. MAP_03 e MAP_09 só devem entrar no grafo jogável quando a fonte fornecer seus acessos.
