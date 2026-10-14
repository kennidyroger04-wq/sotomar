#!/usr/bin/env python3
"""Create labeled static animation boards and GIF previews for G05."""
from __future__ import annotations
import json
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont
ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/"reviews/g05"
BG=(34,40,48,255); CARD=(50,58,68,255); INK=(242,237,222,255); MUTED=(182,193,201,255)
DIRECTIONS=["SE","SW","NW","NE"]
WAY_ACTIONS=["idle","walk","attack","hurt","defend","cast","death"]
ENEMY_ACTIONS=["idle","walk","attack","hurt","death"]
def font(size=17):
    for path in ("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf","/usr/share/fonts/truetype/liberation2/LiberationSans-Regular.ttf"):
        if Path(path).exists(): return ImageFont.truetype(path,size)
    return ImageFont.load_default()
F=font(21); FS=font(15); FXS=font(13)
def rgba_canvas(w,h,title,subtitle):
    im=Image.new("RGBA",(w,h),BG); d=ImageDraw.Draw(im);d.text((22,14),title,font=F,fill=INK);d.text((22,43),subtitle,font=FS,fill=MUTED);return im
def load_frame(path,row,col,size=(128,160)):
    im=Image.open(path).convert("RGBA");return im.crop((col*size[0],row*size[1],(col+1)*size[0],(row+1)*size[1]))
