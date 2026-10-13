-- v6.3: atomic application writes and consistent reads. No seed data.
-- Install after 001_empty_schema.sql, before deploying the application.
begin;
alter table public.cdp_manufacturers add column if not exists details jsonb not null default '{}'::jsonb;
alter table public.cdp_rfqs add column if not exists details jsonb not null default '{}'::jsonb;
alter table public.cdp_rfq_responses add column if not exists details jsonb not null default '{}'::jsonb;
alter table public.cdp_quotation_versions add column if not exists details jsonb not null default '{}'::jsonb;
-- The application has one seller/company settings record; this does not create it.
create unique index if not exists cdp_one_company on public.cdp_companies ((true)) where archived_at is null;

create or replace function public.cdp_read_state() returns jsonb
language sql stable security invoker set search_path = '' as $$
select jsonb_build_object(
'cdp_companies', (select coalesce(jsonb_agg(to_jsonb(t) order by t.created_at,t.id),'[]'::jsonb) from public.cdp_companies t),
'cdp_customers', (select coalesce(jsonb_agg(to_jsonb(t) order by t.created_at,t.id),'[]'::jsonb) from public.cdp_customers t),
'cdp_agents', (select coalesce(jsonb_agg(to_jsonb(t) order by t.created_at,t.id),'[]'::jsonb) from public.cdp_agents t),
'cdp_manufacturers', (select coalesce(jsonb_agg(to_jsonb(t) order by t.created_at,t.id),'[]'::jsonb) from public.cdp_manufacturers t),
'cdp_meetings', (select coalesce(jsonb_agg(to_jsonb(t) order by t.created_at,t.id),'[]'::jsonb) from public.cdp_meetings t),
'cdp_leads', (select coalesce(jsonb_agg(to_jsonb(t) order by t.created_at,t.id),'[]'::jsonb) from public.cdp_leads t),
'cdp_projects', (select coalesce(jsonb_agg(to_jsonb(t) order by t.created_at,t.id),'[]'::jsonb) from public.cdp_projects t),
'cdp_project_history', (select coalesce(jsonb_agg(to_jsonb(t) order by t.created_at,t.id),'[]'::jsonb) from public.cdp_project_history t),
'cdp_articles', (select coalesce(jsonb_agg(to_jsonb(t) order by t.created_at,t.id),'[]'::jsonb) from public.cdp_articles t),
'cdp_bom_items', (select coalesce(jsonb_agg(to_jsonb(t) order by t.created_at,t.id),'[]'::jsonb) from public.cdp_bom_items t),
'cdp_rfqs', (select coalesce(jsonb_agg(to_jsonb(t) order by t.created_at,t.id),'[]'::jsonb) from public.cdp_rfqs t),
'cdp_rfq_responses', (select coalesce(jsonb_agg(to_jsonb(t) order by t.created_at,t.id),'[]'::jsonb) from public.cdp_rfq_responses t),
'cdp_article_prices', (select coalesce(jsonb_agg(to_jsonb(t) order by t.created_at,t.id),'[]'::jsonb) from public.cdp_article_prices t),
'cdp_phases', (select coalesce(jsonb_agg(to_jsonb(t) order by t.created_at,t.id),'[]'::jsonb) from public.cdp_phases t),
'cdp_phase_items', (select coalesce(jsonb_agg(to_jsonb(t) order by t.created_at,t.id),'[]'::jsonb) from public.cdp_phase_items t),
'cdp_quotation_versions', (select coalesce(jsonb_agg(to_jsonb(t) order by t.created_at,t.id),'[]'::jsonb) from public.cdp_quotation_versions t),
'cdp_orders', (select coalesce(jsonb_agg(to_jsonb(t) order by t.created_at,t.id),'[]'::jsonb) from public.cdp_orders t),
'cdp_deliveries', (select coalesce(jsonb_agg(to_jsonb(t) order by t.created_at,t.id),'[]'::jsonb) from public.cdp_deliveries t)
) where auth.uid() is not null;
$$;
revoke all on function public.cdp_read_state() from public, anon;
grant execute on function public.cdp_read_state() to authenticated;

