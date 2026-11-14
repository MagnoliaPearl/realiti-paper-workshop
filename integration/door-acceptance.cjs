'use strict';
// Acceptance test for a FUTURE REALITI-native build. Intentionally fails until
// the room and object exist in the REALITI runtime. Does NOT use paper-sheet.cjs.
// Usage: REALITI_SOURCE=/path/to/Realitiagentframework node integration/door-acceptance.cjs
const assert=require('node:assert/strict');
const path=require('node:path');
const fs=require('node:fs');
const os=require('node:os');

const source=process.env.REALITI_SOURCE;
if(!source) throw Error('Set REALITI_SOURCE to a local REALITI source checkout with the experimental room installed');
const {openResident}=require(path.join(source,'packages/realiti-headless-resident'));
const html=path.join(source,'RealitiRELAX.html');
if(!fs.existsSync(html)) throw Error('REALITI_HTML_NOT_BUILT: build modified source first');
const temp=fs.mkdtempSync(path.join(os.tmpdir(),'washi-realiti-'));
const storage=path.join(temp,'resident-save.json');
const residentId='washi-door-test';
const room='WASHI_PAPER_WORKSHOP';

async function run(door,command){
  const reply=await door.run(command);
  assert.ok(reply && reply.ok!==false,command+' failed: '+JSON.stringify(reply));
  return reply;
}
async function main(){
  let first;
  try{
    first=await openResident({htmlPath:html,residentId,storagePath:storage});
    const rooms=await first.door.run('rooms');
    assert.ok(JSON.stringify(rooms).includes(room),'Paper Workshop was not registered in the REALITI room catalog');
    await run(first.door,'go '+room);
    console.log('WASHI_DIAGNOSTIC_LOOK',JSON.stringify(await first.door.run('look')));
    const actions=await first.door.run('actions');
    assert.ok(JSON.stringify(actions).includes('fold_paper_'),'REALITI did not advertise paper-fold actions');
    for(const action of ['fold_paper_horizontal','fold_paper_vertical']){
      const result=await run(first.door,'act '+action);
      assert.ok(result.receipt_ref||result.receipt,'Missing REALITI world action receipt for '+action);
      assert.notEqual(result.source,'standalone-paper-sheet','Standalone wrapper receipt is not world evidence');
    }
    await run(first.door,'save');
  } finally {
    first?.close();
  }
  // New host process is required for a strong acceptance test.
  // This single-process script is intentionally a preflight only.
  let returned;
  try{
    returned=await openResident({htmlPath:html,residentId,storagePath:storage});
    await run(returned.door,'go '+room);
    const observed=await run(returned.door,'look');
    const serialized=JSON.stringify(observed);
    assert.ok(/fold/i.test(serialized),'World inspection did not report saved folds');
    assert.ok(/2|two/i.test(serialized),'World inspection did not report the two saved fold actions');
    console.log('PASS: REALITI world registers paper and saves observable fold state across host reopen');
    console.log('IMPORTANT: Sedge must also verify separate operating-system processes and independent geometry');
  } finally {
    returned?.close();
    if(process.env.WASHI_KEEP_TEST_STATE!=='1')fs.rmSync(temp,{recursive:true,force:true});
  }
}
main().catch(e=>{console.error(e);process.exitCode=1});
