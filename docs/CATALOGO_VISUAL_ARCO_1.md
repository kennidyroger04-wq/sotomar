# Catálogo visual do Arco 1 — G18D

Atualizado em 2026-10-15. Inclui o lote de sprites G18D. Este catálogo separa o que a fonte documenta das propostas visuais. «Aprovado pelo proprietário» só é marcado após revisão explícita dele.

## Cânone e proposta

| Elemento | Descrição canônica documentada | Interpretação visual proposta (não canônica) | Produzido | Integrado | Aprovação do proprietário |
|---|---|---|---|---|---|
| Regiões Alto Seco, Fímbria e Baixio | Nomes e relação regional aparecem no briefing/dados do mundo. Sereno intensifica características naturais. | Paletas ambientais separadas, com exposição ao Sereno indicada por materiais e luz local, sem alterar biomas por recoloração global. | Não | Parcial, via tiles G03 | Pendente |
| MAP_01 Caieira | Assentamento; o registry lista casas, muros, estrutura, árvores e rochas em células específicas. Arquitetura não descrita. | Casa de alvenaria clara, vigas de madeira escura e telha ocre; interpretação da equipe. | Casa original G18C | Integrada nos três IDs `VIS_HOUSE_SMALL`, em suas células e profundidades já existentes | Pendente |
| MAP_02 Terraços das Roças | Nome e mapa/células do runtime. | Reutilizar variações de solo e cultivo após levantamento visual canônico; sem produção nesta fatia. | Não | Tiles G03 existentes | Pendente |
| MAP_03 Colmeal Velho | Nome; sem conexão canônica definida. | Paleta de terreno seco e estruturas rurais só após especificação de localidade. | Não | Tiles G03 existentes; acesso continua sem inventar saída | Pendente |
| MAP_04 Trilha do Lenhador | Nome e mapa/props runtime. | Vegetação de trilha e madeira, baseada em silhuetas e materiais originais. | Árvores/rochas G03 anteriores | Parcial | Pendente |
| MAP_05 Marco-Prumo | Nome e ligação canônica registrada. | Construção/ponte específica a definir a partir da fonte narrativa. | Não | Tiles G03 existentes | Pendente |
| MAP_06 Ponte Quebrada | Nome; conexão e bloqueios registrados. | Ponte de madeira ou pedra ainda não decidida sem referência canônica adicional. | Não | Tiles G03 existentes | Pendente |
| MAP_07 Descida das Raízes | Nome e rota registrada. | Vegetação em camadas e raízes como composição, não como nova colisão. | Não | Tiles G03 existentes | Pendente |
| MAP_08 Acampamento de Aurelo | Nome e rota registrada. | Acampamento modular e reutilizável; conteúdo de tendas/objetos requer confirmação documental. | Não | Tiles G03 existentes | Pendente |
| MAP_09 Pedras Brancas | Nome; encontro da Coruja-muda está deferido, acesso sem saída canônica. | Afloramentos de pedra clara e fauna silenciosa; posicionamento não definido. | Não | Tiles G03 existentes | Pendente |
| MAP_10 Boca do Grotão | Nome e rota registrada. | Transição para pedra/caverna com exposição ao Sereno sem presumir causa do fenômeno. | Não | Tiles G03 existentes | Pendente |
| MAP_11 Arena da Sineira | Elementos canônicos: selo central, cravas, colunas, canais de Sereno, cal antiga e plataformas laterais; coordenadas TBD. | Cenário vivo e não maligno; ancoragem/movimentação da Sineira continua aberta. | Não | Não; cena continua provisória | Pendente |
| NPC Mira | Guarda da Estrada, papel de quest e falas canônicas existentes. Aparência não descrita. | Guarda de estrada amigável, roupa de viagem verde-azulada/ocre, broquel de madeira e broche. Interpretação visual. | Sim, idle direcional 4×4 | Sim, marker MAP_01, sem alterar diálogo/célula | Pendente |
| NPC Lia | Exploradora, fala de trilhas existente. Aparência não descrita. | Humanoide de viagem com capuz curto, bolsa e mapa; proposta visual. | G18D: idle/walk, 4 direções × 4 quadros | Integrada ao marker MAP_01 existente; interação e célula preservadas | Pendente |
| NPC Nilo | Curandeiro, falas de serviço canônicas. Aparência não descrita. | Humanoide com faixa e bolsa de ervas; proposta, sem novo serviço/item. | G18D: idle/walk, 4 direções × 4 quadros | Integrado ao marker MAP_01; cura/diálogo preservados | Pendente |
| NPC Bram | Comerciante; a fala atual diz que ainda não negocia. Aparência não descrita. | Humanoide com avental e embrulho de viagem; proposta sem sinal de loja/comércio ativo. | G18D: idle/walk, 4 direções × 4 quadros | Integrado ao marker MAP_01; fala e ausência de comércio preservadas | Pendente |
| Cascudo-de-cal | Cânone define nome, variantes NORMAL/ENCHARCADO e perfil `melee`; não define anatomia. | Besouro pequeno, robusto, com carapaça calcária clara segmentada, marcas ocre e antenas curiosas; proposta G18D baseada no motivo anterior G18C. | G18C idle + G18D 5 ações × 4 orientações × 4 quadros | **Sim**, SpriteFrames no board G10; estados usam arte-base | Pendente |
| Papa-mel | Nome, variantes NORMAL/ORVALHADO e perfil `melee`; anatomia não descrita. | Quadrúpede baixo com focinho largo e tufos ocres; forrageio é apenas leitura visual, não dieta canônica. | G18D: 5 ações × 4 orientações × 4 quadros | **Sim**, SpriteFrames no board G10 | Pendente |
| Topetão | Nome, variantes NORMAL/MAREJADO e perfil `melee`; anatomia não descrita. | Quadrúpede compacto com crista erguida; interpretação do nome, não cânone adicional. | G18D: 5 ações × 4 orientações × 4 quadros | **Sim**, SpriteFrames no board G10 | Pendente |
| Fiandeira | Nome, variantes NORMAL/MAREJADO/ENCHARCADO e perfil `ranged_control`; descrição física não definida. | Aracnídeo de oito patas com apêndices táteis; não presume teias nem acrescenta mecânica. | G18D: 5 ações × 4 orientações × 4 quadros | **Sim**, SpriteFrames no board G10; IA/combate G18B | Pendente |
| Sapo-de-poça | Nome, variante MAREJADO e perfil `control`; anatomia não detalhada além do nome. | Anfíbio baixo de membros posteriores largos, proposta visual. | G18D: 5 ações × 4 orientações × 4 quadros | **Sim**, SpriteFrames no board G10 | Pendente |
| Lerdo-de-musgo | Nome, variantes MAREJADO/ENCHARCADO e perfil `support`; anatomia não descrita. | Gastrópode grande com concha em camadas e musgo; a família é interpretação visual. | G18D: 5 ações × 4 orientações × 4 quadros | **Sim**, SpriteFrames no board G10 | Pendente |
| Farejador-de-brejo | Nome, variante MAREJADO e perfil `pack`; anatomia não descrita. | Quadrúpede esguio, focinho baixo e orelhas largas; sem acrescentar mecânica de matilha. | G18D: 5 ações × 4 orientações × 4 quadros | **Sim**, SpriteFrames no board G10 | Pendente |
| Coruja-muda | Ser especial deferido; encontro em MAP_09 mencionado, sem condição narrativa/comportamento de combate completo. | Ave de silhueta silenciosa e expressão não antropomorfizada, sujeito ao contrato futuro. | Não | Sem integração | Pendente |
| Sineira | Cágado-de-sino vivo, grande, casco calcificado em forma de sino, musgo luminoso, veios pálidos; não maligna; fases guardiã/alvoroço/alívio. | Textura, proporções e sinais de estado precisam de turnarounds antes do rig. | Não | Contrato de jogo ainda deferido; sem morte obrigatória | Pendente |
| Habilidades G18B | Golpe, Avanço, Cruz, Lança e Postura têm custo/efeitos definidos em JS e G18B. | FX genéricos de combate originais, com cor/forma alinhadas ao elemento e sem influir no cálculo. | FX base G05 anteriores | Efeitos G18B no overlay; não há cinco kits ilustrados únicos G18C | Pendente |
| Equipamentos | Itens e equipamentos vêm do catálogo; aparência específica não documentada para a maior parte. | Espada/escudo ilustrados existentes; não inventar visuais dos itens ainda indefinidos. | G05/G06 | Camadas visuais de protagonistas existentes; avatar de inventário ainda limitado | Pendente |

