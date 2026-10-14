# Sincronização com a pasta original

## Estado observado

Em 2026-10-14, o remoto anunciou apenas `main`; após `git fetch origin --prune`, o checkout continuou em `1c48d2d00f23fa6985f59cc9bf30ec248a580cc2`. Há 79 arquivos versionados, zero caminhos `assets/` e 3.598.687 bytes. Nenhum ZIP foi localizado em `/workspace` ou `/tmp`. O ZIP foi descrito como tendo aproximadamente 751 arquivos (655 em `assets/`), mas esses números não foram verificados localmente.

Os 20 gráficos e quatro licenças em [`ASSETS_AUSENTES.md`](ASSETS_AUSENTES.md) estão ausentes nos caminhos do manifesto. `tools/restore_assets.py` permite simular a incorporação do ZIP e, com `--apply`, adicionar somente arquivos faltantes sob `assets/`. Ele bloqueia todo o lote se encontrar destino divergente, caminho inseguro ou entrada não regular; não sobrescreve arquivos. Ainda é necessário inventariar o ZIP completo e revisar a simulação antes de aplicar.

## Comparar no Windows

Defina os caminhos locais reais. Os caminhos do Windows não foram fornecidos nesta tarefa:

```powershell
$Repo = 'C:\caminho\para\sotomar'
$Original = 'D:\caminho\para\pasta-original'
py -3 "$Repo\tools\inventory.py" $Original --output "$env:TEMP\sotomar-original.json"
py -3 "$Repo\tools\inventory.py" $Repo --output "$env:TEMP\sotomar-repositorio.json"
py -3 "$Repo\tools\compare_inventory.py" $Original $Repo --output "$Repo\reports\comparacao-original.json"
```

Os scripts usam apenas a biblioteca padrão do Python e comparam caminho relativo, tamanho e SHA-256. O relatório classifica arquivos ausentes, modificados e adicionais.

## Enviar o que faltar

Comece conferindo a branch e as diferenças. Não inicialize um repositório dentro da pasta original nem sobrescreva `main` sem revisar:

```powershell
Set-Location 'C:\caminho\para\sotomar'
git status --short --branch
git branch --all
git remote -v
git add --all
git status --short
git diff --cached --stat
git commit -m "Add remaining game assets"
git push -u origin main
```

Muitos arquivos pequenos favorecem Git ou GitHub Desktop, não upload manual no navegador. Para os arquivos atuais, o problema é a ausência de itens, não um blob individual grande. Antes de usar LFS, gere o manifesto da pasta original e aplique-o somente a tipos binários grandes que precisem de versionamento. Verifique o limite LFS vigente do plano da conta; não use `git lfs track "*"`. Remova duplicatas apenas com hashes iguais e confirmação de que os caminhos não são necessários separadamente.
