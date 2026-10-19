import {createRequire} from 'node:module';
import assert from 'node:assert/strict';
import {events} from '../src/data/events.js';
const require=createRequire(process.env.PLAYWRIGHT_PACKAGE||import.meta.url);
const {chromium}=require('playwright');
const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',headless:true,args:['--no-sandbox']});
const errors=[];
try{
for(const [width,height]of [[320,740],[390,844],[768,1024],[1440,1000]]){
const context=await browser.newContext({viewport:{width,height},acceptDownloads:true,reducedMotion:'reduce'});
const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));
await page.goto('http://127.0.0.1:3000');
await page.getByRole('heading',{name:'もしも、江戸に 生まれたら。'}).waitFor();
async function noOverflow(){assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),`overflow at ${width}`);}
await noOverflow();await page.screenshot({path:`/tmp/hitoyo-home-${width}.png`,fullPage:true});
await page.getByRole('button',{name:'人生を選ぶ'}).click();
await page.locator('#name').fill('花');await page.locator('[data-origin="farm"]').click();assert.equal(await page.locator('#name').inputValue(),'花');
await page.getByRole('button',{name:'この人生をはじめる'}).click();
for(let i=0;i<events.length;i++){
if(i===4)await page.screenshot({path:`/tmp/hitoyo-play-${width}.png`,fullPage:true});
await noOverflow();await page.locator('[data-choice]').first().click();
assert.equal(await page.locator('[data-choice]').count(),0);
if(i===0){await page.reload();await page.locator('[data-action="resume"]').click();assert.equal(await page.locator('[data-choice]').count(),0);await page.getByRole('button',{name:'個人史を見る'}).click();await page.getByRole('dialog').waitFor();await page.keyboard.press('Escape');}
if(events[i].age===11){await page.locator('[data-action="mini"]').click();for(let r=0;r<6&&await page.locator('[data-action="roll"]').count();r++){await page.locator('[data-action="roll"]').click();await page.waitForFunction(()=>{const b=document.querySelector('[data-action="roll"]');return !b||!b.disabled;});}assert.equal(await page.locator('[data-action="mini-reset"]').count(),1);await noOverflow();await page.locator('[data-action="mini-back"]').click();}
await page.locator('[data-action="next"]').click();
}
await page.getByRole('heading',{name:'あなたが歩いた道'}).waitFor();assert.equal(await page.locator('.timeline li').count(),events.length);await noOverflow();
const downloadPromise=page.waitForEvent('download');await page.locator('[data-action="download"]').click();const download=await downloadPromise;assert.match(download.suggestedFilename(),/個人史/);
await page.reload();await page.locator('[data-action="resume"]').click();assert.equal(await page.locator('.timeline li').count(),events.length);
await page.locator('nav [data-action="collection"]').click();assert.ok(await page.locator('.collection-card:not(.locked)').count()>=4);await noOverflow();
await page.locator('[data-action="home"]').first().click();await page.locator('[data-action="random"]').click();assert.equal(await page.locator('[data-choice]').count(),3);
await page.locator('[data-action="home"]').first().click();await page.locator('[data-action="setup"]').click();await page.getByRole('dialog').waitFor();await page.locator('[data-action="close"]').last().click();
console.log(`PASS ${width}x${height}: complete life, save/reload, minigame, collection, download, overflow, restart guard`);
await context.close();
}
assert.deepEqual(errors,[]);
// Invalid persisted input must recover to the title screen.
const context=await browser.newContext();const page=await context.newPage();await page.goto('http://127.0.0.1:3000');await page.evaluate(()=>localStorage.setItem('hitoyo-save-v2','{"version":1}'));await page.reload();assert.equal(await page.locator('[data-action="resume"]').count(),0);console.log('PASS corrupt save recovery');await context.close();
}finally{await browser.close();}
