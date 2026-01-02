-- Add category + follow-up fields for feedback questions and submissions.
alter table questions add column if not exists category text default 'general';
alter table questions add column if not exists follow_up_tags jsonb;

alter table feedback add column if not exists follow_up_tags text[];
alter table feedback add column if not exists follow_up_text text;
