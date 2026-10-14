# Acesso à versão Web — G09/G09B

## Estado verificado

- O workflow `.github/workflows/godot-web.yml` fixa Godot e templates em 4.6.3, valida a exportação e disponibiliza `build/web/` como artefato de Actions por sete dias.
- GitHub Actions (checkout, cache, upload de artefato e Firebase Hosting deploy) está fixado em SHA imutável. O job tem permissão `contents: read`.
- `firebase.json` publica exclusivamente `build/web/`. O projeto-fonte, relatórios, testes e assets de origem não entram nesse diretório.
- Push para `main` e pull requests só compilam e carregam o artefato. O deploy live só pode ocorrer via execução manual em `main` com `publish=true`.
- Nenhum projeto Firebase, conta de serviço, credencial ou site HTTPS foi criado nesta missão. Não há URL pública validada.
- A consulta a `firebase.google.com` foi bloqueada com HTTP 403 neste ambiente. Consulte as quotas oficiais abaixo no momento de habilitar Hosting: não é possível atestar nesta sessão a cota efetiva da conta.

## Plano Firebase Spark e cotas

O Firebase Hosting oferece cota sem custo no plano Spark; não é necessário associar faturamento para permanecer no Spark. A documentação de preços historicamente lista 10 GB de armazenamento e 360 MB/dia de transferência para Hosting no Spark. A exportação atual tem cerca de 42,6 MiB: cabe no armazenamento, mas aproximadamente oito downloads completos em um dia já se aproximam da cota diária, antes de considerar cache e tráfego dos demais recursos. O excedente pode suspender o serviço no plano sem faturamento; confira os valores e condições atuais antes de compartilhar o site.

Fontes oficiais para conferir antes da publicação:

