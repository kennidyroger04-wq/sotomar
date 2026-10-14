# Relatório G11 — encontros, continuidade e integração à exploração

## Resultado

**IMPLEMENTADO** — O controlador G10 recebe agora uma definição de encontro por ID, aceita múltiplas unidades inimigas e produz um registro de resultado. A cena principal mantém o mapa e a célula do protagonista durante o combate. Os marcadores de encontro ficam numa camada separada da decoração e dos NPCs.

**VALIDADO** — `ENC_01` inicia em `MAP_02`; `ENC_05` inicia em `MAP_04`. Após vitória, a exploração reaparece no mesmo mapa e na mesma célula. Após derrota em `ENC_01`, o overlay permanece aberto e oferece nova tentativa.

**PENDENTE** — Os dados canônicos não especificam ativação, repetição nem recompensas por encontro. O estado G11 existe em memória e oferece snapshot versionado, mas ainda não está ligado ao salvamento em disco. Missões e inventário não consomem os eventos; nenhum item ou recompensa é concedido.

## Catálogo derivado

O arquivo [encounter_registry.json](../godot/resources/combat/encounter_registry.json) deriva as composições, exposição, perfis de runtime, habilidades e dependências de missão da fonte JavaScript. `node tools/build_godot_encounter_catalog.js --check` verifica que o JSON continua sincronizado.

| ID | Mapa | Composição canônica | Estado Godot |
|---|---|---|---|
| ENC_01 | MAP_02 | 1 Cascudo-de-cal (NORMAL) | PROVISIONAL_PLAYABLE |
| ENC_02 | MAP_02 | 2 Cascudos-de-cal (NORMAL) | PENDING: gatilho/posição não especificados |
| ENC_03 | MAP_03 | Papa-mel + Cascudo-de-cal (NORMAL) | PENDING: mapa e gatilho |
| ENC_04 | MAP_03 | Papa-mel (ORVALHADO) | PENDING: mapa e gatilho |
| ENC_05 | MAP_04 | 1 Topetão (NORMAL) | PROVISIONAL_PLAYABLE |
| ENC_06 | MAP_04 | Topetão + Fiandeira (NORMAL) | PENDING: gatilho e mecânica da habilidade |
| ENC_07 | MAP_05 | Fiandeira (NORMAL, MAREJADA) | PENDING: mapa, gatilho e mecânica |
| ENC_08 | MAP_06 | 2 Sapos-de-poça + Fiandeira (MAREJADO/MAREJADA) | PENDING: mapa, gatilho e mecânica |
| ENC_09 | MAP_07 | Lerdo-de-musgo + 2 Farejadores (MAREJADO) | PENDING: mapa, gatilho e mecânica |
| ENC_10 | MAP_08 | Lerdo-encharcado + Farejador | PENDING: mapa, gatilho e mecânica |
| ENC_11 | MAP_09 | 2 Farejadores + Topetão (MAREJADO) | PENDING: mapa e gatilho |
| ENC_12 | MAP_10 | Cascudo (ENCHARCADO) + Sapo (MAREJADO) + Fiandeira (ENCHARCADA) | PENDING: mapa, gatilho e mecânica |

Os mapas atualmente disponíveis em Godot são MAP_01, MAP_02 e MAP_04. Os únicos pontos reservados são os primeiros de cada mapa; por isso apenas ENC_01 e ENC_05 recebem gatilhos provisórios. A Coruja-muda especial e a Sineira continuam deferidas na fonte original. Valores de combate herdados do runtime estão marcados como provisórios.

## Interfaces para integração futura

- **ExplorationController** inicia pelo ID selecionado e restaura cena, mapa e célula após vitória. Derrota mantém o overlay e a ação de tentar novamente.
- **EncounterRegistry** expõe `encounters_for_map`, `world_trigger_available` e `combat_definition`; posições padrão são layout temporário da arena, não dados canônicos.
- **CombatController** recebe a definição com `configure(definition, state_store)` e emite `combat_finished`. O registro contém `MOB_KILLED` por unidade derrotada e `ENCOUNTER_RESOLVED` na vitória.
- **QuestState** poderá consumir `events` por ID canônico de criatura/encontro. Nenhum listener de missão foi ligado nesta etapa.
- **InventoryState** poderá receber `reward_candidates` e reservar IDs idempotentes. O catálogo atual não declara recompensas e não existe concessão real.
- **SaveState** pode serializar `snapshot()` e restaurar `restore_snapshot()` (schema 1). A conexão com o salvamento do jogo ainda falta; não há persistência entre recargas.

IDs de claim aceitos precisam constar entre os candidatos explícitos; claims repetidos no mesmo estado/snapshot são recusados. Como não há recompensas por encontro no cânone G11, o fluxo real mantém `rewards_applied=false`.

## Testes e exportação

**TESTADO** — regressões G01–G10 executadas: grade/seleção, pacotes de arte e personagens, touch e zoom, NPCs, mapas/portais, combate e fixtures de paridade. A regressão de layout de props MAP_04 foi preservada com os marcadores de encontro numa camada separada.

**TESTADO** — 25 verificações G11 headless passaram. Incluem catálogo, composição, células de spawn, estado/repetição/claims, iniciativa, combate com dois inimigos, turnos independentes, bloqueio de células ocupadas, vitória, MAP_04 e retorno à mesma célula. A comparação JavaScript verificou os 12 encontros e respectivos dados contra a fonte original; as fixtures G10 continuam com 22 asserções aprovadas.

**VALIDADO** — exportação Web contém 9 arquivos e 42,68 MiB. O validador confirmou os arquivos Web necessários, assinaturas WASM/PCK e exclusão do projeto-fonte. Chromium carregou a build servida em HTTP local, navegou de MAP_01 a MAP_02 por portal e venceu ENC_01 com controles touch; não houve erro JavaScript/console. Isso não substitui teste físico em Android/iOS nem publicação HTTPS.

Captura do retorno à exploração após a vitória: [chromium-enc01-victory.png](../reports/g11/chromium-enc01-victory.png).

Comandos G11:

```sh
node tools/build_godot_encounter_catalog.js --check
node godot/tests/test_encounter_catalog_g11.js
godot --headless --path godot --script res://tests/test_encounters_g11.gd
godot --headless --path godot --script res://tests/test_combat_g10.gd
node godot/tests/test_combat_parity_g10.js
godot --headless --path godot --export-release Web "$PWD/build/web/index.html"
python3 godot/tests/test_web_export_g07.py
python3 tools/validate_g09_web_export.py build/web
```

## Git e status

- Branch de trabalho: `mission/g11-encounter-system`.
- Base conferida antes das alterações: commit G10 `6e98133f1472363caa192f94986346f1eee88f59`.
- JavaScript canônico não foi modificado; não houve publicação externa nem merge.
- Commit/push desta missão: SHA da branch de trabalho informado na entrega final.

### Classificação

- **IMPLEMENTADO:** catálogo derivado, controlador reutilizável, suporte multi-inimigo, marcadores por mapa, estado/resultados em sessão e contrato de eventos.
- **TESTADO:** regressões G01–G10, paridade JavaScript/Godot, 25 verificações G11 e validação estrutural do pacote Web.
- **VALIDADO:** Chromium desktop, interação touch simulada, entrada e vitória em ENC_01, retorno à exploração; ENC_05 validado headless.
- **PENDENTE:** ativação/repetição/recompensas canônicas, mapas e encontros restantes, consumidores de missões/inventário e persistência em disco.
- **FALHOU:** nenhuma falha remanescente na execução final registrada.
