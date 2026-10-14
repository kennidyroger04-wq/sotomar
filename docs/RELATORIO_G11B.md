# Relatório G11B — checkpoint estável e build Web

## Checkpoint G11

- Referência imutável criada: `g11-stable-20261014`.
- Commit protegido pela referência: `89e87f5c1404bc0d9126a73f69bde14fb81bfea7`.
- Tag anotada enviada a `origin`; nenhuma branch estável foi movida e nenhum merge foi feito.
- Branch para a operação: `operation/g12-g17`, aberta no commit G11 e enviada ao remoto.
- O checkout iniciou limpo. A branch G11 continua disponível como `mission/g11-encounter-system`.

## Verificações

- **TESTADO:** Godot `4.6.3.stable.official.7d41c59c4`; G10 combat 22/22; G11 encounters 25/25; catálogo compara os 12 encontros à fonte JavaScript.
- **TESTADO:** exportação Web com 9 arquivos, 42,68 MiB; assinaturas WASM/PCK e exclusão do código-fonte verificadas. ZIP estável tem 15.984.829 bytes, 11 entradas e foi extraído/revalidado.
- **TESTADO:** 11 checks do workflow/deploy; ambos YAMLs foram parseados. O workflow principal continua publicado sem alterações nesta branch.
- **VALIDADO:** G11 já foi percorrido no Chromium com seleção, mapa, combate touch e vitória. Captura: `reports/g11/chromium-enc01-victory.png`.
- **PENDENTE:** testes em aparelhos Android/iOS e publicação HTTPS; Firebase não foi configurado nem utilizado.

## Builds sem Firebase

Build estável empacotada no workspace em `/workspace/sotomar-g11-stable-web.zip`. O ZIP contém apenas a exportação Web, instruções e iniciador Windows; não contém fonte do jogo. Extraia o ZIP, execute `Start-Windows.cmd` e aguarde o navegador abrir em `http://127.0.0.1:8000/`. Para macOS/Linux, com Python 3, execute `python3 -m http.server 8000 --directory web` no diretório extraído e abra o mesmo endereço. Não é necessário instalar Godot nem usar Firebase.

SHA-256 do pacote validado: `81d69ad11a60ee059ae3155dbb702a051b3f6ba47add9c1a04ebb309ad43a277`.

Também é possível recuperar o código-fonte estável:

```sh
git clone --branch g11-stable-20261014 --depth 1 https://github.com/kennidyroger04-wq/sotomar.git sotomar-g11
```

Para gerar uma build Web local a partir da fonte, instale Godot 4.6.3 e os export templates da mesma versão, então:

```sh
godot --headless --editor --path godot --import --quit
godot --headless --path godot --export-release Web "$PWD/build/web/index.html"
python3 tools/serve_web.py --directory build/web --port 8000
```

## Workflows e publicação

- `.github/workflows/godot-web.yml` permanece inalterado: main e PRs validam build; despacho manual exige escolha explícita para publicar, e a condição de deploy só aceita `publish=true` em `main`.
- `.github/workflows/godot-web-experimental.yml` gera artefato separado apenas para `operation/g12-g17`, PRs dessa branch ou despacho manual. Não possui etapa Firebase nem segredos de publicação. Artefatos do Actions duram sete dias.
- A publicação HTTPS segue pendente; nenhuma URL pública foi criada.
- O ambiente cloud confirma proxy HTTP restrito aplicado e GitHub remoto acessível. Não há credencial/variável Firebase configurada, o que não bloqueou builds locais nem commits Git.

## Classificação

- **IMPLEMENTADO:** tag estável remota, branch da operação e workflow de artefato experimental separado.
- **TESTADO:** baseline de G10/G11 e build estruturalmente válida.
- **VALIDADO:** execução da versão G11 no Chromium; pacote local para execução sem Firebase.
- **PENDENTE:** análise manual do proprietário, validação em aparelho físico e hosting HTTPS.
- **FALHOU:** nenhuma verificação G11B executada falhou.
