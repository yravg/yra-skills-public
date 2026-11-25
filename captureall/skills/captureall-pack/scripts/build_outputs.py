#!/usr/bin/env python3
"""captureall (Robo Capture upgraded): build inventory XLSX + capture pack from crawl output.
Needs: pip install openpyxl pillow
Usage: python3 build_outputs.py <crawl_out_dir> <dest_dir> <BaseName> <Rev e.g. R00> [max_zip_mb=9]"""
import json,os,re,sys,hashlib,collections,zipfile,glob
from openpyxl import Workbook
from openpyxl.styles import Font,PatternFill,Alignment,Border,Side
from openpyxl.utils import get_column_letter
from openpyxl.worksheet.table import Table,TableStyleInfo
SRC,DST,BASE,REV=sys.argv[1:5];MAXMB=float(sys.argv[5]) if len(sys.argv)>5 else 9
os.makedirs(DST,exist_ok=True)
d=json.load(open(f'{SRC}/captures.json',encoding='utf-8'));errs=json.load(open(f'{SRC}/errors.json',encoding='utf-8'))
VARS=list(dict.fromkeys(c['variant']['name'] for c in d))
pages=collections.OrderedDict()
for c in d: pages.setdefault(c['url'],[]).append(c)
F='Arial';HD=Font(name=F,bold=True,color='FFFFFF');HF=PatternFill('solid',fgColor='1F2937');BF=Font(name=F,size=10)
wb=Workbook();tabs=[]
def style_hdr(ws,ncol,freeze='B2'):
    for c in ws[1]: c.font=HD;c.fill=HF;c.alignment=Alignment(wrap_text=True,vertical='center')
    for row in ws.iter_rows(min_row=2):
        for c in row: c.font=BF
    ws.row_dimensions[1].height=36;ws.freeze_panes=freeze
def sheet(title,headers,rows,widths={}):
    ws=wb.create_sheet(title);ws.append(headers);[ws.append(r) for r in rows];style_hdr(ws,len(headers))
    for i,h in enumerate(headers,1): ws.column_dimensions[get_column_letter(i)].width=widths.get(h,max(10,min(40,len(h)+4)))
    if rows:
        t=Table(displayName=re.sub(r'\W','',title)+'Tbl',ref=f'A1:{get_column_letter(len(headers))}{len(rows)+1}');t.tableStyleInfo=TableStyleInfo(name='TableStyleLight9',showRowStripes=True);ws.add_table(t)
    return ws
ext=lambda b:('sh' if re.match(r'^(pnpm|npm|npx|yarn|bun)\b',b['text'].strip()) else 'tsx' if re.search(r'import |export |<\w',b['text']) else 'txt')
cap_rows=[];anim=[];trans=[];kf=collections.OrderedDict();code_rows=[];code_store={}
for url,cs in pages.items():
    for c in cs:
        m=c['_meta'];a=c['animations'];v=c['variant']['name'];peak=max([t['running'] for t in a['timeline']] or [0])
        code=c.get('code') or {};nblk=len(code.get('blocks',[]))
        cap_rows.append([m['section'],m['name'] or m['pageHeading'],m['slug'],url,v,'Yes' if m['isIndex'] else 'No',c['selector'],m['rootClass'],m['phase'],c['rect']['width'],c['rect']['height'],m['elementCount'],m['uniqueClasses'],m['buttons'],m['inputs'],m['links'],m['svgs'],m['canvases'],m['images'],m['ariaLabels'],m['ariaLive'],m['roles'],len(c['computedStyles']),len(c['cssRules']),len(a['keyframes']),len(a['cssAnimations']),len(a['transitions']),peak,len(a['frames']),'Yes' if code.get('available') else ('n/a' if m['isIndex'] else 'No'),nblk,m['htmlBytes'],m['textChars'],c['id'],c['timestamp']])
        for x in a['cssAnimations']: anim.append([m['section'],m['slug'],v,x['target'],x['name'],x['duration'],x['delay'],x['timing'],x['iterations'],x['direction'],x['fill'],x['count']])
        for x in a['transitions']: trans.append([m['section'],m['slug'],v,x['target'],x['property'][:250],x['duration'][:150],x['timing'][:250],x['delay'][:150],x['count']])
        for n,css in a['keyframes'].items():
            e=kf.setdefault(n,{'css':css,'pages':set()});e['pages'].add(m['slug'])
        for i,b in enumerate(code.get('blocks',[])):
            h=hashlib.sha1(b['text'].encode()).hexdigest()[:10];key=(m['slug'],h)
            if key in code_store: code_store[key]['variants'].add(v);continue
            fn=f"{i:02d}_{re.sub(r'[^A-Za-z0-9]+','-',b['heading'] or 'source').strip('-').lower()[:40]}.{ext(b)}"
            code_store[key]={'section':m['section'],'slug':m['slug'],'name':m['name'],'heading':b['heading'] or '(main source file)','file':fn,'text':b['text'],'variants':{v},'hash':h}
