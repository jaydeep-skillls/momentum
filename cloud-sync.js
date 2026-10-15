import { firebaseConfig } from './firebase-config.js';
const $=id=>document.getElementById(id), setStatus=t=>{$('cloudStatus').textContent=t};
const configured=Boolean(firebaseConfig.apiKey && firebaseConfig.authDomain && firebaseConfig.projectId && firebaseConfig.appId);
if (!configured) { $('cloudLoginBtn').disabled=true; $('cloudSyncBtn').hidden=true; $('cloudLoginBtn').title='Add Firebase details to firebase-config.js'; $('cloudHint').textContent='Cloud not configured yet. The tracker still works offline and supports JSON/CSV backups.'; }
else {
  try {
    const [{initializeApp},{getAuth,GoogleAuthProvider,signInWithPopup,signInWithRedirect,onAuthStateChanged,signOut},{getFirestore,doc,onSnapshot,setDoc,serverTimestamp}] = await Promise.all([
      import('https://www.gstatic.com/firebasejs/11.10.0/firebase-app.js'),
      import('https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js'),
      import('https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js')
    ]);
    const app=initializeApp(firebaseConfig),auth=getAuth(app),db=getFirestore(app);
    let uid=null,unsubscribe=null,ready=false,remoteData=null,timer=null,dirty=false,applying=false,latestUpdate=0;
    const snapshotLocal=()=>window.momentumGetLocal?.();
    const save=async()=>{
      if(!uid||!ready||!dirty)return;
      dirty=false;const payload=snapshotLocal();if(!payload)return;
      setStatus('Synchronizing…');
      try {await setDoc(doc(db,'momentumUsers',uid),{state:payload,updatedAt:serverTimestamp()});setStatus('Synced ✓')}catch(e){dirty=true;setStatus('Offline — changes saved locally');console.warn(e)}
    };
    window.momentumCloud={onLocalChange:()=>{if(applying)return;dirty=true;if(!uid)return;clearTimeout(timer);timer=setTimeout(save,900)},syncNow:async()=>{if(!uid||!ready){setStatus('Sign in to sync');return}dirty=true;await save()}};
    $('cloudSyncBtn').onclick=()=>window.momentumCloud.syncNow();
    function disconnect(){clearTimeout(timer);unsubscribe?.();unsubscribe=null;uid=null;ready=false;remoteData=null;$('cloudLogoutBtn').hidden=true;$('cloudSyncBtn').hidden=true;$('cloudLoginBtn').hidden=false;setStatus('Local-only mode')}
    onAuthStateChanged(auth,user=>{
      disconnect();if(!user)return;uid=user.uid;$('cloudLoginBtn').hidden=true;$('cloudLogoutBtn').hidden=false;$('cloudSyncBtn').hidden=false;setStatus('Connecting…');
      const ref=doc(db,'momentumUsers',uid);
      unsubscribe=onSnapshot(ref,async snap=>{
        if(!ready){
          ready=true;
          if(!snap.exists()) {dirty=true;await save();return}
          const incoming=snap.data().state;
          const local=snapshotLocal();
          const localHasData=local && (local.checks?.length || Object.keys(local.notes||{}).length || local.activities?.length!==14);
          if(localHasData && JSON.stringify(local)!==JSON.stringify(incoming)){
            if(confirm('Cloud data exists. OK: use CLOUD data on this device. Cancel: upload this device’s LOCAL data to cloud (replaces cloud). Export JSON first if needed.')){
              applying=true;window.momentumApplyCloud(incoming);applying=false;setStatus('Synced ✓');
            } else {dirty=true;await save()}
          } else {applying=true;window.momentumApplyCloud(incoming);applying=false;setStatus('Synced ✓')}
          return;
        }
        if(dirty)return;
        if(snap.exists()&&!snap.metadata.hasPendingWrites){
          const incoming=snap.data().state;if(JSON.stringify(incoming)!==JSON.stringify(snapshotLocal())){
            applying=true;window.momentumApplyCloud(incoming);applying=false;
          }setStatus('Synced ✓');
        }
      },e=>{setStatus('Cloud error — local saving active');console.error(e)});
    });
    $('cloudLoginBtn').onclick=async()=>{
      try {await signInWithPopup(auth,new GoogleAuthProvider())}
      catch(e){if(e.code==='auth/popup-blocked'){await signInWithRedirect(auth,new GoogleAuthProvider())}else{setStatus('Sign-in failed: '+e.code);console.error(e)}}
    };
    $('cloudLogoutBtn').onclick=async()=>{await signOut(auth);disconnect()};
    window.addEventListener('online',()=>{if(dirty&&uid&&ready)save()});
    document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible'&&dirty&&uid&&ready)save()});
  }catch(e){setStatus('Cloud unavailable — local mode');console.error(e)}
}
