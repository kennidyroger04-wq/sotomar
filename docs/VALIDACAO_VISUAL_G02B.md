# Missão G02B — auditoria geométrica e captura local

## Estado

- **IMPLEMENTADO:** `godot/tools/capture_visual.gd` abre a cena principal no Godot Desktop, destaca a célula `(4, 2)`, apresenta uma legenda com janela, viewport lógica, célula e coordenada selecionada, captura PNGs para 1280×720 e 1920×1080 e grava `capture_log.txt`. O script verifica cena, TileSet e seis PNGs antes da captura. A opção `--validate-only` executa essas verificações sem renderização.
- **IMPLEMENTADO:** layout responde à mudança de tamanho da viewport; props e personagem continuam alinhados à projeção lógica.
- **IMPLEMENTADO:** primeira especificação para produção artística definitiva, sem produção em massa.
- **VALIDADO:** auditoria de projeção, grade, escala e assets técnicos passou em 20 verificações headless.
- **PENDENTE:** capturas e inspeção visual reais no Godot Desktop. Nenhuma aprovação visual é atribuída nesta missão.

## Auditoria geométrica

| Verificação | Resultado |
|---|---|
| Centros dos cinco `TileMapLayer` contra os centros lógicos | **VALIDADO** em origem, vizinhos e células distantes; mantém diferença zero nos testes. |
| Forma e encaixe das faces | **VALIDADO** por coordenadas: losango `(64,0) (128,32) (64,64) (0,32)` no passo de 128×64. Vizinhos avançam `(+64,+32)` e `(-64,+32)` na textura e compartilham os vértices. |
| Texturas adjacentes / lacunas geométricas | A dimensão da face preenche exatamente a célula a 0,5× (64×32 px); as faces encostam sem lacuna matemática. **PENDENTE** inspeção de costuras rasterizadas na composição da cena. |
| Escala 0,5 | **VALIDADO** por teste dimensional: 128×64 → 64×32 e origem de textura `(0,-8)` → deslocamento `(0,-4)` após escala. |
| `texture_origin` | **VALIDADO**: todas as seis fontes carregam com `(0,-8)` e teste confere o deslocamento escalado. |
| Profundidade | **VALIDADO** para personagem e props pelo índice lógico `x+y`; teste confirma a chave de profundidade na cena. A aprovação da oclusão visível continua pendente de captura. |
| Redimensionamento | **VALIDADO** em janela 1280×720 e 1920×1080. O projeto usa viewport lógica 960×640 com `canvas_items`; a projeção e o picking permanecem no espaço lógico, enquanto o canvas é escalado para a janela. |

O ajuste geométrico removeu a margem interna de um pixel na face superior anterior. A grade lógica, coordenadas do jogo e dimensões da célula não mudaram. As cores e o contorno de borda ainda precisam de avaliação em desktop.

## Captura local no Windows

1. Instale/abra Godot Desktop 4.x e mantenha o executável de console disponível para registrar mensagens.
2. Na raiz do repositório, execute no PowerShell, ajustando o caminho do executável:

```powershell
& "C:\Godot\Godot_v4.6.3-stable_win64_console.exe" --path godot --script res://tools/capture_visual.gd -- --output-dir captures/g02b
```

3. Aguarde a janela de jogo alternar para 1280×720 e 1920×1080. O script grava `godot/captures/g02b/fimbria_1280x720.png`, `fimbria_1920x1080.png` e `capture_log.txt`.
4. Verifique a saída do console e o log. Compare enquadramento, costuras, seleção, obstruções, profundidade e escala; registre qualquer correção antes de marcar aparência como **VALIDADA**.

As PNGs são capturadas a partir da textura da viewport e redimensionadas ao tamanho solicitado, mantendo o comportamento do modo `canvas_items`. Não é exigida ferramenta de captura de terceiros.

Para verificar recursos sem abrir janela:

```powershell
& "C:\Godot\Godot_v4.6.3-stable_win64_console.exe" --headless --path godot --script res://tools/capture_visual.gd -- --validate-only --output-dir captures/g02b
```

## Testes

**TESTADO:** Godot 4.6.3; importação headless; 20 verificações da suíte; pré-verificação de recursos do roteiro; inicialização headless por cinco frames. Tudo concluiu com código 0. A pré-verificação confirmou cena, TileSet e seis PNGs RGBA 128×80. Os erros de renderização headless já registrados no relatório G02 persistem como limitação de capturas Cloud; a ferramenta gráfica local não foi executada aqui.

Comandos usados:

```sh
godot --headless --editor --path godot --quit
godot --headless --path godot --script res://tests/test_iso_board.gd
godot --headless --path godot --script res://tools/capture_visual.gd -- --validate-only --output-dir /tmp/sotomar-g02b-capture-check
godot --headless --path godot --quit-after 5
```

## Primeiro lote de arte definitiva

**PENDENTE** de criação. Especificação e critérios de revisão em [`ESPECIFICACAO_ARTE_LOTE_1.md`](ESPECIFICACAO_ARTE_LOTE_1.md): variações de grama, terra, pedra, caminho modular, água, oito bordas/transições, uma árvore, uma rocha e personagem básico com quatro orientações e animações idle/walk. As texturas SVG/PNG atuais permanecem materiais técnicos provisórios; props/personagem continuam placeholders.
