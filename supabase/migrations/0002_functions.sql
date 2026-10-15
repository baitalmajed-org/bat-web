-- 0002_functions.sql — authorization helper, inquiry submission, media reference counting

-- Is the current session an administrator? SECURITY DEFINER so it can read admin_users
-- even though that table has no policies for ordinary roles.
create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.admin_users where user_id = auth.uid());
$$;
revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to anon, authenticated;

-- Public inquiry submission. Anonymous visitors have NO direct table access to
-- inquiries; this function is the only write path. It validates, rate limits per
-- e-mail address, snapshots the related product/service name and returns the
-- identifiers needed to send notifications.
create or replace function public.submit_inquiry(
  p_name text, p_email text, p_phone text, p_company text, p_type text,
  p_product_id uuid, p_service_id uuid, p_subject text, p_message text
) returns table (id uuid, reference text, related_label text)
language plpgsql security definer set search_path = public as $$
declare
  v_label text;
  v_ref text;
  v_id uuid;
  v_recent integer;
  v_try integer := 0;
begin
  select count(*) into v_recent from public.inquiries i
   where lower(i.customer_email) = lower(p_email) and i.created_at > now() - interval '1 hour';
  if v_recent >= 5 then
    raise exception 'rate_limited' using errcode = 'P0001';
  end if;

  if p_type = 'product' and p_product_id is not null then
    select name into v_label from public.products where products.id = p_product_id and is_published;
    if v_label is null then p_product_id := null; end if;
  elsif p_type = 'service' and p_service_id is not null then
    select title into v_label from public.services where services.id = p_service_id and is_published;
    if v_label is null then p_service_id := null; end if;
  end if;
  if p_type <> 'product' then p_product_id := null; end if;
  if p_type <> 'service' then p_service_id := null; end if;

  loop
    v_try := v_try + 1;
    v_ref := 'BAM-' || to_char(now() at time zone 'Asia/Dubai', 'YYMMDD') || '-' ||
             upper(substr(translate(encode(gen_random_bytes(6), 'base64'), '+/=Il0O', 'XYZABC'), 1, 6));
    begin
      insert into public.inquiries (reference, customer_name, customer_email, customer_phone, company_name,
        inquiry_type, product_id, service_id, related_label, subject, message)
      values (v_ref, p_name, p_email, p_phone, nullif(p_company, ''), p_type,
        p_product_id, p_service_id, v_label, p_subject, p_message)
      returning inquiries.id into v_id;
      exit;
    exception when unique_violation then
      if v_try >= 5 then raise; end if;
    end;
  end loop;

  return query select v_id, v_ref, v_label;
end $$;
revoke all on function public.submit_inquiry(text,text,text,text,text,uuid,uuid,text,text) from public;
grant execute on function public.submit_inquiry(text,text,text,text,text,uuid,uuid,text,text) to anon, authenticated;

-- Record the outcome of a notification send. Requires BOTH the unguessable inquiry
-- UUID and its reference (a capability pair only the submitting server request holds).
-- Only 'pending' or 'failed' channels can change, and a 'sent' channel is never
-- downgraded, so this cannot be used to tamper with finished deliveries.
create or replace function public.record_notification_result(
  p_id uuid, p_reference text, p_channel text, p_ok boolean, p_error text
) returns boolean language plpgsql security definer set search_path = public as $$
declare v_rows integer;
begin
  if p_channel = 'admin' then
    update public.inquiries set
      admin_email_status = case when p_ok then 'sent' else 'failed' end,
      admin_email_error = case when p_ok then null else left(p_error, 300) end,
      email_attempts = email_attempts + 1, last_email_attempt_at = now()
    where id = p_id and reference = p_reference and admin_email_status in ('pending','failed');
  elsif p_channel = 'customer' then
    update public.inquiries set
      customer_email_status = case when p_ok then 'sent' else 'failed' end,
      customer_email_error = case when p_ok then null else left(p_error, 300) end,
      email_attempts = email_attempts + 1, last_email_attempt_at = now()
    where id = p_id and reference = p_reference and customer_email_status in ('pending','failed');
  else
    return false;
  end if;
  get diagnostics v_rows = row_count;
  return v_rows > 0;
end $$;
revoke all on function public.record_notification_result(uuid,text,text,boolean,text) from public;
grant execute on function public.record_notification_result(uuid,text,text,boolean,text) to anon, authenticated;

-- Count how many content records still reference a Cloudinary public id.
-- Admin only. Used before deleting an asset so shared images are never removed.
create or replace function public.count_asset_references(p_public_id text)
returns integer language plpgsql stable security definer set search_path = public as $$
declare v_count integer;
begin
  if not public.is_admin() then raise exception 'forbidden' using errcode = '42501'; end if;
  select
    (select count(*) from public.site_settings where logo_public_id = p_public_id) +
    (select count(*) from public.homepage_sections where image_public_id = p_public_id) +
    (select count(*) from public.pages where hero_image_public_id = p_public_id) +
    (select count(*) from public.categories where image_public_id = p_public_id) +
    (select count(*) from public.product_images where public_id = p_public_id) +
    (select count(*) from public.services where image_public_id = p_public_id)
  into v_count;
  return v_count;
end $$;
revoke all on function public.count_asset_references(text) from public;
grant execute on function public.count_asset_references(text) to authenticated;

-- Reference counts for every tracked asset in one call (admin Media page). Admin only.
create or replace function public.asset_reference_counts()
returns table (public_id text, refs integer)
language plpgsql stable security definer set search_path = public as $$
begin
  if not public.is_admin() then raise exception 'forbidden' using errcode = '42501'; end if;
  return query
    select u.pid, count(*)::integer from (
      select logo_public_id as pid from public.site_settings
      union all select image_public_id from public.homepage_sections
      union all select hero_image_public_id from public.pages
      union all select image_public_id from public.categories
      union all select public_id from public.product_images
      union all select image_public_id from public.services
    ) u where u.pid is not null group by u.pid;
end $$;
revoke all on function public.asset_reference_counts() from public;
grant execute on function public.asset_reference_counts() to authenticated;
