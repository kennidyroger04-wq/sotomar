# Acesso à versão Web — Missão 19

## Estado verificado

- O workflow `.github/workflows/godot-web.yml` fixa Godot e templates em 4.6.3, valida a exportação e disponibiliza `build/web/` como artefato de Actions por sete dias.
- GitHub Actions (checkout, cache, upload de artefato e Firebase Hosting deploy) está fixado em SHA imutável. O job tem permissão `contents: read`.
- `firebase.json` publica exclusivamente `build/web/`. O projeto-fonte, relatórios, testes e assets de origem não entram nesse diretório.
- Push para `main` e pull requests só compilam e carregam o artefato. O deploy live exige execução manual de **Godot Web build** com `publish=true`; push e pull request nunca publicam.
- `.firebaserc` e o workflow apontam para o ID fornecido `sotomar-eaf2c`. `firebase.json` publica somente `build/web/` e não configura rewrite genérico.
- O Hosting foi informado como habilitado, mas não foi possível autenticar ou consultar o projeto pelo ambiente Codex. Não há publicação ou URL validada nesta missão.
- O ambiente não forneceu credencial Firebase, conta Google em runtime ou CLI Firebase. A API do GitHub bloqueou (HTTP 403) a consulta aos nomes de secrets/variables; portanto, não foi possível confirmar se já existem bindings no repositório.

## Plano Firebase Spark e cotas

O Hosting pode ser usado no plano Spark dentro das cotas gratuitas vigentes. Relatórios anteriores citaram os valores então publicados de 10 GB de armazenamento e 360 MB/dia de transferência. Esses números não foram confirmados em tempo real nesta sessão; confira os limites atuais no Firebase Console e nos links abaixo antes de divulgar o site. O build desta missão tem cerca de 51,46 MiB; cada transferência integral representa uma fração relevante da cota diária histórica. Não associe faturamento nem faça upgrade para Blaze.

Fontes oficiais para conferir antes da publicação:

- [Firebase Hosting: quotas e preços](https://firebase.google.com/docs/hosting/usage-quotas-pricing)
- [Planos e preços Firebase](https://firebase.google.com/pricing)

`index.html` revalida em cada acesso; `.wasm`, `.pck` e JavaScript usam cache de uma hora. Os arquivos do Godot mantêm nomes fixos entre versões, então não são marcados `immutable`. O deploy não altera o plano.

## Preparação única do Firebase e GitHub

Faça esta configuração no computador do proprietário. Nunca envie a chave JSON por chat nem a adicione ao repositório.

### 1. Confirmar o projeto existente

1. Acesse [console.firebase.google.com](https://console.firebase.google.com/).
2. Abra o projeto cujo **ID é exatamente `sotomar-eaf2c`**. Não crie outro projeto se este existir.
3. Em **Configurações do projeto → Geral**, confirme o ID.
4. No painel do plano, confirme **Spark**. Não associe faturamento nem faça upgrade para Blaze.

### 2. Habilitar Hosting

1. No menu esquerdo do Firebase, abra **Build → Hosting**.
2. Pressione **Começar** e avance até concluir a configuração inicial do site de Hosting. Não use o fluxo de publicar arquivos locais: a publicação será pelo GitHub Actions.
3. Confirme que o domínio padrão `PROJECT_ID.web.app` aparece na página Hosting. Ainda não distribua esse endereço: ele só servirá após a primeira publicação autorizada.

### 3. Criar uma credencial de deploy com escopo mínimo

1. Abra [Google Cloud Console](https://console.cloud.google.com/) e selecione `sotomar-eaf2c`.
2. Vá a **IAM e administrador → Contas de serviço → Criar conta de serviço**.
3. Use um nome como `github-firebase-hosting-deploy`.
4. Em permissões do projeto, conceda somente **Firebase Hosting Admin** (`roles/firebasehosting.admin`). Não use Owner/Editor.
5. Abra a conta criada, vá em **Chaves → Adicionar chave → Criar nova chave → JSON** e baixe a chave para um local protegido. Essa etapa cria uma credencial que dá acesso de deploy: não a compartilhe e apague a cópia local depois de cadastrá-la no GitHub.
6. Se a política da organização proibir chaves de conta de serviço, pare aqui e peça ao administrador para preparar Workload Identity Federation; não enfraqueça a política criando uma chave alternativa.

### 4. Cadastrar a credencial no GitHub

1. Acesse `github.com/kennidyroger04-wq/sotomar` e confirme em **Settings → General → Danger Zone** que a visibilidade está **Private**. Não altere a visibilidade sem decisão do proprietário.
2. Abra **Settings → Secrets and variables → Actions**.
3. Em **Secrets**, pressione **New repository secret**. Nome: `FIREBASE_SERVICE_ACCOUNT`. Cole todo o conteúdo JSON baixado no campo Secret e pressione **Add secret**.
4. Não é necessário criar `FIREBASE_PROJECT_ID`: o workflow usa diretamente o ID informado `sotomar-eaf2c`.
5. Não coloque a chave no repositório, workflow, logs ou chat. Nenhuma chave precisa estar no computador usado para iniciar o Actions.

## Gerar e baixar uma build de teste (sem publicar)

Depois que as alterações da Missão 19 estiverem na branch remota `operation/mission-19-firebase`:

1. No GitHub, abra a aba **Actions** do repositório.
2. Escolha **Godot Web build** na lista lateral.
3. Push para `main` inicia compilação automaticamente; pull requests também compilam. Para compilar a branch de trabalho, pressione **Run workflow**, selecione `operation/mission-19-firebase` e deixe `publish` desmarcado.
4. Abra a execução mais recente e aguarde o job **build** ficar verde.
5. Em **Artifacts**, baixe `sotomar-fimbria-web`. O ZIP contém apenas a exportação Web validada e fica disponível por sete dias.

Essa execução não usa a chave Firebase e não publica o site.

## Publicar em HTTPS

O usuário autorizado é quem decide quando tornar o jogo público. Depois de cadastrar os dois valores acima e revisar o artefato de teste:

1. Confirme que `FIREBASE_SERVICE_ACCOUNT` foi cadastrada e que o Hosting está no plano Spark.
2. No GitHub, abra **Actions → Godot Web build → Run workflow**.
3. Selecione `operation/mission-19-firebase`.
4. Marque `publish` e pressione o botão verde **Run workflow**. Essa execução manual é a única rota deste workflow para o canal live.
5. Aguarde os passos de exportação, validação e **Publish to Firebase Hosting** ficarem verdes.
6. Abra **Firebase Console → Build → Hosting** e confirme a versão publicada no site `sotomar-eaf2c`.
7. Acesse `https://sotomar-eaf2c.web.app`, confirme seleção de personagem e entrada em `MAP_01`. Teste Safari num iPhone antes de divulgar amplamente.

Antes do workflow terminar em verde e da resposta HTTP ser verificada, a URL padrão não representa publicação disponível. Essas instruções não substituem o teste em iPhone.

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
