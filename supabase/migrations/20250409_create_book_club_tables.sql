-- Book Club MVP Phase 1 - Schema Migration
-- Creates book_clubs, club_members, discussion_topics, discussion_posts, current_books
-- Generated on 2025-04-09

-- Enable pgcrypto for UUID generation
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =========================
-- Table: book_clubs
-- =========================
CREATE TABLE IF NOT EXISTS book_clubs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id UUID REFERENCES stores(id),
    name TEXT NOT NULL,
    description TEXT,
    privacy TEXT CHECK (privacy IN ('public', 'private')),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- =========================
-- Table: club_members
-- =========================
CREATE TABLE IF NOT EXISTS club_members (
    user_id UUID REFERENCES auth.users(id),
    club_id UUID REFERENCES book_clubs(id),
    role TEXT CHECK (role IN ('admin', 'member')) NOT NULL,
    joined_at TIMESTAMPTZ DEFAULT now(),
    PRIMARY KEY (user_id, club_id)
);

-- =========================
-- Table: discussion_topics
-- =========================
CREATE TABLE IF NOT EXISTS discussion_topics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    club_id UUID REFERENCES book_clubs(id),
    user_id UUID REFERENCES auth.users(id),
    title TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- =========================
-- Table: discussion_posts
-- =========================
CREATE TABLE IF NOT EXISTS discussion_posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    topic_id UUID REFERENCES discussion_topics(id),
    user_id UUID REFERENCES auth.users(id),
    parent_post_id UUID REFERENCES discussion_posts(id),
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- =========================
-- Table: current_books
-- =========================
CREATE TABLE IF NOT EXISTS current_books (
    club_id UUID PRIMARY KEY REFERENCES book_clubs(id) UNIQUE,
    title TEXT NOT NULL,
    author TEXT NOT NULL,
    set_at TIMESTAMPTZ DEFAULT now()
);