for k,e in code_store.items():
    code_rows.append([e['section'],e['name'],e['slug'],e['heading'],', '.join(sorted(e['variants'])),e['file'],len(e['text']),e['text'].count('\n')+1,e['hash'],e['text'][:32000]])
CH=['Section','Name','Slug','URL','Variant','Index Page','Selector','Root Class','Final Phase','W (px)','H (px)','Elements','Unique Classes','Buttons','Inputs','Links','SVGs','Canvases','Images','ARIA Labels','ARIA Live','Roles','Computed Styles','Matched CSS Rules','Keyframes','CSS Animations','Transitions','Peak Running Anims','Frames','Code Shown','Code Blocks','HTML Bytes','Text Chars','Capture ID','Timestamp']
# Pages summary (formulas over Captures)
ws=wb.active;ws.title='Pages'
ph=['#','Section','Name','Slug','URL','Description','Variants Captured','Elements (avg)','CSS Animations (sum)','Transitions (sum)','Keyframes (max)','Code Shown','Code Blocks (unique)','Access']
ws.append(ph);n=len(pages)
for i,(url,cs) in enumerate(pages.items(),start=2):
    m=cs[0]['_meta'];shown=any((c.get('code') or {}).get('available') for c in cs)
    acc='Index' if m['isIndex'] else ('Free – code captured' if shown else 'Pro-gated – preview only (no code shown)')
    ws.append([i-1,m['section'],m['name'] or m['pageHeading'],m['slug'],url,m['description'],f'=COUNTIFS(Captures!$C:$C,$D{i})',f'=IFERROR(AVERAGEIFS(Captures!$L:$L,Captures!$C:$C,$D{i}),0)',f'=SUMIFS(Captures!$Z:$Z,Captures!$C:$C,$D{i})',f'=SUMIFS(Captures!$AA:$AA,Captures!$C:$C,$D{i})',f'=SUMPRODUCT(MAX((Captures!$C$2:$C$5000=$D{i})*Captures!$Y$2:$Y$5000))',f'=IF(COUNTIFS(Captures!$C:$C,$D{i},Captures!$AD:$AD,"Yes")>0,"Yes","No")',f'=COUNTIFS(Code!$C:$C,$D{i})',acc])
t=n+2;ws.append(['','TOTAL','','','','',f'=SUM(G2:G{t-1})','',f'=SUM(I2:I{t-1})',f'=SUM(J2:J{t-1})','',f'=COUNTIF(L2:L{t-1},"Yes")',f'=SUM(M2:M{t-1})',''])
style_hdr(ws,len(ph),'C2')
for c in ws[t]: c.font=Font(name=F,bold=True);c.border=Border(top=Side('thin'))
for k,w in zip('ABCDEFGHIJKLMN',[5,13,24,30,50,60,10,11,12,11,10,9,11,34]): ws.column_dimensions[k].width=w
ws.auto_filter.ref=f'A1:N{t-1}'
# Section summary
wsS=wb.create_sheet('Sections');wsS.append(['Section','Pages','Captures','Pages with Code','Unique Code Blocks','CSS Animations','Transitions'])
secs=list(dict.fromkeys(c['_meta']['section'] for c in d))
for j,s in enumerate(secs,start=2):
    wsS.append([s,f'=COUNTIFS(Pages!$B:$B,$A{j})',f'=COUNTIFS(Captures!$A:$A,$A{j})',f'=COUNTIFS(Pages!$B:$B,$A{j},Pages!$L:$L,"Yes")',f'=SUMIFS(Pages!$M:$M,Pages!$B:$B,$A{j})',f'=SUMIFS(Pages!$I:$I,Pages!$B:$B,$A{j})',f'=SUMIFS(Pages!$J:$J,Pages!$B:$B,$A{j})'])
