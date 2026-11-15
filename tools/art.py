"""Draw original environment and sprite art at native pixel resolution (Pillow)."""
from pathlib import Path
from random import Random
from math import sin, cos, pi
from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parents[1] / "assets"
ROOT.mkdir(exist_ok=True)
rng = Random(404)

def canvas(w, h, color=None):
    im = Image.new("RGBA", (w, h), color or (0,0,0,0))
    return im, ImageDraw.Draw(im)

def save(image, name):
    image.save(ROOT / f"{name}.png", optimize=True)

def person(kind, frame):
    boss = kind == 'boss'
    im, d = canvas(64 if boss else 32, 68 if boss else 38)
    p, r, l, e = d.polygon, d.rectangle, d.line, d.ellipse
    f = [0, 1, 0, -1][frame]
    if boss:
        p([(26,17),(39,16),(50,37),(63,58),(51,64),(40,60),(34,67),(17,65),(2,59),(11,33)],'#130f24')
        for i in range(7):
            x=5+i*8
            p([(29,22),(36+i,29),(x+8,54+f),(x+11,63),(x,58+f)],['#292341','#423354','#332947'][i%3])
            l([(32,25),(x+5,50),(x+5,57)],'#704e69',1)
        p([(20,16),(25,5),(30,10),(34,2),(38,9),(45,7),(45,19),(38,32),(30,31)],'#ba867e')
        p([(24,17),(30,12),(39,13),(42,19),(36,27),(30,25)],'#dfb09a')
        l([(19,22),(14,32),(9,28),(5,37)],'#986777',4)
        l([(44,24),(52,29),(57,23),(60,35)],'#ae7586',4)
        r((28,17,31,18),'#fff0c8'); r((37,17,39,18),'#fff0c8')
        r((32,23,34,25),'#4c324a')
        for x in [16,25,38,46]:
            r((x,44+(x%3)+f,x+2,46+(x%3)+f),'#66bcab')
    elif kind in ('skitter','charger'):
        if kind == 'skitter':
            for i in range(4):
                x=6+i*5
                l([(x,24),(x-3,23+f),(x-4,30-f)],'#6f484d',2)
                l([(x,24),(x+1,29-f),(x+4,30+f)],'#b77d66',1)
            p([(3,24),(6,16),(12,12),(17,14),(24,16),(30,22),(27,28),(10,28)],'#2a1c2c')
            for i in range(4):
                x=6+i*5
                p([(x,23),(x+2,15+i),(x+6,16+i),(x+7,22+i),(x+5,25)],['#be795f','#92605d'][i%2])
            r((25,21,27,22),'#fff0b4')
        else:
            p([(2,25),(6,18),(13,16),(19,20),(22,15),(25,16),(28,11),(29,17),(31,21),(26,25),(21,25),(17,28),(8,27)],'#37223a')
            p([(5,22),(10,17),(14,18),(18,23),(25,19),(30,21),(27,24),(20,24),(16,27),(8,26)],'#a05c69')
            l([(10,25),(8+f,32),(5+f,32)],'#a8747e',2)
            l([(22,24),(24-f,31),(27-f,31)],'#a8747e',2)
            l([(14,21),(17,23),(21,23)],'#e3a295',1)
            r((26,19,27,20),'#fff1ae')
    else:
        outfits={
            'player':('#20363d','#4c696a','#8da195','#d5a57a'),
            'drowned':('#173339','#366068','#66a697','#6fada0'),
            'brute':('#283734','#566d59','#a4a685','#b6a58e'),
            'seer':('#30263f','#665371','#ad88aa','#a991b0'),
            'shade':('#181c36','#40496e','#818eb2','#a1abc4')
        }
        dark,mid,light,skin=outfits[kind]
        w=4 if kind=='brute' else 0
        top = 4 if w else 8
        p([(11-w,24),(15,26),(13,34+f),(8-w,34+f),(8,30)],dark)
        p([(18,24),(20+w,25),(23+w,34-f),(17,34-f),(17,30)],dark)
        r((8-w,33+f,12,34+f),mid); r((18,33-f,23+w,34-f),mid)
        p([(10-w,16),(20+w,15),(22+w,22),(21+w,29),(10,31),(6-w,28),(8-w,21)],dark)
        p([(11-w,17),(17,15),(21+w,18),(20,23),(22+w,27),(13,29),(9-w,26)],mid)
        l([(13,17),(13,22),(11,26)],light,1)
        p([(11-w,top+1),(17,top-2),(21+w,top+1),(22+w,top+6),(19,top+9),(13,top+8),(11-w,top+6)],skin)
        r((17,top+4,21,top+5),'#fff1bd' if kind!='shade' else '#85fff1')
        if kind=='player':
            p([(7,11),(11,9),(12,5),(20,4),(23,10),(27,11),(26,13),(8,13)],'#2d383b')
            l([(10,11),(24,11)],'#b88e67',1)
            p([(14,16),(22,16),(19,19),(11,19)],'#b8835e')
            l([(13,24),(21,24),(30,21)],'#4b3332',4)
            l([(17,23),(28,20),(30,20)],'#bdad94',2)
            r((10,23,11,26),'#f7bb7f')
        elif kind=='brute':
            for y in (11,16,21,26): l([(9,y),(17,y+1),(22,y)],'#dcc2a3',1)
            l([(5,18),(2,24),(4,29)],mid,4)
        elif kind=='seer':
            p([(9,14),(11,8),(17,3),(23,9),(24,14),(20,17),(18,10),(13,13)],'#8b6c9c')
            l([(25,19),(26,31)],'#a97c85',2); r((25,17,27,19),'#f2c7ed')
        elif kind=='shade':
            for i in range(4): l([(8+i*4,23),(5+i*6,34+f)],mid,2)
            r((16,12,17,12),'#b0ffec')
        else:
            l([(8,19),(5,24+f),(7,29+f)],mid,3)
            l([(21,19),(24,21-f),(27,20-f)],light,2)
            r((13,12,15,13),'#275857')
    return im

