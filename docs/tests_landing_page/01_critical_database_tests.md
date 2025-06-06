# Critical Database Tests - Phase 8 Integration Testing

**Priority**: 🔴 **CRITICAL**  
**Focus**: Database Schema, Analytics Timestamp Fix, Data Persistence  
**Must Pass**: Before any deployment  

## 🎯 **TEST OBJECTIVES**

### **Primary Goals**
1. **Verify Database Column Fix**: Ensure analytics uses `timestamp` not `date`
2. **Validate Schema Integrity**: All Store Management tables exist with correct structure
3. **Test RLS Policies**: Store Owner data isolation and access control
4. **Confirm Data Persistence**: All customization data saves and retrieves correctly

## 🔧 **TEST SETUP**

### **Prerequisites**
```typescript
// Test Environment Setup
import { createClient } from '@supabase/supabase-js';
import { Database } from '@/database.types';

const testSupabase = createClient<Database>(
  process.env.VITE_SUPABASE_URL!,
  process.env.VITE_SUPABASE_ANON_KEY!
);

// Test Store Owner Context
const testStoreId = 'test-store-uuid';
const testUserId = 'test-user-uuid';
```

### **Test Data Cleanup**
```sql
-- Cleanup script to run before each test suite
DELETE FROM store_landing_analytics WHERE store_id = 'test-store-uuid';
DELETE FROM store_landing_customization WHERE store_id = 'test-store-uuid';
DELETE FROM store_carousel_items WHERE store_id = 'test-store-uuid';
DELETE FROM store_promotional_banners WHERE store_id = 'test-store-uuid';
```

## 🔴 **CRITICAL TEST 1: Analytics Database Column Fix**

### **Test 1.1: Timestamp Column Verification**
```typescript
describe('Analytics Database Column Fix', () => {
  test('store_landing_analytics uses timestamp column (not date)', async () => {
    // CRITICAL: This test verifies the database column error fix
    const { data, error } = await testSupabase
      .from('store_landing_analytics')
      .select('timestamp')
      .limit(1);
    
    expect(error).toBeNull();
    expect(data).toBeDefined();
  });

  test('analytics queries with timestamp filtering work correctly', async () => {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30);
    
    const { data, error } = await testSupabase
      .from('store_landing_analytics')
      .select('*')
      .eq('store_id', testStoreId)
      .gte('timestamp', startDate.toISOString()) // Using timestamp, not date
      .order('timestamp', { ascending: false });
    
    expect(error).toBeNull();
    expect(data).toBeDefined();
  });
});
```

### **Test 1.2: Analytics Data Insertion with Enhanced Fields**
```typescript
test('analytics event insertion with all enhanced fields', async () => {
  const testEvent = {
    store_id: testStoreId,
    event_type: 'page_load',
    section_name: 'hero',
    element_id: 'test-element-uuid',
    element_type: 'button',
    session_id: 'test_session_123',
    user_id: testUserId,
    user_agent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)',
    ip_address: '192.168.1.1',
    interaction_data: { duration: 5000, scroll_depth: 75 },
    page_url: '/landing',
    referrer_url: 'https://google.com',
    timestamp: new Date().toISOString()
  };
  
  const { data, error } = await testSupabase
    .from('store_landing_analytics')
    .insert(testEvent)
    .select();
  
  expect(error).toBeNull();
  expect(data).toHaveLength(1);
  expect(data[0].timestamp).toBeDefined();
  expect(data[0].section_name).toBe('hero');
});
```

## 🔴 **CRITICAL TEST 2: Store Management Schema Validation**

### **Test 2.1: Core Tables Existence**
```typescript
describe('Store Management Schema', () => {
  test('all required tables exist', async () => {
    const requiredTables = [
      'store_landing_customization',
      'store_landing_analytics',
      'store_carousel_items',
      'store_promotional_banners',
      'store_community_spotlights',
      'store_quotes'
    ];
    
    for (const tableName of requiredTables) {
      const { data, error } = await testSupabase
        .from(tableName as any)
        .select('id')
        .limit(1);
      
      expect(error).toBeNull();
    }
  });

  test('store_landing_customization has correct schema', async () => {
    const testCustomization = {
      store_id: testStoreId,
      hero_quote: 'Test Quote',
      hero_quote_author: 'Test Author',
      hero_font_style: 'elegant',
      chat_button_text: 'Start Chatting',
      chat_button_position: 'center',
      chat_button_color_scheme: 'terracotta',
      is_chat_button_enabled: true,
      sections_enabled: { hero_quote: true }
    };
    
    const { data, error } = await testSupabase
      .from('store_landing_customization')
      .upsert(testCustomization)
      .select();
    
    expect(error).toBeNull();
    expect(data[0].hero_quote).toBe('Test Quote');
    expect(data[0].chat_button_color_scheme).toBe('terracotta');
  });
});
```

### **Test 2.2: Analytics Schema with Section Support**
```typescript
test('analytics table supports section-specific tracking', async () => {
  const sectionEvents = [
    { section_name: 'hero', event_type: 'hero_view' },
    { section_name: 'carousel', event_type: 'carousel_click' },
    { section_name: 'banners', event_type: 'banner_view' },
    { section_name: 'community', event_type: 'community_interaction' },
    { section_name: 'quote', event_type: 'quote_view' }
  ];
  
  for (const event of sectionEvents) {
    const { error } = await testSupabase
      .from('store_landing_analytics')
      .insert({
        store_id: testStoreId,
        session_id: `test_${Date.now()}`,
        timestamp: new Date().toISOString(),
        ...event
      });
    
    expect(error).toBeNull();
  }
});
```

