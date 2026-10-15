#!/usr/bin/env python3
"""Deterministic, data-driven 2D creature sprite factory for Sotomar/Fímbria.

The JSON species definitions are the editable source. Rendering uses Pillow at
2x resolution and downsamples once to the shared transparent frame contract.
No external service or third-party art is required.
"""
from __future__ import annotations

import json, math, hashlib, time
from pathlib import Path
from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parents[2]
SPEC_DIR = ROOT / "art/source/sprite_factory/specs"
SOURCE = ROOT / "art/source/sprite_factory/creatures"
RUNTIME = ROOT / "assets/characters"
REPORT = ROOT.parent / "reports/g18d"
W, H, SCALE, PIVOT_Y = 192, 224, 2, 214
DIRECTIONS = ["front", "left", "back", "right"]
ACTIONS = ["idle", "walk", "attack", "hurt", "defeat"]
FRAMES = 4

# Appearance descriptions are explicitly proposals where the source canon only
# establishes a name, allowed exposure and combat profile.
DEFAULT_SPECIES = [
 {"id":"CRE_CASCUDO_DE_CAL","name":"Cascudo-de-cal","family":"arthropod","canon":"Small, robust burrowing creature is the G18C visual proposal; canon itself records name, NORMAL/ENCHARCADO and melee profile.","proposal":"Segmented pale-limestone beetle, ochre markings, curious antennae; continues G18C motif.","palette":["#d9c38b","#b9894e","#76523b","#f1dc9d"],"build":"beetle"},
 {"id":"CRE_PAPA_MEL","name":"Papa-mel","family":"quadruped_forager","canon":"Name, NORMAL/ORVALHADO exposure and melee profile only; no documented anatomy or diet.","proposal":"Low, round browsing mammal with broad muzzle and amber cheek ruffs; the name is not treated as proof of diet.","palette":["#d98b49","#a75639","#613b36","#f4c978"],"build":"forager"},
 {"id":"CRE_TOPETAO","name":"Topetão","family":"crest_beast","canon":"Name, NORMAL/MAREJADO exposure and melee profile only; anatomy is not documented.","proposal":"Compact sturdy beast with a clearly separated upright feather-like crest and broad paws.","palette":["#c97852","#81444a","#543746","#f0b87e"],"build":"crest"},
 {"id":"CRE_FIANDEIRA","name":"Fiandeira","family":"arachnid","canon":"Name, NORMAL/MAREJADO/ENCHARCADO exposures and ranged_control profile; anatomy and web mechanics are not documented.","proposal":"Eight-legged small arthropod with two ribbon-like tactile feelers; no web or new behavior is implied.","palette":["#778f75","#526b60","#344b4b","#c5d5a2"],"build":"spider"},
 {"id":"CRE_SAPO_DE_POCA","name":"Sapo-de-poça","family":"amphibian","canon":"Name, MAREJADO exposure and control profile; no additional anatomy or effects are documented.","proposal":"Broad, low amphibian with long hind legs, smooth teal skin and raised eyes.","palette":["#6aa99a","#43847d","#315963","#c9df9c"],"build":"frog"},
 {"id":"CRE_LERDO_DE_MUSGO","name":"Lerdo-de-musgo","family":"slow_gastropod","canon":"Name, MAREJADO/ENCHARCADO exposures and support profile only; anatomy is not documented.","proposal":"Large gliding snail-like body with a layered mossy shell and planted eye stalks; no new support mechanic implied.","palette":["#79935b","#a58b59","#536b47","#d2c98b"],"build":"slug"},
 {"id":"CRE_FAREJADOR_DE_BREJO","name":"Farejador-de-brejo","family":"scent_hound","canon":"Name, MAREJADO exposure and pack profile only; no species or anatomy is documented.","proposal":"Lean marshland quadruped with long muzzle, lowered nose and large ears; not a real-world species claim.","palette":["#92765c","#675748","#443f42","#ceb48a"],"build":"hound"},
]

