# Relatório G09 — Web acessível, exploração e conversas

**Projeto:** Sotomar/Fímbria<br>
**Motor validado:** Godot 4.6.3<br>
**Base:** `main` em `1c48d2d` mais alterações locais não commitadas das missões anteriores<br>
**Entrega:** mesma cena jogável iniciada pela seleção de protagonista → `MAP_01`.

## Estado por critério

| Item | Estado | Evidência e limite |
|---|---|---|
| Build Web atualizada | **IMPLEMENTADO / TESTADO** | Exportação recriada em `build/web/`; 9 arquivos, 44.675.322 bytes (42,61 MiB). A validação exige HTML, JavaScript, WASM e PCK não vazios e rejeita arquivos-fonte de desenvolvimento. |
| HTTPS público | **PENDENTE** | Nenhuma hospedagem foi criada e nenhum deploy foi iniciado. Não existe URL pública validada. |
| Publicação gratuita preparada | **IMPLEMENTADO** | Workflow de GitHub Actions e configuração Firebase Hosting para servir somente `build/web/`. A publicação exige execução manual com `publish=true`, segredo de serviço e ID do projeto. |
| GitHub Pages | **AVALIADO** | Para manter o repositório privado sem contratar plano, Pages não é uma opção segura de assumir. A visibilidade da origem não pôde ser consultada pela API nesta sessão (resposta 403); não alterei a visibilidade. Firebase Hosting permite manter a origem privada. |
| Acesso local por Wi-Fi | **IMPLEMENTADO** | Instruções reproduzíveis em [ACESSO_WEB_G09.md](ACESSO_WEB_G09.md). Não testado em telefone físico. |
| Guerreiro e Wayfarer | **VALIDADO** | Ambos entram na mesma MAP_01 via Chromium; a seleção continua persistindo no armazenamento local do perfil. |
| Conversas com Mira, Lia, Nilo e Bram | **IMPLEMENTADO / TESTADO** | Toque/clique no marcador ou botão próximo; diálogo usa as saudações canônicas copiadas de `js/data/npcs.js`. Distância Manhattan de uma célula. |
| Estados de quest e serviços | **PENDENTE** | As falas canônicas de outros estados foram registradas, mas apenas a saudação está ativa. O sistema de quests, cura e comércio ainda não foi migrado; nenhuma escolha ou progressão foi inventada. |
| Acessibilidade básica | **TESTADO** | Botão de conversa e botão de diálogo têm alvo mínimo de 48 px lógicos; `E` abre a conversa, `Enter`/espaço avança ou fecha e `Escape` fecha. O Canvas do Godot não fornece nesta implementação semântica completa para leitor de tela. |
| Enquadramento mobile | **VALIDADO** | Chromium em 390×844 e 844×390; painel e ação de fechar cabem na tela. A paisagem segue preferível. A tela de diálogo ocupa parte do cenário enquanto está aberta. |
| Alinhamento do protagonista | **CORRIGIDO / TESTADO** | O pivô de arte é `(64,152)` em quadros 128×160. O offset do AnimatedSprite passou de `-76` para `-72` com escala `0,5`, zerando o erro vertical calculado de 2 px. |
| Expansão de Caieira | **PENDENTE** | Auditoria e proposta abaixo; nenhuma célula, casa, NPC, portal ou mapa foi alterado. |

## Publicação e caminho para jogar

A fonte JavaScript continua intacta nesta missão; a origem permanece sem commit ou push G09. O site ainda não está na Internet. A infraestrutura escolhida evita publicar o repositório e não exige plano pago no Firebase Hosting Spark. O deploy é uma ação externa e fica protegido por confirmação manual no workflow.

O proprietário precisa criar/habilitar um projeto Firebase Hosting, adicionar no repositório GitHub o secret `FIREBASE_SERVICE_ACCOUNT` e a variável `FIREBASE_PROJECT_ID`, enviar as alterações revisadas à branch `main` e iniciar **Actions → Godot Web build → Run workflow** com `publish` marcado. Nenhuma chave deve ser enviada nesta conversa. Só depois de execução bem-sucedida e teste HTTPS o domínio `*.web.app` poderá ser informado como disponível.

Sem publicação, o usuário pode gerar o mesmo build e acessar pelo celular na mesma rede Wi-Fi usando as instruções em [ACESSO_WEB_G09.md](ACESSO_WEB_G09.md). O servidor local é HTTP e não deve ser tratado como endereço público HTTPS.

O workflow `.github/workflows/godot-web.yml` usa Godot e templates 4.6.3 fixos e verifica SHA-512 dos downloads oficiais. Atualizações de `main` e pull requests apenas geram e validam o artefato. `workflow_dispatch` só publica quando o usuário marca a opção. O teste local cobriu a configuração e o conteúdo do artefato; o workflow hospedado no GitHub ainda não foi executado.

## Integração de NPCs

Os dados usados ficam em `godot/resources/npcs/npc_dialogues_g09.json`; o recurso registra `js/data/npcs.js` como origem e mantém o raio 1. MAP_01 conserva as posições canônicas: Mira `(1,1)`, Lia `(6,1)`, Nilo `(6,4)` e Bram `(1,6)`. Ao iniciar no spawn `(6,5)`, Nilo oferece a ação imediatamente.