- [Firebase Hosting: quotas e preços](https://firebase.google.com/docs/hosting/usage-quotas-pricing)
- [Planos e preços Firebase](https://firebase.google.com/pricing)

O cache configurado para `.wasm` e `.pck` reduz downloads repetidos, mas não elimina limites. Para evitar custos, mantenha o projeto no Spark e não faça upgrade para Blaze. O deploy manual não altera o plano.

## Preparação única do Firebase e GitHub

Faça esta configuração no computador do proprietário. Nunca envie a chave JSON por chat nem a adicione ao repositório.

### 1. Criar projeto no Firebase

1. Acesse [console.firebase.google.com](https://console.firebase.google.com/).
2. Pressione **Adicionar projeto** (ou **Criar um projeto**).
3. Informe um nome, por exemplo `sotomar-fimbria-web`, e pressione **Continuar**.
4. Deixe Google Analytics desativado para este site e conclua **Criar projeto**.
5. Na página do projeto, copie o **ID do projeto** mostrado em **Configurações do projeto → Geral**. Esse valor é o `projectId` e não pode conter espaços.
6. Confirme no painel de faturamento que o projeto usa **Spark**. Não associe uma conta de faturamento nem faça upgrade para Blaze.

### 2. Habilitar Hosting

1. No menu esquerdo do Firebase, abra **Build → Hosting**.
2. Pressione **Começar** e avance até concluir a configuração inicial do site de Hosting. Não use o fluxo de publicar arquivos locais: a publicação será pelo GitHub Actions.
3. Confirme que o domínio padrão `PROJECT_ID.web.app` aparece na página Hosting. Ainda não distribua esse endereço: ele só servirá após a primeira publicação autorizada.

### 3. Criar uma credencial de deploy com escopo mínimo

1. Abra [Google Cloud Console](https://console.cloud.google.com/) selecionando o mesmo projeto.
2. Vá a **IAM e administrador → Contas de serviço → Criar conta de serviço**.
3. Use um nome como `github-firebase-hosting-deploy`.
4. Em permissões do projeto, conceda somente **Firebase Hosting Admin** (`roles/firebasehosting.admin`). Não use Owner/Editor.
5. Abra a conta criada, vá em **Chaves → Adicionar chave → Criar nova chave → JSON** e baixe a chave para um local protegido. Essa etapa cria uma credencial que dá acesso de deploy: não a compartilhe e apague a cópia local depois de cadastrá-la no GitHub.
6. Se a política da organização proibir chaves de conta de serviço, pare aqui e peça ao administrador para preparar Workload Identity Federation; não enfraqueça a política criando uma chave alternativa.

### 4. Cadastrar os dois valores no GitHub

1. Acesse `github.com/kennidyroger04-wq/sotomar` e confirme em **Settings → General → Danger Zone** que a visibilidade está **Private**. Não altere a visibilidade sem decisão do proprietário.
2. Abra **Settings → Secrets and variables → Actions**.
3. Em **Secrets**, pressione **New repository secret**. Nome: `FIREBASE_SERVICE_ACCOUNT`. Cole todo o conteúdo JSON baixado no campo Secret e pressione **Add secret**.
4. Na aba **Variables**, pressione **New repository variable**. Nome: `FIREBASE_PROJECT_ID`. Valor: o ID copiado em Configurações do projeto Firebase. Pressione **Add variable**.
5. Não crie nenhum outro segredo nem coloque valores no workflow. Nenhuma chave precisa estar no computador usado para iniciar o Actions.

## Gerar e baixar uma build de teste (sem publicar)

Depois que as alterações estiverem na branch `main`:

1. No GitHub, abra a aba **Actions** do repositório.
2. Escolha **Godot Web build** na lista lateral.
3. Push para `main` inicia essa compilação automaticamente; pull request também compila. Para solicitar uma compilação manual, pressione **Run workflow**, selecione `main` e deixe `publish` desmarcado.
4. Abra a execução mais recente e aguarde o job **build** ficar verde.
5. Em **Artifacts**, baixe `sotomar-fimbria-web`. O ZIP contém apenas a exportação Web validada e fica disponível por sete dias.

Essa execução não usa a chave Firebase e não publica o site.

## Publicar em HTTPS

O usuário autorizado é quem decide quando tornar o jogo público. Depois de cadastrar os dois valores acima e revisar o artefato de teste:

1. No GitHub, abra **Actions → Godot Web build → Run workflow**.
2. Selecione a branch `main`.
3. Marque `publish` e pressione o botão verde **Run workflow**. Esta é a ação que autoriza a publicação live.
4. Aguarde os passos de exportação, validação e **Publish to Firebase Hosting** ficarem verdes.
5. Abra **Firebase Console → Build → Hosting** e copie o domínio `https://PROJECT_ID.web.app`.
6. Abra o endereço no navegador, verifique a seleção de personagem e entre em `MAP_01`. Teste em telefone real antes de distribuir o endereço.

Antes desse último clique, a URL padrão não representa uma publicação disponível. Esta documentação não autoriza nem executa deploy nesta missão.

## Acesso local pelo celular na mesma rede (HTTP)

No computador, com Godot 4.6.3 e templates Web correspondentes:

```sh
godot --headless --editor --path godot --import --quit
mkdir -p build/web
godot --headless --path godot --export-release Web "$PWD/build/web/index.html"
python3 tools/serve_web.py --host 0.0.0.0 --port 8000
```

Deixe o terminal aberto. Em Windows, execute `ipconfig` e copie o IPv4 do Wi-Fi; em Linux/macOS, veja o endereço nas configurações de rede. No celular conectado à mesma rede, abra `http://IP-DO-COMPUTADOR:8000/`. Se necessário, permita a porta TCP 8000 no firewall da rede privada. Não abra portas do roteador. É uma conexão local em HTTP, não um endereço público HTTPS.

O export atual não usa threads Web, portanto não precisa de cabeçalhos de isolamento cross-origin. Testes em Chromium desktop/emulado não substituem validação em Android/iOS físico.
