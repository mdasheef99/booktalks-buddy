# Enhanced Analytics API Tests - Phase 8 Integration Testing

**Priority**: 🔴 **CRITICAL**  
**Focus**: Enhanced Analytics API, 6 Metrics, Section-Specific Data  
**Must Pass**: Before deployment of analytics features  

## 🎯 **TEST OBJECTIVES**

### **Primary Goals**
1. **Verify Enhanced Analytics API**: Test all 6 enhanced metrics calculation
2. **Section-Specific Analytics**: Validate Hero, Carousel, Banner, Community analytics
3. **Database Column Fix**: Ensure all API calls use `timestamp` column correctly
4. **Error Handling**: Test graceful degradation and fallback scenarios

## 🔧 **TEST SETUP**

### **API Import and Mock Setup**
```typescript
import { AnalyticsAPI } from '@/lib/api/store/analytics';
import { createClient } from '@supabase/supabase-js';

// Mock Supabase client for testing
jest.mock('@/lib/supabase', () => ({
  supabase: {
    from: jest.fn(),
    rpc: jest.fn()
  }
}));

const mockSupabase = {
  from: jest.fn(() => ({
    select: jest.fn(() => ({
      eq: jest.fn(() => ({
        gte: jest.fn(() => ({
          order: jest.fn(() => ({
            not: jest.fn(() => Promise.resolve({ data: [], error: null }))
          }))
        }))
      }))
    }))
  }))
};
```

### **Test Data Setup**
```typescript
const testStoreId = 'test-store-uuid';
const mockAnalyticsData = [
  {
    id: '1',
    store_id: testStoreId,
    event_type: 'page_load',
    section_name: 'hero',
    session_id: 'session_1',
    user_agent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0)',
    timestamp: '2025-01-30T10:00:00Z'
  },
  {
    id: '2',
    store_id: testStoreId,
    event_type: 'chat_button_click',
    section_name: 'hero',
    session_id: 'session_1',
    timestamp: '2025-01-30T10:01:00Z'
  },
  {
    id: '3',
    store_id: testStoreId,
    event_type: 'carousel_click',
    section_name: 'carousel',
    element_id: 'book-123',
    element_type: 'book',
    session_id: 'session_2',
    user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
    timestamp: '2025-01-30T10:02:00Z'
  }
];
```

## 🔴 **CRITICAL TEST 1: Enhanced Analytics Summary (6 Metrics)**

