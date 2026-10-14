# Relatório G18B — paridade do combate tático

## Checkpoint e escopo

- **Base:** `operation/g18a` em `b07589d3ef37411c0126391fd8680a46cd19e24d`.
- **Branch de trabalho:** `operation/g18b`; checkpoint de início preservado em `checkpoint/g18b-start` e `checkpoint-g18b-start-20261014`.
- **Escopo entregue:** motor de efeitos/ações, planejador determinístico da IA, HUD no overlay de combate G10, dados técnicos dos 12 encontros e fixtures equivalentes. A cena principal de exploração, regras JS de produção, missões/saves e gatilhos existentes foram preservados.
- **Godot:** 4.6.3.stable; export Web concluído para `/workspace/build/web` (artefato local fora do repositório).

## Correspondência das habilidades

| ID | Regra da fonte JavaScript | Estado Godot |
|---|---|---|
| `golpe` | 4 PA, recarga 2, distância 1, LoS, inimigo; dano físico inclusivo 35–45 | **IMPLEMENTADO, TESTADO**; mantido integrado ao motor |
| `avanco` | 3 PA, sem recarga, distância 1–3 em linha, inimigo; dash até 3 células desocupadas e 20 dano físico | **IMPLEMENTADO, TESTADO, VALIDADO**; inclui custo, caminho, alvo, feedback/animação e toque |
| `cruz` | 4 PA, sem recarga, distância 0–3, célula/LoS; 9 células da cruz, 25–32 mágico e Vulnerável 2 turnos (−0,15 físico/mágico) nos inimigos | **IMPLEMENTADO, TESTADO, VALIDADO**; prévia e confirmação em dois toques |
| `lanca` | 3 PA, sem recarga, distância 2–3/LoS/inimigo; 18–26 físico e Veneno 2 turnos com 8 físico no início dos turnos do alvo | **IMPLEMENTADO, TESTADO, VALIDADO** |
| `fortificar` | 2 PA, recarga 2, usuário; +0,20 físico/+0,10 mágico por 2 turnos | **IMPLEMENTADO, TESTADO, VALIDADO** |

Todos os ataques são resolvidos pela regra canônica de dano, modificadores de atributos, crítico, bônus e resistência. Custo e recarga são validados antes do efeito. Modificadores temporários participam de resistência; reaplicação da mesma origem/status renova a duração sem acumular; veneno ocorre no início do turno afetado; efeitos expiram no fim desse turno. A fonte não define efeito de combate para `MAREJADO`, `ORVALHADO` ou `ENCHARCADO`: são preservados como metadados de exposição e não alteram regras.

## IA e encontros

Perfis comuns são despachados explicitamente para os modos correspondentes do planejador JavaScript: `melee`/`pack` → melee; `ranged_control` → ranged; `control` → control; `support` → support. A seleção determinística aplica custo/recarga, alvo, alcance, LoS, BFS, obstáculos e ocupação. `melee` mantém a ordenação por distância/grupo; `ranged` prefere alcance maior segundo o comparador original. Perfis especiais retornam `PROFILE_DEFERRED` sem ações inventadas. Todos os membros dos 12 encontros são montáveis a partir de dados de stats/habilidades; testes de batalha individual por encontro só foram feitos para ENC_01 e ENC_05. A atribuição e o balanceamento permanecem sob os rótulos provisórios.

| Perfil canônico | Política Godot | Estado nesta missão |
|---|---|---|
| `melee` | planejador melee JS | **IMPLEMENTADO, TESTADO** em fluxo G10/G18 e mapeamento G18B |
| `ranged_control` | planejador ranged JS | **IMPLEMENTADO, TESTADO, VALIDADO** por fixture Fiandeira/LoS/PM |
| `control` | planejador control JS | **IMPLEMENTADO**; despacho testado, cenário comportamental específico PENDENTE |
| `support` | planejador support JS | **IMPLEMENTADO**; despacho testado, escolha de alvo/necessidade específica PENDENTE |
| `pack` | planejador melee JS com desempate de grupo do comparador JS | **IMPLEMENTADO**; despacho testado, formação multi-inimigo PENDENTE |
| `special_deferred` | sem ação | **PENDENTE**, deferido pela fonte |
| `boss_reference_only` | sem ação | **PENDENTE**, contrato Sineira incompleto |

| Encontro | Combate técnico | Gatilho canônico na exploração | Classificação |
|---|---|---|---|
| ENC_01 | Composição pronta; combate E2E **TESTADO** | Sim, provisório existente em MAP_02 | A pronto; B ativável |
| ENC_02 | Composição testada; batalha individual E2E **PENDENTE** | Não definido | A montável; C pendente |
| ENC_03 | Composição testada; batalha individual E2E **PENDENTE** | Não definido | A montável; C pendente |
| ENC_04 | Composição testada; batalha individual E2E **PENDENTE** | Não definido | A montável; C pendente |
| ENC_05 | Composição pronta; combate E2E **TESTADO** | Sim, provisório existente | A pronto; B ativável |
| ENC_06 | Composição testada; batalha individual E2E **PENDENTE** | Não definido | A montável; C pendente |
| ENC_07 | Composição testada; batalha individual E2E **PENDENTE** | Não definido | A montável; C pendente |
| ENC_08 | Composição testada; batalha individual E2E **PENDENTE** | Não definido | A montável; C pendente |
| ENC_09 | Composição testada; batalha individual E2E **PENDENTE** | Não definido | A montável; C pendente |
| ENC_10 | Composição testada; batalha individual E2E **PENDENTE** | Não definido | A montável; C pendente |
| ENC_11 | Composição testada; batalha individual E2E **PENDENTE** | Não definido | A montável; C pendente |
| ENC_12 | Composição testada; batalha individual E2E **PENDENTE** | Não definido | A montável; C pendente |

