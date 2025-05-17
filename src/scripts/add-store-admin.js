// Script to add a user as a store administrator
// Run this script with: node src/scripts/add-store-admin.js

const { createClient } = require('@supabase/supabase-js');

// Supabase configuration
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://your-supabase-url.supabase.co';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'your-supabase-anon-key';

// Create Supabase client
const supabase = createClient(supabaseUrl, supabaseKey);

// User and store information
const userId = 'efdf6150-d861-4f2c-b59c-5d71c115493b'; // Your user ID
const storeId = 'ce76b99a-5f1a-481a-af85-862e584465e1'; // The store ID
const role = 'owner'; // 'owner' or 'manager'

async function addStoreAdmin() {
  try {
    // Check if the user already exists as an admin for this store
    const { data: existingAdmin, error: checkError } = await supabase
      .from('store_administrators')
      .select('*')
      .eq('store_id', storeId)
      .eq('user_id', userId)
      .maybeSingle();

    if (checkError) {
      console.error('Error checking existing admin:', checkError);
      return;
    }

    if (existingAdmin) {
      console.log('User is already an admin for this store with role:', existingAdmin.role);
      
      // If the role is different, update it
      if (existingAdmin.role !== role) {
        const { data: updatedAdmin, error: updateError } = await supabase
          .from('store_administrators')
          .update({ role })
          .eq('store_id', storeId)
          .eq('user_id', userId)
          .select()
          .single();

        if (updateError) {
          console.error('Error updating admin role:', updateError);
          return;
        }

        console.log('Updated admin role to:', updatedAdmin.role);
      }
      
      return;
    }

    // Add the user as a store admin
    const { data, error } = await supabase
      .from('store_administrators')
      .insert([
        {
          store_id: storeId,
          user_id: userId,
          role,
          assigned_at: new Date().toISOString(),
          assigned_by: userId // Self-assigned
        }
      ])
      .select()
      .single();

    if (error) {
      console.error('Error adding store admin:', error);
      return;
    }

    console.log('Successfully added user as store admin:', data);
  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

// Run the function
addStoreAdmin();
