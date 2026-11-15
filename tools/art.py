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
    for y in range(0,h,13 if index%2 else 17):
        for x in range(-(y//13%2)*12,w,26 if index%2 else 31):
            if rand.random()<.27: continue
            d.line((x,y,x+rand.randint(9,18),y),mid)
            if rand.random()<.26: d.point((x+3,y+1),trim)
    cx,cy=w//2,h//2
    for radius in [46,51,82,97]:
        d.ellipse((cx-radius,cy-radius,cx+radius,cy+radius),outline=mid,width=2)
    for i in range(130):
        x,y=rand.randrange(19,w-20),rand.randrange(28,h-29)
        if abs(x-cx)<34 or abs(y-cy)<31: continue
        size=rand.randrange(4,13)
        if index in (1,6):
            d.polygon([(x-size,y),(x-size,y-13),(x,y-20),(x+size,y-13),(x+size,y)],fill=mid,outline=trim)
            d.line((x-4,y-6,x+4,y-6),light)
        elif index in (2,5):
            for leg in (-1,0,1):
                d.line([(x+leg*size,y+size),(x+leg*4,y),(x,y-15),(x-leg*size,y-25)],mid,width=3)
                d.point((x-leg*size,y-25),light)
        elif index == 3:
            d.arc((x-size*2,y-size,x+size*2,y+size),10,179,fill=trim)
            d.arc((x-size*3,y-size-4,x+size*3,y+size+4),180,356,fill=mid)
        elif index in (4,9):
            d.polygon([(x,y-size),(x+size,y),(x,y+size),(x-size,y)],outline=trim)
            d.line((x-size,y,x,y,x+size,y),mid)
            d.point((x,y),light)
        else:
            d.rectangle((x-size,y-size,x+size,y+size),fill=mid,outline=trim)
            for shelf in range(x-size+2,x+size,4):
                d.line((shelf,y-size+1,shelf,y+size-1),dark)
                d.point((shelf+1,y-3),light)
    for n in range(8+index):
        a=n*2*pi/(8+index)
        x=cx+cos(a)*104
        y=cy+sin(a)*104
        d.line((x,y,x+cos(a)*13,y+sin(a)*13),light,width=2)
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
