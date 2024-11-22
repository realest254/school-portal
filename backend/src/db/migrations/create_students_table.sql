-- Create students table
create table if not exists public.students (
    id uuid default gen_random_uuid() primary key,
    name text not null,
    admission_number text unique not null,
    email text unique not null,
    class_id uuid not null references public.classes(id),
    parent_phone text not null,
    dob date not null,
    status text default 'active' check (status in ('active', 'inactive')),
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create indexes
create index if not exists students_admission_number_idx on public.students(admission_number);
create index if not exists students_email_idx on public.students(email);
create index if not exists students_class_id_idx on public.students(class_id);
create index if not exists students_status_idx on public.students(status);

-- Enable Row Level Security (RLS)
alter table public.students enable row level security;

-- Create policies
create policy "Enable read access for authenticated users" on public.students
    for select
    to authenticated
    using (true);

create policy "Enable insert access for admins only" on public.students
    for insert
    to authenticated
    using (
        exists (
            select 1 from public.profiles
            where profiles.id = auth.uid()
            and profiles.role = 'admin'
        )
    );

create policy "Enable update access for admins only" on public.students
    for update
    to authenticated
    using (
        exists (
            select 1 from public.profiles
            where profiles.id = auth.uid()
            and profiles.role = 'admin'
        )
    );

create policy "Enable delete access for admins only" on public.students
    for delete
    to authenticated
    using (
        exists (
            select 1 from public.profiles
            where profiles.id = auth.uid()
            and profiles.role = 'admin'
        )
    );

-- Create function to automatically update updated_at timestamp
create or replace function public.handle_updated_at()
returns trigger as $$
begin
    new.updated_at = timezone('utc'::text, now());
    return new;
end;
$$ language plpgsql;

-- Create trigger for updated_at
create trigger handle_students_updated_at
    before update on public.students
    for each row
    execute function public.handle_updated_at();