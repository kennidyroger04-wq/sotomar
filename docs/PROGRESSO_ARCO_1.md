# Progresso do Arco 1

| Missão | Estado | Evidência/observação |
|---|---|---|
| G01 — protótipo isométrico | VALIDADO | Grade, seleção, movimento e placeholders; regressões atuais aprovadas. |
| G02/G02B — base visual | VALIDADO | TileSet, camadas, contrato de escala e captura local. |
| G03/G04 — arte 2D | IMPLEMENTADO, TESTADO | Terreno modular, props e personagens; inspeção artística final depende do proprietário. |
| G05/G06 — personagens e seleção | IMPLEMENTADO, TESTADO | Dois protagonistas, equipamento e animações; sem validação física mobile. |
| G07 — Web/touch | VALIDADO | Export Web, viewport mobile emulado, toque e zoom. |
| G08 — mapas variáveis | IMPLEMENTADO PARCIAL | MAP_01, MAP_02, MAP_04 jogáveis; MAP_03 e MAP_05–11 pendentes de integração. |
| G09/G09B — NPC/Web | IMPLEMENTADO, TESTADO | NPCs e diálogos; Hosting HTTPS não publicado. |
| G10 — combate | IMPLEMENTADO, VALIDADO | ENC_01; testes de turnos e paridade JavaScript. |
| G11 — encontros | IMPLEMENTADO, VALIDADO | ENC_01/MAP_02, ENC_05/MAP_04; dez encontros pendentes. |
| G11B — checkpoint | IMPLEMENTADO, TESTADO | Tag `g11-stable-20261014`, branch `operation/g12-g17`, build Web local. |
| G12 — mapas restantes | EM ANDAMENTO | Próxima etapa: auditoria de fonte/topologia e adapter dos mapas originais. |
| G13 — missões/progressão | PENDENTE | A migrar após mapa/eventos G12. |
| G14 — inventário/serviços | PENDENTE | Depende de G13 e contrato de rewards idempotente. |
| G15 — habilidades/criaturas/IA | PENDENTE | Requer auditoria dos efeitos JavaScript e integração incremental. |
| G16 — boss/final do arco | PENDENTE | Boss e conclusão devem ser auditados antes de implementar narrativa. |
| G17 — save/continuidade | PENDENTE | Requer schema versionado para mapa, personagem, missões, itens e encontros. |

## Limites atuais

- Dados canônicos não definem ativação/repetição/recompensas para encontros; não inventar essas regras.
- JavaScript original é a fonte de compatibilidade e permanece sem alteração.
- Não houve publicação externa, teste em dispositivo físico ou aprovação humana de arte/diversão.
- A suíte JavaScript histórica ainda depende de 11 assets Kenney ausentes; preservar e reportar essa falha separadamente ao executar a suíte completa original.