## Assets G18C e G18D

| ID | Arquivos | Dimensão/origem | Pivô/uso | Estado |
|---|---|---|---|---|
| `NPC_MIRA` | `godot/art/source/generated_g18c/mira_idle_master.png`, `godot/assets/characters/npc_mira_g18c/mira_idle.png`, `godot/resources/animations/mira_g18c.tres`, `godot/resources/art/mira_g18c.json` | PNG RGBA 1122×1402, prancha 4×4 (regiões 280×350) | Base inferior central por região; escala de mundo 0,22; 4 orientações idle | Integrado ao marker canônico de MAP_01; Lia/Nilo/Bram agora têm sprites próprios G18D |
| `VIS_HOUSE_SMALL` — interpretação Caieira | `godot/art/source/generated_g18c/caieira_lime_cottage_master.png`, `godot/assets/props/g18c/caieira_lime_cottage.png`, `godot/resources/art/cottage_caieira_g18c.json` | PNG RGBA 1327×1200 | Base central inferior; escala 0,11; respeita a célula atual | Integrado às 3 casas de MAP_01; revisão visual humana pendente |


| Set G18D — criaturas e NPCs | `godot/art/source/sprite_factory/specs/`, `godot/art/source/sprite_factory/creatures/`, `godot/assets/characters/cre_*_g18d/`, `godot/resources/animations/cre_*_g18d.tres`, `godot/resources/art/cre_*_g18d.json` | PNGs RGBA 192×224; atlas 768×896 por ação de criatura; NPC atlas 768×448 com idle/walk | Pivô (96,214); escala de criatura 0,5/NPC 0,36; IDs de variante mantêm arte-base | Criaturas integradas ao combate G10 e Lia/Nilo/Bram aos markers MAP_01; revisão artística pendente |