def load_species_specs():
    """Read editable JSON specs; seed the seven canon-linked defaults once."""
    SPEC_DIR.mkdir(parents=True, exist_ok=True)
    for spec in DEFAULT_SPECIES:
        path = SPEC_DIR / f"{spec['id'].lower()}.json"
        if not path.exists():
            path.write_text(json.dumps(spec, ensure_ascii=False, indent=2) + "\n")
    specs=[]
    for path in sorted(SPEC_DIR.glob("*.json")):
        spec=json.loads(path.read_text())
        required={"id","name","family","canon","proposal","palette","build"}
        missing=required-set(spec)
        if missing:
            raise ValueError(f"{path}: missing fields {sorted(missing)}")
        if spec["build"] not in {"beetle","forager","crest","spider","frog","slug","hound","humanoid"}:
            raise ValueError(f"{path}: unsupported anatomy builder {spec['build']!r}")
        if len(spec["palette"]) != 4:
            raise ValueError(f"{path}: expected four palette colors")
        specs.append(spec)
    return specs

def rgb(value: str):
    v=value.lstrip('#'); return tuple(int(v[i:i+2],16) for i in (0,2,4))

class Canvas:
    def __init__(self):
        self.im=Image.new('RGBA',(W*SCALE,H*SCALE),(0,0,0,0)); self.d=ImageDraw.Draw(self.im)
    def p(self, pt): return (round(pt[0]*SCALE),round(pt[1]*SCALE))
    def poly(self, pts, fill, outline='#443b3a', width=2):
        pts=[self.p(q) for q in pts]; self.d.polygon(pts,fill=fill)
        if outline and width: self.d.line(pts+[pts[0]],fill=outline,width=width*SCALE,joint='curve')
    def ell(self, box, fill, outline='#443b3a', width=2):
        box=(round(box[0]*SCALE),round(box[1]*SCALE),round(box[2]*SCALE),round(box[3]*SCALE))
        self.d.ellipse(box,fill=fill,outline=outline,width=width*SCALE if outline else 1)
    def line(self, pts, fill, width=2): self.d.line([self.p(q) for q in pts],fill=fill,width=width*SCALE,joint='curve')
    def dot(self, xy, r, fill, outline=None): self.ell((xy[0]-r,xy[1]-r,xy[0]+r,xy[1]+r),fill,outline,1 if outline else 0)
    def finish(self): return self.im.resize((W,H),Image.Resampling.LANCZOS)

