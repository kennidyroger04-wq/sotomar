# Progresso visual do Arco 1 — G18D

Atualizado em 2026-10-15. Ver também `PROGRESSO_ARCO_1.md` para a matriz geral.

| Lote/categoria | Estado | Evidência e pendências |
|---|---|---|
| Engenharia reversa G06 | **IMPLEMENTADO / VALIDADO TECNICAMENTE** | Sete masters de ação 4×4; Pillow recorta/redimensiona/alinha; GDScript constrói SpriteFrames. Não há evidência de rig ou desenho procedural. Método de desenho original dos masters não está descrito. |
| Fábrica JSON/Pillow | **IMPLEMENTADO / TESTADO** | `godot/tools/sprite_factory/`; recebe fonte JSON, seleciona módulo anatômico e exporta quadros, masters, atlases, SpriteFrames, metadata, contact sheets, GIFs e relatório. |
| Cascudo-de-cal | **IMPLEMENTADO / INTEGRADO** | Cinco ações, quatro orientações, 80 quadros; G18C idle segue preservado. Integrado no board G10 e variantes usam a espécie-base. |
| Papa-mel | **IMPLEMENTADO / INTEGRADO** | Quadrúpede forrageador — proposta, pois cânone não descreve anatomia; 80 quadros e cinco ações. |
| Topetão | **IMPLEMENTADO / INTEGRADO** | Quadrúpede com crista — proposta baseada no nome; 80 quadros e cinco ações. |
| Fiandeira | **IMPLEMENTADO / INTEGRADO** | Módulo aracnídeo próprio; não pressupõe teia; 80 quadros e cinco ações. |
| Sapo-de-poça | **IMPLEMENTADO / INTEGRADO** | Módulo anfíbio; 80 quadros e cinco ações. |
| Lerdo-de-musgo | **IMPLEMENTADO / INTEGRADO** | Gastrópode com concha/musgo é proposta; 80 quadros e cinco ações. |
| Farejador-de-brejo | **IMPLEMENTADO / INTEGRADO** | Quadrúpede esguio — proposta; 80 quadros e cinco ações. |
| SpriteFrames e pivôs | **TESTADO** | 1.046 verificações GDScript; 140 animações de criatura + 24 NPC, 656 regiões e integração dos sete IDs no board. Teste Python confirma 656 quadros únicos. |
| Variantes/exposições | **IMPLEMENTADO / TESTADO** | IDs variantes usam arte-base sem recoloração; regras de estados não foram alteradas. FX de exposição próprios pendem. |
| NPC Mira | **IMPLEMENTADO PARCIALMENTE** | Asset G18C preservado e integrado como idle direcional; falas e marker preservados. |
| Lia, Nilo e Bram | **IMPLEMENTADO / INTEGRADO** | Idle/walk direcional original no marker MAP_01; as três aparências são propostas, pois a fonte não as descreve. Falas, células e serviços mantidos. |
| Cenários e construções | **PARCIAL** | Casa Caieira G18C, árvores/rochas/tiles anteriores permanecem; muros, ponte, ruínas, estruturas e props de missão pendem. |
| Equipamentos | **PARCIAL** | Espada/escudo G05/G06 preservados; integração com equipamento G14 ainda limitada. Não inventar arte de itens sem definição. |
| FX de habilidades | **PARCIAL/PENDENTE** | FX genéricos G05/G18B preservados; kit visual específico das cinco habilidades não concluído nesta fatia. |
| Sineira e Coruja-muda | **PENDENTE** | Sem produção G18D; cânone/deferimento preservados, nenhum encontro novo criado. |
| Kenney visual no JavaScript | **PENDENTE** | Manifests legados não alterados; ausência de arquivos/ licenças continua documentada em `MATRIZ_MIGRACAO_KENNEY.md`. |
| Aprovação artística humana | **PENDENTE** | Contact sheets e GIFs são materiais de revisão; nenhuma aprovação do proprietário foi feita. |
