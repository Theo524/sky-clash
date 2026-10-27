#!/usr/bin/env python3
"""One uncluttered real-Kairo front-view descending motion A/B/C selector."""
from pathlib import Path
from PIL import Image,ImageDraw,ImageFont
root=Path('visual-review-output/kairo-b-descending-choices')
font=ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf',25)
caption=ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',19)
labels={'A':'A  Featherlight','B':'B  Settling','C':'C  Soft brake'}
frames={}
for choice,title in labels.items():
    source=sorted((root/('frames-'+choice)).glob('*.png'))
    assert len(source)==12,'missing actual 12 real Kairo frames for '+choice
    clips=[]
    for path in source:
        img=Image.open(path).convert('RGB')
        # The actual 830x774 Pose Lab screenshot includes editor text
        # at the top and controls at the bottom. Crop both out; frame
        # actual Kairo from head to shoes, WITHOUT redraw or visual fakes.
        assert img.size==(830,774),'real VRM camera/frame changed'
        body=img.crop((274,79,568,641))
        panel=Image.new('RGB',(325,622),'#eef1f5')
        ImageDraw.Draw(panel).text((18,13),title,font=font,fill='#192a3e')
        panel.paste(body,((325-body.width)//2,55))
        clips.append(panel)
    frames[choice]=clips
    clips[0].save(root/f'B-descend-{choice}.gif',save_all=True,
     append_images=clips[1:],duration=165,loop=0,disposal=2,optimize=True)
combined=[]
for i in range(12):
    canvas=Image.new('RGB',(997,668),'#eef1f5')
    for j,choice in enumerate('ABC'):
        canvas.paste(frames[choice][i],(5+330*j,0))
    ImageDraw.Draw(canvas).text((18,630),
     'All three keep your B flight stance + natural arm motion',
     font=caption,fill='#192a3e')
    combined.append(canvas)
combined[0].save(root/'choose-B-descending-A-B-C.gif',save_all=True,
 append_images=combined[1:],duration=165,loop=0,disposal=2,optimize=True)
combined[6].save(root/'choose-B-descending-A-B-C.png')
print('PASS clean real-Kairo 3-way ascent preview without editor UI')
