# Catálogo visual do Arco 1 — G18C

Atualizado em 2026-10-15. Este catálogo separa o que a fonte documenta das decisões artísticas propostas. «Aprovado pelo proprietário» só é marcado após revisão explícita dele.

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
| NPC Mira | Guarda da Estrada, papel de quest e falas canônicas existentes. Aparência não descrita. | Silhueta de guarda com equipamento de estrada simples. | Não | Placeholder atual | Pendente |
| NPC Lia | Exploradora, fala de trilhas existente. Aparência não descrita. | Silhueta leve de exploradora com bolsa/mapa. | Não | Placeholder atual | Pendente |
| NPC Nilo | Curandeiro, falas de serviço canônicas. Aparência não descrita. | Ervas/estojo de curandeiro, sem definir uniforme ou idade. | Não | Placeholder atual | Pendente |
| NPC Bram | Comerciante; a fala atual diz que ainda não negocia. Aparência não descrita. | Silhueta de comerciante de estrada; sem ícones de transação até existir serviço ativo. | Não | Placeholder atual | Pendente |
| Cascudo-de-cal | Cânone define nome, variantes NORMAL/ENCHARCADO e perfil `melee`; não define anatomia. | Carapaça clara calcária segmentada, marcas ocre e antenas curiosas. | **Sim**, prancha idle G18C | **Sim**, criatura em ENC_01 no tabuleiro G10; só idle/direções | Pendente |
| Papa-mel | Nome, variantes NORMAL/ORVALHADO e perfil `melee`; anatomia não descrita. | Proposta futura: corpo baixo e focinho curioso que sugere forrageio, sem atribuir dieta como fato canônico. | Não | Placeholder procedimental | Pendente |
| Topetão | Nome, variantes NORMAL/MAREJADO e perfil `melee`; anatomia não descrita. | Proposta futura: crista volumosa e silhueta alta, derivada apenas do nome. | Não | Placeholder procedimental | Pendente |
| Fiandeira | Nome, variantes NORMAL/MAREJADO/ENCHARCADO e perfil `ranged_control`; descrição física não definida. | Proposta futura: apêndices que evocam fios, sem usar teias ou controlar o comportamento além das regras. | Não | Placeholder procedimental; IA/combate funcional G18B | Pendente |
| Sapo-de-poça | Nome, variante MAREJADO e perfil `control`; anatomia não definida além do nome. | Proposta futura: silhueta anfíbia com membros largos e leitura de controle por postura. | Não | Placeholder procedimental | Pendente |
| Lerdo-de-musgo | Nome, variantes MAREJADO/ENCHARCADO e perfil `support`; anatomia não definida. | Proposta futura: volume lento coberto por musgo, sem recoloração para representar estados. | Não | Placeholder procedimental | Pendente |
| Farejador-de-brejo | Nome, variante MAREJADO e perfil `pack`; anatomia não definida. | Proposta futura: perfil baixo e focinho de busca, sem criar sistema de matilha novo. | Não | Placeholder procedimental | Pendente |
| Coruja-muda | Ser especial deferido; encontro em MAP_09 mencionado, sem condição narrativa/comportamento de combate completo. | Ave de silhueta silenciosa e expressão não antropomorfizada, sujeito ao contrato futuro. | Não | Sem integração | Pendente |
| Sineira | Cágado-de-sino vivo, grande, casco calcificado em forma de sino, musgo luminoso, veios pálidos; não maligna; fases guardiã/alvoroço/alívio. | Textura, proporções e sinais de estado precisam de turnarounds antes do rig. | Não | Contrato de jogo ainda deferido; sem morte obrigatória | Pendente |
| Habilidades G18B | Golpe, Avanço, Cruz, Lança e Postura têm custo/efeitos definidos em JS e G18B. | FX genéricos de combate originais, com cor/forma alinhadas ao elemento e sem influir no cálculo. | FX base G05 anteriores | Efeitos G18B no overlay; não há cinco kits ilustrados únicos G18C | Pendente |
| Equipamentos | Itens e equipamentos vêm do catálogo; aparência específica não documentada para a maior parte. | Espada/escudo ilustrados existentes; não inventar visuais dos itens ainda indefinidos. | G05/G06 | Camadas visuais de protagonistas existentes; avatar de inventário ainda limitado | Pendente |

## Assets produzidos nesta fatia G18C

| ID | Arquivos | Dimensão/origem | Pivô/uso | Estado |
|---|---|---|---|---|
| `CRE_CASCUDO_DE_CAL` | `godot/art/source/generated_g18c/cascudo_de_cal_idle_master.png`, `godot/assets/characters/cascudo_g18c/cascudo_de_cal_idle.png`, `godot/resources/animations/cascudo_de_cal_g18c.tres`, metadados `.json` | PNG RGBA 1122×1402, prancha 4×4 (regiões 280×350) | Base inferior central por região; escala de render 0,36; 4 orientações idle | Integrado e testado; movimento/ataque/hurt/resolução pendentes |
| `VIS_HOUSE_SMALL` — interpretação Caieira | `godot/art/source/generated_g18c/caieira_lime_cottage_master.png`, `godot/assets/props/g18c/caieira_lime_cottage.png`, `godot/resources/art/cottage_caieira_g18c.json` | PNG RGBA 1327×1200 | Base central inferior; escala 0,11; respeita a célula atual | Integrado às 3 casas de MAP_01; revisão visual humana pendente |

Masters e cópias runtime foram conferidos como cópias byte a byte. As imagens vêm de geração original com ImageGen, sem imagem de referência, sem arte oficial de Dofus e sem pacote de terceiros.

## Contact sheets e capturas

- Prancha original de orientações idle do Cascudo: `reports/g18c/contact-sheets/cascudo_de_cal_4_directions_idle.png`.
- Comparação das casas/props atuais: `godot/reviews/g18c/contact-sheet-props-existing.png`.
- `godot/reviews/g18c/contact-sheet-terrain-existing.png` registra amostra de tiles existentes G03.
- `godot/reviews/g18c/contact-sheet-equipment-existing.png` e `godot/reviews/g18c/contact-sheet-character-sample.png` são pranchas de revisão de recursos já existentes, não novos assets.
- Construções adicionais, NPCs, seis criaturas comuns, Coruja-muda, Sineira, cinco folhas de efeito únicas e novos itens ainda não têm contact sheet de produção.
- Capturas reais do export Web (Chromium) estão em `reports/g18c/captures/`, incluindo quatro resoluções da exploração e `combat-cascudo-de-cal-390x844.png`. A evidência técnica não equivale à aprovação artística do proprietário.
