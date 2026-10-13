-- Read-only checks. Does not create any data.
select p.proname as function_name,
       p.prosecdef as security_definer_should_be_false,
       has_function_privilege('authenticated',p.oid,'execute') as authenticated_should_be_true,
       has_function_privilege('anon',p.oid,'execute') as anonymous_should_be_false
from pg_proc p join pg_namespace n on n.oid=p.pronamespace
where n.nspname='public' and p.proname in ('cdp_read_state','cdp_apply_changes');

select table_name,column_name
from information_schema.columns
where table_schema='public' and column_name='details'
and table_name in ('cdp_manufacturers','cdp_rfqs','cdp_rfq_responses','cdp_quotation_versions')
order by table_name;

select tablename, rowsecurity
from pg_tables where schemaname='public' and tablename like 'cdp_%'
order by tablename;