### **Test 1.1: All 6 Enhanced Metrics Calculation**
```typescript
describe('Enhanced Analytics Summary', () => {
  test('getAnalyticsSummary returns all 6 enhanced metrics', async () => {
    // Mock database response
    mockSupabase.from.mockReturnValue({
      select: () => ({
        eq: () => ({
          gte: () => ({
            order: () => Promise.resolve({ data: mockAnalyticsData, error: null })
          })
        })
      })
    });
    
    const summary = await AnalyticsAPI.getAnalyticsSummary(testStoreId, 30);
    
    // Verify all 6 enhanced metrics are present
    expect(summary).toHaveProperty('totalPageViews');
    expect(summary).toHaveProperty('totalUniqueVisitors');
    expect(summary).toHaveProperty('totalChatClicks');
    expect(summary).toHaveProperty('returnVisitorRate');
    expect(summary).toHaveProperty('mobileVsDesktopRatio');
    expect(summary).toHaveProperty('averageTimeOnPage');
    
    // Verify mobile vs desktop ratio structure
    expect(summary.mobileVsDesktopRatio).toHaveProperty('mobile');
    expect(summary.mobileVsDesktopRatio).toHaveProperty('desktop');
    expect(typeof summary.mobileVsDesktopRatio.mobile).toBe('number');
    expect(typeof summary.mobileVsDesktopRatio.desktop).toBe('number');
  });

  test('mobile vs desktop ratio calculation accuracy', async () => {
    const mixedUserAgentData = [
      { user_agent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0)', event_type: 'page_load' },
      { user_agent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0)', event_type: 'page_load' },
      { user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)', event_type: 'page_load' },
      { user_agent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X)', event_type: 'page_load' }
    ];
    
    mockSupabase.from.mockReturnValue({
      select: () => ({
        eq: () => ({
          gte: () => ({
            order: () => Promise.resolve({ data: mixedUserAgentData, error: null })
          })
        })
      })
    });
    
    const summary = await AnalyticsAPI.getAnalyticsSummary(testStoreId, 30);
    
    // 2 mobile out of 4 total = 50% mobile, 50% desktop
    expect(summary.mobileVsDesktopRatio.mobile).toBe(50);
    expect(summary.mobileVsDesktopRatio.desktop).toBe(50);
  });

  test('return visitor rate calculation', async () => {
    const sessionData = [
      { session_id: 'session_1', user_id: 'user_1', event_type: 'page_load' },
      { session_id: 'session_2', user_id: 'user_1', event_type: 'page_load' }, // Return visit
      { session_id: 'session_3', user_id: 'user_2', event_type: 'page_load' },
      { session_id: 'session_4', user_id: null, event_type: 'page_load' } // Anonymous
    ];
    
    mockSupabase.from.mockReturnValue({
      select: () => ({
        eq: () => ({
          gte: () => ({
            order: () => Promise.resolve({ data: sessionData, error: null })
          })
        })
      })
    });
    
    const summary = await AnalyticsAPI.getAnalyticsSummary(testStoreId, 30);
    
    expect(summary.returnVisitorRate).toBeGreaterThanOrEqual(0);
    expect(summary.returnVisitorRate).toBeLessThanOrEqual(100);
  });
});
```

### **Test 1.2: Database Column Fix Verification**
```typescript
test('analytics API uses timestamp column correctly', async () => {
  const mockQuery = jest.fn(() => Promise.resolve({ data: [], error: null }));
  
  mockSupabase.from.mockReturnValue({
    select: () => ({
      eq: () => ({
        gte: mockQuery,
        order: () => mockQuery
      })
    })
  });
  
  await AnalyticsAPI.getAnalyticsSummary(testStoreId, 30);
  
  // Verify that the query uses 'timestamp' not 'date'
  expect(mockQuery).toHaveBeenCalledWith('timestamp', expect.any(String));
});
```

## 🔴 **CRITICAL TEST 2: Section-Specific Analytics**

### **Test 2.1: Section Analytics Data Structure**
```typescript
describe('Section-Specific Analytics', () => {
  test('getSectionAnalytics returns correct structure', async () => {
    const sectionData = [
      { section_name: 'hero', event_type: 'hero_view', session_id: 'session_1' },
      { section_name: 'hero', event_type: 'chat_button_click', session_id: 'session_1' },
      { section_name: 'carousel', event_type: 'carousel_view', session_id: 'session_2' },
      { section_name: 'carousel', event_type: 'carousel_click', element_id: 'book-1', element_type: 'book' }
    ];
    
    mockSupabase.from.mockReturnValue({
      select: () => ({
        eq: () => ({
          gte: () => ({
            not: () => Promise.resolve({ data: sectionData, error: null })
          })
        })
      })
    });
    
    const sections = await AnalyticsAPI.getSectionAnalytics(testStoreId, 30);
    
    expect(Array.isArray(sections)).toBe(true);
    sections.forEach(section => {
      expect(section).toHaveProperty('sectionName');
      expect(section).toHaveProperty('totalViews');
      expect(section).toHaveProperty('uniqueVisitors');
      expect(section).toHaveProperty('interactionRate');
      expect(section).toHaveProperty('topElements');
    });
  });

  test('element tracking in section analytics', async () => {
    const elementTrackingData = [
      {
        section_name: 'carousel',
        event_type: 'carousel_click',
        element_id: 'book-123',
        element_type: 'book',
        session_id: 'session_1'
      },
      {
        section_name: 'carousel',
        event_type: 'carousel_click',
        element_id: 'book-123',
        element_type: 'book',
        session_id: 'session_2'
      },
      {
        section_name: 'carousel',
        event_type: 'carousel_click',
        element_id: 'book-456',
        element_type: 'book',
        session_id: 'session_3'
      }
    ];
    
    mockSupabase.from.mockReturnValue({
      select: () => ({
        eq: () => ({
          gte: () => ({
            not: () => Promise.resolve({ data: elementTrackingData, error: null })
          })
        })
      })
    });
    
    const sections = await AnalyticsAPI.getSectionAnalytics(testStoreId, 30);
    const carouselSection = sections.find(s => s.sectionName === 'carousel');
    
    expect(carouselSection?.topElements).toBeDefined();
    expect(carouselSection?.topElements?.length).toBeGreaterThan(0);
    
    // Most popular element should be book-123 (2 clicks)
    const topElement = carouselSection?.topElements?.[0];
    expect(topElement?.elementId).toBe('book-123');
    expect(topElement?.interactions).toBe(2);
  });
});
```

