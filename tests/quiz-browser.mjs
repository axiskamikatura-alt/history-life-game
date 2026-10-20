import {createRequire} from 'node:module';
import {readFileSync} from 'node:fs';
import assert from 'node:assert/strict';
import {createGame,choose,advance} from '../src/engine.js';
import {quizQuestions} from '../src/data/quiz.js';
const require=createRequire(process.env.PLAYWRIGHT_PACKAGE||import.meta.url);
const {chromium}=require('playwright');
const browser=await chromium.launch({executablePath:'/usr/bin/chromium',headless:true,args:['--no-sandbox']});
const errors=[],external=[];
try {
 for(const width of [320,390,768,1440]) {
  const ctx=await browser.newContext({viewport:{width,height:950},hasTouch:width<1000,reducedMotion:'reduce',acceptDownloads:true});
  const page=await ctx.newPage();page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>{if(!/^(http:\/\/127\.0\.0\.1:3000|data:|blob:)/.test(r.url()))external.push(r.url());});
  const noOverflow=async()=>assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),`overflow ${width}`);
  await page.goto('http://127.0.0.1:3000');await page.locator('nav [data-action="quiz"]').click();await page.getByRole('heading',{name:'暮らしから学ぶ日本史'}).waitFor();assert.equal(await page.locator('[data-action="quiz-start"]').count(),0);await noOverflow();
  await page.locator('[data-action="home"]').last().click();await page.locator('[data-action="random"]').click();await page.locator('nav [data-action="quiz"]').click();assert.equal(await page.locator('[data-mode="new"]').isDisabled(),true);
  await page.locator('[data-action="resume"]').click();await page.locator('[data-choice="0"]').click();const before=await page.evaluate(()=>JSON.parse(localStorage.getItem('hitoyo-save-v2')));
  await page.locator('.quiz-invitation [data-action="quiz"]').click();await page.locator('[data-mode="new"]').click();assert.equal(await page.locator('#quiz-feedback').count(),0);assert.equal(await page.locator('[data-action="quiz-answer"]').count(),3);await noOverflow();
  await page.reload();await page.locator('nav [data-action="quiz"]').click();assert.equal(await page.locator('#quiz-feedback').count(),0);
  let saved=await page.evaluate(()=>JSON.parse(localStorage.getItem('hitoyo-save-v2')));const id=saved.quiz.session.ids[0];const q=quizQuestions.find(q=>q.id===id);const wrong=(q.correct+1)%3;
  await page.locator(`[data-action="quiz-answer"][data-answer="${wrong}"]`).click();await page.locator('#quiz-feedback').waitFor();assert.equal(await page.locator('[data-action="quiz-answer"]:enabled').count(),0);await noOverflow();await page.screenshot({path:`/tmp/hitoyo-learning-feedback-${width}.png`,fullPage:true});
  await page.reload();await page.locator('nav [data-action="quiz"]').click();await page.locator('#quiz-feedback').waitFor();saved=await page.evaluate(()=>JSON.parse(localStorage.getItem('hitoyo-save-v2')));assert.equal(saved.quiz.records[id].attempts,1);assert.deepEqual(saved.stats,before.stats);assert.deepEqual(saved.budget,before.budget);
  await page.locator('[data-action="resume"]').click();assert.equal(await page.locator('#event-title').textContent(),before.log[0].title);await page.locator('nav [data-action="quiz"]').click();
  while(await page.locator('[data-action="quiz-next"]').count()){await page.locator('[data-action="quiz-next"]').click();if(await page.locator('[data-action="quiz-answer"]:enabled').count()){const s=await page.evaluate(()=>JSON.parse(localStorage.getItem('hitoyo-save-v2'))),qid=s.quiz.session.ids[s.quiz.session.cursor];await page.locator(`[data-action="quiz-answer"][data-answer="${quizQuestions.find(q=>q.id===qid).correct}"]`).click();}}
  await page.getByRole('heading',{name:'歴史が、少し身近に。'}).waitFor();await noOverflow();await page.locator('[data-action="quiz-end"]').click();await page.locator('[data-mode="review"]').click();assert.equal(await page.locator('#quiz-question').textContent(),q.prompt);await page.locator(`[data-action="quiz-answer"][data-answer="${q.correct}"]`).click();await page.locator('[data-action="quiz-next"]').click();await page.locator('[data-action="quiz-end"]').click();assert.equal(await page.locator('[data-mode="review"]').isDisabled(),true);
  await page.locator('[data-action="resume"]').click();await page.locator('[data-action="next"]').click();saved=await page.evaluate(()=>JSON.parse(localStorage.getItem('hitoyo-save-v2')));assert.equal(saved.log.at(-1).year,1805);await page.locator('nav [data-action="quiz"]').click();await page.screenshot({path:`/tmp/hitoyo-learning-home-${width}.png`,fullPage:true});await noOverflow();
  // Previous release v2 saves have no quiz field. Opening them must not lose a life.
  let completed=createGame('farm','学習の花',{seed:3});while(!completed.finished)completed=advance(choose(completed,0));delete completed.quiz;await page.evaluate(s=>localStorage.setItem('hitoyo-save-v2',JSON.stringify(s)),completed);await page.reload();await page.locator('[data-action="resume"]').click();await page.locator('.learning-panel [data-action="quiz"]').click();await page.locator('[data-mode="new"]').click();await page.locator('[data-action="quiz-answer"]').first().click();await page.locator('[data-action="resume"]').click();const downloadEvent=page.waitForEvent('download');await page.locator('[data-action="download"]').click();const download=await downloadEvent;const content=readFileSync(await download.path(),'utf8');assert.ok(content.includes('歴史の学習'));assert.ok(content.includes('回答済み 1問'));
  console.log(`PASS learning ${width}: empty/year gate, pre/post-answer reload, wrong/review/correct, session summary, life unchanged, old-v2 migration, recap/export, overflow`);await ctx.close();
 }
 assert.deepEqual(errors,[]);assert.deepEqual(external,[]);
} finally {await browser.close();}
