import {activeEvents as events,activeEra as era} from './data/registry.js';
import {createLife,updatePeople,applyLifeChoice,conditionMet,validLife} from './life.js';
import {skipChallenge,validChallenges} from './challenge.js';
import {createBudget,recordPeriod,recordOneOff,validBudget} from './economy.js';
import {diaryEntry,validDiary} from './diary.js';
import {createQuiz,validQuiz} from './quiz.js';
export {SAVE_KEY,COLLECTION_KEY} from './storage.js';
export const clamp=n=>Math.max(0,Math.min(100,n));
export function createGame(origin,name='',options={}){
 if(!Object.hasOwn(era.origins,origin))throw Error('Unknown origin');
 const seed=options.seed??(Date.now()^Math.floor(Math.random()*4294967296))>>>0;
 const life=createLife(origin,seed);
 if(options.speed&&['slow','standard','fast'].includes(options.speed))life.speed=options.speed;
 return {version:2,eraId:era.id,origin,name:name.trim().slice(0,16)||'あなた',index:0,stats:{...era.origins[origin].stats,happiness:55},job:'家の手伝い',family:'家族と暮らす',log:[],unlocks:[],pending:null,finished:false,challengeRuns:{},budget:createBudget(origin),diary:[],quiz:createQuiz(),...life};
}
export function choose(state,index){
 if(state.finished||state.pending!==null)return state;
 const event=events[state.index],choice=event?.choices[index];if(!choice)throw Error('Unknown choice');
 const next=structuredClone(state),effects={...choice.effects},context=[];
 updatePeople(next,event.age);
 for(const rule of choice.conditions||[])if(conditionMet(next,rule)){for(const [k,v]of Object.entries(rule.effects))effects[k]=(effects[k]||0)+v;context.push(rule.text);}
 for(const [key,value]of Object.entries(effects))next.stats[key]=clamp(next.stats[key]+value);
 if(choice.job)next.job=choice.job==='独り立ちした働き手'?`独り立ち（${next.job}）`:choice.job;if(choice.family)next.family=choice.family;
 if(choice.unlock&&!next.unlocks.includes(choice.unlock))next.unlocks.push(choice.unlock);
 const relations=applyLifeChoice(next,event,choice);
 recordPeriod(next,event,state.log.at(-1)?.age||0,{...choice,effects});
 next.diary.push(diaryEntry(next,event,choice));
 next.log.push({eventId:event.id,age:event.age,year:era.birth+event.age,title:event.title,choice:choice.label,text:choice.text,history:event.history||null,effects,context,relations,job:next.job,family:next.family,stats:{...next.stats},wealth:next.budget.balance,values:next.values});next.pending=index;return next;
}
export function advance(state){
 if(state.pending===null||state.finished)return state;const next=structuredClone(state);skipChallenge(next,events[next.index]);next.pending=null;next.index++;next.finished=next.index===events.length;
 const age=events[Math.min(next.index,events.length-1)].age;updatePeople(next,age);
 for(const delayed of next.deferred)if(!delayed.applied&&delayed.dueAge<=age){for(const [k,v]of Object.entries(delayed.effects))next.stats[k]=clamp(next.stats[k]+v);recordOneOff(next,{id:`deferred-${delayed.dueAge}-${next.deferred.indexOf(delayed)}`,year:era.birth+age,title:delayed.text,amount:(delayed.effects.money||0)*100});delayed.applied=true;delayed.appliedAge=age;}
 return next;
}
export function ending(state){const labels={health:['暮らしを慈しむ人','からだと日々を大切にした、その歩み。'],money:['暮らしを築く人','働き、工夫し、明日への備えを重ねた、その歩み。'],learning:['学びをつなぐ人','知恵や技を磨き、次の誰かへ手渡した、その歩み。'],bonds:['人の輪に生きる人','誰かを支え、誰かに支えられた、その歩み。'],happiness:['日々に喜びを見つける人','自分にとって大切な時間を積み重ねた、その歩み。']};return labels[Object.keys(labels).sort((a,b)=>state.stats[b]-state.stats[a])[0]];}
function validBase(s,list=events){return !!s&&s.eraId===era.id&&Object.hasOwn(era.origins,s.origin)&&typeof s.name==='string'&&s.name.length<=16&&Number.isInteger(s.index)&&s.index>=0&&s.index<=list.length&&typeof s.finished==='boolean'&&s.finished===(s.index===list.length)&&Array.isArray(s.log)&&s.log.length===s.index+(s.pending!==null?1:0)&&s.log.every(x=>x&&typeof x.title==='string'&&typeof x.choice==='string'&&typeof x.text==='string'&&Number.isInteger(x.age)&&Number.isInteger(x.year))&&Array.isArray(s.unlocks)&&s.unlocks.every(x=>typeof x==='string')&&typeof s.job==='string'&&typeof s.family==='string'&&s.stats&&['health','money','learning','bonds'].every(k=>Number.isFinite(s.stats[k])&&s.stats[k]>=0&&s.stats[k]<=100)&&(s.pending===null||Number.isInteger(s.pending)&&!!list[s.index]?.choices[s.pending]);}
export function validSave(s){try{return Boolean(s?.version===2&&validBase(s)&&Number.isFinite(s.stats.happiness)&&s.stats.happiness>=0&&s.stats.happiness<=100&&validLife(s)&&validChallenges(s)&&validBudget(s)&&validDiary(s)&&validQuiz(s)&&s.log.every((l,i)=>l.eventId===events[i]?.id&&l.age===events[i].age&&l.year===era.birth+events[i].age));}catch{return false;}}
export function migrateSave(s){
 if(s?.version===2){const next={...s,quiz:s.quiz===undefined?createQuiz():s.quiz,challengeRuns:s.challengeRuns??{},diary:s.diary??[],budget:s.budget??{...createBudget(s.origin),legacy:true}};return next;}
 const legacyEvents=events.filter(e=>![6,15,22,31,39,52].includes(e.age));
 if(s?.version!==1||!validBase(s,legacyEvents))return null;
 const next=createGame(s.origin,s.name,{seed:1800});
 Object.assign(next,{stats:{...s.stats,happiness:55},job:s.job,family:s.family,unlocks:[...s.unlocks]});
 // Rebuild already-lived years and mark newly inserted earlier chapters as retrospective.
 const currentAge=s.finished?Infinity:legacyEvents[s.index].age;
 next.log=[];
 for(const event of events){if(event.age>currentAge||event.age===currentAge&&!s.finished&&s.pending===null)break;
 const old=s.log.find(l=>l.age===event.age);
 next.log.push(old?{...old,eventId:event.id,effects:{},context:[],relations:[],job:s.job,stats:{...next.stats}}:{eventId:event.id,age:event.age,year:era.birth+event.age,title:event.title,choice:'旧版からの引き継ぎ',text:'旧版にない章のため、この年は振り返りとして記録しています。',history:event.history||null,effects:{},context:[],relations:[]});}
 next.index=s.finished?events.length:events.findIndex(e=>e.age===currentAge);next.pending=s.pending;next.finished=s.finished;
 updatePeople(next,Math.min(currentAge,60));
 if(s.family==='伴侶と暮らす'){const p=next.people.find(p=>p.id==='partner');p.met=true;p.role='配偶者';}
 next.budget.legacy=true;next.migrated=true;return validSave(next)?next:null;
}
