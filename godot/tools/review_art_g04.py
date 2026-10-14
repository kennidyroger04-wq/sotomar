#!/usr/bin/env python3
"""Build static review boards and run objective G04 package checks using Pillow."""
from __future__ import annotations
import json, math
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "reviews/g04"
BG = (38, 44, 52, 255)
CARD = (55, 62, 71, 255)
INK = (241, 235, 218, 255)
GRID = (90, 99, 106, 255)
TILE_ROOT = ROOT / "assets/tiles/terrain/g03"

def font(size=18):
    for path in ("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf", "/usr/share/fonts/truetype/liberation2/LiberationSans-Regular.ttf"):
        if Path(path).exists(): return ImageFont.truetype(path, size)
    return ImageFont.load_default()
F = font(18); FS = font(14); FT = font(24)
def canvas(w,h,title,subtitle):
    im=Image.new("RGBA",(w,h),BG); d=ImageDraw.Draw(im)
    d.text((24,18),title,font=FT,fill=INK); d.text((24,53),subtitle,font=FS,fill=(184,194,195,255))
    return im
def label(im,xy,text): ImageDraw.Draw(im).text(xy,text,font=FS,fill=INK)
def wrapped_label(im, xy, text, width, selected_font=FS):
    draw = ImageDraw.Draw(im); words = text.split(); lines = []; line = ""
    for word in words:
        candidate = f"{line} {word}".strip()
        if line and draw.textbbox((0, 0), candidate, font=selected_font)[2] > width:
            lines.append(line); line = word
        else: line = candidate
    if line: lines.append(line)
    draw.multiline_text(xy, "\n".join(lines), font=selected_font, fill=INK, spacing=2)
def open_tile(name): return Image.open(TILE_ROOT/f"{name}.png").convert("RGBA")
def paste_tile(im,name,cx,cy,scale=.5):
    src=open_tile(name); size=(round(src.width*scale),round(src.height*scale)); src=src.resize(size,Image.Resampling.LANCZOS)
    im.alpha_composite(src,(round(cx-size[0]/2),round(cy-size[1]/2)))
def save(im,name):
    path=OUT/name; im.convert("RGB").save(path,optimize=True); return path