e=len(secs)+2;wsS.append(['TOTAL']+[f'=SUM({x}2:{x}{e-1})' for x in 'BCDEFG']);style_hdr(wsS,7,'A2')
for c in wsS[e]: c.font=Font(name=F,bold=True);c.border=Border(top=Side('thin'))
for k in 'ABCDEFG': wsS.column_dimensions[k].width=18
sheet('Captures',CH,cap_rows,{'Name':24,'Slug':28,'URL':45,'Roles':30,'Capture ID':22,'Timestamp':24})
sheet('Code',['Section','Name','Slug','Block','Variants','File in Pack','Chars','Lines','Hash','Code (first 32k chars)'],code_rows,{'Block':30,'Variants':40,'File in Pack':34,'Code (first 32k chars)':90})
sheet('CSS Animations',['Section','Slug','Variant','Target Element','Keyframes','Duration','Delay','Timing','Iterations','Direction','Fill','Elements'],anim,{'Target Element':40,'Keyframes':24,'Timing':28})
sheet('Keyframes',['Keyframes Name','Used By (count)','Used By','@keyframes CSS'],[[k,len(e['pages']),', '.join(sorted(e['pages']))[:2000],e['css'][:32000]] for k,e in kf.items()],{'Keyframes Name':26,'Used By':50,'@keyframes CSS':100})
sheet('Transitions',['Section','Slug','Variant','Target Element','Property','Duration','Timing','Delay','Elements'],trans,{'Target Element':40,'Property':40,'Timing':40})
# v3 sheets: page-level data (tokens, fonts, a11y, ia, states, console errors) when crawl.js ran with pageData
tok=[];fnt=[];a11=[];iar=[];sts=[];cons=[]
for c in d:
    m=c['_meta'];v=c['variant']['name'];pg=c.get('page') or {}
    for scope,props in (pg.get('tokens') or {}).get('declared',{}).items():
        for k,val in props.items(): tok.append([m['slug'],v,scope,k,val[:300],(pg['tokens']['resolved'].get(k,'') or '')[:300]])
    f=pg.get('fonts') or {}
    for x in f.get('faces',[]): fnt.append([m['slug'],v,'face',x.get('family',x.get('blockedSheet','')),x.get('weight',''),x.get('style',''),x.get('src','')])
    for x in f.get('used',[]): fnt.append([m['slug'],v,'used',x,'','',''])
    a=pg.get('a11y') or {}
    if a: a11.append([m['slug'],v,len(a.get('nodes',[])),len(a.get('tabOrder',[])),a.get('unnamedFocusable',0),len(a.get('reducedMotionRules',[])),' > '.join(a.get('tabOrder',[]))[:32000]])
    for nav in (pg.get('ia') or {}).get('navs',[]):
        for g in nav.get('groups',[]): iar.append([m['slug'],v,nav['tag'],nav.get('label',''),g['heading'],g['count'],', '.join(g['items'])[:32000]])
    for x in c.get('states') or []: sts.append([m['slug'],v,x['name'],x['action'],x['target'],len(x.get('computedStyles') or {}),x.get('frame',''),x.get('error','')])
    for x in c.get('consoleErrors') or []: cons.append([m['slug'],v,x])
sheet('Tokens',['Slug','Variant','Declared On','Token','Declared Value','Resolved Value'],tok,{'Declared On':40,'Token':30,'Declared Value':40,'Resolved Value':40})
sheet('Fonts',['Slug','Variant','Kind','Family','Weight','Style','Src'],fnt,{'Family':40,'Src':60})
sheet('A11y',['Slug','Variant','Nodes','Focusable','Unnamed Focusable','Reduced-Motion Rules','Tab Order'],a11,{'Tab Order':100})
sheet('IA',['Slug','Variant','Landmark','Label','Group','Items','Item Names'],iar,{'Group':30,'Item Names':100})
sheet('States',['Slug','Variant','State','Action','Target','Computed Styles','Frame','Error'],sts,{'Frame':40,'Error':50})
sheet('Console Errors',['Slug','Variant','Error'],cons,{'Error':100})
sheet('Errors',['URL','Variant','Error'],[[x['url'],x['variant'],x['err']] for x in errs],{'URL':60,'Error':90})
R=wb.create_sheet('README',0)
info=[(f'{BASE} — Robo Capture Inventory ({REV})',''),('Source',', '.join(sorted(set(re.match(r'https?://[^/]+',u).group(0) for u in pages)))),('Captured',d[0]['timestamp'][:16].replace('T',' ')+' UTC · headless Chromium · captureall engine v3 (Robo Capture engine v2 upgraded; port of the Robo Capture extension by Jay / RoboLabs, CC BY 4.0)'),('Scope',f'{len(pages)} pages × {len(VARS)} variants ({", ".join(VARS)}) = {len(d)} captures; {len(errs)} errors'),('Schema','Each capture = extension <web-capture> fields (id, selector, label, tag, url, title, timestamp, innerText, outerHTML, rect, computedStyles, cssRules) + variant + animations (keyframes, cssAnimations, transitions, timeline sampled after load, frames) + code (blocks shown in the page Code tab)'),('Code policy','Code is captured only where the site shows it publicly in its Code tab. Pro-gated items are captured as rendered preview (HTML/CSS/animations) only — no attempt is made to unlock gated source.'),('Sheets','Pages (summary, formulas) · Sections · Captures (one row per page × variant) · Code · CSS Animations · Keyframes · Transitions · Tokens · Fonts · A11y · IA · States · Console Errors · Errors'),('Pack',f'{BASE}_Pack_{REV}_<section>.zip → <section>/<slug>/ capture_<variant>.json, web-capture_<variant>.txt (paste-ready), code/, frames/, anim_<variant>.gif')]
for k,v in info: R.append([k,v])
R['A1'].font=Font(name=F,bold=True,size=14)
for row in R.iter_rows(min_row=2):
    row[0].font=Font(name=F,bold=True);row[1].font=BF;row[1].alignment=Alignment(wrap_text=True,vertical='top');row[0].alignment=Alignment(vertical='top')
