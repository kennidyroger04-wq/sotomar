# Relatório G07 — exportação Web e entrada mobile

**Data:** 14/10/2026<br>
**Motor:** Godot 4.6.3.stable.official.7d41c59c4

## Resultado por estado

| Área | Estado | Evidência |
|---|---|---|
| Preset Web single-thread | **IMPLEMENTADO** | `godot/export_presets.cfg`; renderizador Compatibility/WebGL 2; threads e PWA desativados. |
| Exportação | **TESTADO** | Export real produziu `build/web/index.html`, `.js`, `.wasm`, `.pck` e arquivos de áudio do runtime. O diretório fica ignorado pelo Git. |
| Inicialização no navegador | **VALIDADO** | Chromium headless com WebGL/SwiftShader abriu a seleção e o mapa; sem erros de console na execução final. |
| Interface retrato/paisagem | **VALIDADO** | Chromium em viewports 390×844, 844×390, 960×640 e 1280×720; capturas abaixo. A mudança de orientação redimensionou o canvas sem recarregar a página. |
| Entrada touch | **TESTADO** | Toque selecionou a Wayfarer, abriu o mapa, destacou a célula e confirmou uma caminhada. Botões têm alvo mínimo de 48 unidades CSS nos viewports móveis simulados. |
| Mouse e teclado | **TESTADO** | Clique direito moveu o personagem e roda do mouse alterou o zoom no Chromium. Setas/Enter selecionaram e abriram o jogo. Os testes G01 de seleção e movimentação continuam passando. |
| Proteção contra clique duplicado | **TESTADO** | Mouse emulado está habilitado para que os botões Godot recebam toque; o controlador ignora o evento emulado depois de entrada no mapa. Teste G07 cobre essa guarda. |
| Persistência | **VALIDADO** | Escolher a Wayfarer, recarregar a página e abrir outra aba no mesmo contexto Chromium preservou o destaque da personagem. O navegador expôs a base Godot `/userfs` no IndexedDB. |
| Hospedagem externa | **PENDENTE** | Nenhum serviço foi publicado. Ver o procedimento HTTPS em [WEB_BUILD.md](../godot/WEB_BUILD.md). |
| Dispositivos móveis físicos | **PENDENTE** | Não havia Android ou iPhone físicos disponíveis. Chromium com viewport/touch emulados não substitui Chrome Android ou Safari iOS reais. |

**FALHOU:** nenhum teste automatizado ou de Chromium na execução final.

## Export e tamanho

O preset usa Godot Compatibility e WebGL 2, com exportação sem threads. A seleção continua salva em `user://character_selection.cfg`; no Web, Godot guarda `user://` no IndexedDB do navegador. A escolha pode desaparecer ao limpar os dados do site, usar modo privado ou aplicar políticas que bloqueiam armazenamento.

Build verificado em `build/web/`:

| Arquivo | Tamanho observado |
|---|---:|
| `index.wasm` | 37.700.666 bytes (aprox. 36 MiB) |
| `index.pck` | 6.547.560 bytes (aprox. 6,2 MiB) |
| Diretório inteiro | aprox. 43 MiB |

Em uma navegação local no Chromium do Cloud, a tela de seleção ficou pronta em cerca de **1,7 s**. A medição de recursos mostrou o WebAssembly baixado e o pacote PCK atendido do cache; este valor descreve apenas essa execução local e não é uma medição fria nem um resultado em celular. Memória real, FPS sustentado, custo de GPU, contagem de objetos `Resource` carregados e tempo de início em hardware Android/iOS permanecem **PENDENTES**. O protótipo Godot ainda não usa áudio de jogo; teste de áudio Web também fica pendente.

O pacote inclui os recursos referenciados pelos protagonistas e pelo protótipo, sem as fontes de arte, pranchas de revisão, testes e demos isolados excluídos pelo preset. Os cinco `TileMapLayer` usam o mesmo TileSet de seis materiais técnicos. Não há carregamento por região nesta missão. A seleção apresenta ambos os protagonistas animados, então seus recursos visuais são necessários logo na entrada. O log do export informa passos de empacotamento, que também incluem arquivos auxiliares; não os trato como contagem de recursos carregados pelo jogo.

## Regressões

As suítes G01–G06 foram executadas novamente sem alterar seus testes. O conjunto anterior registrava 83 verificações aprovadas. G07 acrescenta 15 verificações GDScript de layout, toque, zoom, conversão, bloqueios e proteção contra mouse emulado, além de três casos estruturais do pacote. Todas passaram.

Comandos executados na raiz do repositório:

