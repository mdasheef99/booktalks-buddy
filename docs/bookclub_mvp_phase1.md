# Book Club MVP - Phase 1: Database Schema Design

## Description

This phase focuses on defining the database schema for the book club features in Supabase.

## Tables

-   `book_clubs` (id, store_id, name, description, privacy, created_at, updated_at)
-   `club_members` (user_id, club_id, role, joined_at)
-   `discussion_topics` (id, club_id, user_id, title, created_at, updated_at)
-   `discussion_posts` (id, topic_id, user_id, parent_post_id, content, created_at, updated_at)
-   `current_books` (club_id, title, author, set_at)

## Schema Details

### `book_clubs`

| Column      | Type          | Description                               | Constraints                                  |
| ----------- | ------------- | ----------------------------------------- | -------------------------------------------- |
| id          | UUID          | Unique identifier for the book club       | PRIMARY KEY DEFAULT gen_random_uuid()        |
| store_id    | UUID          | Identifier for the store (future use)     | REFERENCES stores(id)                        |
| name        | TEXT          | Name of the book club                     | NOT NULL                                     |
| description | TEXT          | Description of the book club              |                                              |
| privacy     | TEXT          | Privacy setting (public or private)       | CHECK (privacy IN ('public', 'private'))     |
| created_at  | TIMESTAMPTZ   | Timestamp of when the club was created    | DEFAULT now()                                |
| updated_at  | TIMESTAMPTZ   | Timestamp of when the club was last updated | DEFAULT now()                                |

### `club_members`

| Column   | Type      | Description                           | Constraints                                                                 |
| -------- | --------- | ------------------------------------- | --------------------------------------------------------------------------- |
| user_id  | UUID      | Identifier for the user               | REFERENCES auth.users(id)                                                  |
| club_id  | UUID      | Identifier for the book club          | REFERENCES book_clubs(id)                                                  |
| role     | TEXT      | Role of the user in the club (admin/member) | CHECK (role IN ('admin', 'member')) NOT NULL                               |
| joined_at | TIMESTAMPTZ | Timestamp of when the user joined the club | DEFAULT now()                                                               |
|          |           |                                       | PRIMARY KEY (user_id, club_id)                                              |

### `discussion_topics`

| Column      | Type          | Description                               | Constraints                                  |
| ----------- | ------------- | ----------------------------------------- | -------------------------------------------- |
| id          | UUID          | Unique identifier for the discussion topic | PRIMARY KEY DEFAULT gen_random_uuid()        |
| club_id     | UUID          | Identifier for the book club              | REFERENCES book_clubs(id)                        |
| user_id     | UUID          | Identifier for the user               | REFERENCES auth.users(id)                        |
| title       | TEXT          | Title of the discussion topic             | NOT NULL                                     |
| created_at  | TIMESTAMPTZ   | Timestamp of when the topic was created    | DEFAULT now()                                |
| updated_at  | TIMESTAMPTZ   | Timestamp of when the topic was last updated | DEFAULT now()                                |

### `discussion_posts`

| Column        | Type          | Description                               | Constraints                                  |
| ------------- | ------------- | ----------------------------------------- | -------------------------------------------- |
| id            | UUID          | Unique identifier for the discussion post  | PRIMARY KEY DEFAULT gen_random_uuid()        |
| topic_id      | UUID          | Identifier for the discussion topic       | REFERENCES discussion_topics(id)             |
| user_id       | UUID          | Identifier for the user               | REFERENCES auth.users(id)                        |
| parent_post_id | UUID          | Identifier for the parent post (if reply) | REFERENCES discussion_posts(id)              |
| content       | TEXT          | Content of the discussion post            | NOT NULL                                     |
| created_at    | TIMESTAMPTZ   | Timestamp of when the post was created     | DEFAULT now()                                |
| updated_at    | TIMESTAMPTZ   | Timestamp of when the post was last updated  | DEFAULT now()                                |

### `current_books`

| Column   | Type   | Description                  | Constraints                                  |
| -------- | ------ | ---------------------------- | -------------------------------------------- |
| club_id  | UUID   | Identifier for the book club | PRIMARY KEY REFERENCES book_clubs(id) UNIQUE |
| title    | TEXT   | Title of the current book    | NOT NULL                                     |
| author   | TEXT   | Author of the current book   | NOT NULL                                     |
| set_at   | TIMESTAMPTZ | Timestamp of when the book was set | DEFAULT now()                                |

## SQL Scripts

-   Create SQL scripts to create the tables in the Supabase database.
    -   `supabase/migrations/xxxx_create_book_club_tables.sql`

## RLS Policies

-   Implement RLS (Row Level Security) policies for each table to control data access.
    -   `supabase/policies/book_club_policies.sql`
-   Example RLS logic:
    -   `book_clubs`: Members can SELECT clubs they belong to. Admin role can INSERT/UPDATE/DELETE clubs.
    -   `club_members`: Only admins can INSERT/UPDATE/DELETE. Members can SELECT their own membership.
    -   `discussion_topics`: Members can SELECT topics in clubs they belong to. Members can INSERT topics in clubs they belong to.
    -   `discussion_posts`: Members can SELECT posts in topics they have access to. Members can INSERT posts in topics they have access to.
    -   `current_books`: Only admins can INSERT/UPDATE/DELETE.