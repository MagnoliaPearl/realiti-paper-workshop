'use strict';
const assert=require('node:assert/strict');
const {createSheet,foldSheet,saveSheet,loadSheet,inspectSheet}=require('../src/paper-sheet.cjs');

// Three independent simulated visits using serialized JSON checkpoints.
const virgin=createSheet({id:'washi-demo',colour:'coral'});
const first=foldSheet(virgin,{from:[0,0.25],to:[1,0.25],angleDegrees:75});
const firstSave=saveSheet(first);
const second=foldSheet(loadSheet(firstSave),
  {from:[0.65,0],to:[0.65,1],angleDegrees:-120});
const secondSave=saveSheet(second);
const returned=loadSheet(secondSave);
assert.deepEqual(inspectSheet(returned).folds,[
  {order:1,from:[0,0.25],to:[1,0.25],angleDegrees:75},
  {order:2,from:[0.65,0],to:[0.65,1],angleDegrees:-120}
]);
assert.equal(inspectSheet(returned).creaseCount,2);
assert.equal(inspectSheet(returned).foldActionCount,2);
assert.equal(virgin.folds.length,0);
assert.equal(loadSheet(firstSave).folds.length,1);
assert.equal(saveSheet(returned),secondSave);

// A different fold history with the same ID remains independent.
const alternate=foldSheet(createSheet({id:'washi-demo'}),
  {from:[0,0],to:[1,1],angleDegrees:35});
assert.equal(inspectSheet(alternate).foldActionCount,1);
assert.equal(inspectSheet(createSheet({id:'washi-demo'})).creaseCount,0);
assert.equal(inspectSheet(loadSheet(secondSave)).foldActionCount,2);

// Reverse endpoints record two actions on one geometric crease.
const refold=foldSheet(returned,
  {from:[1,0.25],to:[0,0.25],angleDegrees:30});
assert.equal(inspectSheet(refold).foldActionCount,3);
assert.equal(inspectSheet(refold).creaseCount,2);
assert.deepEqual(inspectSheet(refold).creases[0].foldOrders,[1,3]);

// Reject invalid state consistently on save and restore.
const invalid=[
  {...returned,id:' '},
  {...returned,material:{}},
  {...returned,colour:undefined},
  {...returned,folds:[{...returned.folds[0],angleDegrees:0},returned.folds[1]]},
];
const sparse=Array(2); sparse[0]=returned.folds[0];
invalid.push({...returned,folds:sparse});
for (const state of invalid) {
  assert.throws(()=>saveSheet(state));
  assert.throws(()=>loadSheet(JSON.stringify(state)));
}
assert.throws(()=>createSheet({material:{}}));
assert.throws(()=>createSheet({id:' '}));
assert.throws(()=>foldSheet(returned,{from:[0,0],to:[0,0]}));
assert.throws(()=>foldSheet(returned,{from:[0,0],to:[1,1],angleDegrees:0}));
assert.throws(()=>loadSheet('{"schema":"WASHI_SHEET_V1"}'));

// Inspection and loading never hand back references to input objects.
const view=inspectSheet(returned);
view.folds[0].from[0]=0.9;
view.creases[0].from[0]=0.8;
assert.deepEqual(returned.folds[0].from,[0,0.25]);
const restored=loadSheet(secondSave);
restored.folds[0].from[0]=0.5;
assert.deepEqual(loadSheet(secondSave).folds[0].from,[0,0.25]);
console.log('PASS: independent fold history, unique crease marks, validation, isolation');
