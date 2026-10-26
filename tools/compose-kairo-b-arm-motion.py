#!/usr/bin/env python3
"""Render only user-chosen B-arm amplitude comparison, with real Kairo frames."""
import os,json,pathlib
from PIL import Image, ImageDraw, ImageFont
root=pathlib.Path('visual-review-output/kairo-b-arm-motion')
labels={'A':'A  Gentle','B':'B  Natural','C':'C  Expressive'}
font_path='/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf'
font=ImageFont.truetype(font_path,25)
small=ImageFont.truetype(font_path,18)
strips={x:sorted((root/('frames-'+x)).glob('*.png')) for x in labels}
assert all(len(x)==12 for x in strips.values())
background='#f2f4f8';ink='#182b44'
def one_frame(path,label):
    picture=Image.open(path).convert('RGB')
    # The true WebGL canvas is 830x774 and Kairo is centered; keep full
    # head+feet frame with only unused horizontal margin removed.
    w,h=picture.size
    crop=picture.crop((max(0,(w-520)//2),25,
     min(w,(w+520)//2),min(h,765)))
    crop.thumbnail((315,409))
    tile=Image.new('RGB',(330,452),background)
    tile.paste(crop,((330-crop.width)//2,37))
    d=ImageDraw.Draw(tile)
    d.text((18,5),label,font=font,fill=ink)
    return tile
videos={}
for a,label in labels.items():
    frames=[one_frame(p,label) for p in strips[a]]
    frames[0].save(root/('B-'+a+'-motion.gif'),save_all=True,
     append_images=frames[1:],duration=165,loop=0,optimize=True,disposal=2)
    frames[0].save(root/('B-'+a+'-still.png'))
    videos[a]=frames
combined=[]
for i in range(12):
    img=Image.new('RGB',(1010,500),background)
    d=ImageDraw.Draw(img)
    d.text((18,465),'Same B base pose  •  Only arm motion amount changes',
     fill=ink,font=small)
    for j,key in enumerate(labels):img.paste(videos[key][i],(5+335*j,0))
    combined.append(img)
combined[0].save(root/'pick-B-arm-motion-A-B-C.gif',save_all=True,
 append_images=combined[1:],duration=165,loop=0,optimize=True,disposal=2)
combined[0].save(root/'pick-B-arm-motion-A-B-C-still.png')
print('PASS real Kairo A/B/C looping visual choices')
