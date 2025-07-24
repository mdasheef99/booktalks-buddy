const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://qsldppxjmrplbmukqorj.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFzbGRwcHhqbXJwbGJtdWtxb3JqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQ1MzQ2NzQsImV4cCI6MjA1MDExMDY3NH0.wBz5RJw_5PdBcKdKdKZjAR8hNnqVOoNBmjhQYhNkKnE'
);

async function checkStoreManager() {
  try {
    console.log('Checking Store Manager access for kafka user...');
    
    // Check if kafka user exists in store_administrators
    const { data: storeAdmin, error } = await supabase
      .from('store_administrators')
      .select(`
        user_id,
        store_id,
        role,
        stores (
          id,
          name
        )
      `)
      .eq('user_id', '192ea974-1770-4b03-9dba-cc8121525c57');
    
    if (error) {
      console.error('Error querying store_administrators:', error);
      return;
    }
    
    console.log('Store administrators data:', JSON.stringify(storeAdmin, null, 2));
    
    // Also check if the user exists in the users table
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id, username, email')
      .eq('id', '192ea974-1770-4b03-9dba-cc8121525c57')
      .single();
    
    if (userError) {
      console.error('Error querying users:', userError);
    } else {
      console.log('User data:', JSON.stringify(userData, null, 2));
    }
    
    // Check all store administrators to see what's in the table
    const { data: allAdmins, error: allError } = await supabase
      .from('store_administrators')
      .select(`
        user_id,
        store_id,
        role,
        stores (
          id,
          name
        )
      `);
    
    if (allError) {
      console.error('Error querying all store_administrators:', allError);
    } else {
      console.log('All store administrators:', JSON.stringify(allAdmins, null, 2));
    }
    
  } catch (err) {
    console.error('Error:', err);
  }
}

checkStoreManager();
