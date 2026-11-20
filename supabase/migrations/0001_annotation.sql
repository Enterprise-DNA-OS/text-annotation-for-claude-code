create table projects (
 id uuid primary key default gen_random_uuid(), code text not null unique, name text not null,
 purpose text not null, guideline text not null, guideline_version integer not null default 1,
 labels jsonb not null check(jsonb_typeof(labels)='array' and jsonb_array_length(labels)>0),
 minimum_reviews integer not null default 2 check(minimum_reviews between 1 and 10),
 retention_review_on date not null, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table items (
 id uuid primary key default gen_random_uuid(), project_id uuid not null references projects(id),
 code text not null unique, source text not null, external_id text not null, content text not null check(length(trim(content))>0),
 source_answers jsonb not null default '[]', source_status text not null default 'unknown',
 owner text not null, due_on date not null, privacy_evidence text, privacy_checked_by text,
 held boolean not null default false, hold_reason text, revision integer not null default 1,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
 unique(project_id, source, external_id)
);
create table annotations (
 id uuid primary key default gen_random_uuid(), item_id uuid not null references items(id),
 actor text not null, labels jsonb not null check(jsonb_typeof(labels)='array' and jsonb_array_length(labels)>0),
 rationale text not null, guideline_version integer not null,
 sequence bigint generated always as identity unique,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table decisions (
 id uuid primary key default gen_random_uuid(), item_id uuid not null references items(id),
 actor text not null, labels jsonb not null, rationale text not null, item_revision integer not null,
 guideline_version integer not null, sequence bigint generated always as identity unique,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table import_batches (
 id uuid primary key default gen_random_uuid(), project_id uuid not null references projects(id),
 source text not null, sha256 text not null, original_csv text not null, mapping jsonb not null,
 row_count integer not null, item_count integer not null, actor text not null,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
 unique(project_id,source,sha256)
);
create table releases (
 id uuid primary key default gen_random_uuid(), project_id uuid not null references projects(id),
 code text not null unique, actor text not null, guideline_version integer not null,
 payload jsonb not null, sha256 text not null, note text not null,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table audit (
 id uuid primary key default gen_random_uuid(), actor text not null, action text not null,
 entity_id uuid not null, detail jsonb not null, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create function touch_updated_at() returns trigger language plpgsql as $$ begin new.updated_at=clock_timestamp(); return new; end $$;
do $$ declare t text; begin foreach t in array array['projects','items','annotations','decisions','import_batches','releases','audit'] loop
 execute format('create trigger touch before update on %I for each row execute function touch_updated_at()',t);
 execute format('alter table %I enable row level security',t);
 execute format('revoke all on %I from public',t);
end loop; end $$;
create index items_project_idx on items(project_id);
create index annotations_item_idx on annotations(item_id,sequence desc);
create index decisions_item_idx on decisions(item_id,sequence desc);
create view latest_annotations as
 select distinct on (item_id,lower(actor)) * from annotations order by item_id,lower(actor),sequence desc;
create view latest_decisions as
 select distinct on (item_id) * from decisions order by item_id,sequence desc;
create view review_queue as
 select i.id,i.project_id,i.code,p.code project,i.owner,i.due_on,i.source_status,i.held,i.revision,
 p.guideline_version,p.minimum_reviews,
 coalesce(a.reviewers,0) reviewers,coalesce(a.answer_sets,0) answer_sets,
 d.labels final_labels,d.actor reviewer,
 (d.id is not null and d.item_revision=i.revision and d.guideline_version=p.guideline_version) decision_current,
 case
 when i.held then 'held'
 when p.retention_review_on < current_date then 'retention_overdue'
 when coalesce(trim(i.privacy_evidence),'')='' then 'privacy_review'
 when coalesce(a.reviewers,0) < p.minimum_reviews then 'needs_labels'
 when d.id is null or d.item_revision<>i.revision or d.guideline_version<>p.guideline_version then
   case when coalesce(a.answer_sets,0)>1 then 'disagreement' else 'needs_adjudication' end
 else 'ready' end status
 from items i join projects p on p.id=i.project_id
 left join lateral(select count(*) reviewers,count(distinct labels) answer_sets from latest_annotations a where a.item_id=i.id and a.guideline_version=p.guideline_version) a on true
 left join latest_decisions d on d.item_id=i.id;
create view project_progress as
 select p.id,p.code,p.name,p.guideline_version,p.retention_review_on,count(q.id) items,
 count(q.id) filter(where q.status='ready') ready,
 count(q.id) filter(where q.answer_sets>1 and not q.decision_current) disagreements,
 count(q.id) filter(where q.due_on<current_date and q.status<>'ready') overdue
 from projects p left join review_queue q on p.id=q.project_id group by p.id;
create view compliance_findings as
 select i.id,i.code,'NZ-IPP8' rule,'Accuracy and privacy evidence not recorded' finding from items i where coalesce(trim(privacy_evidence),'')=''
 union all select p.id,p.code,'NZ-IPP9','Retention review is overdue; do not release' from projects p where retention_review_on<current_date
 union all select i.id,i.code,'LOCAL-HOLD',coalesce(i.hold_reason,'Held for review') from items i where held
 union all select q.id,q.code,'LOCAL-REVIEW','Independent review or current adjudication missing' from review_queue q where q.status in ('needs_labels','needs_adjudication','disagreement');
