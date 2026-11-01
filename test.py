import asyncio,sys,subprocess
from playwright.async_api import async_playwright
P=['dovehuongson','maugiao','trianlietsi']
async def main():
  async with async_playwright() as p:
    br=await p.chromium.launch(executable_path='/usr/bin/google-chrome',args=['--autoplay-policy=no-user-gesture-required'])
    for n in P:
      ctx=await br.new_context(viewport={'width':430,'height':932},device_scale_factor=2,record_video_dir=f'{n}/_vid',record_video_size={'width':430,'height':932})
      pg=await ctx.new_page();errs=[]
      pg.on('pageerror',lambda e:errs.append(str(e)));pg.on('console',lambda m:m.type=='error' and errs.append(m.text))
      await pg.goto(f'http://localhost:8099/{n}/index.html');await pg.wait_for_timeout(1200)
      if await pg.query_selector('#nm'): await pg.fill('#nm','Anh')
      await pg.click('#go');await pg.wait_for_timeout(1500)
      if n=='dovehuongson':
        await pg.click('#bHoa');await pg.wait_for_timeout(1500);await pg.click('#bHuong');await pg.wait_for_timeout(1500);await pg.click('#bChuong');await pg.wait_for_timeout(2000)
        await pg.screenshot(path=f'{n}/screenshot.png');await pg.click('#bLoc');await pg.wait_for_timeout(2500);await pg.click('#mLoc');await pg.wait_for_timeout(3000)
      if n=='maugiao':
        b=await pg.query_selector('#board');bb=await b.bounding_box()
        await pg.mouse.move(bb['x']+30,bb['y']+70);await pg.mouse.down()
        for i in range(30): await pg.mouse.move(bb['x']+30+i*5,bb['y']+70+15*((i%6)-3)/3)
        await pg.mouse.up();await pg.click('#bDao');await pg.wait_for_timeout(4000);await pg.screenshot(path=f'{n}/screenshot.png')
        await pg.click('#bHoa');await pg.wait_for_timeout(2500);await pg.click('#mHoa');await pg.evaluate('setPhase(3)');await pg.wait_for_timeout(4000)
      if n=='trianlietsi':
        await pg.click('#bH');await pg.wait_for_timeout(2000);await pg.click('#bF');await pg.click('#bF');await pg.wait_for_timeout(1000);await pg.click('#bQ')
        await pg.mouse.move(180,700);await pg.mouse.down()
        for i in range(40): await pg.mouse.move(150+i*5,700+(i%5)*6)
        await pg.mouse.up();await pg.wait_for_timeout(3000);await pg.screenshot(path=f'{n}/screenshot.png')
        await pg.click('#bV');await pg.fill('#tv','Con xin kính cẩn nghiêng mình tưởng nhớ các anh.');await pg.click('#sv');await pg.wait_for_timeout(3000);await pg.click('#cw');await pg.wait_for_timeout(2000)
      print(n,'ERRORS:',errs)
      v=pg.video;await ctx.close();src=await v.path()
      subprocess.run(['ffmpeg','-y','-loglevel','error','-i',src,'-t','15','-vf','scale=540:-2','-c:v','libx264','-pix_fmt','yuv420p',f'{n}/preview.mp4'])
    await br.close()
asyncio.run(main())
