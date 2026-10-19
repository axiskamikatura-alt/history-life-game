import test from 'node:test';
import assert from 'node:assert/strict';
import {loadProgress,persistProgress,SAVE_KEY,LEGACY_SAVE_KEY} from '../src/storage.js';
import {createGame,validSave} from '../src/engine.js';
const memory=()=>{const data=new Map();return {getItem:k=>data.get(k)??null,setItem:(k,v)=>data.set(k,v)};};
test('legacy save is copied without deleting the original',()=>{const store=memory(),s=createGame('town');store.setItem(LEGACY_SAVE_KEY,JSON.stringify(s));const loaded=loadProgress(store,validSave,x=>x);assert.deepEqual(loaded.state,s);assert.equal(store.getItem(LEGACY_SAVE_KEY),JSON.stringify(s));assert.equal(store.getItem(SAVE_KEY),JSON.stringify(s));});
test('broken current save never silently resurrects an old life',()=>{const store=memory();store.setItem(LEGACY_SAVE_KEY,JSON.stringify(createGame('town')));store.setItem(SAVE_KEY,'broken');assert.equal(loadProgress(store,validSave,x=>x).state,null);assert.equal(store.getItem(SAVE_KEY),'broken');});
test('storage errors are handled and writes preserve collection',()=>{assert.equal(loadProgress({getItem(){throw Error();}},validSave,x=>x).state,null);const store=memory();const s=createGame('town');s.unlocks=['双六'];assert.deepEqual(persistProgress(store,s,['暮らし','双六']),['暮らし','双六']);});
