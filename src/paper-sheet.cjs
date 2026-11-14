'use strict';

// Independent crease-state experiment, not a REALITI physics or contact engine.
// Coordinates live in the normalized [0,1] square; folds are recorded actions.
const VERSION = 1;
const finite = n => typeof n === 'number' && Number.isFinite(n);
const scalar = (s, field) => {
  if (typeof s !== 'string' || !s.trim() || s.length > 160)
    throw new TypeError(field + ' must be a nonempty string of at most 160 characters');
  return s;
};
function point(p) {
  if (!Array.isArray(p) || p.length !== 2 || ![0,1].every(i => Object.hasOwn(p,i)) ||
      !p.every(finite) || p.some(n => n < 0 || n > 1))
    throw new TypeError('Fold endpoints must be [x,y] within the unit square');
  return [...p];
}
function validFold(f,i) {
  if (!f || typeof f !== 'object' || Array.isArray(f) || f.order !== i+1 ||
      !finite(f.angleDegrees) || f.angleDegrees === 0 ||
      f.angleDegrees < -180 || f.angleDegrees > 180)
    throw new Error('Invalid fold entry');
  const a=point(f.from), b=point(f.to);
  if (Math.hypot(a[0]-b[0],a[1]-b[1]) < 1e-8)
    throw new Error('Zero-length crease');
}
function validate(sheet) {
  if (!sheet || typeof sheet !== 'object' || Array.isArray(sheet) ||
      sheet.schema !== 'WASHI_SHEET_V1' || sheet.version !== VERSION ||
      !Array.isArray(sheet.folds) || !Number.isSafeInteger(sheet.revision) ||
      sheet.revision < 0 || sheet.revision !== sheet.folds.length)
    throw new Error('Invalid sheet checkpoint');
  scalar(sheet.id,'Sheet ID');
  scalar(sheet.material,'Material');
  scalar(sheet.colour,'Colour');
  // Array.every/forEach silently skip holes. Require every expected index.
  for (let i=0;i<sheet.folds.length;i++) {
    if (!Object.hasOwn(sheet.folds,i)) throw new Error('Sparse fold history');
    validFold(sheet.folds[i],i);
  }
  return sheet;
}
function createSheet({id='sheet-1', material='washi', colour='ivory'}={}) {
  return validate({schema:'WASHI_SHEET_V1',version:VERSION,
    id:scalar(id,'Sheet ID'),material:scalar(material,'Material'),
    colour:scalar(colour,'Colour'),folds:[],revision:0});
}
function clone(sheet) {
  // A schema-controlled copy prevents caller metadata references leaking through.
  return {schema:sheet.schema,version:sheet.version,id:sheet.id,
    material:sheet.material,colour:sheet.colour,revision:sheet.revision,
    folds:sheet.folds.map(f=>({order:f.order,from:[...f.from],
      to:[...f.to],angleDegrees:f.angleDegrees}))};
}
function foldSheet(sheet,{from,to,angleDegrees=180}={}) {
  validate(sheet);
  const a=point(from), b=point(to);
  if (Math.hypot(a[0]-b[0],a[1]-b[1]) < 1e-8) throw new Error('Zero-length crease');
  if (!finite(angleDegrees) || angleDegrees === 0 ||
      angleDegrees < -180 || angleDegrees > 180)
    throw new TypeError('Fold angle must be nonzero and between -180 and 180 degrees');
  const next=clone(sheet);
  next.folds.push({order:next.folds.length+1,from:a,to:b,angleDegrees});
  next.revision++;
  return validate(next);
}
function saveSheet(sheet) {
  return JSON.stringify(clone(validate(sheet)));
}
function loadSheet(checkpoint) {
  if (typeof checkpoint !== 'string') throw new TypeError('Checkpoint must be JSON text');
  return clone(validate(JSON.parse(checkpoint)));
}
function samePoint(a,b) {
  return a[0] === b[0] && a[1] === b[1];
}
function sameSegment(a,b) {
  return (samePoint(a.from,b.from) && samePoint(a.to,b.to)) ||
    (samePoint(a.from,b.to) && samePoint(a.to,b.from));
}
function inspectSheet(sheet) {
  const actions=clone(validate(sheet)).folds;
  const creases=[];
  for(const action of actions) {
    const existing=creases.find(c=>sameSegment(c,action));
    if (existing) {
      existing.foldOrders.push(action.order);
    } else {
      creases.push({from:[...action.from],to:[...action.to],
        foldOrders:[action.order]});
    }
  }
  return {id:sheet.id,material:sheet.material,colour:sheet.colour,
    revision:sheet.revision,foldActionCount:actions.length,
    creaseCount:creases.length,folds:actions,creases};
}
module.exports={createSheet,foldSheet,saveSheet,loadSheet,inspectSheet,validate};
