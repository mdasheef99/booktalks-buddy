/**
 * Manual Security Test
 * 
 * This script demonstrates the security vulnerability where users with expired 
 * subscriptions retain premium access. Run this to see the current insecure behavior.
 * 
 * Usage: npx ts-node src/test/manual-security-test.ts
 */

import { supabase } from '../lib/supabase';
import { calculateUserEntitlements } from '../lib/entitlements/membership';
import { hasEntitlement } from '../lib/entitlements/permissions';

// Test users with expired subscriptions
const TEST_USERS = [
  {
    id: 'efdf6150-d861-4f2c-b59c-5d71c115493b',
    username: 'admin',
    email: 'admin@bookconnect.com'
  },
  {
    id: '57b3036a-1f67-4144-8f94-c51df437a175',
    username: 'kant',
    email: 'kant@bc.com'
  },
  {
    id: 'd5329cc4-d896-4f7e-9f7f-be19a8dfd895',
    username: 'plato',
    email: 'plato@bc.com'
  },
  {
    id: 'e9f18ee7-f533-422f-b634-8a535d9ddadc',
    username: 'popper',
    email: 'popper@bc.com'
  },
  {
    id: '0c55465e-7551-48f1-b204-7efcda18c6ab',
    username: 'asdfgh',
    email: 'asdfgh@asdfgh'
  }
];

async function testSecurityVulnerability() {
  console.log('🔍 Testing Security Vulnerability: Expired Subscriptions with Premium Access\n');
  
  for (const user of TEST_USERS) {
    console.log(`\n👤 Testing user: ${user.username} (${user.email})`);
    
    try {
      // 1. Check current database tier
      const { data: dbUser, error: userError } = await supabase
        .from('users')
        .select('membership_tier')
        .eq('id', user.id)
        .single();
      
      if (userError) {
        console.log(`   ❌ Error fetching user: ${userError.message}`);
        continue;
      }
      
      console.log(`   📊 Database tier: ${dbUser?.membership_tier || 'MEMBER'}`);
      
      // 2. Check subscription status
      const { data: subscriptions, error: subError } = await supabase
        .from('user_subscriptions')
        .select('is_active, end_date, subscription_type')
        .eq('user_id', user.id)
        .order('end_date', { ascending: false });
      
      if (subError) {
        console.log(`   ❌ Error fetching subscriptions: ${subError.message}`);
        continue;
      }
      
      if (!subscriptions || subscriptions.length === 0) {
        console.log(`   📅 Subscription: NO SUBSCRIPTION FOUND`);
      } else {
        const latest = subscriptions[0];
        const isExpired = latest.end_date && new Date(latest.end_date) < new Date();
        console.log(`   📅 Subscription: ${latest.subscription_type} (${isExpired ? 'EXPIRED' : 'ACTIVE'} - ends ${latest.end_date})`);
      }
      
      // 3. Test current entitlements (this shows the vulnerability)
      const entitlements = await calculateUserEntitlements(user.id);
      
      // Check premium entitlements
      const premiumEntitlements = [
        'CAN_ACCESS_PREMIUM_CONTENT',
        'CAN_CREATE_UNLIMITED_CLUBS',
        'CAN_ACCESS_EXCLUSIVE_CONTENT',
        'CAN_MODERATE_DISCUSSIONS'
      ];
      
      console.log(`   🔑 Current entitlements:`);
      let hasPremiumAccess = false;
      
      for (const entitlement of premiumEntitlements) {
        const hasAccess = hasEntitlement(entitlements, entitlement);
        if (hasAccess) {
          hasPremiumAccess = true;
          console.log(`      🔴 ${entitlement}: GRANTED (SECURITY ISSUE!)`);
        } else {
          console.log(`      ✅ ${entitlement}: DENIED`);
        }
      }
      
      // 4. Security assessment
      const hasExpiredOrNoSubscription = !subscriptions || subscriptions.length === 0 || 
        (subscriptions[0].end_date && new Date(subscriptions[0].end_date) < new Date());
      
      if (hasExpiredOrNoSubscription && hasPremiumAccess) {
        console.log(`   🚨 SECURITY VULNERABILITY: User has premium access without valid subscription!`);
      } else if (hasExpiredOrNoSubscription && !hasPremiumAccess) {
        console.log(`   ✅ SECURE: User correctly denied premium access`);
      } else {
        console.log(`   ✅ VALID: User has active subscription and premium access`);
      }
      
    } catch (error) {
      console.log(`   ❌ Error testing user: ${error}`);
    }
  }
  
  console.log('\n📋 Summary:');
  console.log('This test demonstrates the security vulnerability where users with expired');
  console.log('subscriptions still have premium access due to Line 58 in membership.ts:');
  console.log('  const membershipTier = user?.membership_tier || "MEMBER";');
  console.log('\nThe fix will integrate subscription validation to deny premium access');
  console.log('to users with expired subscriptions while maintaining their basic access.');
}

async function testDatabaseFunctions() {
  console.log('\n🔧 Testing Database Subscription Functions\n');
  
  for (const user of TEST_USERS) {
    console.log(`\n👤 Testing database functions for: ${user.username}`);
    
    try {
      // Test has_active_subscription function
      const { data: hasActive, error: activeError } = await supabase
        .rpc('has_active_subscription', { p_user_id: user.id });
      
      if (activeError) {
        console.log(`   ❌ has_active_subscription error: ${activeError.message}`);
      } else {
        console.log(`   📊 has_active_subscription: ${hasActive}`);
      }
      
      // Test get_user_subscription_tier function
      const { data: tier, error: tierError } = await supabase
        .rpc('get_user_subscription_tier', { p_user_id: user.id });
      
      if (tierError) {
        console.log(`   ❌ get_user_subscription_tier error: ${tierError.message}`);
      } else {
        console.log(`   📊 get_user_subscription_tier: ${tier}`);
      }
      
    } catch (error) {
      console.log(`   ❌ Database function error: ${error}`);
    }
  }
}

// Run the tests
async function main() {
  console.log('🚀 Starting Security Vulnerability Assessment\n');
  console.log('=' .repeat(60));
  
  await testSecurityVulnerability();
  
  console.log('\n' + '=' .repeat(60));
  
  await testDatabaseFunctions();
  
  console.log('\n' + '=' .repeat(60));
  console.log('✅ Security assessment complete!');
  console.log('\nNext steps:');
  console.log('1. Implement Task 2.1: Feature Flag System');
  console.log('2. Implement Task 2.2: Fix Line 58 in membership.ts');
  console.log('3. Re-run this test to verify the fix works');
}

if (require.main === module) {
  main().catch(console.error);
}

export { testSecurityVulnerability, testDatabaseFunctions };
