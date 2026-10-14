# Plano técnico de integração com Godot 4

Estado: **IMPLEMENTADO** como protótipo inicial em [`../godot/`](../godot/), testado em Godot 4.6.3 headless. A migração do jogo original e a integração das regras continuam **PENDENTES**.

## Preservação funcional

- Manter RPG tático por turnos, mapas 2D isométricos e movimento por células.
- Tratar os dados JavaScript, salvamento e regras atuais como referência de compatibilidade. Definir fixtures de entrada/saída para combate, turnos, inventário, missões, portais e salvamento antes de portar cada domínio.
- Separar coordenadas lógicas de célula da projeção visual. Uma mudança de escala, arte ou câmera não deve alterar alcance, caminho, colisão ou seleção da célula.
- Migrar gradualmente por fatias verificáveis; não remover o jogo web nem substituir recursos sem revisão visual e funcional.
- Manter a nova arte original, usando apenas inspiração ampla de cores vivas, contornos legíveis e formas amigáveis. Sem copiar personagens, mapas ou imagens de Dofus.

## Ordem sugerida

1. Restaurar e conferir os assets e licenças do ZIP, registrar hashes e concluir a suíte JavaScript.
2. Importar uma amostra de tiles/sprites após definir escala e licença.
3. Expandir a cena atual de prova `MAP_01`: terreno em camadas (futuro `TileMapLayer`), colisões, ator temporário, seleção de célula e movimento; portal como transição explícita simples.
4. Validar projeção, ordenação de profundidade, navegação e legibilidade em diferentes tamanhos de janela. Comparar cada ação com o runtime web.
5. Integrar dados e regras por adaptadores pequenos e testes de paridade, começando por carregamento de mapa e movimentação, depois combate e salvamento.
6. Expandir a biblioteca visual e migrar mapas em lotes, mantendo telas web funcionais até cada lote passar pelos critérios de aceite.

## Primeira cena recomendada

Uma fatia de 10×10 células de `MAP_01`, sem combate: chão e caminho, props, personagem de placeholder, seleção, movimento por entrada/rota e células bloqueadas. Essa cena está implementada em `godot/scenes/main.tscn`; não inclui portal. A escala final depende da nova arte e de inspeção visual; não assumir que PNGs existentes definem a escala.

## Critérios antes de avançar

- Coordenada tela↔célula consistente, movimento e bloqueios determinísticos.
- Mesmos estados/regras esperados pelo conjunto de casos JavaScript de referência.
- Sem erro de importação, warning de recurso ausente ou licença desconhecida.
- Capturas em escala nativa e janela ampliada aprovadas visualmente antes de expandir.

O jogo continua sendo 2D. Não planejar modelos, câmera ou pipeline 3D.
