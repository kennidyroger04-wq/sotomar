# Relatório G18D — fábrica de sprites e produção artística procedural

## Estado e segurança

- Origem confirmada: `operation/g18c-art` em `e82f371da4917ab4f9f0736dba32fbbab9a9bdba`; remoto `origin/operation/g18c-art` apontava para o mesmo SHA após `fetch --prune`.
- Branch criada e enviada sem merge: `operation/g18d-sprite-factory`.
- Checkpoint remoto: tag `checkpoint-g18d-start-20261015`, no SHA inicial da G18C.
- Nenhuma branch anterior foi reescrita, nenhum conteúdo G18C foi removido e nenhuma publicação externa foi feita.
- Godot local: 4.6.3 stable.

## Engenharia reversa da G06

O guerreiro masculino usa sete masters PNG (`male_warrior_{idle,walk,attack,hurt,defend,cast,death}_master.png`), cada um com 4 orientações × 4 poses, mais um master de equipamentos. As pranchas de ação medem 1122×1402; a de equipamento, 1586×992. `godot/tools/build_character_art_g06.py` abre cada master, recorta a grade 4×4, redimensiona com Lanczos para células de 128×160, alinha o último pixel opaco ao baseline y=152 e grava atlas por ação. O mesmo script separa espada e escudo. `build_character_resources_g06.gd` cria 28 animações direcionais, cada uma com quatro regiões AtlasTexture, e registra os recursos SpriteFrames.

| Pergunta | Evidência e conclusão |
|---|---|
| Como foram produzidos os 112 quadros? | Sete pranchas-fonte × 16 células; 7 × 4 orientações × 4 poses = 112 quadros. O script Python apenas recorta, redimensiona e alinha. |
| Etapas automatizadas | Conversão de atlas, normalização RGBA/tamanho, alinhamento de pés, geração das folhas de equipamento, metadados, SpriteFrames e verificações Pillow/GDScript. |
| Desenho individual | Os desenhos já estão completos nas pranchas master. O repositório não documenta a ferramenta nem a divisão entre pintura manual e assistência de ferramenta. Não há evidência de rig, articulações ou geração procedural de poses na G06. |
| Custo computacional | Rodei `build_character_art_g06.py` neste checkout: 3 s no ambiente atual, com checksums de saída idênticos antes/depois. O custo dominante foi produzir/revisar as pranchas, não recortar os 112 quadros. |
| Gargalos | Mudança em pose exige editar a prancha inteira; limites de células e baseline são dependências manuais; anatomia e consistência entre as quatro direções não são reaproveitadas como rig; o teste de pixels distintos não prova movimento artístico coerente. |
| Reuso da mesma metodologia | O adaptador de atlas serve a outras espécies se já houver pranchas completas. Não cria anatomias novas. G18D separa esse problema em especificações estruturadas e renderizadores anatômicos independentes. |
| Escala com qualidade | Manter fontes por espécie, anatomia/família explícita, pivô, comparação visual, validação automática, revisão humana e integração por lote. Não aumentar a quantidade usando recoloração de um único corpo. |

Os sete masters da G06 foram conferidos por `godot/tests/test_art_pack_g06.py`: 112 células visíveis, quatro quadros diferentes por orientação/ação e baseline comum. Essas verificações confirmam a estrutura, não a origem do desenho nem a qualidade do movimento.

## Lote entregue — criaturas comuns

Foi criada uma fábrica Python/Pillow determinística, dirigida por dez JSON editáveis em `godot/art/source/sprite_factory/specs/`. Ela gera sete módulos anatômicos de criaturas (besouro segmentado, quadrúpede forrageador, quadrúpede de crista, aracnídeo, anfíbio, gastrópode e farejador quadrúpede) e um humanoide para NPCs. As criaturas têm cinco ações × quatro orientações × quatro quadros; cada NPC tem idle/walk com o mesmo contrato direcional. O pacote contém 560 quadros de criaturas e 96 de NPCs, total de 656 quadros visíveis e únicos; não há duplicatas, quadros transparentes nem alertas de pivô. Foram geradas dez pranchas de contato, 27 GIFs, 656 PNGs por quadro, 41 masters de atlas e 41 atlases runtime. A execução medida do conjunto levou 47,4 s; os atlases runtime somam 4.949.357 bytes. A quantidade não é medida de qualidade artística.

