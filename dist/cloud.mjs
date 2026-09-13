import {cleanState} from './state.mjs';
export const firebaseConfig={apiKey:'AIzaSyCxPppnUG864v3E2j1OzykzFmhLpsEJCSE',authDomain:'chess-1885a.firebaseapp.com',databaseURL:'https://chess-1885a-default-rtdb.asia-southeast1.firebasedatabase.app/',projectId:'chess-1885a',storageBucket:'chess-1885a.firebasestorage.app',messagingSenderId:'824383572856',appId:'1:824383572856:web:7c663d6bf0f970f6acd68d',measurementId:'G-0EMJ4W2KLS'};
let sdk,profile,revision=0,ready=false,blocked=false,timer,queue=Promise.resolve(),attempt=0;
const device=()=>{let id=localStorage.getItem('paperio-device');if(!id){id=crypto.randomUUID();localStorage.setItem('paperio-device',id);}return id;};
export async function connectCloud(local){
 const current=++attempt;ready=false;let timeout;
 try{return await Promise.race([loadCloud(local,current),new Promise((_,reject)=>{timeout=setTimeout(()=>{attempt++;reject(Error('連線逾時，請確認網路後重試'));},15000);})]);}finally{clearTimeout(timeout);}
}
async function loadCloud(local,current){
 sdk=await import('./vendor.mjs');const app=sdk.initializeApp(firebaseConfig),auth=sdk.getAuth(app);const credential=await sdk.signInAnonymously(auth);
 profile=sdk.ref(sdk.getDatabase(app),'paperioPocket/players/'+credential.user.uid);
 const snap=await sdk.get(profile),value=snap.val();if(current!==attempt)throw Error('連線已取消');revision=value?.revision||0;ready=true;blocked=false;
 const baseline=JSON.parse(localStorage.getItem('paperio-cloud-baseline')||'null');
 const useLocal=baseline?.uid===credential.user.uid&&baseline.revision===revision;
 localStorage.setItem('paperio-cloud-baseline',JSON.stringify({uid:credential.user.uid,revision}));
 return {state:useLocal||!value?.state?local:cleanState(value.state),uid:credential.user.uid};
}
export function saveCloud(state,onStatus){
 if(!ready||blocked)return;clearTimeout(timer);const copy=JSON.parse(JSON.stringify(state));
 timer=setTimeout(()=>{queue=queue.then(async()=>{
  if(blocked)return;
  try{const result=await sdk.runTransaction(profile,current=>{
   if((current?.revision||0)!==revision)return;
   return {revision:revision+1,device:device(),updatedAt:Date.now(),state:copy};
  },{applyLocally:false});
  if(!result.committed){blocked=true;onStatus('雲端存檔已在另一分頁更新，請重新整理後繼續。');return;}
  revision++;const baseline=JSON.parse(localStorage.getItem('paperio-cloud-baseline')||'{}');baseline.revision=revision;localStorage.setItem('paperio-cloud-baseline',JSON.stringify(baseline));onStatus('Firebase 已同步');
  }catch{onStatus('雲端同步失敗，進度保留於此裝置；下次儲存會重試。');}
 });},800);
}
