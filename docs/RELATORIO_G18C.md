# Relatório G18C — produção e integração visual do Arco 1

Data: 2026-10-15. Branch de trabalho: `operation/g18c-art`. O trabalho permanece numa fatia recuperável; **G18C não está integralmente concluída**.

## Segurança, branch e base

- Remoto: `origin` → `https://github.com/kennidyroger04-wq/sotomar.git`.
- A branch `operation/g18b` estava limpa e alinhada ao remoto em `6abb5fb0683a7287026b4413afc9e2c14590c755`; `git fetch origin --prune` confirmou a referência.
- Criada `operation/g18c-art` desse SHA, sem reescrever branch/tag. Checkpoint inicial publicado: branch `checkpoint/g18c-start` e tag `checkpoint-g18c-start-20261015`.
- Checkpoint de arte recuperável enviado: `2a43a797317029a3228fefde2eacf27a5f86d180` (`feat(art): integrate Caieira cottage and Cascudo idle`). Os documentos desta auditoria seguem em um commit separado na mesma branch.
- Nenhuma publicação de jogo nem merge em `main`.

## Inventário real

- Foram encontrados e revalidados **20 PNGs Kenney ausentes** (11 de terreno/cenário e 9 de personagem/criatura) e **4 licenças Kenney ausentes**, exatamente os caminhos exigidos pelos dois manifests legados. Nenhum foi restaurado ou recriado como vazio. Matriz e caminhos exatos: `MATRIZ_MIGRACAO_KENNEY.md`.
- Existem **16 OGG Kenney** em `audio/kenney/rpg/` e `audio/kenney/ui/`; as duas licenças de áudio registradas permanecem presentes. Áudio foi mantido inalterado.
- Godot já tinha arte original G03 de terreno (grama/terra/pedra/água, caminhos e bordas), árvores e rochas, protagonistas Wayfarer/Guerreiro, Raider de combate e equipamentos espada/escudo. Ver `godot/assets/README.md`, masters G03/G05/G06 e contact sheets existentes. Há **55 PNGs** no diretório `godot/assets/` após esta fatia.
- O runtime continha placeholders vetoriais de casa/muro/alvenaria, NPCs e criaturas sem arte específica. Os mapas canônicos têm 11 layouts; não foram adicionados spawns, portais, células de bloqueio ou colisões.

## Entrega concreta desta fatia

- **Casa de Caieira — IMPLEMENTADO:** imagem original RGBA 1327×1200, master e export em `godot/art/source/generated_g18c/caieira_lime_cottage_master.png` e `godot/assets/props/g18c/caieira_lime_cottage.png`. Substitui o desenho placeholder nas três referências `VIS_HOUSE_SMALL` de MAP_01. A âncora é a base central, escala 0,11. Células, bloqueio e ordenação continuam sendo os dados atuais.
- **Cascudo-de-cal — IMPLEMENTADO (idle limitado):** imagem original RGBA 1122×1402, prancha direcional 4×4, export em `godot/assets/characters/cascudo_g18c/cascudo_de_cal_idle.png`, master, SpriteFrames e metadados. O board G10 renderiza essa espécie em ENC_01 no motor existente, com idle de quatro quadros em cada orientação e base nos pés.
- As regiões atlas medidas pelo Godot são 280×350; o master não está em grade pixel-perfect do gerador. O adaptador usa exatamente essas regiões (perda somente até 2 px nas margens exteriores). O teste confirma RGBA, transparência, carregamento e pivô. Variação de idle é sutil; **não há** walk, ataque, hurt ou derrota próprios ainda.
- Os dois masters são cópias byte a byte dos PNGs runtime. Origem ImageGen, sem arte oficial de Dofus, referência de terceiros ou conteúdo Kenney. Os traços arquitetônicos/anatômicos são propostas, não cânone documentado.

## Status por lote

| Lote | Estado | Evidência e limite |
|---|---|---|
| A — cenários/construções | **PARCIAL — IMPLEMENTADO/TESTADO** | Terrenos, caminhos, transições, árvore e rocha originais G03 já existiam e os 11 mapas usam o catálogo compartilhado. Casa original agora ocupa as 3 células `VIS_HOUSE_SMALL` de Caieira. Muros, ponte, alvenaria/ruínas e identidade visual própria dos outros mapas não produzidos. |
| B — NPCs | **PENDENTE** | Mira, Lia, Nilo e Bram continuam markers/representações provisórias; sem sprites próprios por orientação. Contratos e diálogo existentes foram preservados. |
| C — criaturas comuns | **PARCIAL — IMPLEMENTADO/TESTADO** | Cascudo tem idle original direcional e integração ENC_01. Papa-mel, Topetão, Fiandeira, Sapo-de-poça, Lerdo-de-musgo e Farejador-de-brejo continuam sem sprites próprios. Walk/ataque/hurt/derrota e variantes visuais/estado do Cascudo também pendem. |
| D — criaturas especiais | **PENDENTE** | Coruja-muda continua deferida; Sineira mantém contrato canônico de cágado-de-sino vivo e não maligno, mas ainda sem arte/rig/animação. Nenhuma morte obrigatória foi criada. |
| E — habilidades/efeitos | **PARCIAL — IMPLEMENTADO** | FX G05/G18B existentes e cinco habilidades comuns continuam no overlay; cálculo segue separado do renderer. Esta fatia não produziu cinco conjuntos ilustrados únicos. |
| F — equipamentos/interface | **PARCIAL — TESTADO** | Espada/escudo dos protagonistas e rig original G05/G06 permanecem. Não foram inventados visuais de itens indefinidos nem criados todos os ícones. |