```sh
godot --headless --editor --path godot --quit
godot --headless --path godot --script res://tests/test_iso_board.gd
godot --headless --path godot --script res://tests/test_art_pack_g03.gd
python3 godot/tests/test_art_pack_g04.py
godot --headless --path godot --script res://tests/test_combat_art_g05.gd
python3 godot/tests/test_art_pack_g05.py
godot --headless --path godot --script res://tests/test_characters_g06.gd
python3 godot/tests/test_art_pack_g06.py
godot --headless --path godot --script res://tests/test_web_mobile_g07.gd
godot --headless --path godot --export-release Web "$PWD/build/web/index.html"
python3 godot/tests/test_web_export_g07.py
```

Os scripts existentes G01–G06 foram preservados. O teste G07 verifica seleção móvel empilhada em retrato, cartões lado a lado em paisagem, entrada sem movimento acidental, confirmação, célula bloqueada, limites de zoom e conversão screen-to-cell após a transformação da câmera.

## Matriz de navegadores

| Navegador/ambiente | Resultado |
|---|---|
| Chromium desktop, Linux Cloud (SwiftShader) | **VALIDADO:** inicialização, seleção, persistência após refresh/aba, mouse, zoom e mapa. Viewports 960×640 e 1280×720. |
| Chromium com viewport mobile e touch emulados | **VALIDADO:** retrato 390×844, paisagem 844×390, seleção touch, movimento confirmado e rotação sem recarga. |
| Chrome em Android físico | **PENDENTE:** testar no aparelho e navegador reais. |
| Outros navegadores Chromium móveis | **PENDENTE:** validar no dispositivo alvo. |
| Safari em iPhone/iOS | **PENDENTE:** validar no iPhone real. |
| Firefox desktop | **PENDENTE:** não instalado neste ambiente. |
| Edge desktop | **PENDENTE:** não instalado neste ambiente. |

As capturas Chromium guardadas em `reports/g07/` são evidência de viewports emulados e renderização gráfica no Cloud, não aprovação visual em hardware móvel:

- [Seleção mobile em retrato, 390×844](../reports/g07/chromium-mobile-portrait-selection-390x844.png)
- [Mapa mobile em retrato, 390×844](../reports/g07/chromium-mobile-portrait-game-390x844.png)
- [Mapa mobile em paisagem, 844×390](../reports/g07/chromium-mobile-landscape-game-844x390.png)
- [Mapa desktop, 1280×720](../reports/g07/chromium-desktop-game-1280x720.png)
- [Mapa depois de selecionar uma célula por toque](../reports/g07/chromium-mobile-touch-selected.png)
- [Mapa depois de confirmar o movimento por toque](../reports/g07/chromium-mobile-after-touch-move.png)

## Limites e publicação

- O conteúdo funciona como site estático e usa Compatibility/WebGL 2. O preset não requer threads compartilhadas nem backend.
- A tela respeita margens internas; a página não usa `viewport-fit=cover`, então mantém o comportamento padrão do navegador para áreas seguras. Recortes/notches precisam de conferência em iPhone físico.
- O build estático soma aproximadamente 43 MiB. O `index.wasm` fica abaixo do limite de 100 MB por arquivo do GitHub Pages. O arquivo excede 25 MiB, limite de asset de Cloudflare Pages para upload estático direto; nessa opção será preciso configurar compressão/`Content-Encoding` ou reduzir o artefato.
- Não foi implementado PWA/offline nesta missão. Nenhum sistema JavaScript do jogo original foi alterado nesta missão. Alterações locais preexistentes em `css/menu-sotomar.css`, `js/data/audio-assets.js` e `js/tests/run-tests.js` foram preservadas sem edição.
- O código gerado em `build/web/` está ignorado em `.gitignore`; não foram feitos commits nem publicação externa.

## Abrir e testar em um celular

Instale os templates Web do Godot 4.6.3 no computador, execute o comando de exportação acima e rode:

```sh
python3 tools/serve_web.py --host 0.0.0.0 --port 8000
```

Com o celular e o computador na mesma rede Wi-Fi, abra `http://IP_DO_COMPUTADOR:8000/` no navegador do aparelho. Isso é um ensaio local por HTTP. Para a distribuição pretendida, copie o conteúdo de `build/web/` para uma raiz estática HTTPS, por exemplo uma branch dedicada do GitHub Pages. A publicação ainda depende de escolha/autorização do responsável pelo repositório.

Consulte [godot/WEB_BUILD.md](../godot/WEB_BUILD.md) para requisitos, comandos PowerShell, execução local e hospedagem.