- Toque/clique no marcador: abre conversa quando o protagonista está ao alcance; caso contrário, informa que deve se aproximar.
- Ação de interface “Conversar com …”: disponível para o NPC próximo e focável por teclado.
- `E`: abre a conversa do NPC mais próximo; `Enter`/espaço e botão avançam; `Escape` fecha.
- Movimento fica bloqueado durante a conversa. O texto original é apresentado sem opções novas.
- A seleção do protagonista continua sendo persistida por `CharacterRoster` em `user://`; isso é armazenamento local do navegador/perfil, sem sincronização entre dispositivos.

Os estados alternativos de Mira e Lia e as respostas de serviço de Nilo constam no JSON como referência, porém não são exibidos sem o estado de quests/serviços correspondente.

## Geometria e interface

O frame contract comum dos dois protagonistas é 128×160, pivô nos pés `(64,152)`, escala `0,5`. O centro de cada célula continua sendo a origem lógica do ator; a transformação visual não altera movimentação ou TileMap.

A inspeção Chromium identificou texto e controles novos pequenos demais no Web e painel de diálogo cortado. O layout passou a escalar texto/alvos com o fator da tela, separar a ação de fechar do texto e ancorá-la na margem inferior do painel. Os testes validam o retângulo do painel e da ação em 390×844, 844×390 e 1280×720. Capturas finais disponíveis:

- [MAP_01 desktop 1280×720](../reports/g09/chromium-desktop-1280x720-map01.png)
- [Diálogo desktop 1280×720](../reports/g09/chromium-desktop-1280x720-dialogue.png)
- [MAP_01 portrait 390×844 (Wayfarer)](../reports/g09/chromium-mobile-portrait-390x844-map01.png)
- [Diálogo portrait 390×844](../reports/g09/chromium-mobile-portrait-390x844-dialogue.png)
- [Diálogo landscape 844×390](../reports/g09/chromium-mobile-landscape-844x390-dialogue.png)
- [Portal de MAP_01 para MAP_02](../reports/g09/chromium-desktop-1280x720-map02-portal.png)
- [Retorno de MAP_02 a MAP_01](../reports/g09/chromium-desktop-1280x720-map01-return.png)
- [Portal Carroçal para MAP_04](../reports/g09/chromium-desktop-1280x720-carrocal-portal.png)
- [Zoom da câmera](../reports/g09/chromium-desktop-1280x720-camera-zoom.png)

Estas são capturas de Chromium com SwiftShader. Não comprovam renderização ou desempenho em aparelho físico nem aprovação artística final.

## Proposta espacial para Caieira

O mapa atual é 12×10, com três casas nas células `(4,2)`, `(10,3)` e `(2,9)`, quatro paredes/alvenaria, o spawn `(6,5)`, os quatro NPCs acima e duas saídas: MAP_02 em `(11,5)` na borda leste e Carroçal/MAP_04 em `(6,9)` na borda sul. As posições e caminhos vêm dos dados JavaScript; não há um desenho canônico para a área adicional.

**Proposta para uma missão posterior:** manter este mapa como núcleo de referência sem deslocar suas coordenadas; primeiro produzir uma planta de Caieira com setores, ruas conectadas, áreas de serviço para Nilo/Bram e rotas de entrada/saída. Só então aumentar o retângulo ou dividir a vila em submapas. Como as duas saídas atuais ocupam bordas, qualquer extensão que ultrapasse leste/sul exige decidir explicitamente onde ficam essas saídas e atualizar destino/retorno nos dados canônicos. Até haver planta e decisão sobre portais, um mapa maior teria risco de introduzir espaço vazio ou alterar topologia; por isso não foi implementado nesta missão.

## Suítes e execução

**TESTADO:** 19 comandos de validação passaram. Contagem consolidada: 156 verificações com marcador `PASS` e 17 testes Python (`unittest`) — 173 verificações no conjunto. Incluem regressões G01–G08, teste G09, validação do mapa, benchmark, sincronização de dados, importação Godot, inicialização da tela de seleção e MAP_01, exportação Web e validação de pacote.

**VALIDADO em Chromium:** HTTP 200 para a build local; canvas inicia nas viewports 1280×720, 390×844 e 844×390. Guerreiro e Wayfarer carregam; interação por `E`, zoom, MAP_01 ↔ MAP_02 e MAP_01 → MAP_04 foram exercitados. Console, erro de página e requisições falhas: zero. Isso é teste de navegador em desktop/emulação mobile, não teste em celular físico.

**FALHOU — JavaScript original:** `node js/tests/run-tests.js` ainda acumula 362 aprovações e interrompe em `js/tests/run-tests.js:501`, ao verificar referências de arte no manifesto V4. São os 11 assets Kenney já listados em [ASSETS_AUSENTES.md](ASSETS_AUSENTES.md). O restante da suíte não executa. G09 não alterou seus dados ou testes e não usou os assets Godot para mascarar a falha.

**PENDENTE:** deploy e validação de URL HTTPS, credenciais/projeto Firebase, teste em aparelhos Android/iOS físicos, leitor de tela, interação de estados/quests, serviços de cura/comércio e arte definitiva de NPCs/casas.

## Próximo passo

Configurar o projeto Firebase e as duas bindings do GitHub, enviar o conjunto revisado à branch de trabalho e executar o workflow de build. Depois, com autorização de publicação, rodar `publish=true`, testar a URL real em desktop e celular e entregar o endereço. Em paralelo, preparar a planta da expansão de Caieira sem migrar novos sistemas narrativos.