R.column_dimensions['A'].width=16;R.column_dimensions['B'].width=120
xl=f'{DST}/{BASE}_Inventory_{REV}.xlsx';wb.save(xl)
# Pack
from PIL import Image
stage=f'{DST}/_pack';os.makedirs(stage,exist_ok=True)
for url,cs in pages.items():
    m=cs[0]['_meta'];base=f"{stage}/{m['section']}/{m['slug']}";os.makedirs(base+'/frames',exist_ok=True)
    for c in cs:
        v=c['variant']['name'];json.dump(c,open(f'{base}/capture_{v}.json','w',encoding='utf-8'),ensure_ascii=False,indent=1)
        core={k:c[k] for k in ['id','selector','label','tag','url','title','timestamp','innerText','outerHTML','rect','computedStyles','cssRules']}
        open(f'{base}/web-capture_{v}.txt','w',encoding='utf-8').write('<web-capture>'+json.dumps([core],ensure_ascii=False)+'</web-capture>')
        fr=[f"{SRC}/{f}" for f in c['animations']['frames'] if os.path.exists(f"{SRC}/{f}")]
        for f in fr: os.replace(f,f"{base}/frames/{os.path.basename(f)}") if os.path.exists(f) else None
        ims=[Image.open(f"{base}/frames/{os.path.basename(f)}").convert('RGB') for f in fr]
        if ims:
            ims=[i.resize((max(1,i.width//2),max(1,i.height//2))) for i in ims]
            ims[0].save(f'{base}/anim_{v}.gif',save_all=True,append_images=ims[1:],duration=[300,500,700,1000,1600,2500][:len(ims)],loop=0,optimize=True)
for (slug,h),e in code_store.items():
    p=f"{stage}/{e['section']}/{slug}/code";os.makedirs(p,exist_ok=True)
    tag='_'.join(sorted(set(x.split('-')[-1] for x in e['variants'])))
    open(f"{p}/{tag}__{e['file']}",'w',encoding='utf-8').write(e['text'])
json.dump(errs,open(f'{stage}/errors.json','w'),indent=1)
# zip per section, split to MAXMB
zips=[]
for sec in sorted(os.listdir(stage)):
    sp=f'{stage}/{sec}'
    if not os.path.isdir(sp): continue
    files=sorted(glob.glob(sp+'/**/*',recursive=True));files=[f for f in files if os.path.isfile(f)]
    part,cur,zf=1,0,None
    def newzip(pn):
        name=f'{DST}/{BASE}_Pack_{REV}_{sec}'+('' if pn==1 else f'_part{pn}')+'.zip';zips.append(name);return zipfile.ZipFile(name,'w',zipfile.ZIP_DEFLATED),name
    zf,name=newzip(1)
    for f in files:
        zf.write(f,os.path.relpath(f,stage));zf.fp.flush()
        if os.path.getsize(name)>MAXMB*1024*1024*0.97:
            zf.close();part+=1;zf,name=newzip(part)
    zf.close()
# full raw JSON per section (zipped)
raws=[]
for sec in dict.fromkeys(c['_meta']['section'] for c in d):
    name=f'{DST}/{BASE}_Captures_{REV}_{sec}.zip'
    with zipfile.ZipFile(name,'w',zipfile.ZIP_DEFLATED) as z: z.writestr(f'{BASE}_Captures_{REV}_{sec}.json',json.dumps([c for c in d if c['_meta']['section']==sec],ensure_ascii=False))
    raws.append(name)
print(json.dumps({'xlsx':xl,'zips':[(z,round(os.path.getsize(z)/1e6,2)) for z in zips],'raw':[(z,round(os.path.getsize(z)/1e6,2)) for z in raws],'pages':len(pages),'captures':len(d),'code_blocks':len(code_store),'errors':len(errs)},indent=1))
