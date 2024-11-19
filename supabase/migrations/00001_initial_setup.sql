-- Create profiles table for user roles and information
create table public.profiles (
    id uuid references auth.users on delete cascade primary key,
    email text unique not null,
    role text not null check (role in ('admin', 'student', 'teacher')),
    created_at timestamp with time zone default now(),
    updated_at timestamp with time zone default now()
);

-- Create invites table for managing user invitations
create table public.invites (
    id uuid default gen_random_uuid() primary key,
    email text not null unique,
    role text not null check (role in ('student', 'teacher')),
    invited_by uuid references auth.users(id) not null,
    created_at timestamp with time zone default now(),
    is_used boolean default false
);

-- Enable Row Level Security (RLS)
alter table public.profiles enable row level security;
alter table public.invites enable row level security;

-- Profiles policies
create policy "Users can view own profile"
    on profiles for select
    using ( auth.uid() = id );

create policy "Users can update own profile"
    on profiles for update
    using ( auth.uid() = id );

-- Invites policies
create policy "Only admin can create invites"
    on invites for insert
    to authenticated
    with check (
        exists (
            select 1 from profiles
            where id = auth.uid()
            and role = 'admin'
        )
    );

create policy "Users can view their own invite"
    on invites for select
    using (
        email = auth.jwt() ->> 'email'
        or
        invited_by = auth.uid()
    );

-- Function to handle profile updates
create or replace function handle_profile_updated_at()
returns trigger
language plpgsql
security definer
as $$
begin
    new.updated_at = now();
    return new;
end;
$$;

-- Create trigger for automatic profile updates
create trigger profiles_updated_at
    before update on profiles
    for each row
    execute function handle_profile_updated_at();

-- Insert initial admin user (IMPORTANT: Replace 'your-admin-email@example.com' with actual admin email)
-- Run this after creating the first admin user through Supabase Auth
insert into public.profiles (id, email, role)
select 
    id,
    email,
    'admin'
from auth.users
where email = 'your-admin-email@example.com'
on conflict (id) do nothing;

-- Create email templates for different roles
-- Student invite template
select auth.create_template(
    'student-invite',
    'Invitation to join School Portal as Student',
    '<!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .button {
                background-color: #4CAF50;
                color: white;
                padding: 14px 20px;
                text-decoration: none;
                border-radius: 4px;
                display: inline-block;
                margin: 20px 0;
            }
            .header { color: #2C3E50; }
            .footer { font-size: 12px; color: #666; margin-top: 30px; }
        </style>
    </head>
    <body>
        <div class="container">
            <h2 class="header">Welcome to School Portal - Student Invitation</h2>
            <p>Hello,</p>
            <p>You have been invited to join School Portal as a student. Click the button below to complete your registration:</p>
            <a href="{{ .ConfirmationURL }}" class="button">Set Up Student Account</a>
            <p><strong>Important Notes:</strong></p>
            <ul>
                <li>This invite link will expire in 24 hours</li>
                <li>This link can only be used once</li>
                <li>If you did not request this invitation, please ignore this email</li>
            </ul>
            <div class="footer">
                <p>This is an automated message, please do not reply to this email.</p>
                <p> School Portal. All rights reserved.</p>
            </div>
        </div>
    </body>
    </html>'
);

-- Teacher invite template
select auth.create_template(
    'teacher-invite',
    'Invitation to join School Portal as Teacher',
    '<!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .button {
                background-color: #2196F3;
                color: white;
                padding: 14px 20px;
                text-decoration: none;
                border-radius: 4px;
                display: inline-block;
                margin: 20px 0;
            }
            .header { color: #2C3E50; }
            .footer { font-size: 12px; color: #666; margin-top: 30px; }
        </style>
    </head>
    <body>
        <div class="container">
            <h2 class="header">Welcome to School Portal - Teacher Invitation</h2>
            <p>Hello,</p>
            <p>You have been invited to join School Portal as a teacher. Click the button below to complete your registration:</p>
            <a href="{{ .ConfirmationURL }}" class="button">Set Up Teacher Account</a>
            <p><strong>Important Notes:</strong></p>
            <ul>
                <li>This invite link will expire in 24 hours</li>
                <li>This link can only be used once</li>
                <li>If you did not request this invitation, please ignore this email</li>
            </ul>
            <div class="footer">
                <p>This is an automated message, please do not reply to this email.</p>
                <p> School Portal. All rights reserved.</p>
            </div>
        </div>
    </body>
    </html>'
);