### **Test 2.2: Enhanced Analytics Integration**
```typescript
test('getEnhancedAnalytics returns complete structure', async () => {
  mockSupabase.from.mockReturnValue({
    select: () => ({
      eq: () => ({
        gte: () => ({
          order: () => Promise.resolve({ data: mockAnalyticsData, error: null }),
          not: () => Promise.resolve({ data: mockAnalyticsData, error: null })
        })
      })
    })
  });
  
  const enhanced = await AnalyticsAPI.getEnhancedAnalytics(testStoreId, 30);
  
  // Verify main structure
  expect(enhanced).toHaveProperty('summary');
  expect(enhanced).toHaveProperty('sectionBreakdown');
  expect(enhanced).toHaveProperty('heroAnalytics');
  expect(enhanced).toHaveProperty('carouselAnalytics');
  expect(enhanced).toHaveProperty('bannerAnalytics');
  expect(enhanced).toHaveProperty('communityAnalytics');
  expect(enhanced).toHaveProperty('quoteAnalytics');
  
  // Verify hero analytics structure
  expect(enhanced.heroAnalytics).toHaveProperty('customQuoteViews');
  expect(enhanced.heroAnalytics).toHaveProperty('chatButtonClickRate');
  expect(enhanced.heroAnalytics).toHaveProperty('heroEngagementRate');
  
  // Verify carousel analytics structure
  expect(enhanced.carouselAnalytics).toHaveProperty('totalBookClicks');
  expect(enhanced.carouselAnalytics).toHaveProperty('carouselInteractionRate');
  expect(enhanced.carouselAnalytics).toHaveProperty('mostPopularBooks');
});
```

## 🔴 **CRITICAL TEST 3: Error Handling & Graceful Degradation**

