-- RPA 연동용 제품 메타. 앱에서 신규 insert 시 submission_status는 'READY'를 넣습니다.
alter table public.products
  add column if not exists submission_status text default 'READY';

alter table public.products
  add column if not exists registration_number text;

alter table public.products
  add column if not exists submitted_at timestamptz;

alter table public.products
  add column if not exists completed_at timestamptz;

update public.products
set submission_status = 'READY'
where submission_status is null or trim(submission_status) = '';