def draw(spec, direction, action, frame):
    c=Canvas(); base, mid, shade, light=spec['palette']; kind=spec['build']
    # Mirrored lateral views preserve a stable four-way read without moving feet.
    mirror = -1 if direction=='left' else 1
    frontal=direction=='front'; rear=direction=='back'; side=direction in ('left','right')
    phase=(frame-1.5)/1.5
    walk=action=='walk'; attack=action=='attack'; hurt=action=='hurt'; defeat=action=='defeat'
    bob=(math.sin(frame*math.pi/2)*2 if walk else math.sin(frame*math.pi/2)*1.1 if action=='idle' else 0)
    lunge=(4 if attack and frame in (1,2) else -2 if hurt else 0)*mirror
    fall=12 if defeat else 0
    # Body landmarks are measured upward from the shared foot contact zone.
    # Keep visible paws/shoes on the alpha baseline; the shadow must not be the
    # only opaque content near the documented pivot.
    cy=196+bob+fall
    # Ground shadow and two restrained light strokes anchor every family.
    c.ell((57,193,137,212),(35,42,40,68),None,0)
    if kind=='beetle':
        # Six articulated feet, separated head/thorax and three shell plates.
        leg_shift=phase*5 if walk else (7 if attack and frame==2 else 0)
        for idx,x in enumerate([70,82,110,122,77,115]):
            side_sign=-1 if idx%2==0 else 1
            joint_y=cy-25+(idx%3)*6
            endx=x+side_sign*(9+leg_shift*((idx%2)*2-1))
            c.line([(x,joint_y),(x+side_sign*5,joint_y+9),(endx,cy+13)],shade,5)
            c.ell((endx-3,cy+10,endx+4,cy+16),mid,shade,1)
        c.ell((72+lunge,cy-55,122+lunge,cy-5),mid,shade,3)
        # Armor shell with segmented plates, raised highlight and ochre flecks.
        c.ell((59+lunge,cy-85,135+lunge,cy-28),base,shade,4)
        c.ell((68+lunge,cy-82,108+lunge,cy-31),light,shade,2)
        c.line([(104+lunge,cy-77),(105+lunge,cy-36)],shade,3)
        for x,y in [(72,cy-66),(88,cy-75),(118,cy-61)]: c.ell((x+lunge-4,y-2,x+lunge+3,y+3),'#c48d4d',shade,1)
        hx=100+lunge+(17*mirror if side else 0)
        c.ell((hx-19,cy-67,hx+18,cy-38),mid,shade,3)
        if not rear:
            for ex in ([hx-8] if side else [hx-9,hx+8]):
                c.line([(ex,cy-62),(ex+mirror*3,cy-78),(ex+mirror*8,cy-84)],shade,2)
                c.dot((ex+mirror*8,cy-84),3,light,shade)
            c.ell((hx+mirror*5-3,cy-56,hx+mirror*5+2,cy-51),'#292e32',None,0)
        else:
            c.line([(hx-11,cy-61),(hx,cy-56),(hx+11,cy-61)],shade,2)
            c.dot((hx,cy-51),2,light)
    elif kind in ('forager','crest','hound'):
        # Mammal profile, each species has different body ratio and head profile.
        if kind=='forager': body=(61,cy-66,137,cy-17); headw=32; muzzle=13; legw=8
        elif kind=='crest': body=(55,cy-75,132,cy-13); headw=34; muzzle=9; legw=10
        else: body=(56,cy-60,139,cy-23); headw=29; muzzle=20; legw=7
        stride=phase*6 if walk else 0
        for idx,x in enumerate([69,91,112,130]):
            offset=stride*(1 if idx in (0,3) else -1)
            hip=(x,cy-28 if kind!='crest' else cy-35)
            foot=(x+offset,cy+13)
            c.line([hip,(x+offset*0.4,cy-7),foot],shade,legw+2)
            c.line([hip,(x+offset*0.4,cy-7),foot],mid,legw)
            c.line([foot,(foot[0]+4,foot[1]+1)],shade,3)
        c.ell((body[0]+lunge,body[1],body[2]+lunge,body[3]),base,shade,4)
        # distinct back ridge/marking: sunlit patches rather than a recolor.
        if kind=='forager':
            c.ell((72+lunge,cy-62,117+lunge,cy-39),light,None,0)
            for x in [82,95,108]: c.dot((x+lunge,cy-50),2,'#a8673d')
        elif kind=='crest':
            c.ell((72+lunge,cy-72,110+lunge,cy-38),mid,shade,2)
            for i in range(5):
                x=86+i*5+lunge; top=cy-103+(i%2)*5
                c.poly([(x-5,cy-69),(x-2,top),(x+6,cy-66)],light,shade,2)
            c.line([(69,cy-48),(48,cy-39),(42,cy-43)],shade,4)
        else:
            c.ell((62,cy-67,105,cy-36),light,None,0)
            c.ell((56,cy-75,75,cy-49),base,shade,2); c.ell((58,cy-71,70,cy-55),light,None,0)
            c.ell((124,cy-76,148,cy-54),base,shade,2)
        # Neck/head profile points right or turns to front/back by shape width.
        hx=(119 if not frontal and not rear else 100)+lunge
        if kind=='hound' and side: hx=119+lunge
        c.ell((hx-headw//2,cy-78,hx+headw//2,cy-38),mid,shade,3)
        if not rear:
            mx=hx+(muzzle*mirror if side else 0)
            c.ell((mx-10,cy-59,mx+14,cy-42),light,shade,2)
            c.ell((mx+mirror*7-3,cy-55,mx+mirror*7+3,cy-50),shade,None,0)
            for ex in ([hx+mirror*4] if side else [hx-8,hx+8]):
                c.ell((ex-4,cy-69,ex+4,cy-61),'#f1d28a',shade,1)
                c.dot((ex+mirror,cy-65),2,'#292d34')
        if kind=='forager':
            # Two honey-amber cheek tufts make the head readily identifiable.
            c.ell((hx-20,cy-57,hx-7,cy-41),'#e8b75f',shade,2)
        if attack:
            c.line([(hx+mirror*17,cy-48),(hx+mirror*26,cy-46)],light,3)
    elif kind=='spider':
        # Eight separated legs, central abdomen and smaller raised cephalothorax.
        leg_motion=phase*7 if walk else 8 if attack and frame==2 else 0
        for i in range(4):
            side_sign=-1 if i%2==0 else 1
            y=cy-38+i*10; hipx=91 if i<2 else 105
            knee=(hipx+side_sign*(15+leg_motion*((i%2)*2-1)),y-8)
            foot=(hipx+side_sign*(28+leg_motion*((i%2)*2-1)),cy+9)
            c.line([(hipx,y),knee,foot],shade,6)
            c.line([(hipx,y),knee,foot],mid,3)
            c.ell((foot[0]-3,foot[1]-3,foot[0]+4,foot[1]+3),light,shade,1)
        c.ell((60+lunge,cy-65,132+lunge,cy-20),base,shade,4)
        for i in range(4):
            x=70+i*14+lunge; y=cy-48+(i%2)*7
            c.ell((x-5,y-5,x+5,y+5),light,shade,1)
        c.ell((82+lunge,cy-83,117+lunge,cy-48),mid,shade,3)
        if not rear and side:
            eye_x=95 if direction=='left' else 109
            c.ell((eye_x+lunge-3,cy-77,eye_x+lunge+4,cy-69),'#ead795',shade,1)
            c.line([(eye_x+lunge,cy-53),(eye_x+lunge+mirror*11,cy-47)],shade,3)
        elif not rear:
            c.ell((92+lunge,cy-76,98+lunge,cy-70),'#ead795',shade,1)
            c.ell((105+lunge,cy-76,111+lunge,cy-70),'#ead795',shade,1)
        else:
            c.ell((92+lunge,cy-74,108+lunge,cy-58),base,shade,1)
        c.line([(91+lunge,cy-79),(85+lunge,cy-103),(77+lunge,cy-112)],light,4)
        c.line([(108+lunge,cy-79),(117+lunge,cy-101),(126+lunge,cy-105)],light,4)
        for x in (77,126): c.ell((x+lunge-4,cy-116,x+lunge+5,cy-108),base,shade,1)
    elif kind=='frog':
        # Wide amphibian torso, long spring legs, webbed toes and high eyes.
        leg_motion=phase*8 if walk else 10 if attack and frame in (1,2) else 0
        for s in (-1,1):
            c.line([(82+s*16,cy-21),(82+s*(25+leg_motion),cy+4),(82+s*(34+leg_motion),cy+12)],shade,11)
            c.line([(82+s*16,cy-21),(82+s*(25+leg_motion),cy+4),(82+s*(34+leg_motion),cy+12)],mid,7)
            for toe in range(3): c.line([(82+s*(34+leg_motion),cy+12),(82+s*(40+leg_motion),cy+11+toe*2)],shade,2)
        c.ell((57+lunge,cy-63,136+lunge,cy-14),base,shade,4)
        c.ell((69+lunge,cy-53,112+lunge,cy-26),light,None,0)
        if not rear:
            for x in ([102+lunge] if side else [79+lunge,113+lunge]):
                c.ell((x-11,cy-80,x+11,cy-54),mid,shade,2)
                c.ell((x-7,cy-74,x+7,cy-59),'#f3d78a',shade,1)
                c.dot((x+2,cy-67),3,'#293540')
        else:
            c.ell((77+lunge,cy-72,116+lunge,cy-47),mid,shade,2)
            for x in [85,96,107]: c.line([(x+lunge,cy-69),(x+lunge,cy-52)],shade,1)
        if not rear:
            c.line([(112+lunge,cy-39),(129+lunge,cy-38)],shade,2)
            c.dot((122+lunge,cy-38),2,shade)
        for x,y in [(72,cy-40),(121,cy-48),(91,cy-31)]: c.dot((x+lunge,y),2,'#9ecb88')
    elif kind=='slug':
        # Broad, slow gliding foot and a real raised, banded shell silhouette.
        drift=phase*3 if walk else 0
        c.ell((54+drift,cy-26,140+drift,cy+12),base,shade,3)
        c.ell((62+drift,cy-34,127+drift,cy-15),light,None,0)
        c.ell((82+lunge,cy-91,136+lunge,cy-34),mid,shade,4)
        for k in range(4):
            y=cy-82+k*11
            c.line([(88+lunge,y),(105+lunge,y+5),(128+lunge,y)],shade,2)
        c.ell((65+lunge,cy-62,98+lunge,cy-32),base,shade,3)
        if not rear:
            stalks = [73 if direction == "left" else 89] if side else [73,89]
            for x in stalks:
                c.line([(x+lunge,cy-55),(x+lunge,cy-91),(x+lunge+(4 if x==89 else -3),cy-101)],shade,3)
                c.ell((x+lunge-7,cy-108,x+lunge+7,cy-95),light,shade,2)
                c.dot((x+lunge+2,cy-102),2,'#263139')
            if side:
                seam_x=92 if direction == "left" else 121
                c.line([(seam_x,cy-72),(seam_x+mirror*7,cy-58)],light,3)
        else:
            c.line([(72,cy-50),(96,cy-60),(124,cy-49)],shade,3)
    elif kind=='humanoid':
        # Shared biped skeleton with occupation-specific proportion and props.
        profile=spec.get('profile','lia'); stride=phase*5 if walk else 0
        if profile=='lia': torso=(75,cy-99,119,cy-32); head=(82,cy-145,114,cy-105); leg_color=shade
        elif profile=='nilo': torso=(70,cy-99,122,cy-31); head=(81,cy-143,113,cy-105); leg_color=shade
        else: torso=(67,cy-95,125,cy-29); head=(77,cy-140,117,cy-103); leg_color=shade
        for idx,x in enumerate((84,111)):
            kick=stride*(1 if idx==0 else -1)
            c.line([(x,cy-35),(x+kick,cy-12),(x+kick,cy+12)],leg_color,10)
            c.line([(x,cy-35),(x+kick,cy-12),(x+kick,cy+12)],mid,6)
            c.ell((x+kick-6,cy+9,x+kick+8,cy+15),shade,shade,1)
        c.poly([(torso[0],torso[1]),(torso[2],torso[1]),(torso[2]-4,torso[3]),(torso[0]+4,torso[3])],base,shade,3)
        c.ell(head,mid,shade,3)
        # shoulders/arms swing in opposition to their legs.
        for s in (-1,1):
            ax=75 if s<0 else 119; hand_y=cy-48+(phase*3*s if walk else 0)
            c.line([(ax,cy-89),(ax+s*7,cy-63),(ax+s*5,hand_y)],shade,8)
            c.line([(ax,cy-89),(ax+s*7,cy-63),(ax+s*5,hand_y)],base,5)
            c.ell((ax+s*5-4,hand_y-3,ax+s*5+4,hand_y+5),light,shade,1)
        c.ell((head[0]-2,head[1]+2,head[2]+2,head[1]+17),shade,shade,2)
        # Proposal props are role-specific and do not activate NPC services.
        if profile=='lia':
            c.poly([(84,cy-132),(97,cy-153),(113,cy-132),(110,cy-124),(88,cy-124)],'#47766f',shade,2)
            c.ell((117,cy-84,137,cy-54),'#9b6946',shade,2)
            c.line([(121,cy-78),(133,cy-68)],light,2)
        elif profile=='nilo':
            c.line([(77,cy-85),(117,cy-85)],light,5)
            c.ell((116,cy-78,137,cy-53),'#698254',shade,2)
            for x in (121,129): c.ell((x,cy-69,x+4,cy-63),'#d0c877',shade,1)
            c.line([(64,cy-96),(60,cy-12)],shade,3)
        else:
            c.poly([(78,cy-58),(116,cy-58),(121,cy-33),(74,cy-33)],'#815b43',shade,2)
            c.ell((119,cy-77,139,cy-52),'#a57e50',shade,2)
            c.line([(127,cy-70),(134,cy-62)],light,2)
        if not rear:
            eye_x=100+(8*mirror if side else 0)
            c.dot((eye_x,cy-125),2,'#29343b')
            c.line([(eye_x-4,cy-114),(eye_x+4,cy-114)],shade,1)
        else:
            c.line([(86,cy-128),(110,cy-128)],shade,2)
        for x,y in [(96,cy-44),(110,cy-54),(121,cy-43)]: c.ell((x+lunge-4,y-5,x+lunge+4,y+3),'#91a760',shade,1)
    # Pose-specific action cues preserve animation meaning without combat logic.
    if hurt and frame in (1,2):
        c.line([(48,cy-108),(56,cy-101)],'#fff0c2',3); c.line([(143,cy-95),(137,cy-88)],'#fff0c2',3)
    if attack and frame==2:
        c.line([(139,cy-87),(148,cy-83)],'#f6d47e',3)
    if defeat:
        c.ell((75,cy-24,126,cy-12),shade,None,0)
        for x in [78,101,125]: c.line([(x,cy-26),(x+5,cy-19)],light,2)
    # directional marker differences: front/back maintain species shape while
    # lateral portraits move the face; the rear removes eye highlights above.
    if rear and kind in ('frog','slug'):
        c.line([(78,cy-55),(121,cy-55)],shade,2)
    im=c.finish()
    # Pose transforms are intentionally visible at game scale. The feet anchor
    # remains fixed during idle/walk/attack/hurt; defeat rotates around that
    # anchor so it reads as a fall rather than a color flash.
    shifts={
        'idle':[(0,0),(0,-2),(1,-3),(0,-1)],
        'walk':[(-3,-2),(2,-4),(3,-1),(-2,-4)],
        'attack':[(-2,2),(-5,-1),(7,-3),(3,0)],
        'hurt':[(0,0),(-5,1),(-8,4),(-3,2)],
        'defeat':[(0,0),(-2,2),(-5,3),(-7,4)],
    }
    dx,dy=shifts[action][frame]
    if direction=='left': dx=-dx
    im=im.transform((W,H),Image.Transform.AFFINE,(1,0,-dx,0,1,-dy),resample=Image.Resampling.BICUBIC)
    if action=='defeat':
        angle=[0,10,20,28][frame] * (-1 if direction in ('left','back') else 1)
        im=im.rotate(angle,resample=Image.Resampling.BICUBIC,center=(W//2,PIVOT_Y),expand=False)
    if mirror==-1:
        im=im.transpose(Image.Transpose.FLIP_LEFT_RIGHT)
    return im

def save_sheet(spec, action, frames):
    sheet=Image.new('RGBA',(W*4,H*4),(0,0,0,0))
    for d, direction in enumerate(DIRECTIONS):
        for f in range(FRAMES): sheet.alpha_composite(frames[(direction,f)],(d*W,f*H))
    path=SOURCE/spec['id'].lower()/f"{spec['id'].lower()}_{action}_master.png"
    path.parent.mkdir(parents=True,exist_ok=True); sheet.save(path,optimize=True)
    runtime=RUNTIME/(spec['id'].lower()+"_g18d")/f"{spec['id'].lower()}_{action}.png"
    runtime.parent.mkdir(parents=True,exist_ok=True); sheet.save(runtime,optimize=True)
    return path,runtime

def build_one(spec):
    t0=time.perf_counter(); root=SOURCE/spec['id'].lower(); root.mkdir(parents=True,exist_ok=True)
    actions=spec.get('actions',ACTIONS)
    if not actions or any(action not in ACTIONS for action in actions):
        raise ValueError(f"{spec['id']}: actions must be selected from {ACTIONS}")
    metadata={"id":spec['id'],"name":spec['name'],"canon_description":spec['canon'],"visual_proposal":spec['proposal'],"family":spec['family'],"source_spec":f"res://art/source/sprite_factory/specs/{spec['id'].lower()}.json","frame_size":[W,H],"pivot_feet":[W//2,PIVOT_Y],"directions":DIRECTIONS,"actions":{},"sprite_frames":f"res://resources/animations/{spec['id'].lower()}_g18d.tres","quality":{"unique_frames":True}}
    atlas_paths=[]; comparisons=[]; duplicates=[]; transparent=[]; bad_bounds=[]; useful=0
    for action in actions:
        per_action={}
        for direction in DIRECTIONS:
            cycle=[]
            for idx in range(FRAMES):
                im=draw(spec,direction,action,idx); cycle.append(im)
                if im.getchannel('A').getbbox() is None: transparent.append(f"{action}/{direction}/{idx}")
                bbox=im.getchannel('A').getbbox()
                if not bbox or abs((bbox[3]-1)-PIVOT_Y)>19: bad_bounds.append(f"{action}/{direction}/{idx}:{bbox}")
            per_action[direction]=cycle
            sig=[hashlib.sha1(x.tobytes()).hexdigest() for x in cycle]
            if len(set(sig))<4: duplicates.append(f"{action}/{direction}")
            useful += len(set(sig))
        atlas,runtime=save_sheet(spec,action,{(d,i):per_action[d][i] for d in DIRECTIONS for i in range(FRAMES)})
        atlas_paths.append(str(atlas.relative_to(ROOT))); comparisons.append((action,per_action))
        metadata['actions'][action]={"path":f"res://assets/characters/{spec['id'].lower()}_g18d/{runtime.name}","fps":{"idle":4,"walk":8,"attack":8,"hurt":8,"defeat":5}[action],"loop":action in ("idle","walk"),"frames_per_direction":FRAMES,"atlas_layout":"columns=front,left,back,right; rows=frame index"}
        frame_dir=root/'frames'/action; frame_dir.mkdir(parents=True,exist_ok=True)
        for direction in DIRECTIONS:
            for idx,im in enumerate(per_action[direction]): im.save(frame_dir/f"{direction}_{idx:02d}.png",optimize=True)
    # Contact sheet uses all five actions, four dirs and four frame poses.
    thumb_w,thumb_h=96,112; sheet=Image.new('RGBA',(thumb_w*16,thumb_h*len(actions)),(37,48,47,255)); d=ImageDraw.Draw(sheet)
    for row,(action,poses) in enumerate(comparisons):
        for col,direction in enumerate(DIRECTIONS):
            for f,im in enumerate(poses[direction]):
                thumb=im.resize((thumb_w,thumb_h),Image.Resampling.LANCZOS)
                sheet.alpha_composite(thumb,(col*4*thumb_w+f*thumb_w,row*thumb_h))
        d.text((3,row*thumb_h+3),action.upper(),fill='#fff0c5',stroke_width=1,stroke_fill='#303b36')
    (REPORT/'contact-sheets').mkdir(parents=True,exist_ok=True)
    sheet.save(REPORT/'contact-sheets'/f"{spec['id'].lower()}.png")
    gifs=[]
    for action in ('idle','walk','attack'):
        if action not in actions: continue
        seq=[]
        # One temporal frame contains all four orientations in the same phase.
        for frame_index in range(FRAMES):
            frame_board=Image.new('RGBA',(W*4,H),(36,48,48,255))
            for direction_index,direction in enumerate(DIRECTIONS):
                frame_board.alpha_composite(draw(spec,direction,action,frame_index),(W*direction_index,0))
            seq.append(frame_board)
        gif=REPORT/'gifs'/f"{spec['id'].lower()}_{action}.gif"; gif.parent.mkdir(parents=True,exist_ok=True)
        seq[0].save(gif,save_all=True,append_images=seq[1:],duration=180,loop=0); gifs.append(str(gif.relative_to(ROOT.parent)))
    manifest={**metadata,"master_sheets":[f"res://{p}" for p in atlas_paths],"review":{"contact_sheet":f"reports/g18d/contact-sheets/{spec['id'].lower()}.png","gifs":gifs},"integrity":{"frame_count":len(actions)*len(DIRECTIONS)*FRAMES,"unique_frame_count":useful,"duplicates":duplicates,"transparent_frames":transparent,"pivot_outliers":bad_bounds}}
    (ROOT/f"resources/art/{spec['id'].lower()}_g18d.json").write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n')
    # Copy full structured source definition next to outputs.
    (SPEC_DIR/f"{spec['id'].lower()}.json").write_text(json.dumps(spec,ensure_ascii=False,indent=2)+'\n')
    return {"id":spec['id'],"family":spec['family'],"actions":actions,"frames":len(actions)*4*FRAMES,"unique":useful,"duplicate_cycles":duplicates,"transparent":transparent,"pivot_outliers":bad_bounds,"seconds":round(time.perf_counter()-t0,2)}

def main():
    start=time.perf_counter(); species=load_species_specs(); results=[build_one(spec) for spec in species]
    report={"generator":"godot/tools/sprite_factory/build_g18d.py","renderer":"Pillow 2x supersampling, deterministic Python vector primitives","frame_size":[W,H],"pivot_feet":[W//2,PIVOT_Y],"directions":DIRECTIONS,"actions":ACTIONS,"species":results,"total_frames":sum(r['frames'] for r in results),"total_unique_frames":sum(r['unique'] for r in results),"elapsed_seconds":round(time.perf_counter()-start,2),"status":"generated; artistic review pending"}
    REPORT.mkdir(parents=True,exist_ok=True); (REPORT/'sprite-factory-integrity.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
    print(json.dumps(report,ensure_ascii=False,indent=2))

if __name__=='__main__': main()
