# Pranchas de revisão G04

Geradas localmente, sem a renderização do Godot:

```sh
python3 godot/tools/review_art_g04.py
```

Requer Pillow (testado com Pillow 12.3.0). A ferramenta grava sete PNGs, `audit_g04.json` e retorna falha se encontrar recursos ausentes, dimensões incompatíveis ou quadros vazios. `python3 godot/tests/test_art_pack_g04.py` roda os testes técnicos G04.

As imagens são úteis para inspeção estática; não simulam a filtragem, ordem de desenho, TileMapLayer ou movimento do Godot. Consulte `docs/RELATORIO_G04.md` antes de tratar uma impressão da prancha como defeito ou aprovação artística.
