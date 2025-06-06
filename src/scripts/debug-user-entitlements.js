// Debug script to check user entitlements
// Run this script with: node src/scripts/debug-user-entitlements.js

import { createClient } from '@supabase/supabase-js';

// Supabase configuration
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://qsldppxjmrplbmukqorj.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFzbGRwcHhqbXJwbGJtdWtxb3JqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDMyNTc2MjcsImV4cCI6MjA1ODgzMzYyN30.dBHl6el5fKu07Ya1CLW_L9kMQOWQ1_vYTMmnUWaAdaI';

// Create Supabase client
const supabase = createClient(supabaseUrl, supabaseKey);

// User information
const userId = 'efdf6150-d861-4f2c-b59c-5d71c115493b';
const storeId = 'ce76b99a-5f1a-481a-af85-862e584465e1';

async function debugUserEntitlements() {
  console.log('='.repeat(80));
  console.log('DEBUGGING USER ENTITLEMENTS');
  console.log('='.repeat(80));
  console.log('User ID:', userId);
  console.log('Store ID:', storeId);
  console.log('');

  try {
    // 1. Check if user exists
    console.log('1. Checking if user exists...');
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (userError) {
      console.log('❌ User not found in users table:', userError.message);
    } else {
      console.log('✅ User found:', {
        id: user.id,
        email: user.email,
        username: user.username,
        membership_tier: user.membership_tier
      });
    }
    console.log('');

    // 2. Check store administrator role
    console.log('2. Checking store administrator role...');
    const { data: storeAdmin, error: storeAdminError } = await supabase
      .from('store_administrators')
      .select('*')
      .eq('user_id', userId)
      .eq('store_id', storeId);

    if (storeAdminError) {
      console.log('❌ Error checking store admin:', storeAdminError.message);
    } else if (!storeAdmin || storeAdmin.length === 0) {
      console.log('❌ User is NOT a store administrator for this store');

      // Check if user is admin for any store
      const { data: anyStoreAdmin } = await supabase
        .from('store_administrators')
        .select('*')
        .eq('user_id', userId);

      if (anyStoreAdmin && anyStoreAdmin.length > 0) {
        console.log('ℹ️  User is admin for other stores:', anyStoreAdmin);
      } else {
        console.log('ℹ️  User is not an admin for any store');
      }
    } else {
      console.log('✅ User is a store administrator:', storeAdmin[0]);
    }
    console.log('');

    // 3. Check club lead roles
    console.log('3. Checking club lead roles...');
    const { data: clubLeads, error: clubLeadError } = await supabase
      .from('book_clubs')
      .select('id, name, store_id')
      .eq('lead_user_id', userId);

    if (clubLeadError) {
      console.log('❌ Error checking club leads:', clubLeadError.message);
    } else if (!clubLeads || clubLeads.length === 0) {
      console.log('ℹ️  User is not a club lead for any clubs');
    } else {
      console.log('✅ User is club lead for:', clubLeads);
    }
    console.log('');

    // 4. Check club moderator roles
    console.log('4. Checking club moderator roles...');
    const { data: clubMods, error: clubModError } = await supabase
      .from('club_moderators')
      .select('*')
      .eq('user_id', userId);

    if (clubModError) {
      console.log('❌ Error checking club moderators:', clubModError.message);
    } else if (!clubMods || clubMods.length === 0) {
      console.log('ℹ️  User is not a club moderator for any clubs');
    } else {
      console.log('✅ User is club moderator for:', clubMods);
    }
    console.log('');

    // 5. Check platform owner status
    console.log('5. Checking platform owner status...');
    const { data: platformOwner, error: platformError } = await supabase
      .from('platform_settings')
      .select('value')
      .eq('key', 'platform_owner_id')
      .single();

    if (platformError) {
      console.log('ℹ️  No platform owner set or error:', platformError.message);
    } else if (platformOwner?.value === userId) {
      console.log('✅ User is the platform owner');
    } else {
      console.log('ℹ️  User is not the platform owner');
    }
    console.log('');

    // 6. Simulate entitlements calculation
    console.log('6. Simulating entitlements calculation...');
    const entitlements = [];

    // Add membership tier entitlements
    if (user?.membership_tier) {
      switch (user.membership_tier) {
        case 'PRIVILEGED_PLUS':
          entitlements.push('CAN_CREATE_UNLIMITED_CLUBS', 'CAN_JOIN_UNLIMITED_CLUBS', 'CAN_SEND_DIRECT_MESSAGES');
          // Fall through
        case 'PRIVILEGED':
          entitlements.push('CAN_CREATE_LIMITED_CLUBS', 'CAN_JOIN_UNLIMITED_CLUBS', 'CAN_NOMINATE_BOOKS');
          // Fall through
        case 'MEMBER':
          entitlements.push('CAN_JOIN_LIMITED_CLUBS', 'CAN_PARTICIPATE_IN_DISCUSSIONS');
          break;
      }
    }

    // Add store administrator entitlements
    if (storeAdmin && storeAdmin.length > 0) {
      const role = storeAdmin[0].role;
      entitlements.push(`STORE_${role.toUpperCase()}_${storeId}`);

      if (role === 'owner') {
        entitlements.push('CAN_MANAGE_STORE_SETTINGS', 'CAN_MANAGE_EVENTS', 'CAN_CREATE_CLUBS');
      } else if (role === 'manager') {
        entitlements.push('CAN_MANAGE_EVENTS', 'CAN_MODERATE_CONTENT');
      }
    }

    // Add club lead entitlements
    if (clubLeads && clubLeads.length > 0) {
      for (const club of clubLeads) {
        entitlements.push(`CLUB_LEAD_${club.id}`);
      }
      entitlements.push('CAN_MANAGE_CLUB', 'CAN_SET_CURRENT_BOOK');
    }

    // Add club moderator entitlements
    if (clubMods && clubMods.length > 0) {
      for (const mod of clubMods) {
        entitlements.push(`CLUB_MODERATOR_${mod.club_id}`);
      }
      entitlements.push('CAN_MODERATE_DISCUSSIONS');
    }

    // Add platform owner entitlements
    if (platformOwner?.value === userId) {
      entitlements.push('CAN_MANAGE_PLATFORM_SETTINGS', 'CAN_MANAGE_ALL_STORES', 'CAN_MANAGE_ALL_CLUBS');
    }

    console.log('✅ Calculated entitlements:', entitlements);
    console.log('');

    // 7. Check specific event creation permissions
    console.log('7. Checking event creation permissions...');
    const hasStoreOwnerPermission = entitlements.includes(`STORE_OWNER_${storeId}`);
    const hasStoreManagerPermission = entitlements.includes(`STORE_MANAGER_${storeId}`);
    const hasGeneralEventPermission = entitlements.includes('CAN_MANAGE_EVENTS') ||
                                      entitlements.includes('CAN_MANAGE_STORE_SETTINGS') ||
                                      entitlements.includes('CAN_MANAGE_ALL_STORES');

    console.log('Store Owner Permission:', hasStoreOwnerPermission);
    console.log('Store Manager Permission:', hasStoreManagerPermission);
    console.log('General Event Permission:', hasGeneralEventPermission);

    const canCreateEvents = hasStoreOwnerPermission || hasStoreManagerPermission || hasGeneralEventPermission;
    console.log('');
    console.log('🎯 CAN CREATE EVENTS:', canCreateEvents ? '✅ YES' : '❌ NO');

    if (!canCreateEvents) {
      console.log('');
      console.log('💡 TO FIX: Add user as store administrator:');
      console.log(`   INSERT INTO store_administrators (store_id, user_id, role, assigned_by) VALUES ('${storeId}', '${userId}', 'owner', '${userId}');`);
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }

  console.log('');
  console.log('='.repeat(80));
  console.log('DEBUG COMPLETE');
  console.log('='.repeat(80));
}

// Run the function
debugUserEntitlements();
