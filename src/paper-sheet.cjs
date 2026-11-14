'use strict';

// Independent proof of concept: persistent crease geometry, NOT REALITI physics.
// Coordinates are normalized to a square sheet. No unverified sensory claims.
const VERSION = 1;
const finite = n => typeof n === 'number' && Number.isFinite(n);
function point(p) {
  if (!Array.isArray(p) || p.length !== 2 || !p.every(finite) || p.some(n => n < 0 || n > 1))
    throw new TypeError('Fold endpoints must be [x,y] within the unit square');
  return [...p];
}
function createSheet({id='sheet-1', material='washi', colour='ivory'}={}) {
  if (typeof id !== 'string' || !id.trim()) throw new TypeError('Sheet requires an ID');
  return {schema:'WASHI_SHEET_V1', version:VERSION, id, material, colour, folds:[], revision:0};
}
function validate(sheet) {
  if (!sheet || sheet.schema !== 'WASHI_SHEET_V1' || sheet.version !== VERSION ||
      !Array.isArray(sheet.folds) || !Number.isSafeInteger(sheet.revision) ||
      sheet.revision !== sheet.folds.length || typeof sheet.id !== 'string')
    throw new Error('Invalid sheet checkpoint');
  sheet.folds.forEach((f,i) => {
    if (f.order !== i+1 || !finite(f.angleDegrees) || f.angleDegrees < -180 || f.angleDegrees > 180)
      throw new Error('Invalid fold entry');
    const a=point(f.from), b=point(f.to);
    if (Math.hypot(a[0]-b[0], a[1]-b[1]) < 1e-8) throw new Error('Zero-length crease');
  });
  return sheet;
}
function foldSheet(sheet,{from,to,angleDegrees=180}={}) {
  validate(sheet);
  const a=point(from), b=point(to);
  if (Math.hypot(a[0]-b[0],a[1]-b[1]) < 1e-8) throw new Error('Zero-length crease');
  if (!finite(angleDegrees) || angleDegrees < -180 || angleDegrees > 180 || angleDegrees === 0)
    throw new TypeError('Fold angle must be nonzero and between -180 and 180 degrees');
  const fold={order:sheet.folds.length+1,from:a,to:b,angleDegrees};
  const result={...sheet,folds:[...sheet.folds.map(f=>({...f,from:[...f.from],to:[...f.to]})),fold],revision:sheet.revision+1};
  return validate(result);
}
function saveSheet(sheet) { return JSON.stringify(validate(sheet)); }
function loadSheet(checkpoint) {
  const parsed=JSON.parse(checkpoint);
  validate(parsed);
  return parsed;
}
function inspectSheet(sheet) {
  validate(sheet);
  return {id:sheet.id,material:sheet.material,colour:sheet.colour,
    revision:sheet.revision,creaseCount:sheet.folds.length,
    creases:sheet.folds.map(f=>({...f,from:[...f.from],to:[...f.to]}))};
}
module.exports={createSheet,foldSheet,saveSheet,loadSheet,inspectSheet};