Composição, IDs/perfis e habilidade foram derivados dos catálogos JavaScript, preservando o registro original. ENC_11/12 não contêm a Coruja-muda nem a Sineira. As espécies especiais continuam deferidas, fora destes encontros. Coordenadas padrão continuam apenas layout interno de combate, sem declarar posição narrativa. Eventos de morte/resolução, progresso e transação de recompensa seguem sob adaptadores G11/G13/G14 existentes. Regressões de quests, idempotência e save passaram; nenhuma política de repetição/recompensa foi inventada.

## Interface

**IMPLEMENTADO:** ações por toque (`Golpe`, `Avanço`, `Cruz`, `Lança`, `Fortificar`), custos PA visíveis no botão, controle de recarga/PA, células válidas, prévia da área, indicação de turno/estado e conexão ao mesmo overlay G10. Layout e projeção do tabuleiro foram verificados em 360×800, 390×844, 844×390 e 1280×720 por testes headless. **PENDENTE:** inspeção visual humana e aparelho físico. As capturas do Chromium são evidência técnica, não aprovação artística.

## Testes e exportação

- **Headless GDScript:** todos os 16 `godot/tests/test_*.gd` executados; regressão total, incluindo 78 verificações G18B. G10 cobre combate, IA, vitória, retorno e retry; G13/G14/G17 cobrem quests, itens/recompensas e save.
- **JavaScript:** sete scripts de regra/catálogo passaram: habilidades, contrato de boss, fixtures G10/G18B, catálogo de encontros, inspeções e mapas. `test_combat_web_g18b.js` gerou capturas do fluxo Web completo; `combat-browser-check.json` registra console/rede vazios. `test_web_save_flow_g18a.js` confirmou download e seletor de arquivo; o resultado final não foi coletado como aprovação completa.
- **Python:** cinco scripts `godot/tests/test_*.py` aprovados, inclusive workflow e verificação estrutural Web (3 asserts).
- **Export Web:** Godot 4.6.3 produziu `index.html`, `.js`, `.wasm`, `.pck` e worklets; WASM começa com `\0asm`, PCK com `GDPC`; teste estrutural aprovado. A primeira tentativa com diretório XDG vazio falhou por falta de templates; repetida com os templates instalados em `/tmp/sotomar-godot-data` e passou.
- **Chromium:** o export local abriu em 390×844 emulado sem erros de console/rede. O script `godot/tests/test_combat_web_g18b.js` importou uma posição de teste para MAP_04, abriu ENC_05, moveu duas células, lançou Lança duas vezes, verificou visualmente POISON/tick e Golpe do inimigo, venceu com Golpe e retornou à exploração. Capturas: [`mobile-g18b-lanca-target-result.png`](reports/g18b/captures/mobile-g18b-lanca-target-result.png), [`mobile-g18b-enemy-turn.png`](reports/g18b/captures/mobile-g18b-enemy-turn.png), [`mobile-g18b-after-golpe.png`](reports/g18b/captures/mobile-g18b-after-golpe.png); console/rede: [`combat-browser-check.json`](reports/g18b/captures/combat-browser-check.json). Emulação touch de Chromium, não aparelho físico. Derrota/retry Web não executados.
- **Suíte JS original:** **FALHOU** por assets Kenney ausentes em `js/tests/run-tests.js:501`, depois de 362 verificações aprovadas. Essa falha pré-existente foi mantida separada e não mascarada.

## G15 e lacunas remanescentes

**G15 não deve ser declarada integralmente concluída:** as cinco habilidades comuns estão integradas e demonstradas por fixtures, mas `special_deferred`/`boss_reference_only` e fixtures comportamentais próprias de control/support/pack permanecem pendentes. ENC_01 e ENC_05 tiveram batalha E2E; os outros dez só tiveram montagem de composição verificada. Sineira e Coruja-muda não fazem parte das composições atuais. Dez encontros seguem sem gatilho narrativo. O Chromium emulado comprovou vitória ENC_05 e retorno ao mapa; derrota/retry e aparelho físico permanecem pendentes. Capturas são evidência técnica, não aprovação artística.

| Critério | Resultado |
|---|---|
| IMPLEMENTADO | motor G18B; HUD/overlay; integração com turnos e IA comum; construtor técnico de encontros |
| TESTADO | regressões automatizadas G01–G18A, fixtures, exportação, responsividade headless e fluxo Chromium ENC_05 → Lança → Golpe → exploração |
| VALIDADO | paridade determinística demonstrada nos cenários compartilhados Avanço, Cruz, Lança, Fortificar, IA/LoS e catálogo; Lança/veneno e retorno da vitória observados no Web emulado |
| PENDENTE | ação especial Coruja-muda, contrato Sineira, gatilhos/recompensas ausentes, derrota/retry Web, inspeção em dispositivo físico |
| FALHOU | suíte JS original por dependência Kenney ausente; primeira exportação sem templates (resolvida na repetição) |

## Execução

```sh
node tools/build_godot_encounter_catalog.js --check
node godot/tests/test_combat_parity_g18b.js
XDG_DATA_HOME=/tmp/sotomar-godot-data XDG_CONFIG_HOME=/tmp/sotomar-g18b-config XDG_CACHE_HOME=/tmp/sotomar-g18b-cache godot --headless --path godot --script res://tests/test_combat_g18b.gd
XDG_DATA_HOME=/tmp/sotomar-godot-data XDG_CONFIG_HOME=/tmp/sotomar-g18b-config XDG_CACHE_HOME=/tmp/sotomar-g18b-cache godot --headless --path godot --export-release Web /workspace/build/web/index.html
```