### **Test 3.1: Database Error Handling**
```typescript
describe('Error Handling', () => {
  test('graceful handling of database errors', async () => {
    mockSupabase.from.mockReturnValue({
      select: () => ({
        eq: () => ({
          gte: () => ({
            order: () => Promise.resolve({ 
              data: null, 
              error: { message: 'Database connection failed' }
            })
          })
        })
      })
    });
    
    const summary = await AnalyticsAPI.getAnalyticsSummary(testStoreId, 30);
    
    // Should return default values, not throw error
    expect(summary.totalPageViews).toBe(0);
    expect(summary.totalUniqueVisitors).toBe(0);
    expect(summary.mobileVsDesktopRatio.mobile).toBe(0);
    expect(summary.mobileVsDesktopRatio.desktop).toBe(0);
  });

  test('performance alerts with no data', async () => {
    mockSupabase.from.mockReturnValue({
      select: () => ({
        eq: () => ({
          gte: () => ({
            order: () => Promise.resolve({ data: [], error: null })
          })
        })
      })
    });
    
    const alerts = await AnalyticsAPI.getPerformanceAlerts(testStoreId);
    
    expect(Array.isArray(alerts)).toBe(true);
    expect(alerts.length).toBeGreaterThan(0); // Should return "no data" alert
    
    const noDataAlert = alerts.find(alert => 
      alert.title.toLowerCase().includes('no analytics data')
    );
    expect(noDataAlert).toBeDefined();
  });

  test('enhanced analytics with missing data returns empty structure', async () => {
    mockSupabase.from.mockReturnValue({
      select: () => ({
        eq: () => ({
          gte: () => ({
            order: () => Promise.resolve({ data: null, error: new Error('Test error') }),
            not: () => Promise.resolve({ data: null, error: new Error('Test error') })
          })
        })
      })
    });
    
    const enhanced = await AnalyticsAPI.getEnhancedAnalytics(testStoreId, 30);
    
    // Should return empty structure, not crash
    expect(enhanced.summary.totalPageViews).toBe(0);
    expect(enhanced.sectionBreakdown).toEqual([]);
    expect(enhanced.heroAnalytics.customQuoteViews).toBe(0);
    expect(enhanced.carouselAnalytics.mostPopularBooks).toEqual([]);
  });
});
```

### **Test 3.2: Performance and Caching**
```typescript
test('analytics API response time within budget', async () => {
  mockSupabase.from.mockReturnValue({
    select: () => ({
      eq: () => ({
        gte: () => ({
          order: () => Promise.resolve({ data: mockAnalyticsData, error: null })
        })
      })
    })
  });
  
  const startTime = performance.now();
  await AnalyticsAPI.getAnalyticsSummary(testStoreId, 30);
  const responseTime = performance.now() - startTime;
  
  // API should respond within 2 seconds
  expect(responseTime).toBeLessThan(2000);
});

test('simple metrics for dashboard display', async () => {
  mockSupabase.from.mockReturnValue({
    select: () => ({
      eq: () => ({
        gte: () => ({
          order: () => Promise.resolve({ data: mockAnalyticsData, error: null })
        })
      })
    })
  });
  
  const metrics = await AnalyticsAPI.getSimpleMetrics(testStoreId);
  
  expect(metrics).toHaveProperty('pageViews');
  expect(metrics).toHaveProperty('chatClicks');
  expect(metrics).toHaveProperty('bounceRate');
  expect(metrics).toHaveProperty('hasData');
  expect(typeof metrics.hasData).toBe('boolean');
});
```

## ✅ **SUCCESS CRITERIA**

### **Enhanced Analytics API Must Pass**
- ✅ **6 Enhanced Metrics**: All metrics calculate correctly with proper data types
- ✅ **Section-Specific Data**: Hero, Carousel, Banner, Community analytics work
- ✅ **Database Column Fix**: All API calls use `timestamp` column without errors
- ✅ **Mobile Detection**: User agent parsing works for mobile vs desktop ratio
- ✅ **Element Tracking**: Top elements calculation works for each section
- ✅ **Return Visitor Rate**: Calculation handles edge cases properly

### **Error Handling Requirements**
- ✅ **Graceful Degradation**: API returns default values on database errors
- ✅ **No Data Scenarios**: Proper handling when no analytics data exists
- ✅ **Performance Alerts**: Generate appropriate alerts for all scenarios
- ✅ **Type Safety**: All returned data matches TypeScript interfaces

### **Performance Standards**
- ✅ **Response Time**: API calls complete within 2 seconds
- ✅ **Data Accuracy**: Calculations are mathematically correct
- ✅ **Memory Efficiency**: No memory leaks in data processing

**These enhanced analytics API tests ensure our analytics system provides accurate, reliable data for Store Owners to optimize their landing pages.**
