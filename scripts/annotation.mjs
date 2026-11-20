#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import {createHash,randomUUID} from 'node:crypto';
import {pathToFileURL} from 'node:url';
import {getDb,REPO_ROOT} from './lib/db.mjs';
import {parseCsv} from './lib/csv.mjs';
import {table} from './lib/format.mjs';

export const readCommands=['projects','items','queue','attention','disagreements','coverage','reviewer-workload','compliance','imports','releases','audit'];
export const writeCommands=['add-project','add-item','assign','annotate','adjudicate','privacy-check','hold','unhold','guidelines','retention-review','log','import','release'];
export const commands=['help',...readCommands,'detail','history','weekly-review',...writeCommands,'draft-review-note','export'];
const hash=s=>createHash('sha256').update(s).digest('hex');
const must=(o,k)=>{if(typeof o[k]!=='string'||!o[k].trim())throw Error(`--${k} is required`);return o[k].trim();};
const date=s=>{if(!/^\d{4}-\d{2}-\d{2}$/.test(s)||Number.isNaN(Date.parse(s))||new Date(s).toISOString().slice(0,10)!==s)throw Error('Use a real calendar date YYYY-MM-DD');return s;};
const json=s=>JSON.stringify(s);
const normalActor=s=>s.trim().toLowerCase();
function labels(value,allowed){const a=[...new Set(value.split(';').map(s=>s.trim()).filter(Boolean))].sort();if(!a.length||a.some(s=>!allowed.includes(s)))throw Error(`Labels must be from: ${allowed.join('; ')}`);return a;}
function parse(argv){const opt={},args=[];for(const x of argv){if(x.startsWith('--')){const i=x.indexOf('=');const k=x.slice(2,i<0?undefined:i);if(k in opt)throw Error(`Repeated flag --${k}`);opt[k]=i<0?true:x.slice(i+1);}else args.push(x);}return {cmd:args[0]||'help',sub:args[1],opt};}
export async function resolve(db,t,ref){
 const fields=t==='projects'?['code','name']:['code'];
 const rows=await db.query(`select * from ${t} where id::text ilike $1 or ${fields.map(f=>`${f} ilike $1`).join(' or ')} order by code`,['%'+ref.replace(/[\\%_]/g,'\\$&')+'%']);
 const exact=rows.filter(r=>[r.id,...fields.map(f=>r[f])].some(v=>String(v).toLowerCase()===ref.toLowerCase()));
 const found=exact.length?exact:rows;
 if(found.length!==1)throw Error(found.length?`Ambiguous ${t}: ${found.map(r=>`${r.code} (${r.id})`).join(', ')}`:`No ${t} match ${ref}`);
 return found[0];
}
const queryMap={
 projects:'select code,name,items,ready,disagreements,overdue,retention_review_on from project_progress order by code',
 items:'select code,source,external_id,owner,due_on,revision from items order by code',
 queue:'select code,project,owner,due_on,reviewers,answer_sets,status from review_queue order by due_on,code',
 attention:"select code,project,owner,status,due_on from review_queue where status<>'ready' order by due_on,code",
 disagreements:'select code,project,owner,reviewers,answer_sets,status from review_queue where answer_sets>1 and not decision_current order by code',
 coverage:`select p.code project, a.label,count(distinct q.id) items from projects p cross join lateral jsonb_array_elements_text(p.labels) a(label)
 left join review_queue q on q.project_id=p.id and q.status='ready' and q.final_labels ? a.label group by p.code,a.label order by p.code,a.label`,
 'reviewer-workload':`select lower(a.actor) actor,count(*) latest_labels,count(*) filter(where a.guideline_version<>p.guideline_version) old_guideline,
 count(*) filter(where q.answer_sets>1 and not q.decision_current) open_disagreements from latest_annotations a join items i on i.id=a.item_id join projects p on p.id=i.project_id join review_queue q on q.id=i.id group by lower(a.actor) order by lower(a.actor)`,
 compliance:'select code,rule,finding from compliance_findings order by code,rule',
 imports:'select id,source,row_count,item_count,sha256,actor,created_at from import_batches order by created_at,id',
 releases:'select code,guideline_version,jsonb_array_length(payload) items,sha256,actor,created_at from releases order by created_at,id',
 audit:'select action,actor,entity_id,detail,created_at from audit order by created_at,id'
};
async function importer(db,o,sub){
 if(sub!=='datasaur')throw Error('Use import datasaur');
 const p=await resolve(db,'projects',must(o,'project'));
 const source=must(o,'source'),actor=must(o,'actor');
 const owner=must(o,'owner'),due=date(must(o,'due')); 
 const raw=fs.readFileSync(path.resolve(must(o,'file')),'utf8');
 const mapping=o.map?JSON.parse(fs.readFileSync(path.resolve(o.map),'utf8')):{id:'Line',text:'Text',answer:'Category',status:'Label Status'};
 for(const key of ['id','text','answer'])if(typeof mapping[key]!=='string'||!mapping[key])throw Error(`Mapping requires ${key} column`);
 const records=parseCsv(raw);if(!records.length)throw Error('CSV contains no data rows');
 const groups=new Map();
 for(const [index,r] of records.entries()){
  for(const key of ['id','text','answer'])if(!(mapping[key] in r))throw Error(`Missing mapped column ${mapping[key]}`);
  const external=r[mapping.id].trim(),text=r[mapping.text];
  if(!external||!text.trim())throw Error(`Row ${index+2}: identifier and text are required`);
  const status=mapping.status&&r[mapping.status]?r[mapping.status].trim().toLowerCase():'unknown';
  if(!['unknown','resolved','conflicted','unresolved','conflict'].includes(status))throw Error(`Row ${index+2}: unrecognised label status ${status}`);
  const answer=r[mapping.answer].trim()?labels(r[mapping.answer],p.labels):[];
  const g=groups.get(external)||{external,content:text,answers:[],statuses:[]};
  if(g.content!==text)throw Error(`Conflicting text for source identifier ${external}; choose a stable original text column`);
  g.answers.push({labels:answer,status,row:index+2,raw:r});g.statuses.push(status);groups.set(external,g);
 }
 const digest=hash(raw);
 const prior=await db.query('select id from import_batches where project_id=$1 and source=$2 and sha256=$3',[p.id,source,digest]);
 if(prior.length)return {unchanged:true,batch:prior[0].id,items:groups.size};
 let additions=0;
 for(const g of groups.values()){
  const old=await db.query('select * from items where project_id=$1 and source=$2 and external_id=$3',[p.id,source,g.external]);
  const same=old.length&&old[0].content===g.content&&hash(stable(old[0].source_answers))===hash(stable(g.answers));
  if(old.length&&!same)throw Error(`Source ${source}/${g.external} changed. Preserve this import; use a new source snapshot name and reconcile it explicitly.`);
  if(old.length)continue;
  additions++;
  if(!o['dry-run'])await db.query(`insert into items(project_id,code,source,external_id,content,source_answers,source_status,owner,due_on) values($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
   [p.id,'TXT-'+randomUUID().slice(0,12),source,g.external,g.content,json(g.answers),g.statuses.some(x=>['conflicted','conflict','unresolved'].includes(x))?'conflicted':g.statuses.every(x=>x==='resolved')?'resolved':'unknown',owner,due]);
 }
 if(o['dry-run'])return {dry_run:true,rows:records.length,items:groups.size,new_items:additions};
 const [b]=await db.query('insert into import_batches(project_id,source,sha256,original_csv,mapping,row_count,item_count,actor) values($1,$2,$3,$4,$5,$6,$7,$8) returning id',[p.id,source,digest,raw,json(mapping),records.length,groups.size,actor]);
 return {batch:b.id,rows:records.length,items:groups.size,new_items:additions};
}
function stable(v){if(Array.isArray(v))return '['+v.map(stable).join(',')+']';if(v&&typeof v==='object')return '{'+Object.keys(v).sort().map(k=>json(k)+':'+stable(v[k])).join(',')+'}';return json(v);}

export async function execute(db,cmd,o={},sub){
 if(!commands.includes(cmd))throw Error(`Unknown command ${cmd}. Use help.`);
 if(cmd==='help')return commands.map(command=>({command}));
 if(queryMap[cmd])return db.query(queryMap[cmd]);
 if(cmd==='weekly-review')return {projects:await execute(db,'projects'),attention:await execute(db,'attention'),disagreements:await execute(db,'disagreements'),compliance:await execute(db,'compliance'),coverage:await execute(db,'coverage')};
 if(cmd==='detail'||cmd==='history'){
  const i=await resolve(db,'items',must(o,'item'));
  return {item:i,queue:(await db.query('select * from review_queue where id=$1',[i.id]))[0],annotations:await db.query('select actor,labels,rationale,guideline_version,sequence,created_at from annotations where item_id=$1 order by sequence',[i.id]),decisions:await db.query('select actor,labels,rationale,item_revision,guideline_version,created_at from decisions where item_id=$1 order by sequence',[i.id]),events:await db.query('select actor,action,detail,created_at from audit where entity_id=$1 order by created_at,id',[i.id])};
 }
 if(cmd==='export'){
  if(o.release){const r=await resolve(db,'releases',o.release);return {kind:'training-release',release:r,payload:r.payload};}
  const data={};for(const t of ['projects','items','annotations','decisions','import_batches','releases','audit'])data[t]=await db.query(`select * from ${t} order by id`);
  return {format:'text-annotation-archive-v1',generated_at:new Date().toISOString(),data};
 }
 if(cmd==='draft-review-note'){
  const i=await execute(db,'detail',o);
  return {item:i.item.code,sent:false,text:`Draft for manual review\n\nItem: ${i.item.code}\nOwner: ${i.item.owner}\nStatus: ${i.queue.status}\n\nSource text:\n${i.item.content}\n\nLatest review:\n${json(i.annotations)}\n\nReview the recorded evidence and the current guidelines before deciding.\n`};
 }
 const actor=must(o,'actor');let result;
 if(cmd==='add-project'){
  const names=[...new Set(must(o,'labels').split(';').map(x=>x.trim()).filter(Boolean))].sort();if(!names.length)throw Error('Provide labels');
  const minimum=Number(o.minimum||2);if(!Number.isInteger(minimum)||minimum<1||minimum>10)throw Error('minimum must be 1 to 10');
  [result]=await db.query(`insert into projects(code,name,purpose,guideline,labels,minimum_reviews,retention_review_on) values($1,$2,$3,$4,$5,$6,$7) returning *`,[must(o,'code'),must(o,'name'),must(o,'purpose'),must(o,'guideline'),json(names),minimum,date(must(o,'retention'))]);
 }else if(cmd==='add-item'){
  const p=await resolve(db,'projects',must(o,'project'));
  [result]=await db.query(`insert into items(project_id,code,source,external_id,content,owner,due_on) values($1,$2,$3,$4,$5,$6,$7) returning *`,[p.id,must(o,'code'),must(o,'source'),must(o,'external-id'),must(o,'text'),must(o,'owner'),date(must(o,'due'))]);
 }else if(cmd==='guidelines'){
  const p=await resolve(db,'projects',must(o,'project'));
  [result]=await db.query('update projects set guideline=$1,guideline_version=guideline_version+1 where id=$2 returning *',[must(o,'text'),p.id]);
 }else if(cmd==='retention-review'){
  const p=await resolve(db,'projects',must(o,'project'));must(o,'evidence');
  [result]=await db.query('update projects set retention_review_on=$1 where id=$2 returning *',[date(must(o,'due')),p.id]);
 }else if(cmd==='import')result=await importer(db,o,sub);
 else if(cmd==='release'){
  const p=await resolve(db,'projects',must(o,'project'));
  const q=await db.query('select * from review_queue where project_id=$1 order by code',[p.id]);
  if(!q.length||q.some(x=>x.status!=='ready'))throw Error(`Release blocked: ${q.filter(x=>x.status!=='ready').map(x=>`${x.code}: ${x.status}`).join(', ')||'no items'}`);
  const rows=await db.query(`select i.code,i.source,i.external_id,i.content,d.labels,d.actor reviewer,d.rationale,i.privacy_evidence,i.revision from items i join latest_decisions d on d.item_id=i.id where i.project_id=$1 order by i.code`,[p.id]);
  [result]=await db.query('insert into releases(project_id,code,actor,guideline_version,payload,sha256,note) values($1,$2,$3,$4,$5,$6,$7) returning *',[p.id,must(o,'code'),actor,p.guideline_version,json(rows),hash(stable(rows)),must(o,'note')]);
 }else{
  const i=await resolve(db,'items',must(o,'item'));const p=await resolve(db,'projects',i.project_id);
  if(cmd==='annotate'){
   if(i.held)throw Error('Item is held; resolve the hold before annotation');
   [result]=await db.query('insert into annotations(item_id,actor,labels,rationale,guideline_version) values($1,$2,$3,$4,$5) returning *',[i.id,actor,json(labels(must(o,'labels'),p.labels)),must(o,'reason'),p.guideline_version]);
   await db.query('update items set revision=revision+1 where id=$1',[i.id]);
  }else if(cmd==='adjudicate'){
   const a=await db.query('select * from latest_annotations where item_id=$1 and guideline_version=$2',[i.id,p.guideline_version]);
   if(i.held||a.length<p.minimum_reviews)throw Error('Adjudication needs an unheld item and the required current labels');
   if(a.some(x=>normalActor(x.actor)===normalActor(actor)))throw Error('Reviewer must be different from the annotators');
   [result]=await db.query('insert into decisions(item_id,actor,labels,rationale,item_revision,guideline_version) values($1,$2,$3,$4,$5,$6) returning *',[i.id,actor,json(labels(must(o,'labels'),p.labels)),must(o,'reason'),i.revision,p.guideline_version]);
  }else if(cmd==='privacy-check'){
   [result]=await db.query('update items set privacy_evidence=$1,privacy_checked_by=$2,revision=revision+1 where id=$3 returning *',[must(o,'evidence'),actor,i.id]);
  }else if(cmd==='hold'||cmd==='unhold'){
   [result]=await db.query('update items set held=$1,hold_reason=$2,revision=revision+1 where id=$3 returning *',[cmd==='hold',must(o,'reason'),i.id]);
  }else if(cmd==='assign'){
   [result]=await db.query('update items set owner=$1,due_on=$2 where id=$3 returning *',[must(o,'owner'),date(must(o,'due')),i.id]);
  }else if(cmd==='log')result={id:i.id,note:must(o,'text')};
 }
 if(!o['dry-run'])await db.query('insert into audit(actor,action,entity_id,detail) values($1,$2,$3,$4)',[actor,cmd,result.item_id||result.id||result.batch||'00000000-0000-0000-0000-000000000000',json(o)]);
 return result;
}
// A single transaction and write lock protects review decisions from concurrent mutations.
// PostgreSQL deployments use one trusted service role; actor labels are not authentication.
export async function run(db,cmd,o={},sub){
 const write=writeCommands.includes(cmd);
 await db.exec(write?'BEGIN':'BEGIN READ ONLY');
 try{
  if(write)await db.exec('LOCK TABLE projects,items,annotations,decisions,import_batches,releases,audit IN SHARE ROW EXCLUSIVE MODE');
  const result=await execute(db,cmd,o,sub);await db.exec(o['dry-run']?'ROLLBACK':'COMMIT');return result;
 }catch(e){await db.exec('ROLLBACK');throw e;}
}
export function human(value){
 if(Array.isArray(value)){if(!value.length)return '  (none)';return table(value,Object.keys(value[0]).map(key=>({key,label:key,format:v=>v instanceof Date?v.toISOString().slice(0,10):v&&typeof v==='object'?json(v):v})));}
 if(value&&typeof value==='object'&&Object.values(value).some(Array.isArray))return Object.entries(value).map(([k,v])=>`${k}\n${Array.isArray(v)?human(v):typeof v==='object'?JSON.stringify(v,null,2):v}`).join('\n\n');
 return JSON.stringify(value,null,2);
}
export async function main(argv=process.argv.slice(2)){
 const {cmd,sub,opt}=parse(argv);const db=await getDb();
 try{
  let result=await run(db,cmd,opt,sub);
  if(cmd==='draft-review-note'||cmd==='export'){
   const dir=path.resolve(process.env.OUTPUT_DIR||REPO_ROOT,cmd==='export'?'exports':'drafts');fs.mkdirSync(dir,{recursive:true,mode:0o700});
   const file=path.join(dir,`${cmd}-${randomUUID()}.${cmd==='export'?'json':'txt'}`);
   fs.writeFileSync(file,cmd==='export'?JSON.stringify(result,null,2)+'\n':result.text,{mode:0o600});
   result={file,sent:false,...(cmd==='export'?{kind:result.kind||result.format}:{item:result.item})};
  }
  console.log(opt.json?JSON.stringify(result):human(result));
 }finally{await db.close();}
}
if(process.argv[1]&&import.meta.url===pathToFileURL(path.resolve(process.argv[1])).href)main().catch(e=>{console.error(e.message);process.exitCode=1;});
