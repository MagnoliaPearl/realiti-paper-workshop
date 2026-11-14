'use strict';
const assert=require('node:assert/strict');
const {createSheet,foldSheet,saveSheet,loadSheet,inspectSheet}=require('../src/paper-sheet.cjs');

// Visit 1: fold horizontally, then vertically, and depart.
const first=createSheet({id:'washi-demo',colour:'coral'});
const once=foldSheet(first,{from:[0,0.5],to:[1,0.5],angleDegrees:180});
const twice=foldSheet(once,{from:[0.5,0],to:[0.5,1],angleDegrees:90});
assert.equal(first.folds.length,0,'immutable original sheet');
assert.equal(once.folds.length,1);
const departure=saveSheet(twice);

// Visit 2: load independent checkpoint and inspect without folding anew.
const returned=loadSheet(departure);
const view=inspectSheet(returned);
assert.equal(view.creaseCount,2);
assert.equal(view.revision,2);
assert.deepEqual(view.creases[0].from,[0,0.5]);
assert.deepEqual(view.creases[1].from,[0.5,0]);
assert.equal(saveSheet(returned),departure,'exact checkpoint round trip');

// Visit 2 can add a fold while the archived checkpoint remains unchanged.
const third=foldSheet(returned,{from:[0,0],to:[1,1],angleDegrees:45});
assert.equal(third.folds.length,3);
assert.equal(loadSheet(departure).folds.length,2);

// Reject invalid or corrupt input.
assert.throws(()=>foldSheet(returned,{from:[0,0],to:[0,0]}),/Zero-length/);
assert.throws(()=>foldSheet(returned,{from:[0,0],to:[1,1],angleDegrees:500}),/angle/);
assert.throws(()=>loadSheet('{"schema":"WASHI_SHEET_V1"}'),/Invalid/);
console.log('PASS: two creases survive separate saved/loaded visits');
