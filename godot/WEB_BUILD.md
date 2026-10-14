# Build Web e teste no celular

## Requisitos

- Godot **4.6.3** e export templates da mesma versão. No Editor, instale-os em **Editor > Manage Export Templates**.
- Python 3 para servir a pasta localmente. Nenhuma dependência Python adicional é usada.

O preset **Web** está em `godot/export_presets.cfg`, usa o renderizador Compatibility (WebGL 2) e exporta sem threads. A saída em `build/web/` não é versionada.

## Exportar

Na raiz do repositório:

```sh
godot --headless --editor --path godot --quit
godot --headless --path godot --export-release Web "$PWD/build/web/index.html"
python3 godot/tests/test_web_export_g07.py
```

No Windows PowerShell:

```powershell
godot.exe --headless --editor --path godot --quit
godot.exe --headless --path godot --export-release Web (Join-Path (Get-Location) 'build/web/index.html')
python godot/tests/test_web_export_g07.py
```

## Teste neste computador

```sh
python3 tools/serve_web.py --host 127.0.0.1 --port 8000
```

Abra `http://127.0.0.1:8000/` em Chrome, Firefox ou Edge. Para abrir o servidor na rede local, inicie-o com `--host 0.0.0.0`; consulte o endereço IPv4 do computador (`ipconfig` no Windows ou `ip addr` no Linux/macOS) e abra `http://ENDERECO_IPV4:8000/` no celular conectado à mesma rede. O firewall do computador precisa aceitar essa conexão. Esse endereço HTTP da rede local serve para ensaio; a distribuição principal deve usar HTTPS.

Na tela inicial, selecione um protagonista e toque em **Entrar no protótipo**. No mapa, um toque escolhe uma célula caminhável; toque novamente na mesma célula ou use **Caminhar para…** para confirmar. Arraste o mapa para deslocar a câmera e use pinça para zoom. No computador, clique esquerdo seleciona, clique direito move e setas/WASD movimentam.

## Hospedar por HTTPS

O conteúdo é estático: publique **o conteúdo inteiro de `build/web/` na raiz** de um site HTTPS, mantendo lado a lado `index.html`, `index.js`, `index.wasm`, `index.pck` e os arquivos de áudio. Não é preciso backend. O projeto não publica nem configura um serviço automaticamente.

O caminho simples recomendado é GitHub Pages: copie a saída para uma branch/pasta dedicada de publicação, configure Pages para servir essa raiz e use a URL HTTPS fornecida pelo GitHub. Mantenha o diretório de desenvolvimento sem os binários de exportação; o build atual tem cerca de 43 MiB. O `index.wasm` tem cerca de 36 MiB, abaixo do limite de arquivo de GitHub Pages, mas acima do limite de 25 MiB por arquivo do Cloudflare Pages em upload estático direto. Para Cloudflare, seria necessário um fluxo que sirva o WASM comprimido com `Content-Encoding` apropriado ou uma configuração de build compatível.

Nenhum site foi publicado nesta missão. Escolha e autorize a publicação antes de enviar o build a uma hospedagem externa.

## Armazenamento e limitações

A seleção é gravada por `ConfigFile` em `user://character_selection.cfg`; no Godot Web esse armazenamento usa o sistema de arquivos persistente do navegador (IndexedDB). A seleção foi mantida após atualizar a página no Chromium. Limpar dados do site, navegar em modo privado, usar políticas que bloqueiam armazenamento ou trocar de navegador pode apagar/isolar a escolha. O navegador pode remover dados locais; não há sincronização entre dispositivos.

O preset não habilita PWA ou modo offline. O primeiro carregamento baixa o WebAssembly e o pacote de recursos; o tamanho total transferido depende do servidor e do cache. Use compressão HTTP para `.wasm` quando a hospedagem suportar `Content-Encoding: br` ou `gzip`.

Consulte [RELATORIO_G07.md](../docs/RELATORIO_G07.md) para resultados, capturas e matriz de navegadores.