Os masters G18C e suas cópias runtime foram conferidos como cópias byte a byte; foram gerados com ImageGen sem referência externa. Os PNGs G18D são rasterizações originais locais de especificações JSON/Pillow, sem arte de terceiros nem recursos oficiais de Dofus.

Os masters G18C são PNGs raster sem camadas; os briefs estão em `godot/art/source/generated_g18c/prompts.md`. As fontes G18D são JSON estruturados e código do renderizador, com PNGs por quadro editáveis como saídas regeneráveis. Nenhum dos assets foi aprovado como arte final.

## Contact sheets e capturas

- Prancha original de orientações idle do Cascudo: `reports/g18c/contact-sheets/cascudo_de_cal_4_directions_idle.png`.
- Prancha original de orientações idle da Mira: `reports/g18c/contact-sheets/mira_4_directions_idle.png`.
- Comparação das casas/props atuais: `godot/reviews/g18c/contact-sheet-props-existing.png`.
- `godot/reviews/g18c/contact-sheet-terrain-existing.png` registra amostra de tiles existentes G03.
- `godot/reviews/g18c/contact-sheet-equipment-existing.png` e `godot/reviews/g18c/contact-sheet-character-sample.png` são pranchas de revisão de recursos já existentes, não novos assets.
- Pranchas de revisão das criaturas e NPCs G18D estão em `reports/g18d/contact-sheets/`; GIFs em `reports/g18d/gifs/`. Construções adicionais, Coruja-muda, Sineira, cinco folhas de efeito únicas e novos itens ainda não têm contact sheet de produção.
- Capturas Web em Chromium estão em `reports/g18d/captures/`: ENC_05 durante combate e MAP_01 com os quatro NPCs, em 360×800, 390×844, 844×390 e 1280×720. Captura não equivale a teste físico nem aprovação artística.
