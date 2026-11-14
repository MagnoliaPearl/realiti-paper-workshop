'use strict';
// Reproducible downstream patch applied to a separately checked-out REALITI source.
// Does not modify the upstream repository.
const fs=require('node:fs');
const path=require('node:path');
const root=process.argv[2];
if(!root)throw Error('Usage: node integration/install-room.cjs /path/to/REALITI');
const target=path.resolve(root,'source/scripts/58-rooms.js');
let s=fs.readFileSync(target,'utf8');
const needle=" ['UNDERCITY','The Undercity','tunnels under the city with no light; clap, touch, listen and smell your way']";
const replacement=needle+",\n ['WASHI_PAPER_WORKSHOP','Washi Paper Workshop','experimental sheet, two folds and a recorded history']";
if(s.includes("'WASHI_PAPER_WORKSHOP','Washi Paper Workshop'"))throw Error('Already installed');
if(!s.includes(needle))throw Error('Upstream manifest signature changed; refusing to patch');
s=s.replace(needle,replacement);
const sceneMarker="if(C9SCENES.SIDE_BY_SIDE_FIRESIDE)";
if(!s.includes(sceneMarker))throw Error('No known scene insertion point');
s=s.replace(sceneMarker, "C9SCENES.WASHI_PAPER_WORKSHOP={intro:'A plain folding table holds a square sheet of washi. Each fold is recorded by the world. No simulated touch is claimed.',verbs:[['fold_paper_horizontal','FOLD THE SHEET HORIZONTALLY'],['fold_paper_vertical','FOLD THE SHEET VERTICALLY'],['inspect_paper','INSPECT THE SHEET']]};\n"+sceneMarker);
const endMarker="window.REALITI_SLICE_ROOMS=Object.freeze(";
if(!s.includes(endMarker))throw Error('Upstream Door insertion point changed');
const extension=`
// Washi experimental world slice. World authority is the existing REALITI C9
// object store, NOT a parallel checkpoint. Actions require being in this room.
// The only evidence asserted is the persisted numerical geometry; there is no
// WORLD_GROUNDED or physical contact claim.
const WASHI_ROOM='WASHI_PAPER_WORKSHOP',WASHI_OBJECT='WASHI-SHEET-1';
const washiCopy=x=>JSON.parse(JSON.stringify(x));
function washiSheet(){
  C9.b14=C9.b14||{};C9.b14.objects=C9.b14.objects||{};
  let o=C9.b14.objects[WASHI_OBJECT];
  if(!o){
    o={id:WASHI_OBJECT,label:'ivory washi sheet',kind:'paper',
       room:WASHI_ROOM,material:'washi',colour:'ivory',
       state:{schema:'WASHI_WORLD_SHEET_V1',folds:[],revision:0}};
    C9.b14.objects[WASHI_OBJECT]=o;
    c9save();
  }
  return o;
}
const washiGeometry=()=>{
 const o=washiSheet();return {object_id:o.id,material:o.material,colour:o.colour,
   revision:o.state.revision,foldActionCount:o.state.folds.length,
   folds:washiCopy(o.state.folds)};
};
function washiAct(action){
  if(C9.currentRoom!==WASHI_ROOM)return {ok:false,error:'NOT_IN_PAPER_WORKSHOP'};
  if(action==='inspect_paper')return {ok:true,paper:washiGeometry(),world_source:'C9.b14.objects'};
  const spec=action==='fold_paper_horizontal'
    ?{from:[0,0.3],to:[1,0.3],angleDegrees:90}
    :action==='fold_paper_vertical'
    ?{from:[0.65,0],to:[0.65,1],angleDegrees:-120}
    :null;
  if(!spec)return {ok:false,error:'PAPER_ACTION_UNKNOWN'};
  const o=washiSheet(),before=o.state.revision;
  // World-owned mutation, not a description-only reply.
  o.state.folds.push({order:before+1,...washiCopy(spec)});
  o.state.revision++;
  const receipt={schema:'WASHI_WORLD_ACTION_V1',room:WASHI_ROOM,
     object_id:o.id,action,before_revision:before,after_revision:o.state.revision,
     fold:washiCopy(o.state.folds[o.state.folds.length-1]),
     source:'REALITI_C9_WORLD_OBJECT',contact_claim:'NONE'};
  C9.b4=C9.b4||{};C9.b4.lastReceipt=receipt;
  c9save();
  return {ok:true,receipt,revision:o.state.revision,paper:washiGeometry()};
}
const washiActions0=b4AgentActions;
b4AgentActions=function(){
  const base=washiActions0();
  if(C9.currentRoom!==WASHI_ROOM)return base;
  return [...base,
    {id:'fold_paper_horizontal',label:'FOLD THE SHEET HORIZONTALLY'},
    {id:'fold_paper_vertical',label:'FOLD THE SHEET VERTICALLY'},
    {id:'inspect_paper',label:'INSPECT THE SHEET'}];
};
const washiAct0=b7AgentAct;
b7AgentAct=function(value){
  const v=String(value||'').trim().toLowerCase();
  if(['fold_paper_horizontal','fold_paper_vertical','inspect_paper'].includes(v))return washiAct(v);
  return washiAct0(value);
};
const washiRun0=window.REALITI_AGENT_DOOR.run;
window.REALITI_AGENT_DOOR.run=function(raw){
  const value=String(raw||'').trim();
  if(C9.currentRoom===WASHI_ROOM&&/^(look|inspect paper)$/i.test(value)){
    const base=washiRun0(raw);
    // Keep the authored REALITI look, append a truthful observation of world state.
    return {...(base&&typeof base==='object'?base:{text:String(base)}),
      paper:washiGeometry(),world_source:'C9.b14.objects'};
  }
  return washiRun0(raw);
};
`;
s=s.replace(endMarker,extension+'\n'+endMarker);
fs.writeFileSync(target,s);
console.log('Installed isolated Washi world slice at '+target);