def tile_board(meta):
    names=[x["name"] for x in meta["tiles"]]; cellw,cellh=200,155; cols=5; rows=math.ceil(len(names)/cols)
    im=canvas(24+cols*cellw,100+rows*cellh,"G04 · Catálogo dos 23 tiles","PNG RGBA · miniaturas a 0,5× (128×80 → 64×40) · nomes do catálogo")
    for i,name in enumerate(names):
        x=24+(i%cols)*cellw; y=94+(i//cols)*cellh
        ImageDraw.Draw(im).rounded_rectangle((x,y,x+cellw-12,y+cellh-12),radius=8,fill=CARD,outline=GRID,width=1)
        paste_tile(im,name,x+88,y+61,.66); wrapped_label(im,(x+8,y+112),name.replace("_", " "),cellw-28)
    return save(im,"01_tiles_catalog.png")

def path_board():
    names=["path_center","path_straight_ne_sw","path_straight_nw_se","path_bend","path_cross"]
    im=canvas(920,490,"G04 · Caminhos e conexões","Montagem de teste em grade lógica · peças centralizadas com passo 64×32 px")
    # top five individual samples
    for i,n in enumerate(names):
        x=100+i*170; y=170
        paste_tile(im,"grass_meadow",x,y,.5); paste_tile(im,n,x,y,.5); label(im,(x-64,226),n)
    # path network
    cx,cy=460,360
    for dx,dy,n in [(-2,0,"path_straight_ne_sw"),(-1,0,"path_straight_ne_sw"),(0,0,"path_cross"),(0,1,"path_straight_nw_se"),(0,2,"path_straight_nw_se"),(1,0,"path_straight_ne_sw"),(2,0,"path_bend")]:
        px=cx+(dx-dy)*32; py=cy+(dx+dy)*16
        paste_tile(im,"grass_meadow",px,py,.5); paste_tile(im,n,px,py,.5)
    return save(im,"02_path_connections.png")

def transitions_board():
    names=[x["name"] for x in json.loads((ROOT/"resources/art_pack_g03.json").read_text())["tiles"] if x["group"]=="transition"]
    cols=4; cw,ch=210,160; im=canvas(24+cols*cw,100+2*ch,"G04 · Transições de terreno","Sobreposição em grama; visualização estática para conferir silhueta, cobertura e alfa")
    for i,n in enumerate(names):
        x=24+(i%cols)*cw; y=94+(i//cols)*ch
        ImageDraw.Draw(im).rounded_rectangle((x,y,x+cw-12,y+ch-10),8,fill=CARD,outline=GRID)
        paste_tile(im,"grass_meadow",x+92,y+59,.64); paste_tile(im,n,x+92,y+59,.64); wrapped_label(im,(x+8,y+112),n.replace("_", " "),cw-26)
    return save(im,"03_transitions.png")

def props_board():
    names=["grass_meadow","dirt_ochre","stone_moss","water_clear"]
    im=canvas(940,570,"G04 · Props em pisos diferentes","Comparação em escala de cena (0,5×) · ponto de apoio na base do sprite")
    props=[("tree_mosswood",ROOT/"assets/props/g03/tree_mosswood.png"),("rock_moss_stone",ROOT/"assets/props/g03/rock_moss_stone.png")]
    for row,(pn,path) in enumerate(props):
        for col,tn in enumerate(names):
            cx=142+col*220; cy=190+row*210
            paste_tile(im,tn,cx,cy,.5)
            src=Image.open(path).convert("RGBA").resize((128,144),Image.Resampling.LANCZOS)
            im.alpha_composite(src,(cx-64,cy-140))
            ImageDraw.Draw(im).line((cx-6,cy,cx+6,cy),fill=(255,80,80,255),width=2); ImageDraw.Draw(im).line((cx,cy-6,cx,cy+6),fill=(255,80,80,255),width=2)
            wrapped_label(im,(cx-82,cy+32),f"{pn.replace('_',' ')} / {tn.replace('_',' ')}",174, font(12))
    return save(im,"04_props_on_terrain.png")

def frame(row,col):
    sheet=Image.open(ROOT/"assets/characters/wayfarer_v1/wayfarer_v1.png").convert("RGBA")
    return sheet.crop((col*128,row*160,(col+1)*128,(row+1)*160))
def character_boards():
    dirs=["SE","SW","NW","NE"]
    im=canvas(960,390,"G04 · Quatro orientações · pose idle","Um quadro central de cada direção, renderizado a 0,75×; ordem de linhas conforme metadata")
    for row,d in enumerate(dirs):
        x=115+row*230; y=220
        im.alpha_composite(frame(row,1).resize((96,120),Image.Resampling.LANCZOS),(x-48,y-114)); label(im,(x-25,y+18),d)
    p1=save(im,"05_character_directions.png")
    im=canvas(1180,450,"G04 · Comparação de animações","Idle (4 quadros @4 fps) e walk (4 quadros @8 fps), quatro direções; sequência estática")
    for row,d in enumerate(dirs):
        label(im,(20,102+row*75),d)
        for col in range(4):
            for group,start in enumerate((0,4)):
                x=110+col*125+group*525; y=96+row*75
                im.alpha_composite(frame(row,start+col).resize((64,80),Image.Resampling.LANCZOS),(x,y))
        if row==0:
            label(im,(220,78),"IDLE →"); label(im,(730,78),"WALK →")
    return p1,save(im,"06_idle_walk.png")

def map_preview():
    # Recreate G03 map material placement, path, overlays, props and one character pose.
    width,height=1024,700; im=canvas(width,height,"G04 · Prévia estática do mapa demonstrativo","Composição Pillow aproximada · grade 10×10 · tile pitch 64×32 · não equivale ao renderizador Godot")
    origin=(512,378)
    def pos(x,y): return (origin[0]+(x-y)*32,origin[1]+(x+y)*16)
    for y in range(10):
        for x in range(10):
            sid=["grass_meadow","grass_clover","grass_fern"][(x+y)%3]
            if 1<=x<=3 and 6<=y<=8: sid="stone_moss" if (x+y)%2==0 else "stone_lichen"
            elif 6<=x<=8 and 1<=y<=3: sid="water_clear" if (x+y)%2 else "water_ripple"
            elif x>=7 and y>=6: sid=["dirt_ochre","dirt_dappled","path_center"][(x+y)%3]
            px,py=pos(x,y); paste_tile(im,sid,px,py,.5)
    overlays={(2,2):"path_center",(3,2):"path_straight_ne_sw",(4,2):"path_straight_ne_sw",(5,2):"path_cross",(5,3):"path_straight_nw_se",(5,4):"path_bend",(0,7):"transition_grass_earth_edge_north",(4,7):"transition_grass_earth_edge_south",(6,7):"transition_grass_water_stones_a",(7,5):"transition_grass_water_stones_b",(5,7):"transition_earth_cliff_edge"}
    for (x,y),name in sorted(overlays.items(),key=lambda a:a[0][0]+a[0][1]): paste_tile(im,name,*pos(x,y),.5)
    for cell,pn in [((2,4),"tree_mosswood"),((7,4),"rock_moss_stone")]:
        x,y=cell; px,py=pos(x,y); path=ROOT/f"assets/props/g03/{pn}.png"; prop=Image.open(path).convert("RGBA").resize((128,144),Image.Resampling.LANCZOS); im.alpha_composite(prop,(px-64,py-140))
    # walk SE frame (row 0, column 5), feet at cell center
    px,py=pos(4,4); im.alpha_composite(frame(0,5).resize((64,80),Image.Resampling.LANCZOS),(px-32,py-76))
    return save(im,"07_demo_map_static.png")

def audit(meta):
    issues=[]; facts=[]
    tiles=meta.get("tiles",[])
    if len(tiles)!=23: issues.append(f"manifest contains {len(tiles)} tiles; expected 23")
    for t in tiles:
        p=ROOT/t["path"].replace("res://","")
        if not p.is_file(): issues.append(f"missing tile: {p.relative_to(ROOT)}"); continue
        with Image.open(p) as im:
            if im.size!=(128,80): issues.append(f"{p.name}: expected 128x80, found {im.size}")
            if im.mode!="RGBA": issues.append(f"{p.name}: expected RGBA, found {im.mode}")
            if im.getchannel("A").getbbox() is None: issues.append(f"{p.name}: empty alpha")
    for name,pd in meta.get("props",{}).items():
        p=ROOT/pd["path"].replace("res://","")
        if not p.is_file(): issues.append(f"missing prop: {p.relative_to(ROOT)}"); continue
        with Image.open(p) as im:
            if im.size!=(256,288) or im.mode!="RGBA": issues.append(f"{name}: unexpected dimensions/mode {im.size}/{im.mode}")
            bbox=im.getchannel("A").getbbox()
            if bbox is None: issues.append(f"{name}: empty alpha")
            else:
                pivot=pd.get("pivot",[])
                if len(pivot)!=2 or abs(bbox[3]-pivot[1])>1: issues.append(f"{name}: alpha base {bbox[3]} differs from pivot {pivot}")
    c=meta.get("character",{}); cp=ROOT/c.get("path","").replace("res://","")
    if not cp.is_file(): issues.append(f"missing character sheet: {cp}")
    else:
        with Image.open(cp) as sheet:
            if sheet.size!=(1024,640) or sheet.mode!="RGBA": issues.append(f"character sheet: unexpected dimensions/mode {sheet.size}/{sheet.mode}")
            bottoms=[]; empties=[]
            for r in range(4):
                for col in range(8):
                    a=sheet.crop((col*128,r*160,(col+1)*128,(r+1)*160)).getchannel("A").getbbox()
                    if not a: empties.append((r,col))
                    else: bottoms.append(a[3])
            if empties: issues.append(f"empty character frames: {empties}")
            if bottoms and max(bottoms)-min(bottoms)>2: issues.append(f"character alpha baseline spread {max(bottoms)-min(bottoms)}px")
            facts.append(f"character frames: 32 non-empty; alpha baseline spread {max(bottoms)-min(bottoms) if bottoms else 'n/a'}px")
    for s in meta.get("editable_raster_masters",[]):
        p=ROOT/s["path"].replace("res://","")
        if not p.is_file(): issues.append(f"missing raster master: {p.relative_to(ROOT)}")
        else:
            with Image.open(p) as im:
                if list(im.size)!=s["size"]: issues.append(f"master dimensions mismatch: {p.name}")
    facts += [f"tiles: {len(tiles)} listed",f"props: {len(meta.get('props',{}))}",f"raster masters: {len(meta.get('editable_raster_masters',[]))}"]
    return facts,issues

def main():
    OUT.mkdir(parents=True,exist_ok=True); meta=json.loads((ROOT/"resources/art_pack_g03.json").read_text(encoding="utf-8"))
    boards=[tile_board(meta),path_board(),transitions_board(),props_board(),*character_boards(),map_preview()]
    facts,issues=audit(meta)
    report={"audited_visual_assets":23+2+32+5,"facts":facts,"objective_issues":issues,"review_boards":[str(p.relative_to(ROOT)) for p in boards],"limitations":["Static Pillow boards are review aids; they do not reproduce Godot texture filtering, TileMapLayer drawing or animation timing.","Seam quality, path semantic compatibility and artistic direction require visual judgment."]}
    (OUT/"audit_g04.json").write_text(json.dumps(report,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
    for p in boards: print(p.relative_to(ROOT))
    print(json.dumps(report,ensure_ascii=False,indent=2))
    raise SystemExit(1 if issues else 0)
if __name__=="__main__": main()
