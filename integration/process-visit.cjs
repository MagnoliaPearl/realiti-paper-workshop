'use strict';
// Stronger independent-process check: invoke as 'fold' and 'return' in separate
// Node processes, sharing ONLY REALITI's own durable host storage.
const assert=require('node:assert/strict');
const path=require('node:path');
const fs=require('node:fs');
const source=process.env.REALITI_SOURCE;
const state=process.env.WASHI_REALITI_STATE;
const mode=process.argv[2];
if(!source||!state||!['fold','return'].includes(mode))
  throw Error('Set REALITI_SOURCE and WASHI_REALITI_STATE, then run fold or return');
const {openResident}=require(path.join(source,'packages/realiti-headless-resident'));
const html=path.join(source,'RealitiRELAX.html');
const residentId='washi-actual-door-independent-process';
const expected=[
  {order:1,from:[0,0.3],to:[1,0.3],angleDegrees:90},
  {order:2,from:[0.65,0],to:[0.65,1],angleDegrees:-120}
];
async function check(result,expectedFolds){
  assert.equal(result.ok,true,JSON.stringify(result));
  const payload=result.result || result;
  assert.equal(payload.world_source,'C9.b14.objects');
  assert.deepEqual(payload.paper.folds,expectedFolds);
  assert.equal(payload.paper.revision,expectedFolds.length);
}
async function main(){
  const session=await openResident({htmlPath:html,residentId,storagePath:state});
  try{
    const door=session.door;
    const moved=await door.run('go WASHI_PAPER_WORKSHOP');
    assert.equal(moved.ok,true,'room not reachable');
    if(mode==='fold'){
      for(const action of ['fold_paper_horizontal','fold_paper_vertical']){
        const result=await door.run('act '+action);
        assert.equal(result.ok,true,JSON.stringify(result));
        assert.ok(result.receipt_ref || result.receipt, 'Missing world action receipt: '+JSON.stringify(result));
        const details=result.receipt_ref ? await door.run('receipt '+result.receipt_ref) : result.receipt;
        assert.ok(JSON.stringify(details).includes('WASHI_WORLD_ACTION_V1'), 'Wrong receipt: '+JSON.stringify(details));
      }
      const result=await door.run('act inspect_paper');
      
      await check(result,expected);
      const saved=await door.run('save');
      assert.notEqual(saved?.ok,false,'save failed');
      console.log('PASS: two world actions and receipt verified in departure process');
    } else {
      // No fold commands on return: state must preexist.
      const result=await door.run('act inspect_paper');
      assert.equal(result.world_source,'C9.b14.objects');
      await check(result,expected);
      console.log('PASS: both exact folds recovered before mutation in a NEW Node process');
    }
  } finally {session.close()}
}
main().catch(err=>{console.error(err);process.exitCode=1});
