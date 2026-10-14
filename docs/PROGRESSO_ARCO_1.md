# Progresso do Arco 1

| Missão | Estado | Evidência/observação |
|---|---|---|
| G01 — protótipo isométrico | VALIDADO | Grade, seleção, movimento e placeholders; regressões atuais aprovadas. |
| G02/G02B — base visual | VALIDADO | TileSet, camadas, contrato de escala e captura local. |
| G03/G04 — arte 2D | IMPLEMENTADO, TESTADO | Terreno modular, props e personagens; inspeção artística final depende do proprietário. |
| G05/G06 — personagens e seleção | IMPLEMENTADO, TESTADO | Dois protagonistas, equipamento e animações; sem validação física mobile. |
| G07 — Web/touch | VALIDADO | Export Web, viewport mobile emulado, toque e zoom. |
| G08/G12 — mapas do Arco 1 | IMPLEMENTADO, TESTADO | Catálogo e renderização dos onze mapas; portais/spawns validados por BFS; MAP_03/MAP_09 seguem sem acesso pois faltam saídas canônicas. Ver `RELATORIO_G12.md`. |
| G09/G09B — NPC/Web | IMPLEMENTADO, TESTADO | NPCs e diálogos; Hosting HTTPS não publicado. |
| G10 — combate | IMPLEMENTADO, VALIDADO | ENC_01; testes de turnos e paridade JavaScript. |
| G11 — encontros | IMPLEMENTADO, TESTADO | ENC_01–ENC_12 têm composição tecnicamente montável; ENC_01 e ENC_05 mantêm os únicos gatilhos provisórios. Dez seguem sem gatilho de exploração. |
| G11B — checkpoint | IMPLEMENTADO, TESTADO | Tag `g11-stable-20261014`, branch `operation/g12-g17`, build Web local. |
| G12 — mapas restantes | IMPLEMENTADO, TESTADO | Relatório `RELATORIO_G12.md`; importação, cena compartilhada, navegação existente, gate e export Web passaram. Inspeção visual humana pendente. |
| G13 — missões/progressão | IMPLEMENTADO, TESTADO; narrativa PARCIAL | QuestState, aceite, eventos G11, tracker, gate MAIN_04, diálogos condicionais e inspeções provisórias. Reivindicações de itens aguardam transação G14; ver `RELATORIO_G13.md`. |
| G14 — inventário/serviços | IMPLEMENTADO, TESTADO; visual PARCIAL | 61 itens sincronizados; mochila rolável, equipamento equipar/desequipar, atributos e Poção Simples; cura de Nilo com estado persistido. Avatar ainda não reflete graficamente o equipamento. Bram não negocia pela fonte; preços seguem provisórios. Ver `RELATORIO_G14.md` e `RELATORIO_G18A.md`. |
| G15 — habilidades/criaturas/IA | PARCIAL; mecânicas comuns IMPLEMENTADAS/TESTADAS | Cinco habilidades comuns e despacho dos perfis comuns ligados ao overlay G10; contratos especiais e fixtures específicas de control/support/pack permanecem pendentes. Ver `RELATORIO_G15.md` e `RELATORIO_G18B.md`. |
| G16 — boss/final do arco | PARCIAL, AUDITADO | Sineira é o único boss explícito, mas a fonte não confirma que seja o boss final nem define luta/epílogo. Coruja-muda segue deferida. Ver `RELATORIO_G16.md`. |
| G17 — save/continuidade | IMPLEMENTADO, TESTADO; arquivo Web VALIDADO em emulação | Schema v1, journal dois slots, checksum, migração JS V2; exportação, seletor de arquivo Web, prévia/confirm/cancel, cópia pré-importação recuperável e reload testados no Chromium. Sem teste físico de celular. Ver `RELATORIO_G17.md` e `RELATORIO_G18A.md`. |
| G18A — consolidação/mobile | IMPLEMENTADO parcialmente; regressões TESTADAS; Web VALIDADO tecnicamente | Reflow da interface, controles de inventário/equipamento/consumível, cura de Nilo, backup visual e auditoria de lacunas. G15/G16 permanecem parciais; sem publicação, teste físico ou aprovação artística. Ver `RELATORIO_G18A.md`. |
| G18B — combate/paridade | IMPLEMENTADO; TESTADO; Web VALIDADO no fluxo ENC_05 | Lança, veneno, Golpe, vitória e retorno à exploração passaram no Chromium mobile emulado; 69 testes G18B, regressões G01–G18A e export Web. Gatilhos narrativos, derrota Web/retry e contratos especiais seguem pendentes. Ver `RELATORIO_G18B.md`. |

## Limites atuais

- Dados canônicos não definem ativação/repetição/recompensas para encontros; não inventar essas regras.
- JavaScript original é a fonte de compatibilidade e permanece sem alteração.
- Não houve publicação externa, teste em dispositivo físico ou aprovação humana de arte/diversão.
- `node js/tests/run-tests.js` segue falhando na verificação de recursos ausentes: 362 checks antecedem a falha em `js/tests/run-tests.js:501`; a auditoria atual registra 20 PNGs e 4 licenças ausentes em `ASSETS_AUSENTES.md`.

## Atualização G18B

As cinco habilidades comuns e os perfis de IA com regra canônica estão implementados e cobertos por fixtures JavaScript/Godot. Os 12 encontros têm cenários técnicos montáveis; só ENC_01/05 conservam acesso provisório pelo mundo. A Sineira/Coruja-muda, repetição/recompensas sem política canônica, derrota/retry Web e inspeção física permanecem **PENDENTES**. A vitória ENC_05 em Chromium emulado retornou à exploração sem erro de console/rede. Nenhum conteúdo foi publicado e a árvore JS de produção não foi alterada.
# Atualização G18B — combate tático

- **IMPLEMENTADO:** ações comuns de G15 (Golpe, Avanço, Cruz, Lança e Fortificar) ligadas ao overlay G10; efeitos temporários; seleção determinística da IA; definições técnicas ENC_01–ENC_12.
- **TESTADO:** regressão automatizada headless G01–G18A mais 69 verificações G18B; seis testes JS de compatibilidade/catálogo e cinco scripts Python; Web WASM/PCK exportado e estruturalmente verificado.
- **VALIDADO:** fixtures comuns JS/Godot para habilidades/IA e acesso do overlay de combate por célula/toque em teste Godot. ENC_01 e ENC_05 continuam os únicos gatilhos provisórios existentes.
- **PENDENTE:** fluxo Chromium de combate completo usando uma habilidade nova; fluxo de derrota/retry no Chromium; revisão visual humana/dispositivo físico; recompensas/repetição/ativação ausentes; contratos especiais da Coruja-muda e Sineira.
- **FALHOU:** `node js/tests/run-tests.js` ainda para na referência a asset Kenney ausente (`js/tests/run-tests.js:501`) depois de 362 verificações aprovadas. Não se trata de falha do motor Godot.
- **G15:** concluída para as cinco habilidades comuns e perfis comuns com dados; contratos especiais adiados não estão cobertos.
- **Branch de trabalho:** `operation/g18b`, baseado no commit validado G18A `b07589d`. Ver `RELATORIO_G18B.md`.
