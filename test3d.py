import asyncio,sys,subprocess,json
from playwright.async_api import async_playwright
ARGS=['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist','--autoplay-policy=no-user-gesture-required']
SCRIPTS=json.load(open('scripts.json'))
async def run(p,n,video):
  br=await p.chromium.launch(executable_path='/usr/bin/google-chrome',args=ARGS)
  kw=dict(viewport={'width':430,'height':932},device_scale_factor=1,is_mobile=True,has_touch=True)
  if video: kw.update(record_video_dir=f'{n}/_vid',record_video_size={'width':430,'height':932})
  ctx=await br.new_context(**kw);pg=await ctx.new_page();errs=[]
  pg.on('pageerror',lambda e:errs.append('PAGEERR '+str(e)));pg.on('console',lambda m:m.type in('error','warning') and errs.append(m.type+' '+m.text[:300]))
  await pg.goto(f'http://localhost:8099/{n}/index.html');await pg.wait_for_timeout(6000)
  await pg.screenshot(path=f'{n}/shot_creator.png')
  await pg.fill('#kgc-name','Anh');await pg.click('#kgc-go');await pg.wait_for_timeout(1500)
  for st in SCRIPTS[n]:
    if st[0]=='js': await pg.evaluate(st[1])
    elif st[0]=='wait': await pg.wait_for_timeout(st[1])
    elif st[0]=='shot': await pg.screenshot(path=f'{n}/{st[1]}')
  fps=await pg.evaluate('new Promise(r=>{let c=0,t=performance.now();function f(){c++;if(performance.now()-t<2000)requestAnimationFrame(f);else r(c/2)}requestAnimationFrame(f)})')
  print(n,'fps(swiftshader)',fps,'ERRORS:',errs[:8])
  v=pg.video;await ctx.close();await br.close()
  if video:
    src=await v.path();subprocess.run(['ffmpeg','-y','-loglevel','error','-ss','7.5','-i',src,'-t','15','-vf','scale=430:-2','-c:v','libx264','-pix_fmt','yuv420p',f'{n}/preview.mp4'])
async def main():
  async with async_playwright() as p:
    for n in sys.argv[1].split(','): await run(p,n,len(sys.argv)>2)
asyncio.run(main())
