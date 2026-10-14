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
| G11 — encontros | IMPLEMENTADO, VALIDADO | ENC_01/MAP_02, ENC_05/MAP_04; dez encontros pendentes. |
| G11B — checkpoint | IMPLEMENTADO, TESTADO | Tag `g11-stable-20261014`, branch `operation/g12-g17`, build Web local. |
| G12 — mapas restantes | IMPLEMENTADO, TESTADO | Relatório `RELATORIO_G12.md`; importação, cena compartilhada, navegação existente, gate e export Web passaram. Inspeção visual humana pendente. |
| G13 — missões/progressão | IMPLEMENTADO, TESTADO; narrativa PARCIAL | QuestState, aceite, eventos G11, tracker, gate MAIN_04, diálogos condicionais e inspeções provisórias. Reivindicações de itens aguardam transação G14; ver `RELATORIO_G13.md`. |
| G14 — inventário/serviços | IMPLEMENTADO, TESTADO; integração visual PARCIAL | 61 itens sincronizados; modelos de inventário/equipamento/stats, rewards idempotentes, consumíveis e serviços; mochila acessível por toque e inspeções concedem item após transação. Sem persistência (G17) nem UI de equipar/comércio. Ver `RELATORIO_G14.md`. |
| G15 — habilidades/criaturas/IA | PENDENTE | Requer auditoria dos efeitos JavaScript e integração incremental. |
| G16 — boss/final do arco | PENDENTE | Boss e conclusão devem ser auditados antes de implementar narrativa. |
| G17 — save/continuidade | PENDENTE | Requer schema versionado para mapa, personagem, missões, itens e encontros. |

## Limites atuais

- Dados canônicos não definem ativação/repetição/recompensas para encontros; não inventar essas regras.
- JavaScript original é a fonte de compatibilidade e permanece sem alteração.
- Não houve publicação externa, teste em dispositivo físico ou aprovação humana de arte/diversão.
- A suíte JavaScript histórica ainda depende de 11 assets Kenney ausentes; preservar e reportar essa falha separadamente ao executar a suíte completa original.
