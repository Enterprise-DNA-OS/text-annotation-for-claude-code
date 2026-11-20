do $$
declare p uuid; p2 uuid; x uuid; k integer; texts text[]:=array[
 'The parcel arrived with a cracked lid. Please replace it.',
 'Where can I download the invoice for last month?',
 'I want to cancel and get my money back.',
 'Thank you for the quick replacement.',
 'The parcel is late and the tracking link has stopped.',
 'Please update the account contact before renewing.'];
begin
 if exists(select 1 from projects where code='DEMO') then return; end if;
 if exists(select 1 from projects) then raise exception 'Seed requires an empty demo database'; end if;
 insert into projects(code,name,purpose,guideline,labels,retention_review_on)
 values('DEMO','Service enquiries','Synthetic service routing examples','Choose the main request: delivery, billing, cancellation or praise. Keep ambiguity visible.', '["billing","cancellation","delivery","praise"]',current_date+90) returning id into p;
 insert into projects(code,name,purpose,guideline,labels,retention_review_on)
 values('ARCHIVE','Service archive','Old synthetic examples awaiting retention review','Separate complaint from praise.','["complaint","praise"]',current_date-10) returning id into p2;
 for k in 1..6 loop
 insert into items(project_id,code,source,external_id,content,owner,due_on,privacy_evidence,privacy_checked_by,held,hold_reason)
 values(p,'TXT-00'||k,'demo',k::text,texts[k],case when k%2=0 then 'Rae' else 'Morgan' end,current_date+k-4,
 case when k<>6 then 'Synthetic text; no real customer information' end,case when k<>6 then 'Demo steward' end,k=5,case when k=5 then 'Check whether two requests need separate examples' end) returning id into x;
 if k<5 then
 insert into annotations(item_id,actor,labels,rationale,guideline_version) values(x,'Ari',case when k in(1,3) then '["delivery"]'::jsonb when k=2 then '["billing"]'::jsonb else '["praise"]'::jsonb end,'Initial synthetic review',1);
 end if;
 if k<4 then
 insert into annotations(item_id,actor,labels,rationale,guideline_version) values(x,'Blair',case when k=1 then '["delivery"]'::jsonb when k=2 then '["billing"]'::jsonb else '["cancellation"]'::jsonb end,'Second synthetic review',1);
 end if;
 if k=1 then insert into decisions(item_id,actor,labels,rationale,item_revision,guideline_version) values(x,'Demo lead','["delivery"]','Replacement request confirmed',1,1); end if;
 end loop;
 insert into items(project_id,code,source,external_id,content,owner,due_on,privacy_evidence,privacy_checked_by)
 values(p2,'OLD-001','demo','1','The invoice was wrong.','Rae',current_date-20,'Synthetic example','Demo steward');
end $$;
