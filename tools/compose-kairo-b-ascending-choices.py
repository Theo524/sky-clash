#!/usr/bin/env python3
"""Show one CLEAN animated side-by-side Kairo ascension selection."""
import pathlib
from PIL import Image,ImageDraw,ImageFont
root=pathlib.Path('visual-review-output/kairo-b-ascending-choices')
source={a:sorted((root/f'frames-{a}').glob('*.png')) for a in 'ABC'}
assert all(len(seq)==12 for seq in source.values())
labels={'A':'A  Gentle','B':'B  Balanced','C':'C  Buoyant'}
font=ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf',25)
small=ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',18)
tiles={}
for a,seq in source.items():
    frames=[]
    for p in seq:
        img=Image.open(p).convert('RGB')
        # The default Pose Lab canvas sits on the LEFT of the page.
        # Source model-view screenshots are of the WebGL canvas only.
        w,h=img.size
        cut=min(520,w)
        img=img.crop((max(0,(w-cut)//2),20,min(w,(w+cut)//2),h-15))
        img.thumbnail((310,395),Image.Resampling.LANCZOS)
        tile=Image.new('RGB',(326,455),'#f2f4f8')
        tile.paste(img,((326-img.width)//2,40))
        d=ImageDraw.Draw(tile)
        d.text((18,7),labels[a],fill='#17283e',font=font)
        frames.append(tile)
    tiles[a]=frames
    frames[0].save(root/f'B-ascend-{a}.gif',save_all=True,
      append_images=frames[1:],duration=155,loop=0,disposal=2,optimize=True)
group=[]
for k in range(12):
    img=Image.new('RGB',(1002,494),'#f2f4f8')
    d=ImageDraw.Draw(img)
    for j,a in enumerate('ABC'):img.paste(tiles[a][k],(6+j*330,3))
    d.text((20,465),'Same B stance + natural arm sway  •  choose ASCENDING intensity',
     font=small,fill='#17283e')
    group.append(img)
group[0].save(root/'choose-B-ascending-A-B-C.gif',save_all=True,
 append_images=group[1:],duration=155,loop=0,disposal=2,optimize=True)
group[6].save(root/'choose-B-ascending-A-B-C.png')
print('PASS composed real-Kairo three-option ascending GIF')
