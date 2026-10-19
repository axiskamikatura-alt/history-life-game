export const SAVE_KEY = 'hitoyo-save-v2';
export const LEGACY_SAVE_KEY = 'hitoyo-save-v1';
export const COLLECTION_KEY = 'hitoyo-collection-v1';
export function loadProgress(storage, validate, migrate) {
  try {
    const current = storage.getItem(SAVE_KEY);
    const legacy = current === null ? storage.getItem(LEGACY_SAVE_KEY) : null;
    const raw = current ?? legacy;
    if (raw === null) return {state:null, message:''};
    const parsed = JSON.parse(raw);
    const state = migrate(parsed);
    if (!validate(state)) return {state:null,message:'保存データを読み込めません。元のデータは保持しています。'};
    if (legacy !== null) {
      // Write the migrated copy only. Never delete the original v1 record.
      storage.setItem(SAVE_KEY,JSON.stringify(state));
      return {state,message:'旧版の人生を引き継ぎました。旧版の保存データも残しています。'};
    }
    return {state,message:''};
  } catch {
    return {state:null,message:'保存機能が使えないか、データを読み込めません。元のデータは削除していません。'};
  }
}
export function loadCollection(storage) {
  try {const value=JSON.parse(storage.getItem(COLLECTION_KEY));return Array.isArray(value)?[...new Set(value.filter(x=>typeof x==='string'))]:[];}catch{return [];}
}
export function persistProgress(storage,state,collection) {
  storage.setItem(SAVE_KEY,JSON.stringify(state));
  const next=[...new Set([...collection,...state.unlocks])];
  storage.setItem(COLLECTION_KEY,JSON.stringify(next));
  return next;
}
