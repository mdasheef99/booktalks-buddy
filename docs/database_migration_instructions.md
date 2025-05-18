# Database Migration Instructions for Event Images

This document provides instructions for running the database migration to add image-related columns to the events table and set up the necessary storage bucket and policies.

## Migration Overview

The migration script `supabase/migrations/20250620_add_event_images.sql` will:

1. Add the following columns to the `events` table:
   - `image_url`: URL to the original image
   - `thumbnail_url`: URL to the 200x200px thumbnail version
   - `medium_url`: URL to the 600x400px medium version
   - `image_alt_text`: Accessible description of the image
   - `image_metadata`: JSON object containing additional image data

2. Create a dedicated storage bucket for event images called `event-images`

3. Set up the following storage policies:
   - Allow anyone to view event images
   - Allow authenticated users to upload event images
   - Allow users to update their own event images
   - Allow users to delete their own event images

## When to Run the Migration

Run this migration **before** deploying the Event Image Handling feature to production. The migration should be run in the following environments in this order:

1. Development environment
2. Staging/testing environment
3. Production environment

## How to Run the Migration

### Prerequisites

- Supabase CLI installed
- Access to the Supabase project

### Using Supabase CLI (Recommended)

1. Make sure you have the Supabase CLI installed:
   ```bash
   npm install -g supabase
   ```

2. Log in to Supabase:
   ```bash
   supabase login
   ```

3. Link your local project to your Supabase project:
   ```bash
   supabase link --project-ref <your-project-ref>
   ```
   Replace `<your-project-ref>` with your Supabase project reference ID.

4. Run the migration:
   ```bash
   supabase db push
   ```

### Manual Migration (Alternative)

If you don't have access to the Supabase CLI, you can run the migration manually:

1. Open the Supabase dashboard for your project
2. Navigate to the SQL Editor
3. Copy the contents of `supabase/migrations/20250620_add_event_images.sql`
4. Paste the SQL into the editor
5. Click "Run" to execute the migration

## Verifying the Migration

After running the migration, verify that:

1. The new columns have been added to the `events` table:
   ```sql
   SELECT column_name, data_type 
   FROM information_schema.columns 
   WHERE table_name = 'events' AND 
   column_name IN ('image_url', 'thumbnail_url', 'medium_url', 'image_alt_text', 'image_metadata');
   ```

2. The `event-images` storage bucket has been created:
   ```sql
   SELECT * FROM storage.buckets WHERE name = 'event-images';
   ```

3. The storage policies have been created:
   ```sql
   SELECT * FROM storage.policies WHERE bucket_id = 'event-images';
   ```

## Rollback Instructions

If you need to roll back the migration:

```sql
-- Remove the storage policies
DROP POLICY IF EXISTS "Anyone can view event images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload event images" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own event images" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own event images" ON storage.objects;

-- Remove the storage bucket
DROP BUCKET IF EXISTS "event-images";

-- Remove the columns from the events table
ALTER TABLE events
DROP COLUMN IF EXISTS image_url,
DROP COLUMN IF EXISTS thumbnail_url,
DROP COLUMN IF EXISTS medium_url,
DROP COLUMN IF EXISTS image_alt_text,
DROP COLUMN IF EXISTS image_metadata;
```

## Troubleshooting

- **Error: Bucket already exists**: If the bucket already exists, you can skip that part of the migration or drop and recreate it.
- **Error: Column already exists**: If any of the columns already exist, you can skip adding those specific columns.
- **Error: Policy already exists**: If any of the policies already exist, you can skip creating those specific policies.

## Support

If you encounter any issues with this migration, please contact the development team for assistance.