def blit_fit(canvas,frame,box):
    x,y,w,h=box; frame=frame.copy();frame.thumbnail((w,h),Image.Resampling.LANCZOS);canvas.alpha_composite(frame,(x+(w-frame.width)//2,y+(h-frame.height)))
def sheet_board(character, actions, frame_fn, name):
    cell_w,cell_h=92,108; left=108; block_h=4*cell_h+34; header=78; gap=10
    width=left+4*cell_w+24;height=header+len(actions)*(block_h+gap)
    im=rgba_canvas(width,height,f"G05 · {name}","Quadros em ordem de reprodução · pivô dos pés alinhado ao rodapé do quadro")
    draw=ImageDraw.Draw(im)
    for ai,action in enumerate(actions):
        y=header+ai*(block_h+gap)
        draw.rounded_rectangle((10,y,width-10,y+block_h-5),radius=8,fill=CARD)
        draw.text((20,y+10),action.upper(),font=FS,fill=INK)
        for row,direction in enumerate(DIRECTIONS):
            yy=y+30+row*cell_h
            draw.text((20,yy+31),direction,font=FXS,fill=MUTED)
            for col in range(4):
                frame=frame_fn(action,row,col)
                blit_fit(im,frame,(left+col*cell_w,yy,cell_w-8,cell_h-8))
    out=OUT/f"{name.lower().replace(' ','_')}_animations.png";im.convert("RGB").save(out,optimize=True);return out

def gear_board():
    im=rgba_canvas(820,330,"G05 · Equipamento modular","Espada e broquel em folhas RGBA separadas · quatro orientações · pivôs de ancoragem registrados")
    d=ImageDraw.Draw(im)
    for row,slot in enumerate(["sword","shield"]):
        d.text((20,110+row*110),slot.upper(),font=FS,fill=INK)
        sheet=Image.open(ROOT/f"assets/equipment/g05/wayfarer_{slot}_idle.png").convert("RGBA")
        for col,di in enumerate(DIRECTIONS):
            cell=sheet.crop((col*128,0,(col+1)*128,160))
            im.alpha_composite(cell,(130+col*160,70+row*110));d.text((180+col*160,166+row*110),di,font=FXS,fill=MUTED)
    out=OUT/"equipment_layers.png";im.convert("RGB").save(out,optimize=True);return out

def proportions_board():
    im=rgba_canvas(820,360,"G05 · Proporções em combate","Wayfarer × Saqueador musgoso · mesma escala de tela, pivôs nos pés")
    d=ImageDraw.Draw(im); floor_y=290
    d.ellipse((195,floor_y-8,360,floor_y+8),fill=(15,18,22,210));d.ellipse((480,floor_y-7,625,floor_y+7),fill=(15,18,22,210))
    way=Image.open(ROOT/"assets/characters/wayfarer_v1/wayfarer_v1.png").convert("RGBA").crop((0,0,128,160))
    raider=load_frame(ROOT/"assets/characters/moss_raider_g05/moss_raider_idle.png",0,0)
    blit_fit(im,way,(180,95,190,195));blit_fit(im,raider,(470,125,170,165))
    d.text((219,315),"WAYFARER",font=FS,fill=INK);d.text((497,315),"MOSS RAIDER",font=FS,fill=INK)
    out=OUT/"character_proportions.png";im.convert("RGB").save(out,optimize=True);return out

def combat_sequence():
    im=rgba_canvas(1040,360,"G05 · Sequências de combate","Prancha de referência SE · Wayfarer ataque/conjuração · Saqueador ataque/recebimento de dano")
    d=ImageDraw.Draw(im)
    rows=[("Wayfarer · attack",ROOT/"assets/characters/wayfarer_g05/wayfarer_attack.png",0),("Wayfarer · cast",ROOT/"assets/characters/wayfarer_g05/wayfarer_cast.png",1),("Raider · attack",ROOT/"assets/characters/moss_raider_g05/moss_raider_attack.png",2),("Raider · hurt",ROOT/"assets/characters/moss_raider_g05/moss_raider_hurt.png",3)]
    for i,(title,path,row) in enumerate(rows):
        y=76+i*68;d.text((18,y+23),title,font=FXS,fill=INK)
        for col in range(4): blit_fit(im,load_frame(path,0,col),(250+col*180,y,108,64))
    out=OUT/"combat_sequences.png";im.convert("RGB").save(out,optimize=True);return out

def static_demo_preview():
    im=rgba_canvas(940,430,"G05 · Prévia estática da cena de combate","Composição Pillow de teste · camadas em idle · ataque ilustrado separado · não substitui o renderizador Godot")
    d=ImageDraw.Draw(im)
    # A quiet stage and feet anchors make relative character size easy to compare.
    d.rounded_rectangle((55,98,885,365),radius=24,fill=(44,55,66,255),outline=(91,112,124,255),width=2)
    for x in (315,645):
        d.ellipse((x-84,317,x+84,339),fill=(16,20,25,210))
    base=Image.open(ROOT/"assets/characters/wayfarer_v1/wayfarer_v1.png").convert("RGBA")
    way=base.crop((0,0,128,160))
    sword=Image.open(ROOT/"assets/equipment/g05/wayfarer_sword_idle.png").convert("RGBA").crop((0,0,128,160))
    shield=Image.open(ROOT/"assets/equipment/g05/wayfarer_shield_idle.png").convert("RGBA").crop((0,0,128,160))
    # Match SpriteFrames' centered frame and (0,-72) feet offset in the Godot rig.
    hero=Image.new("RGBA",(160,190),(0,0,0,0));hero.alpha_composite(way,(16,15));hero.alpha_composite(sword,(40,37));hero.alpha_composite(shield,(16,15))
    blit_fit(im,hero,(205,130,220,205))
    raider=load_frame(ROOT/"assets/characters/moss_raider_g05/moss_raider_idle.png",0,0)
    blit_fit(im,raider,(560,175,165,155))
    d.text((268,344),"WAYFARER · SE",font=FS,fill=INK);d.text((582,344),"MOSS RAIDER · SE",font=FS,fill=INK)
    out=OUT/"combat_demo_static.png";im.convert("RGB").save(out,optimize=True);return out

def gifs():
    output=[]
    combos=[("wayfarer_attack",ROOT/"assets/characters/wayfarer_g05/wayfarer_attack.png",0),
            ("wayfarer_cast",ROOT/"assets/characters/wayfarer_g05/wayfarer_cast.png",3),
            ("moss_raider_walk",ROOT/"assets/characters/moss_raider_g05/moss_raider_walk.png",0),
            ("moss_raider_attack",ROOT/"assets/characters/moss_raider_g05/moss_raider_attack.png",0)]
    for name,path,row in combos:
        frames=[]
        for col in range(4):
            frame=load_frame(path,row,col).resize((256,320),Image.Resampling.LANCZOS)
            bg=Image.new("RGBA",frame.size,BG);bg.alpha_composite(frame);frames.append(bg.convert("P",palette=Image.Palette.ADAPTIVE))
        out=OUT/f"{name}.gif";frames[0].save(out,save_all=True,append_images=frames[1:],duration=140,loop=0,disposal=2);output.append(out)
    return output

def way_frame(action,row,col):
    if action in ("idle","walk"):
        sheet=Image.open(ROOT/"assets/characters/wayfarer_v1/wayfarer_v1.png").convert("RGBA")
        offset=0 if action=="idle" else 4
        return sheet.crop(((offset+col)*128,row*160,(offset+col+1)*128,(row+1)*160))
    return load_frame(ROOT/f"assets/characters/wayfarer_g05/wayfarer_{action}.png",row,col)

def main():
    OUT.mkdir(parents=True,exist_ok=True)
    way=sheet_board("wayfarer",WAY_ACTIONS,way_frame,"Wayfarer")
    # G03 idle/walk are an additional resource and referenced separately in the documentation.
    enemy=sheet_board("moss_raider",ENEMY_ACTIONS,lambda a,r,c: load_frame(ROOT/f"assets/characters/moss_raider_g05/moss_raider_{a}.png",r,c),"Moss Raider")
    boards=[way,enemy,gear_board(),proportions_board(),combat_sequence(),static_demo_preview()]
    animations=gifs()
    manifest={"boards":[p.relative_to(ROOT).as_posix() for p in boards],"gifs":[p.relative_to(ROOT).as_posix() for p in animations],"note":"Static contact sheets and short GIFs aid review but do not replace Godot playback inspection."}
    (OUT/"review_index.json").write_text(json.dumps(manifest,indent=2)+"\n",encoding="utf-8")
    for p in boards+animations: print(p.relative_to(ROOT))
if __name__=="__main__":main()
