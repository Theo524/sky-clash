"""Review CMU recorded karate actions before adapting them to Kairo.

No game animation is changed by this script. Kairo's measured VRM skeleton
requires explicit retargeting and gameplay visual review first.
CMU source: https://mocap.cs.cmu.edu/search.php?subjectnumber=135
BVH redistribution: https://github.com/una-dinosauria/cmu-mocap
CMU terms: free to include in products; do not sell the motion data itself.
"""
from __future__ import annotations
import argparse,json
from pathlib import Path
import numpy as np
from scipy.spatial.transform import Rotation
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt

FILES={'front-kick':'135_04.bvh','roundhouse':'135_07.bvh','side-kick':'135_11.bvh'}
class Joint:
    def __init__(self,name,parent):
        self.name=name;self.parent=parent;self.offset=np.zeros(3)
        self.channels=[];self.start=0
def read_bvh(path):
    lines=path.read_text().splitlines();nodes=[];stack=[];nc=0;line_no=None
    for i,line in enumerate(lines):
        s=line.strip()
        if s=='MOTION':line_no=i;break
        if s.startswith('ROOT ') or s.startswith('JOINT '):
            nodes.append(Joint(s.split(maxsplit=1)[1],stack[-1] if stack else None))
        elif s=='End Site':
            nodes.append(Joint('End_'+str(len(nodes)),stack[-1] if stack else None))
        elif s=='{':stack.append(len(nodes)-1)
        elif s=='}':stack.pop()
        elif s.startswith('OFFSET '):
            nodes[-1].offset=np.array(list(map(float,s.split()[1:])))
        elif s.startswith('CHANNELS '):
            a=s.split();nodes[-1].channels=a[2:];nodes[-1].start=nc;nc+=int(a[1])
            assert len(nodes[-1].channels)==int(a[1])
    assert line_no is not None and not stack
    n=int(lines[line_no+1].split(':')[1]);dt=float(lines[line_no+2].split(':')[1])
    values=np.fromstring('\n'.join(lines[line_no+3:]),sep=' ')
    assert len(values)==nc*n,(path,n,nc,len(values))
    return nodes,values.reshape(n,nc),dt

def sample(nodes,values):
    orientations=[];points=[]
    for joint in nodes:
        data=values[joint.start:joint.start+len(joint.channels)]
        offset=joint.offset.copy();q=Rotation.identity()
        for axis,value in zip(joint.channels,data):
            if axis.endswith('position'):offset['XYZ'.index(axis[0])]+=value
            elif axis.endswith('rotation'):q=q*Rotation.from_euler(axis[0].lower(),value,degrees=True)
        if joint.parent is None:
            points.append(offset);orientations.append(q)
        else:
            p=joint.parent
            points.append(points[p]+orientations[p].apply(offset))
            orientations.append(orientations[p]*q)
    return np.array(points)

def select_window(nodes,frames,fps):
    names=[n.name for n in nodes];li,ri,hi=[names.index(x) for x in ('LeftFoot','RightFoot','Hips')]
    step=max(1,int(fps//30));best=None
    for frame in range(0,len(frames),step):
        p=sample(nodes,frames[frame])
        left,right=p[li],p[ri]
        for side,foot in (('left',left),('right',right)):
            elevation=foot[1]-min(left[1],right[1])
            extension=np.linalg.norm((foot-p[hi])[[0,2]])
            score=elevation+.20*extension
            if best is None or score>best[0]:best=(score,frame,side)
    score,peak,side=best
    return {'peakFrame':peak,'kickingSide':side,
        'sourceWindow':[max(0,peak-round(.47*fps)),
                        min(len(frames)-1,peak+round(.50*fps))],
        'frameRate':fps,'frames':len(frames),'selectionScore':round(float(score),3)}

def render(nodes,frames,selection,title,path):
    names=[n.name for n in nodes]
    used=('Hips','LowerBack','Spine','Spine1','Neck1','Head',
          'LeftShoulder','LeftArm','LeftForeArm','LeftHand',
          'RightShoulder','RightArm','RightForeArm','RightHand',
          'LeftUpLeg','LeftLeg','LeftFoot','RightUpLeg','RightLeg','RightFoot')
    ids=[names.index(name) for name in used if name in names]
    first,last=selection['sourceWindow'];fig=plt.figure(figsize=(16,8))
    for i,frame in enumerate(np.linspace(first,last,6,dtype=int)):
        p=sample(nodes,frames[frame]);p=p-p[names.index('Hips')]
        ax=fig.add_subplot(2,3,i+1,projection='3d')
        for j in ids:
            par=nodes[j].parent
            if par is None:continue
            a,b=p[j],p[par]
            ax.plot((a[0],b[0]),(a[2],b[2]),(a[1],b[1]),
                    c='#dd543f' if 'Leg' in names[j] or 'Foot' in names[j] else '#267e9e',lw=3)
        ax.set_xlim(-20,20);ax.set_ylim(-20,20);ax.set_zlim(-25,20)
        ax.set_box_aspect((1,1,1.25));ax.view_init(elev=13,azim=-60)
        ax.set_axis_off();ax.set_title('Source frame '+str(frame))
    fig.suptitle(title+' (real martial artist, not yet retargeted)',fontsize=14)
    plt.tight_layout();plt.savefig(path,dpi=100);plt.close(fig)

def main():
    ap=argparse.ArgumentParser()
    ap.add_argument('--source-dir',type=Path,required=True)
    ap.add_argument('--output-dir',type=Path,required=True)
    a=ap.parse_args();a.output_dir.mkdir(parents=True,exist_ok=True)
    result={}
    for title,basename in FILES.items():
        nodes,frames,dt=read_bvh(a.source_dir/basename)
        selection=select_window(nodes,frames,1/dt)
        selection['sourceFile']=basename;result[title]=selection
        render(nodes,frames,selection,title,a.output_dir/(title+'.png'))
        print('KARATE_REFERENCE',title,selection)
    (a.output_dir/'source-selections.json').write_text(json.dumps(result,indent=2)+'\n')

if __name__=='__main__':main()