As sete criaturas foram integradas ao board de combate G10 por seus IDs canônicos; IDs de exposição resolvem para a arte da espécie base, sem criar espécies ou mudar estados/regras. Os ataques e reações usam o controlador G18B e animações visuais; a aplicação de dano, alcance, IA e turnos não foi alterada. Lia, Nilo e Bram receberam idle/walk próprios no mesmo marker MAP_01, preservando falas, interações, posições e serviços existentes.

### Limite canônico e artístico

Para Papa-mel, Topetão, Fiandeira, Sapo-de-poça, Lerdo-de-musgo e Farejador-de-brejo, a fonte descreve nome, perfil e exposições, mas não fornece anatomia visual. As formas listadas em `godot/resources/art/*_g18d.json` são **propostas visuais**. O Cascudo mantém a proposta de carapaça clara de G18C como referência, com nova prancha animada. A inspeção técnica confirma legibilidade de silhuetas e separação de famílias. O estilo ainda é arte procedural simplificada; não é aprovação artística humana nem arte final.

| Categoria | Resultado |
|---|---|
| Fábrica e especificações JSON | **IMPLEMENTADO / TESTADO** |
| Set de sete criaturas comuns | **IMPLEMENTADO / INTEGRADO** no combate G10/G18B |
| 656 quadros, atlases, SpriteFrames, 10 contact sheets e 27 GIFs | **TESTADO** tecnicamente |
| Módulos reutilizáveis | **IMPLEMENTADO** — 7 anatômicos para criatura e 1 humanoide |
| Regressão de lógica de combate | **TESTADO** na suíte automatizada após integração |
| NPCs Lia/Nilo/Bram | **IMPLEMENTADO / INTEGRADO** como proposta visual idle/walk; aparência não canônica |
| Novos cenários, equipamentos, efeitos próprios e especiais | **PENDENTE**; assets herdados G03/G06/G18C preservados |
| Migração Kenney no JavaScript legado | **PENDENTE**; o catálogo não foi alterado nesta etapa |
| Inspeção Chromium | **TESTADO** no fluxo ENC_05 em quatro viewports, com captura durante combate; sem dispositivo físico |
| Aprovação artística do proprietário | **PENDENTE** |

## Testes específicos

- `python3 godot/tests/test_sprite_factory_g18d.py` — metadados, 656 quadros únicos, alpha, pivôs, dimensões 192×224, sete silhuetas de criaturas distintas, cinco ações de criatura, dez fontes JSON e integração ao board/mapa.
- `godot --headless --path godot --script res://tests/test_sprite_factory_g18d.gd` — 1.046 verificações: criaturas com 140 animações direcionais (5 ações × 4 direções × 7 espécies), NPCs com 24 animações (2 × 4 × 3), quatro frames/região, flags de loop, integração dos sete participantes, pivô/profundidade, variantes e markers/células NPC.
- `godot/tests/test_assets_g18c.gd` — os 83 checks G18C continuam cobrindo os masters anteriores; o participante Cascudo agora confirma o SpriteFrames G18D no board.
- Regressões automatizadas: 18 testes GDScript, 6 Python e 7 JS auxiliares passaram, incluindo G01–G18C. A suíte JS original parou em `js/tests/run-tests.js:501`; a linha de progresso anterior registra 362 aprovações devido aos PNGs de Kenney ausentes, conforme `ASSETS_AUSENTES.md`.
- Godot 4.6.3 importou o projeto; export Web atual: 9 arquivos, 53.962.639 bytes (51,46 MiB), com WASM/PCK validados por `tools/validate_g09_web_export.py`.
- Chromium emulado carregou ENC_05 Topetão, recebeu Lança e Golpe, além de MAP_01 com quatro NPCs, nas vistas 360×800, 390×844, 844×390 e 1280×720, sem erro de console/rede. Capturas em `reports/g18d/captures/`; não é teste físico.

## Estado geral

**IMPLEMENTADO:** fábrica inicial reutilizável, pacote das sete criaturas integrado ao combate existente e propostas idle/walk para Lia, Nilo e Bram nos markers já existentes.

**VALIDADO TECNICAMENTE:** IDs, atlas, importação, frames, pivôs, transparência, animações direcionais e renderização no board (headless).

**PENDENTE:** acabamento artístico/revisão humana; lotes de cenários/efeitos/equipamentos adicionais; Sineira e Coruja-muda; substituição visual Kenney do JavaScript; aprovação do proprietário e tarefas A–F não concluídas.

Não declarar G18D integralmente concluída até os lotes pendentes serem resolvidos ou explicitamente separados em checkpoint posterior.
