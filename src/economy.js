import {activeEra as era,activeEconomy as rules}from'./data/registry.js';
export function createBudget(origin){return {initial:rules.initial[origin],balance:rules.initial[origin],income:0,expense:0,ledger:[],legacy:false};}
export function postEntry(state,entry){const b=state.budget;b.income+=entry.income;b.expense+=entry.expense;b.balance+=entry.income-entry.expense;b.ledger.push({...entry,balance:b.balance});}
export function recordPeriod(state,event,previousAge,choice){
 let earned=0,support=0,food=0,rent=0,goods=0;
 for(let age=previousAge+1;age<=event.age;age++){
  if(age<rules.adultAge)support+=rules.supportPerYear;
  else{const base=state.job.includes('農')?rules.income.farm:state.job.includes('商')?rules.income.trade:rules.income.craft;earned+=Math.round((base+state.stats.learning*rules.learningFactor+state.stats.health*rules.healthFactor)*(age>=rules.laterAge?rules.laterFactor:1));}
  food+=age<rules.adultAge?rules.food.child:rules.food.adult;rent+=rules.rent[state.origin];goods+=age<rules.adultAge?rules.goods.child:rules.goods.adult;
  if(state.people.some(p=>p.id==='child'&&p.metAge<=age))food+=rules.food.dependent;
 }
 const choiceAmount=(choice.effects.money||0)*rules.choiceMonPerPoint;const extraIncome=Math.max(0,choiceAmount),extraExpense=Math.max(0,-choiceAmount);
 postEntry(state,{id:event.id,year:era.birth+event.age,fromAge:previousAge,toAge:event.age,title:event.title,job:state.job,income:earned+support+extraIncome,expense:food+rent+goods+extraExpense,earned,support,food,rent,goods,extraIncome,extraExpense});
}
export function recordOneOff(state,{id,year,title,amount}){if(!amount||state.budget.ledger.some(e=>e.id===id))return;postEntry(state,{id,year,title,job:state.job,fromAge:null,toAge:null,income:Math.max(0,amount),expense:Math.max(0,-amount),earned:0,support:0,food:0,rent:0,goods:0,extraIncome:Math.max(0,amount),extraExpense:Math.max(0,-amount)});}
export function validBudget(s){const b=s.budget;if(!b||!Number.isSafeInteger(b.initial)||!Number.isSafeInteger(b.balance)||!Number.isSafeInteger(b.income)||!Number.isSafeInteger(b.expense)||b.income<0||b.expense<0||typeof b.legacy!=='boolean'||!Array.isArray(b.ledger)||b.ledger.length>120)return false;let income=0,expense=0,balance=b.initial;const ids=new Set();for(const e of b.ledger){if(!e||typeof e.id!=='string'||ids.has(e.id)||typeof e.title!=='string'||typeof e.job!=='string'||!Number.isInteger(e.year)||!Number.isSafeInteger(e.income)||e.income<0||!Number.isSafeInteger(e.expense)||e.expense<0)return false;if(!['earned','support','food','rent','goods','extraIncome','extraExpense'].every(k=>Number.isSafeInteger(e[k])&&e[k]>=0)||e.income!==e.earned+e.support+e.extraIncome||e.expense!==e.food+e.rent+e.goods+e.extraExpense)return false;ids.add(e.id);income+=e.income;expense+=e.expense;balance+=e.income-e.expense;if(e.balance!==balance)return false;}return b.income===income&&b.expense===expense&&b.balance===balance;}
export function referenceConversion(mon,low,high){if(!Number.isFinite(mon)||!Number.isFinite(low)||!Number.isFinite(high)||low<=0||high<low||high>1000000)return null;return [Math.round(mon*low),Math.round(mon*high)].sort((a,b)=>a-b);}