sheet, _ = canvas(256, 68*8)
for row, k in enumerate(['player','drowned','skitter','brute','seer','charger','shade','boss']):
    for frame in range(4):
        art = person(k, frame)
        sheet.alpha_composite(art, (frame*64 + (64-art.width)//2, row*68 + 68-art.height))
save(sheet,'sprites')

def quay():
    w,h=864,576
    im,d=canvas(w,h,'#142127')
    p,r,l,e=d.polygon,d.rectangle,d.line,d.ellipse
    for y in range(h):
        for x in range(w):
            d.point((x,y), ((22,33,37),(22,33,37),(23,35,39),(24,36,40),(18,30,35),(22,37,40))[rng.randrange(6)])
    for row in range(3, h-2, 11):
        for col in range(-16+(row%2)*9, w-3, 18):
            if rng.random()<.26: continue
            x=col + rng.randrange(-3,4)
            width=rng.randrange(11,18)
            j=rng.randrange(3)
            shade=('#1d2b31','#19262d','#233136')[j]
            p([(x,row+1),(x+3,row),(x+width-1,row),(x+width,row+3),(x+width-1,row+8),(x,row+9),(x-1,row+5)],shade)
            l([(x+1,row+1),(x+width-3,row+1)],('#283639','#253239','#2e3b3e')[j])
            if rng.random()<.14:
                l([(x+1,row+5),(x+5,row+4),(x+7,row+8)],'#18272b')
    for _ in range(173):
        x,y=rng.randrange(w),rng.randrange(h)
        a,b=rng.randrange(4,27),rng.randrange(2,9)
        p([(x-a,y),(x-a//2,y-b),(x+a//2,y-b),(x+a,y),(x+a//2,y+b),(x-a//3,y+b)],rng.choice(['#182d31','#173239','#193137','#1c2c31']))
        l([(x-a+3,y+2),(x-a//5,y+3),(x+a-3,y+2)],'#27474a')
    for n in range(9):
        inset=20-n*3
        l([(inset,28),(80,14),(220,22),(385,12),(535,20),(700,11),(w-inset,27)], ['#21383c','#1a3034','#1a2a2e'][n%3], 2)
        l([(0,h-inset),(85,h-28+n*2),(160,h-inset),(269,h-25+n*2),(390,h-inset),(640,h-30+n*2),(w,h-inset)], ['#20363c','#192c31','#19282e'][n%3],2)
    for _ in range(1050):
        x,y=rng.randrange(w),rng.randrange(h)
        if rng.random()<.22: l([(x,y),(x+1,y),(x+1,y-2)],'#385151')
        else: d.point((x,y),rng.choice(['#33484b','#35504f','#625448','#3a5551']))
    # Keep stone crossings and the five landmark coordinates readable from above.
    props = Random(405)
    banks = [
        [(0,407),(54,390),(107,404),(149,394),(211,421),(270,414),(327,435),(406,418),(406,576),(0,576)],
        [(471,421),(511,427),(574,406),(634,419),(688,399),(751,407),(808,378),(864,386),(864,576),(471,576)]
    ]
    for shoreline in banks:
        p(shoreline,'#142d37')
        edge=shoreline[:-2]
        l(edge,'#091820',9)
        l([(x,y-4) for x,y in edge],'#4e6a66',2)
        l([(x,y+5) for x,y in edge],'#2d535a',2)
    for y in range(395,576,3):
        for _ in range(10):
            x=props.randrange(w)
            if im.getpixel((x,y))[:3] != (20,45,55): continue
            l((x,y,min(x+props.randrange(4,27),405 if x<406 else 863),y),props.choice(['#193742','#24434a','#294b52']))
    for x,y,length,width in [(97,390,154,41),(331,425,96,42),(535,420,119,42),(735,400,133,48),(408,409,167,62)]:
        r((x-3,y,x+width+4,y+length),'#0e1b22')
        for plank in range(y,y+length,6):
            shade=props.choice(['#39403a','#343b37','#40443d','#4b4b3e'])
            r((x,plank,x+width,plank+4),shade)
            l((x+2,plank,x+width-2,plank),'#55584a')
            l((x+4,plank+2,x+width-3,plank+2),'#353932')
        for side in (x-2,x+width-1):
            for post in range(y+5,y+length,29):
                r((side-2,post-5,side+3,post+3),'#232a29')
                l((side-2,post-5,side+3,post-5),'#77735b')
    for x,y,wid,high in [(25,170,85,69),(126,241,59,58),(319,191,57,66),(509,165,77,87),(737,214,96,68),(797,111,61,65),(270,77,111,79),(594,102,95,65)]:
        p([(x,y+4),(x+wid,y+15),(x+wid+32,y+39),(x+15,y+27)],'#0b1820')
        r((x+1,y-high//2,x+wid-1,y+18),'#283639')
        r((x+2,y+3,x+wid-2,y+18),'#202b31')
        for window in range(x+9,x+wid-8,21):
            r((window,y+7,window+7,y+14),'#131b21')
            if props.random()<.72: l((window+1,y+8,window+6,y+8),'#a16a48')
        p([(x-5,y+4),(x-5,y-high//2),(x+wid//2,y-high),(x+wid+4,y-high//2),(x+wid+4,y+4)],'#182830')
        for tile in range(y-high//2+2,y+2,5):
            l((x-3,tile,x+wid+2,tile),props.choice(['#2f4347','#293a3f','#233439']))
        l([(x-5,y-high//2),(x+wid//2,y-high),(x+wid+4,y-high//2)],'#475757',2)
        l((x-5,y+4,x+wid+4,y+4),'#62584a')
    for y in range(230,413,7):
        half=32 if y<340 else 36
        for x in range(432-half,432+half,8):
            if props.random()<.78:
                l((x,y,x+4,y),props.choice(['#384440','#52544a','#293a3b']))
    for x,y in [(317,306),(379,348),(474,344),(535,306),(244,238),(621,269),(165,365),(703,350)]:
        e((x-13,y+1,x+13,y+7),'#132326')
        r((x-2,y-17,x+1,y+4),'#303e3c')
        l((x+2,y-18,x+2,y+3),'#8a8264')
        r((x-4,y-21,x+4,y-16),'#241a19')
        r((x-2,y-20,x+2,y-17),'#e4a664')
    for x,y in [(136,456),(235,464),(375,484),(540,487),(696,474),(785,465)]:
        p([(x-11,y),(x-8,y-17),(x+1,y-25),(x+11,y-11),(x+11,y+5),(x+1,y+11)],'#101f25')
        l([(x-11,y),(x-8,y-17),(x+1,y-25),(x+11,y-11),(x+11,y+5),(x+1,y+11),(x-11,y)],'#625548')
        for row in range(y-14,y+5,5): l((x-6,row,x+7,row),'#3d4136')
    return im
save(quay(),'quay')

def landmark(kind):
    im,d=canvas(112,108)
    p,r,l,e=d.polygon,d.rectangle,d.line,d.ellipse
    e((7,78,107,100),'#102026')
    if kind=='chapel':
        p([(11,61),(20,37),(31,30),(31,14),(42,4),(48,14),(48,31),(59,19),(77,35),(94,47),(96,83),(67,92),(16,87)],'#172128')
        p([(17,55),(32,44),(32,16),(41,8),(45,17),(45,47),(54,51),(54,85),(18,84)],'#35454a')
        p([(54,51),(66,42),(93,49),(93,82),(70,88),(54,85)],'#25363f')
        p([(46,43),(60,23),(91,47),(66,51)],'#384656')
        l([(60,24),(66,46),(91,46)],'#728080')
        r((36,19,41,32),'#1c2830'); r((37,22,39,28),'#62a695')
        p([(29,82),(29,64),(35,57),(42,64),(42,84)],'#12262a')
        l([(31,81),(31,64),(35,60),(40,65),(40,82)],'#648e80')
        for x,y in [(18,54),(19,73),(45,66),(64,65),(74,76),(84,58),(67,55),(49,77)]:
            l([(x,y),(x+6,y-1)],'#53626a')
        l([(41,9),(41,1),(41,6),(46,6),(37,6)],'#a39982')
    elif kind=='boat':
        p([(10,72),(33,49),(78,56),(99,68),(92,82),(69,92),(31,85)],'#202327')
        p([(12,70),(33,52),(76,59),(94,69),(74,80),(27,79)],'#51434b')
        for i in range(4): l([(24+i*3,68+i*2),(41,57+i*3),(79,65+i*2),(85,70+i*2)],'#746057')
        l([(44,68),(46,27),(49,65)],'#84715e',2)
        p([(48,28),(72,44),(78,55),(60,51),(61,44),(53,44)],'#57595a')
        l([(18,79),(49,88),(73,89),(93,78)],'#8b6e58',2)
    elif kind=='well':
        e((24,65,88,91),'#283b43'); r((24,59,88,76),'#3c5150')
        e((21,51,91,78),'#62716a'); e((30,56,83,73),'#172c31'); e((34,61,79,71),'#328579')
        l([(43,64),(63,64),(70,67)],'#96c5a0')
        for x in range(29,86,11): l([(x,78),(x+2,84)],'#162830')
        l([(30,64),(30,44),(49,33),(80,42),(80,64)],'#746859',3)
        l([(51,34),(53,65)],'#928a70')
    else:
        e((19,72,93,94),'#2b3c43'); e((19,69,93,82),'#485a5c')
        r((40,64,71,79),'#374f58'); r((43,62,70,65),'#789089')
        if kind=='shrine':
            p([(42,63),(46,26),(53,20),(57,30),(64,16),(70,24),(71,62)],'#514959')
            l([(45,61),(50,30),(53,36),(61,30),(66,23),(67,62)],'#9b7485',2)
            p([(51,56),(55,39),(62,39),(67,55),(59,62)],'#331e3c')
            l([(55,54),(60,46),(62,56)],'#eb93a1',2)
        else:
            p([(43,65),(47,53),(50,32),(60,32),(64,53),(68,65)],'#47626a')
            l([(49,55),(61,54)],'#9ba68f')
            p([(46,32),(49,19),(55,12),(61,19),(65,32)],'#3c6b69')
            p([(50,28),(54,19),(57,19),(61,29)],'#9bdab7')
            r((54,22,58,28),'#ecdf9f')
    for i in range(37):
        x,y=rng.randrange(15,99),rng.randrange(50,90)
        rgba=im.getpixel((x,y))
        if rgba[3] and rgba[:3]!=(16,32,38): d.point((x,y),'#65736c')
    return im

for k in ['chapel','boat','well','shrine','beacon']:
    save(landmark(k),k)

def title():
    w,h=640,400
    im,d=canvas(w,h,'#0a111c')
    r,l,p,e=d.rectangle,d.line,d.polygon,d.ellipse
    for y in range(h):
        t=y/h
        c=(int(10+11*t),int(16+28*t),int(31+25*t))
        l([(0,y),(w,y)],c)
    for _ in range(900):
        x,y=rng.randrange(w),rng.randrange(250)
        if rng.randrange(5)==0: d.point((x,y),rng.choice(['#30555c','#24414a','#426164']))
    mx,my=457,133
    for rad in range(102,11,-1):
        t=(102-rad)/91
        e((mx-rad,my-rad,mx+rad,my+rad),(int(23+17*t),int(44+40*t),int(57+30*t)))
    e((412,84,506,180),'#98ccc0')
    e((423,71,516,166),'#233f4a')
    for _ in range(240):
        x,y=rng.randrange(280,w),rng.randrange(65,246)
        n=rng.randrange(5,105)
        l([(x,y),(x+n,y)],rng.choice(['#192e39','#1b3540','#203944','#26434d','#2b5058']))
    for band in range(3):
        base=246+band*28
        shade=['#213540','#172b35','#14232e'][band]
        for n in range(14):
            x=264+n*30+rng.randrange(-10,11)
            y=base-rng.randrange(11,47)
            p([(x,base+15),(x,y+7),(x+12,y-5),(x+25,y+5),(x+25,base+15)],shade)
            if n%3==0: r((x+12,y+10,x+13,y+13),'#697a6c')
    p([(393,303),(395,220),(413,207),(424,183),(441,198),(460,182),(472,202),(493,194),(505,210),(505,303)],'#111c27')
    for x,y,a in [(375,189,17),(417,151,25),(477,167,28),(531,185,19)]:
        p([(x,290),(x,y+20),(x+a//2,y),(x+a,y+20),(x+a,284)],'#111b28')
        l([(x+a//2,y+4),(x+a//2,y-8)],'#2f535a')
        l([(x+1,y+20),(x+1,260)],'#3b5556')
        p([(x+4,y+52),(x+4,y+40),(x+a//2,y+33),(x+a-5,y+40),(x+a-5,y+52)],'#62988a')
    p([(436,287),(436,255),(451,235),(469,254),(469,287)],'#2d5156')
    p([(440,288),(440,256),(451,241),(464,256),(464,288)],'#77a890')
    p([(445,287),(445,258),(451,249),(458,259),(458,288)],'#233a40')
    r((451,272,452,287),'#cba776')
    for y in (273,285,295,309,321,336,362,387):
        for _ in range(23):
            x=rng.randrange(244,w)
            has_light=abs(x-452)<(y-265)*.5+9
            l([(x,y+rng.randrange(4)),(x+rng.randrange(3,35),y+3)],rng.choice(['#305e60','#507e70','#427479']) if has_light else rng.choice(['#1e4149','#1a2936','#28434b']))
    p([(0,400),(0,351),(69,327),(92,337),(135,317),(169,329),(214,325),(226,340),(287,346),(323,361),(389,400)],'#101923')
    p([(630,400),(490,400),(529,374),(543,363),(571,347),(605,343),(640,328),(640,400)],'#121c26')
    for _ in range(145):
        x,y=rng.randrange(w),rng.randrange(335,h)
        if (x<280 and y>363) or x>576:
            l([(x,y),(x+2,y-2),(x+4,y-2)],rng.choice(['#1e3239','#2b4e50','#325c5a']))
    hero=person('player',0).resize((80,95),Image.Resampling.NEAREST)
    im.alpha_composite(hero,(291,291))
    for i in range(74):
        x,y=rng.randrange(w),rng.randrange(h)
        if x>240 and rng.random()<.66: r((x,y,x+1,y),rng.choice(['#3b7270','#497677','#b8835e']))
    return im
save(title(),'title')
icon, draw=canvas(192,192,'#101a24')
draw.ellipse((22,22,170,170),outline='#587d76',width=2)
draw.polygon([(96,32),(142,94),(96,160),(50,94)],outline='#c3a271',width=5)
draw.ellipse((72,67,120,122),outline='#88d5bd',width=4)
draw.ellipse((92,76,101,114),fill='#88d5bd')
save(icon,'icon')
save(icon.resize((512,512),Image.Resampling.NEAREST),'icon-512')
icon.resize((256,256),Image.Resampling.NEAREST).save(ROOT/'icon.ico',sizes=[(16,16),(32,32),(48,48),(128,128),(256,256)])

palettes = [
    ('#192820','#304337','#59704f','#9aaf80'),
    ('#271925','#482a38','#76384d','#c47678'),
    ('#132536','#234650','#3c697a','#72bdc4'),
    ('#211934','#34274e','#665084','#b292dc'),
    ('#19251f','#2a4028','#4a6334','#91b754'),
    ('#1a2131','#293959','#536a93','#a6bce2'),
    ('#281d1c','#45332b','#765b40','#c7a67b'),
    ('#2a231b','#494132','#776846','#c0a263'),
    ('#261927','#492746','#763863','#d583aa'),
]

def painted_arena(index, colors):
    dark, mid, trim, light = colors
    w,h=864,576
    im,d=canvas(w,h,dark)
    rand=Random(index*4233)
    line,poly,rect,oval=d.line,d.polygon,d.rectangle,d.ellipse
    shadow=tuple(int(dark[i:i+2],16)*3//5 for i in (1,3,5))
    floor=tuple((int(dark[i:i+2],16)*2+int(mid[i:i+2],16))//3 for i in (1,3,5))
    for y in range(0,h,9+index%3):
        for x in range(-(y//13%2)*12,w,21+index%4):
            if rand.random()<.25: continue
            line((x,y,x+rand.randint(7,17),y),floor)
            if rand.random()<.20: d.point((x+3,y+1),mid)

    def path(points, width=49):
        line(points,shadow,width+8,joint='curve')
        line(points,floor,width,joint='curve')
        for a,b in zip(points,points[1:]):
            line((a,b),mid,2)

    def ribs(x,y,width,height,fill):
        poly([(x-width//2,y),(x-width//2,y-height//2),(x,y-height),(x+width//2,y-height//2),(x+width//2,y)],
             fill,outline=trim)

    if index==1:
        path([(432,0),(432,214),(426,324),(520,470),(520,576)],67)
        path([(0,321),(213,289),(426,324),(677,328),(864,300)],43)
        for cx,cy in [(272,224),(598,238),(334,385),(576,388),(208,435),(727,190),(736,444),(117,196)]:
            oval((cx-89,cy-50,cx+89,cy+45),shadow,outline=mid,width=2)
            for row in range(3):
                for j in range(5):
                    x,y=cx+(j-2)*28+(row%2)*9,cy+(row-1)*21
                    fallen=rand.randrange(5)==0
                    if fallen: line((x-7,y,x+7,y-5),trim,3)
                    else:
                        ribs(x,y,14,18,mid)
                        line((x,y-14,x,y-5),light)
                        line((x-2,y-11,x+2,y-11),light)
        for x,y in [(368,270),(499,274),(368,375),(492,374)]:
            ribs(x,y,25,42,mid)
            rect((x-2,y-29,x+1,y-25),light)
    elif index==2:
        for x in (120,432,752): path([(x,0),(x,576)],70 if x==432 else 36)
        path([(0,333),(864,333)],67)
        oval((301,131,563,339),floor,outline=trim,width=4)
        for n in range(4):
            d.arc((316+n*9,154+n*9,548-n*9,310-n*9),180,360,fill=light if n==0 else mid,width=2)
        for x in range(355,514,14):
            high=32+int(55*(1-abs(x-432)/92))
            ribs(x,233,12,high,mid)
            rect((x-3,219,x+3,230),shadow)
        for y in range(242,515,31):
            for x in (235,337,527,629):
                oval((x-16,y-8,x+16,y+8),shadow)
                rect((x-5,y-25,x+4,y),mid)
                d.point((x,y-24),light)
    elif index==3:
        for points in [[(0,423),(231,342),(423,363),(626,316),(864,343)],
                       [(432,0),(517,164),(423,363),(489,576)]]:
            line(points,shadow,99,joint='curve')
            line(points,mid,53,joint='curve')
            line(points,dark,39,joint='curve')
        for cx,cy in [(269,249),(651,235),(299,424),(661,415),(107,227),(766,478)]:
            poly([(cx-47,cy),(cx-33,cy-37),(cx+39,cy-49),(cx+60,cy-8),(cx+33,cy+23),(cx-31,cy+23)],floor,outline=trim)
            ribs(cx,cy,50,54,mid)
            for j in (-1,0,1):
                rect((cx+j*14-3,cy-13,cx+j*14+3,cy-7),shadow)
            for j in range(7):
                y=cy+21+j*5
                line((cx+rand.randrange(-43,-4),y,cx+rand.randrange(2,50),y),trim if j%3==0 else mid)
        for x,y in [(375,289),(491,343),(365,409),(565,350)]:
            oval((x-5,y-5,x+5,y+5),light,outline=mid)
            line((x,y+6,x,y+19),trim)
    elif index==4:
        for cx,cy,size in [(432,296,122),(218,215,81),(634,219,90),(263,426,78),(624,435,105),(78,372,74),(787,115,84)]:
            for layer,offset in enumerate([29,19,8,0]):
                r=size-offset
                poly([(cx-r,cy+offset),(cx,cy-r//2+offset),(cx+r,cy+offset),(cx,cy+r//2+offset)],
                     [shadow,mid,floor,dark][layer],outline=trim if layer!=3 else light)
            line((cx-size,cy,cx+size,cy),mid)
            line((cx,cy-size//2,cx,cy+size//2),trim)
            poly([(cx-17,cy),(cx,cy-9),(cx+17,cy),(cx,cy+9)],mid,outline=trim)
    elif index==5:
        path([(378,0),(354,132),(423,272),(432,385),(357,512),(383,576)],69)
        path([(0,366),(220,333),(423,272),(677,319),(864,285)],51)
        for cx,cy in [(273,221),(554,235),(333,370),(535,401),(235,447),(672,405),(120,197),(730,173),(751,477)]:
            oval((cx-54,cy-15,cx+69,cy+36),shadow)
            for leg in range(8):
                a=leg*pi/4
                line([(cx,cy),(cx+cos(a)*22,cy+sin(a)*14),(cx+cos(a+.3)*57,cy+sin(a+.3)*36)],mid,4)
            poly([(cx-17,cy+7),(cx-13,cy-43),(cx-5,cy-75),(cx+12,cy-52),(cx+21,cy+8)],mid,outline=trim)
            for j in range(5):
                oval((cx-6-j*2,cy-37-j*5,cx+13-j*2,cy-26-j*5),shadow,outline=trim)
            d.point((cx+3,cy-55),light)
    elif index==6:
        path([(0,291),(864,291)],88)
        path([(432,0),(432,576)],65)
        for y in (155,216,358,425,492):
            for x in (177,247,327,537,609,689,758):
                rect((x-27,y-20,x+27,y+24),shadow,outline=mid,width=2)
                line((x-27,y+22,x+27,y+22),trim)
                rect((x-18,y-11,x+5,y+4),floor,outline=trim)
                rect((x-18,y-11,x-11,y+3),mid)
        for cx,cy in [(323,269),(541,270),(432,403)]:
            oval((cx-29,cy-29,cx+29,cy+29),floor,outline=light,width=2)
            for j in range(12):
                a=j*pi/6
                line((cx+cos(a)*24,cy+sin(a)*24,cx+cos(a)*27,cy+sin(a)*27),trim)
            line((cx,cy-17,cx,cy,cx+12,cy+7),light,2)
    elif index==7:
        path([(432,0),(432,576)],89)
        path([(0,328),(864,328)],59)
        for x in (115,235,337,527,629,749):
            for y in (112,218,433,520):
                rect((x-49,y-45,x+49,y+18),shadow,outline=mid,width=3)
                rect((x-44,y-38,x+44,y+9),mid,outline=trim)
                for row in range(y-32,y+7,12):
                    line((x-41,row,x+41,row),shadow,2)
                    for j in range(x-39,x+39,7):
                        rect((j,row-6,j+rand.randint(2,4),row-2),rand.choice([floor,trim,light]))
        for x,y in [(374,269),(490,269),(374,378),(490,378)]:
            rect((x-14,y-10,x+14,y+14),mid,outline=trim)
            rect((x-8,y-5,x+6,y+9),light)
            line((x,y-4,x,y+9),shadow)
    elif index==8:
        path([(432,0),(432,576)],107)
        path([(0,340),(864,340)],67)
        for i in range(5):
            rect((284+i*19,154+i*15,580-i*19,305-i*4),floor,outline=trim,width=2)
        poly([(381,252),(381,181),(407,167),(432,187),(457,167),(483,181),(483,252)],mid,outline=light,width=2)
        rect((401,211,463,253),shadow,outline=trim,width=2)
        for x in (226,342,522,638):
            for y in (287,381,470):
                oval((x-23,y-11,x+30,y+15),shadow)
                rect((x-9,y-49,x+9,y+3),mid,outline=trim)
                line((x-9,y-46,x+9,y-46),light)
    else:
        path([(432,0),(419,198),(438,339),(430,576)],72)
        path([(0,311),(220,292),(438,339),(673,284),(864,311)],69)
        for cx,cy in [(260,225),(600,210),(330,385),(545,399),(145,410),(729,441),(726,139)]:
            for r in (59,46,32):
                d.arc((cx-r,cy-r//2,cx+r,cy+r//2),15+r*2,270+r,fill=mid if r==59 else trim,width=2)
            poly([(cx-51,cy+2),(cx-19,cy-7),(cx-14,cy-34),(cx+3,cy-18),(cx+13,cy-25),(cx+28,cy-1),
                  (cx+57,cy+16),(cx+13,cy+10),(cx-10,cy+30),(cx-22,cy+7)],shadow,outline=trim)
            line((cx-33,cy,cx-13,cy-8,cx-13,cy-21,cx+2,cy-10,cx+13,cy-14,cx+21,cy+1,cx+46,cy+13),light)
    return im

for stage_index,palette in enumerate(palettes,1):
    save(painted_arena(stage_index,palette),f'arena{stage_index}')

cast,_=canvas(256,68*31)
for row in range(31):
    hero=row<12
    variant=row if hero else row-12
    dark,mid,trim,light=palettes[variant%len(palettes)]
    if hero:
        light=['#96dacc','#cba6fd','#d3e89a','#93caff','#d3b78e','#f3bac8',
               '#91f39f','#b8a9ff','#efae84','#a6b8f0','#f5c26d','#d59aff'][variant]
    for frame in range(4):
        base=person('player' if hero else 'boss',frame)
        draw=ImageDraw.Draw(base)
        fall=(0,1,0,-1)[frame]
        if hero:
            draw.polygon([(3,34+fall),(9,15),(20,13),(29,34-fall),(18,33),(11,36)],fill=dark,outline=mid)
            draw.polygon([(6,20),(12,12),(18,14),(24,22),(17,28),(11,25)],fill=trim)
            if variant%4==0:
                draw.rectangle((6,7,22,12),fill=mid)
                draw.line((2,12,27,12),fill=light,width=2)
            elif variant%4==1:
                draw.polygon([(6,14),(15,3),(23,13),(15,16)],fill=mid,outline=light)
            elif variant%4==2:
                draw.ellipse((8,5,21,15),fill=mid,outline=light)
                draw.line((12,10,26,13),fill=light,width=2)
            else:
                draw.rectangle((8,6,22,14),fill=mid,outline=light)
                draw.point((15,10),light)
            draw.line((18,23,29,17+(variant%3)),fill=light,width=2)
        else:
            n=variant%5
            draw.polygon([(9,59),(17,28),(29,15),(45,28),(57,57),(45,65),(27,61)],fill=dark,outline=trim)
            draw.polygon([(18,29),(25,15-n),(34,10+n),(42,19),(48,35),(39,45),(25,43)],fill=mid,outline=light)
            for wing in [-1,1]:
                draw.polygon([(33+wing*9,30),(33+wing*(21+n),21),(33+wing*28,36+fall),
                              (33+wing*(18+n),48),(33+wing*10,45)],fill=trim,outline=mid)
            for eye in range(1+n):
                x=27+eye*3
                y=24+eye%2*5
                draw.rectangle((x,y,x+1,y+1),fill='#ffdbc3')
            draw.line((31,45,35,60+fall),fill=light,width=2)
        cast.alpha_composite(base,(frame*64+(64-base.width)//2,row*68+68-base.height))
save(cast,'cast')
