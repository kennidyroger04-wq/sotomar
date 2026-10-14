#!/usr/bin/env python3
"""Normalize generated G05 transparent atlases into stable Godot sprite sheets."""
from __future__ import annotations
import json
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "art/source/generated_g05"
WAY = ROOT / "assets/characters/wayfarer_g05"
ENEMY = ROOT / "assets/characters/moss_raider_g05"
GEAR = ROOT / "assets/equipment/g05"
DIRECTIONS = ["se", "sw", "nw", "ne"]
ACTION_FPS = {"idle":4,"walk":8,"attack":6,"hurt":6,"defend":5,"cast":6,"death":4}
WAY_ACTIONS = {"attack":"wayfarer_attack_master.png","hurt":"wayfarer_hurt_master.png","defend":"wayfarer_defend_master.png","cast":"wayfarer_cast_master.png","death":"wayfarer_death_master_v2.png"}
ENEMY_ACTIONS = {"idle":"moss_raider_idle_master.png","walk":"moss_raider_walk_master.png","attack":"moss_raider_attack_master.png","hurt":"moss_raider_hurt_master.png","death":"moss_raider_death_master.png"}

def contain(image, size, pivot_y=152):
    image=image.convert("RGBA")
    alpha=image.getchannel("A")
    # Ignore antialias color fringing with near-zero opacity when measuring the silhouette.
    bounds=alpha.point(lambda a: 255 if a >= 24 else 0).getbbox()
    if not bounds: raise ValueError("empty atlas cell")
    sprite=image.crop(bounds)
    max_w,max_h=size[0]-12, size[1]-10
    sprite.thumbnail((max_w,max_h),Image.Resampling.LANCZOS)
    canvas=Image.new("RGBA",size,(0,0,0,0))
    canvas.alpha_composite(sprite,((size[0]-sprite.width)//2,pivot_y-sprite.height))
    return canvas

def row_cells(source, row, row_count=4, columns=4):
    """Find four separated transparent sprites in this row; fallback to equal cells."""
    y0,y1=round(row*source.height/row_count),round((row+1)*source.height/row_count)
    alpha=source.getchannel("A")
    threshold=max(4,round((y1-y0)*0.018))
    active=[]
    for x in range(source.width):
        count=sum(1 for value in alpha.crop((x,y0,x+1,y1)).get_flattened_data() if value>=24)
        active.append(count>threshold)
    segments=[]; start=None; last=None
    for x,on in enumerate(active+[False]):
        if on:
            if start is None: start=x
            last=x
        elif start is not None:
            segments.append([start,last+1]);start=None
    # Join small gaps caused by holes between costume/weapon pieces.
    merged=[]
    for segment in segments:
        if merged and segment[0]-merged[-1][1] <= 5:
            merged[-1][1]=segment[1]
        else: merged.append(segment)
    if len(merged)==columns:
        return [(x0,y0,x1,y1) for x0,x1 in merged]
    return [(round(col*source.width/columns),y0,round((col+1)*source.width/columns),y1) for col in range(columns)]

def export_character(action_map, dest, character):
    records={}
    dest.mkdir(parents=True,exist_ok=True)
    for action,filename in action_map.items():
        source=Image.open(SOURCE/filename).convert("RGBA")
        sheet=Image.new("RGBA",(512,640),(0,0,0,0)); boxes=[]
        for row,direction in enumerate(DIRECTIONS):
            row_boxes=row_cells(source,row)
            for col in range(4):
                box=row_boxes[col]
                raw=source.crop(box)
                alpha=raw.getchannel("A").point(lambda a:255 if a>=24 else 0)
                bounds=alpha.getbbox()
                if not bounds: raise ValueError(f"empty frame: {filename} {direction} {col}")
                frame=contain(raw,(128,160),152)
                sheet.alpha_composite(frame,(col*128,row*160))
                boxes.append({"direction":direction,"frame":col,"source_cell":list(box),"source_alpha_bounds":list(bounds),"pivot":[64,152]})
        out=dest/f"{character}_{action}.png"; sheet.save(out,optimize=True)
        records[action]={"path":f"res://assets/characters/{dest.name}/{out.name}","frame_size":[128,160],"rows":4,"columns":4,"directions":DIRECTIONS,"fps":ACTION_FPS[action],"loop":action in ("idle","walk"),"pivot":[64,152],"frames":boxes,"source":f"res://art/source/generated_g05/{filename}"}
    return records

def export_equipment():
    source=Image.open(SOURCE/"equipment_master.png").convert("RGBA")
    GEAR.mkdir(parents=True,exist_ok=True)
    records={}
    # Atlas is two rows: sword, buckler; columns follow the same four directions.
    for slot,row in (("sword",0),("shield",1)):
        sheet=Image.new("RGBA",(512,160),(0,0,0,0)); poses=[]
        for col,direction in enumerate(DIRECTIONS):
            box=(round(col*source.width/4),round(row*source.height/2),round((col+1)*source.width/4),round((row+1)*source.height/2))
            crop=source.crop(box); bounds=crop.getchannel("A").point(lambda a:255 if a>=24 else 0).getbbox()
            if not bounds: raise ValueError(f"empty {slot} direction {direction}")
            item=crop.crop(bounds); item.thumbnail((46,60) if slot=="sword" else (48,48),Image.Resampling.LANCZOS)
            frame=Image.new("RGBA",(128,160),(0,0,0,0))
            # Anchor positions are a documented neutral hold position; animated attacks use co-rendered action art.
            anchors={"se":(92,94),"sw":(36,94),"nw":(36,94),"ne":(92,94)}
            ax,ay=anchors[direction]
            frame.alpha_composite(item,(ax-item.width//2,ay-item.height//2))
            sheet.alpha_composite(frame,(col*128,0))
            poses.append({"direction":direction,"rect":[col*128,0,128,160],"item_pivot":list(anchors[direction]),"source_bounds":list(bounds)})
        out=GEAR/f"wayfarer_{slot}_idle.png"; sheet.save(out,optimize=True)
        records[slot]={"path":f"res://assets/equipment/g05/{out.name}","frame_size":[128,160],"directions":DIRECTIONS,"poses":poses,"source":"res://art/source/generated_g05/equipment_master.png"}
    return records

def main():
    way=export_character(WAY_ACTIONS,WAY,"wayfarer")
    enemy=export_character(ENEMY_ACTIONS,ENEMY,"moss_raider")
    gear=export_equipment()
    metadata={"package":"Sotomar/Fímbria original combat art G05","status":"prototype_requires_visual_review","directions":DIRECTIONS,"frame_size":[128,160],"pivot":[64,152],"characters":{"wayfarer":{"base_sheet":"res://assets/characters/wayfarer_v1/wayfarer_v1.png","existing_actions":{"idle":{"fps":4,"loop":True,"path":"res://assets/characters/wayfarer_v1/wayfarer_v1.png"},"walk":{"fps":8,"loop":True,"path":"res://assets/characters/wayfarer_v1/wayfarer_v1.png"}},"actions":way},"moss_raider":{"description":"Original moss goblin raider, shorter and stockier than the Wayfarer.","scale":0.82,"actions":enemy}},"equipment":gear,"impact_events":{"wayfarer_attack":{"frame":2,"event":"impact"},"moss_raider_attack":{"frame":2,"event":"impact"},"wayfarer_cast":{"frame":2,"event":"release"},"wayfarer_defend":{"frame":2,"event":"block"},"wayfarer_hurt":{"frame":1,"event":"damage_received"},"wayfarer_death":{"frame":3,"event":"defeated"},"moss_raider_hurt":{"frame":1,"event":"damage_received"},"moss_raider_death":{"frame":3,"event":"defeated"}},"effect_ids":["physical_slash","impact","shield_block","damage_flash","defeat_marker","spell_release"],"layering":{"neutral":"Separate sword/shield overlay sheets attach to a CharacterRig and share its transform.","combat":"The action atlases are co-rendered with their held weapon for pose continuity. Hide static overlays during attack/defend actions to prevent doubled equipment.","logical_position":"Equipment is visual-only and inherits the rig position; it never edits the logical grid cell."}}
    (ROOT/"resources/combat/combat_art_g05.json").write_text(json.dumps(metadata,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
    print("Exported",sum(len(x) for x in (way,enemy)),"action sheets and",len(gear),"equipment sheets")
if __name__=="__main__": main()
