# Auditoria de assets e caminhos

Referência atualizada em 2026-10-14: branch `main`, commit local/remoto `1c48d2d00f23fa6985f59cc9bf30ec248a580cc2`. `git ls-remote --heads origin` anuncia apenas `main`; `git fetch origin --prune` não trouxe commit novo. A árvore versionada contém zero caminhos `assets/`, e não foi encontrado ZIP em `/workspace` ou `/tmp`. “Ausente confirmado” significa que o caminho declarado não existe no checkout; não prova ausência na origem.

## Ausentes confirmados no checkout

### Tiles de ambiente — 11 imagens

`js/data/visual-assets.js` declara estes recursos em `assets/vendor/kenney/`:

- `sketch-town/Tiles/grass_center_E.png`
- `sketch-town/Tiles/dirt_center_E.png`
- `sketch-town/Tiles/grass_path_E.png`
- `sketch-town/Tiles/water_center_E.png`
- `sketch-town/Tiles/tree_single_E.png`
- `sketch-town/Tiles/rocks_grass_E.png`
- `sketch-town/Tiles/building_centerBeige_E.png`
- `sketch-town/Tiles/bridge_E.png`
- `sketch-town/Tiles/castle_wall_E.png`
- `isometric-landscape/PNG/landscapeTiles_043.png`
- `isometric-buildings/PNG/buildingTiles_032.png`

As nove primeiras usam o prefixo `assets/vendor/kenney/`; as duas últimas usam os prefixos dos respectivos pacotes apresentados acima.

### Sprites de personagem e criaturas — 9 imagens

`js/data/character-assets.js` declara, sob `assets/vendor/kenney/tiny-dungeon/Tiles/`:

`tile_0087.png`, `tile_0084.png`, `tile_0099.png`, `tile_0088.png`, `tile_0100.png`, `tile_0108.png`, `tile_0110.png`, `tile_0120.png` e `tile_0123.png`.

### Licenças de pacotes — 4 arquivos

- `assets/vendor/kenney/sketch-town/License.txt`
- `assets/vendor/kenney/isometric-landscape/License.txt`
- `assets/vendor/kenney/isometric-buildings/License.txt`
- `assets/vendor/kenney/tiny-dungeon/License.txt`

As quatro ausências foram confirmadas por `exists()` nos caminhos declarados. Não baixei pacotes de terceiros nem substituí imagens ou licenças.

**Recuperação: PENDENTE.** Nenhum dos 24 arquivos foi recuperado neste ambiente. A lista exata acima (20 PNG e 4 licenças) é o conjunto mínimo comprovado pelas referências atuais; não é garantido que represente os 655 itens `assets/` informados sobre o ZIP. Envie ou monte o ZIP original e execute primeiro `python3 tools/restore_assets.py /caminho/para/original.zip` (simulação). Após revisar a listagem e os conflitos, `python3 tools/restore_assets.py /caminho/para/original.zip --apply` adiciona somente arquivos ausentes sob `assets/`. Arquivos existentes com conteúdo diferente provocam conflito e bloqueiam todas as gravações; nada é sobrescrito.

## Assets existentes e referências corrigidas

- **17 recursos binários existentes**: 16 OGG sob `audio/kenney/` e o PNG `menu/sotomar-fimbria-menu.png`; as duas licenças de áudio também existem. Os OGG e o PNG são tecnicamente importáveis pelo Godot 4, após confirmação de procedência/licença apropriada ao uso. Nenhum deles é a arte de mapa/personagem em falta.
- **16 sons OGG** existem sob `audio/kenney/rpg/` e `audio/kenney/ui/`, com as duas licenças correspondentes. O manifesto `js/data/audio-assets.js` apontava para `assets/audio/...`; corrigi-o para os caminhos reais `audio/...`.
- `menu/sotomar-fimbria-menu.png` existe (2.761.887 bytes). Corrigi o CSS do menu de `../assets/menu/...` para `../menu/...`.
- O scanner de `index.html` e CSS não encontrou referências locais quebradas após essas correções.

## Referências dinâmicas e mapas

Os mapas são módulos JavaScript (`js/data/maps.js`, `fimbria-runtime.js` e `map01-visual.js` a `map11-visual.js`), não arquivos de imagem ou JSON externos. Os IDs dos recursos são resolvidos pelos manifestos. Ainda não foi possível verificar caminhos construídos em runtime além das referências declaradas nem comparar o conjunto com o ZIP original; essa parte permanece **PENDENTE**.