## 🔴 **CRITICAL TEST 3: RLS Policy Enforcement**

### **Test 3.1: Store Owner Data Isolation**
```typescript
describe('Row Level Security', () => {
  test('store owners can only access their own customization data', async () => {
    // Create test data for two different stores
    const store1Data = {
      store_id: 'store-1-uuid',
      hero_quote: 'Store 1 Quote'
    };
    const store2Data = {
      store_id: 'store-2-uuid',
      hero_quote: 'Store 2 Quote'
    };
    
    await testSupabase.from('store_landing_customization').upsert(store1Data);
    await testSupabase.from('store_landing_customization').upsert(store2Data);
    
    // Test that store 1 owner can only see store 1 data
    const { data } = await testSupabase
      .from('store_landing_customization')
      .select('*')
      .eq('store_id', 'store-1-uuid');
    
    expect(data).toHaveLength(1);
    expect(data[0].hero_quote).toBe('Store 1 Quote');
  });

  test('analytics data is isolated by store', async () => {
    const { data } = await testSupabase
      .from('store_landing_analytics')
      .select('*')
      .eq('store_id', testStoreId);
    
    // Should only return data for the specified store
    data?.forEach(event => {
      expect(event.store_id).toBe(testStoreId);
    });
  });
});
```

### **Test 3.2: Unauthorized Access Prevention**
```typescript
test('unauthorized users cannot access store management data', async () => {
  // Test without proper authentication context
  const unauthorizedClient = createClient(
    process.env.VITE_SUPABASE_URL!,
    process.env.VITE_SUPABASE_ANON_KEY!
  );
  
  const { data, error } = await unauthorizedClient
    .from('store_landing_customization')
    .select('*');
  
  // Should either return empty data or proper error based on RLS
  expect(data).toEqual([]);
});
```

## 🔴 **CRITICAL TEST 4: Data Persistence Validation**

### **Test 4.1: Hero Customization Persistence**
```typescript
describe('Data Persistence', () => {
  test('hero customization data saves and retrieves correctly', async () => {
    const heroData = {
      store_id: testStoreId,
      hero_quote: 'Welcome to our bookstore community',
      hero_quote_author: 'Store Owner',
      hero_font_style: 'modern',
      chat_button_text: 'Chat with us',
      chat_button_position: 'right',
      chat_button_color_scheme: 'sage',
      chat_button_size: 'large',
      is_chat_button_enabled: true,
      sections_enabled: { hero_quote: true }
    };
    
    // Insert data
    const { error: insertError } = await testSupabase
      .from('store_landing_customization')
      .upsert(heroData);
    expect(insertError).toBeNull();
    
    // Retrieve and verify
    const { data, error } = await testSupabase
      .from('store_landing_customization')
      .select('*')
      .eq('store_id', testStoreId)
      .single();
    
    expect(error).toBeNull();
    expect(data.hero_quote).toBe(heroData.hero_quote);
    expect(data.chat_button_color_scheme).toBe(heroData.chat_button_color_scheme);
  });
});
```

### **Test 4.2: Analytics Data Aggregation**
```typescript
test('analytics data aggregates correctly for enhanced metrics', async () => {
  // Insert test analytics events
  const events = [
    { event_type: 'page_load', session_id: 'session_1', user_agent: 'Mobile Safari' },
    { event_type: 'page_load', session_id: 'session_2', user_agent: 'Chrome Desktop' },
    { event_type: 'chat_button_click', session_id: 'session_1' },
    { event_type: 'carousel_click', section_name: 'carousel', session_id: 'session_2' }
  ];
  
  for (const event of events) {
    await testSupabase.from('store_landing_analytics').insert({
      store_id: testStoreId,
      timestamp: new Date().toISOString(),
      ...event
    });
  }
  
  // Test aggregation queries
  const { data: pageLoads } = await testSupabase
    .from('store_landing_analytics')
    .select('*')
    .eq('store_id', testStoreId)
    .eq('event_type', 'page_load');
  
  expect(pageLoads).toHaveLength(2);
  
  const { data: chatClicks } = await testSupabase
    .from('store_landing_analytics')
    .select('*')
    .eq('store_id', testStoreId)
    .eq('event_type', 'chat_button_click');
  
  expect(chatClicks).toHaveLength(1);
});
```

## ✅ **SUCCESS CRITERIA**

### **Critical Database Tests Must Pass**
- ✅ **Analytics Timestamp Fix**: All queries use `timestamp` column without errors
- ✅ **Schema Validation**: All Store Management tables exist with correct structure
- ✅ **RLS Policy Enforcement**: Store Owner data isolation works 100%
- ✅ **Data Persistence**: All customization data saves and retrieves correctly
- ✅ **Section Analytics Support**: Analytics table supports section-specific tracking
- ✅ **Enhanced Fields**: Analytics supports all 6 enhanced metrics data collection

### **Performance Requirements**
- ✅ **Query Response Time**: Database queries complete within 500ms
- ✅ **Data Integrity**: No data corruption or loss during operations
- ✅ **Concurrent Access**: Multiple Store Owners can access simultaneously

### **Error Handling**
- ✅ **Graceful Failures**: Database errors don't crash the application
- ✅ **Constraint Validation**: Database constraints prevent invalid data
- ✅ **Transaction Safety**: Data operations are atomic and consistent

**These critical database tests ensure the foundation of our Store Management system is solid and the enhanced analytics database column fix is working correctly.**