create or replace function public.cdp_apply_changes(changes jsonb) returns jsonb
language plpgsql security invoker set search_path = '' as $$
declare
 item jsonb; payload jsonb; tbl text; key text; cols text; vals text; assignments text;
 current_row jsonb; result_row jsonb; result jsonb := '[]'::jsonb;
 row_id uuid; expected bigint; permitted text[] := array['cdp_companies','cdp_customers','cdp_agents','cdp_manufacturers','cdp_meetings','cdp_leads','cdp_projects','cdp_project_history','cdp_articles','cdp_bom_items','cdp_rfqs','cdp_rfq_responses','cdp_article_prices','cdp_phases','cdp_phase_items','cdp_quotation_versions','cdp_orders','cdp_deliveries'];
begin
 if auth.uid() is null then raise exception 'Inloggning krävs.' using errcode='42501'; end if;
 if jsonb_typeof(changes) is distinct from 'array' or jsonb_array_length(changes)>5000 then
   raise exception 'Ogiltigt antal ändringar.';
 end if;
 -- Serialize application batches; RLS and revision checks still apply.
 perform pg_advisory_xact_lock(634263,1);
 for item in select value from jsonb_array_elements(changes) loop
   tbl := item->>'table'; payload := item->'row';
   if tbl is null or not (tbl = any(permitted)) or jsonb_typeof(payload) is distinct from 'object' then
     raise exception 'Ogiltig tabell eller rad.';
   end if;
   row_id := (payload->>'id')::uuid;
   expected := (item->>'revision')::bigint;
   if row_id is null then raise exception 'ID saknas.'; end if;
   cols := ''; vals := ''; assignments := '';
   for key in select jsonb_object_keys(payload) loop
     if key in ('created_at','updated_at','created_by','updated_by','revision') or not exists (
       select 1 from information_schema.columns c where c.table_schema='public' and c.table_name=tbl and c.column_name=key
     ) then raise exception 'Otillåtet fält: %', key; end if;
     cols := cols || case when cols='' then '' else ',' end || format('%I',key);
     vals := vals || case when vals='' then '' else ',' end || format('v.%I',key);
     if key <> 'id' then assignments := assignments || case when assignments='' then '' else ',' end || format('%I=v.%I',key,key); end if;
   end loop;
   execute format('select to_jsonb(t) from public.%I t where id=$1 for update',tbl) into current_row using row_id;
   -- A retried request whose first response was lost is a no-op if its payload already matches.
   if current_row is not null and not exists (
     select 1 from jsonb_each(payload) e where current_row->e.key is distinct from e.value
   ) then
     result_row := current_row;
   elsif current_row is null then
     if expected is not null then raise exception 'Raden finns inte längre. Ladda om.' using errcode='40001'; end if;
     execute format('insert into public.%I (%s) select %s from jsonb_populate_record(null::public.%I,$1) v returning to_jsonb(%I.*)',tbl,cols,vals,tbl,tbl)
       into result_row using payload;
   else
     if expected is null or expected <> (current_row->>'revision')::bigint then
       raise exception 'Någon annan har ändrat uppgifterna. Ladda om innan du försöker igen.' using errcode='40001';
     end if;
     execute format('update public.%I t set %s from jsonb_populate_record(null::public.%I,$1) v where t.id=$2 returning to_jsonb(t)',tbl,assignments,tbl)
       into result_row using payload,row_id;
   end if;
   result := result || jsonb_build_array(jsonb_build_object('table',tbl,'id',row_id,'revision',result_row->'revision'));
 end loop;
 return result;
end; $$;
revoke all on function public.cdp_apply_changes(jsonb) from public, anon;
grant execute on function public.cdp_apply_changes(jsonb) to authenticated;
notify pgrst, 'reload schema';
commit;