Status canônico/visual detalhado e propostas separadas: `CATALOGO_VISUAL_ARCO_1.md`. G18C **não** atende ainda os critérios de conclusão global.

## Kenney e JavaScript legado

- A exportação ativa Godot Web não carrega os caminhos Kenney em `js/data/visual-assets.js`/`character-assets.js`.
- Os manifests JavaScript ainda declaram 20 PNGs e 4 licenças faltantes. Recursos G03/G18C correspondentes existem no Godot, mas não foram ligados aos manifests JS; faltam substitutos específicos para NPCs, 6 espécies, ponte, muros e alvenaria. Atualizar o JS apontando espécies diferentes para o Cascudo ou Raider criaria um mapeamento falso.
- A suíte original `node js/tests/run-tests.js` **FALHOU** em `js/tests/run-tests.js:501`, depois de **362 verificações aprovadas**, quando a existência física do primeiro caminho de visual Kenney foi exigida. Nenhum teste foi desabilitado ou enfraquecido para esconder a falta.
- Testes JS independentes de regras/mapas/encontros G10/G11/G12/G13/G15/G18B passaram; manifestos existentes não mudaram.

## Testes e validação visual

- A suíte `godot/tests/test_*.gd` foi rodada antes das alterações no checkpoint inicial. Na regressão após a integração, foi acrescentado `test_assets_g18c.gd` com **50 verificações**: PNGs, transparência, quatro orientações × quatro quadros, recurso SpriteFrames, pivô, cópia byte a byte de master/export, instalação no board e casa nas três células de MAP_01.
- `test_iso_board.gd` inicialmente apontou a antiga expectativa de escala uniforme; atualizei o teste para validar 0,11/base de casas e 0,5/base de props existentes, mantendo todas as verificações de células e z-order.
- **Export Web:** Godot 4.6.3 gerou WASM/PCK atualizado após adicionar a arte; `test_web_export_g07.py` confere estrutura e assinatura.
- **Chromium:** a regressão G18B foi repetida após reexportação e passou: ENC_05, Lança/Golpe e runtime sem erros de console/rede. Teste adicional captura ENC_01 com o novo Cascudo em 390×844 e também não encontrou erros de console/rede. Capturas reais estão em `reports/g18c/captures/`.
- A exploração foi capturada em 360×800, 390×844, 844×390 e 1280×720. As capturas foram inspecionadas tecnicamente; a grade/projeção e arte atual carregam. Ainda não há inspeção em aparelho físico nem aprovação artística do proprietário.
- A captura de MAP_01 foi feita no Chromium desktop após início do jogo. Posições e colisões vieram do mapa existente. O layout continua mostrando props temporários para muro e alvenaria; estes permanecem pendentes.

## Classificação final desta fatia

- **IMPLEMENTADO:** casa original de Caieira no GDScript de cenário; Cascudo original no board G10; masters/exports/metadata/contact sheets; captura Chromium multi-viewport.
- **TESTADO:** regressões G01–G18B mais 50 verificações novas de assets; fixtures JavaScript existentes; importação Godot e Web export; ENC_01 Cascudo no Chromium; ENC_05 G18B no Chromium.
- **VALIDADO:** nenhum erro de console/rede no fluxo Chromium verificado, arte presente no PCK, anchors/células/profundidade pelo teste. Não é aprovação artística humana.
- **PENDENTE:** a maior parte dos lotes A–F, integração JS dos recursos originais, walk/ataque/hurt/derrota Cascudo, demais espécies e variantes, NPCs, Sineira, Coruja-muda, revisão artística do proprietário.
- **FALHOU:** suíte JS original na referência Kenney ausente (`362` checks antes de falhar); uma expectativa antiga de escala única falhou inicialmente e foi corrigida com teste específico por asset; as regressões posteriores devem ser usadas como estado final.

## Próximo checkpoint recomendado

Continuar com um sprite individual de NPC (Mira), incluindo idle e contrato de pivô, e expandir os props de Caieira para muro/alvenaria. Antes de gerar demais criaturas, escrever e revisar propostas de silhuetas para que não virem simples recolorações. Manter a suíte legada marcada como bloqueada até haver arte específica para todos os IDs que ela exige ou uma migração fundamentada dos manifests e seus testes.
