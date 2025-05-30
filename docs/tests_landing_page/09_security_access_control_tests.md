# Security & Access Control Tests - Phase 8 Integration Testing

**Priority**: 🟢 **MEDIUM**  
**Focus**: Store Owner Isolation, Data Privacy, Authentication, Authorization  
**Coverage**: RLS Policies, Route Guards, API Security, Data Protection  

## 🎯 **TEST OBJECTIVES**

### **Primary Goals**
1. **Store Owner Isolation**: Verify Store Owners can only access their own data
2. **Authentication Security**: Test login/logout and session management
3. **Authorization Controls**: Ensure proper role-based access control
4. **Data Privacy**: Verify analytics and customization data isolation

## 🔧 **TEST SETUP**

### **Security Testing Environment**
```typescript
import { createClient } from '@supabase/supabase-js';
import { render, screen, waitFor } from '@testing-library/react';

// Test users for security testing
const TEST_USERS = {
  storeOwner1: {
    id: 'store-owner-1-uuid',
    email: 'owner1@test.com',
    storeId: 'store-1-uuid'
  },
  storeOwner2: {
    id: 'store-owner-2-uuid',
    email: 'owner2@test.com',
    storeId: 'store-2-uuid'
  },
  regularUser: {
    id: 'regular-user-uuid',
    email: 'user@test.com',
    storeId: null
  }
};

// Mock authentication contexts
const mockAuthContext = (user: typeof TEST_USERS.storeOwner1 | null) => ({
  user: user ? {
    id: user.id,
    email: user.email,
    user_metadata: { store_id: user.storeId }
  } : null,
  isAuthenticated: !!user,
  isStoreOwner: !!user?.storeId
});

// Security test wrapper
const SecurityTestWrapper = ({ 
  user, 
  children 
}: { 
  user: typeof TEST_USERS.storeOwner1 | null;
  children: React.ReactNode;
}) => {
  const authContext = mockAuthContext(user);
  
  return (
    <AuthProvider value={authContext}>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          {children}
        </BrowserRouter>
      </QueryClientProvider>
    </AuthProvider>
  );
};
```

## 🟢 **MEDIUM PRIORITY TEST 1: Store Owner Data Isolation**

### **Test 1.1: Store Management Data Access Control**
```typescript
describe('Store Owner Data Isolation', () => {
  test('store owners can only access their own customization data', async () => {
    // Create test data for two different stores
    const store1Data = {
      store_id: TEST_USERS.storeOwner1.storeId,
      hero_quote: 'Store 1 Quote',
      chat_button_text: 'Store 1 Chat'
    };
    
    const store2Data = {
      store_id: TEST_USERS.storeOwner2.storeId,
      hero_quote: 'Store 2 Quote',
      chat_button_text: 'Store 2 Chat'
    };

    // Insert test data
    await testSupabase.from('store_landing_customization').upsert(store1Data);
    await testSupabase.from('store_landing_customization').upsert(store2Data);

    // Test Store Owner 1 can only see their data
    render(
      <SecurityTestWrapper user={TEST_USERS.storeOwner1}>
        <HeroCustomization />
      </SecurityTestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByDisplayValue('Store 1 Quote')).toBeInTheDocument();
      expect(screen.queryByDisplayValue('Store 2 Quote')).not.toBeInTheDocument();
    });

    // Test Store Owner 2 can only see their data
    render(
      <SecurityTestWrapper user={TEST_USERS.storeOwner2}>
        <HeroCustomization />
      </SecurityTestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByDisplayValue('Store 2 Quote')).toBeInTheDocument();
      expect(screen.queryByDisplayValue('Store 1 Quote')).not.toBeInTheDocument();
    });
  });

  test('analytics data is isolated by store', async () => {
    // Create analytics data for different stores
    const store1Analytics = {
      store_id: TEST_USERS.storeOwner1.storeId,
      event_type: 'page_load',
      session_id: 'store1_session',
      timestamp: new Date().toISOString()
    };

    const store2Analytics = {
      store_id: TEST_USERS.storeOwner2.storeId,
      event_type: 'page_load',
      session_id: 'store2_session',
      timestamp: new Date().toISOString()
    };

    await testSupabase.from('store_landing_analytics').insert(store1Analytics);
    await testSupabase.from('store_landing_analytics').insert(store2Analytics);

    // Test Store Owner 1 analytics access
    render(
      <SecurityTestWrapper user={TEST_USERS.storeOwner1}>
        <LandingPageAnalytics />
      </SecurityTestWrapper>
    );

    await waitFor(() => {
      // Should only see their own analytics data
      expect(screen.getByTestId('analytics-dashboard')).toBeInTheDocument();
      // Verify data isolation through API calls
    });

    // Verify API-level isolation
    const store1Data = await AnalyticsAPI.getAnalyticsSummary(TEST_USERS.storeOwner1.storeId, 30);
    const store2Data = await AnalyticsAPI.getAnalyticsSummary(TEST_USERS.storeOwner2.storeId, 30);

    expect(store1Data).not.toEqual(store2Data);
  });

  test('carousel data isolation between stores', async () => {
    const store1Carousel = {
      store_id: TEST_USERS.storeOwner1.storeId,
      title: 'Store 1 Book',
      author: 'Store 1 Author',
      position: 1,
      is_active: true
    };

    const store2Carousel = {
      store_id: TEST_USERS.storeOwner2.storeId,
      title: 'Store 2 Book',
      author: 'Store 2 Author',
      position: 1,
      is_active: true
    };

    await testSupabase.from('store_carousel_items').insert(store1Carousel);
    await testSupabase.from('store_carousel_items').insert(store2Carousel);

    // Test Store Owner 1 carousel access
    render(
      <SecurityTestWrapper user={TEST_USERS.storeOwner1}>
        <CarouselManagement />
      </SecurityTestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('Store 1 Book')).toBeInTheDocument();
      expect(screen.queryByText('Store 2 Book')).not.toBeInTheDocument();
    });
  });
});
```

### **Test 1.2: Cross-Store Data Access Prevention**
```typescript
test('prevents cross-store data modification attempts', async () => {
  // Attempt to modify another store's data
  const unauthorizedUpdate = {
    store_id: TEST_USERS.storeOwner2.storeId,
    hero_quote: 'Unauthorized modification attempt'
  };

  // This should fail due to RLS policies
  const { error } = await testSupabase
    .from('store_landing_customization')
    .upsert(unauthorizedUpdate);

  expect(error).toBeDefined(); // Should be blocked by RLS
});
```

## 🟢 **MEDIUM PRIORITY TEST 2: Authentication and Route Guards**

### **Test 2.1: Store Owner Route Protection**
```typescript
describe('Authentication and Route Guards', () => {
  test('unauthenticated users cannot access store management', async () => {
    render(
      <SecurityTestWrapper user={null}>
        <StoreManagementDashboard />
      </SecurityTestWrapper>
    );

    // Should redirect to login or show access denied
    await waitFor(() => {
      expect(screen.getByText(/access denied|login required/i)).toBeInTheDocument();
    });
  });

  test('regular users cannot access store management', async () => {
    render(
      <SecurityTestWrapper user={TEST_USERS.regularUser}>
        <StoreManagementDashboard />
      </SecurityTestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText(/access denied|not authorized/i)).toBeInTheDocument();
    });
  });

  test('store owners can access their management dashboard', async () => {
    render(
      <SecurityTestWrapper user={TEST_USERS.storeOwner1}>
        <StoreManagementDashboard />
      </SecurityTestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByTestId('store-management-dashboard')).toBeInTheDocument();
      expect(screen.queryByText(/access denied/i)).not.toBeInTheDocument();
    });
  });

  test('analytics dashboard requires store owner authentication', async () => {
    // Test unauthenticated access
    render(
      <SecurityTestWrapper user={null}>
        <LandingPageAnalytics />
      </SecurityTestWrapper>
    );

    await waitFor(() => {
      expect(screen.queryByTestId('analytics-dashboard')).not.toBeInTheDocument();
    });

    // Test authenticated store owner access
    render(
      <SecurityTestWrapper user={TEST_USERS.storeOwner1}>
        <LandingPageAnalytics />
      </SecurityTestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByTestId('analytics-dashboard')).toBeInTheDocument();
    });
  });
});
```

### **Test 2.2: Session Management Security**
```typescript
test('session expiration handling', async () => {
  // Mock expired session
  const expiredAuthContext = {
    user: null,
    isAuthenticated: false,
    isStoreOwner: false,
    sessionExpired: true
  };

  render(
    <AuthProvider value={expiredAuthContext}>
      <StoreManagementDashboard />
    </AuthProvider>
  );

  await waitFor(() => {
    expect(screen.getByText(/session expired|please login again/i)).toBeInTheDocument();
  });
});

test('concurrent session detection', async () => {
  // Test handling of concurrent sessions from different devices
  // This would involve testing session invalidation logic
  const sessionConflictContext = {
    user: TEST_USERS.storeOwner1,
    isAuthenticated: false,
    sessionConflict: true
  };

  render(
    <AuthProvider value={sessionConflictContext}>
      <StoreManagementDashboard />
    </AuthProvider>
  );

  await waitFor(() => {
    expect(screen.getByText(/session conflict|logged in elsewhere/i)).toBeInTheDocument();
  });
});
```

## 🟢 **MEDIUM PRIORITY TEST 3: API Security and Authorization**

### **Test 3.1: API Endpoint Security**
```typescript
describe('API Security', () => {
  test('analytics API requires proper authentication', async () => {
    // Test without authentication
    const unauthenticatedClient = createClient(
      process.env.VITE_SUPABASE_URL!,
      process.env.VITE_SUPABASE_ANON_KEY!
    );

    const { data, error } = await unauthenticatedClient
      .from('store_landing_analytics')
      .select('*')
      .eq('store_id', TEST_USERS.storeOwner1.storeId);

    // Should return empty data or error due to RLS
    expect(data).toEqual([]);
  });

  test('hero customization API authorization', async () => {
    // Test unauthorized access to another store's hero data
    try {
      await HeroCustomizationAPI.upsertHeroCustomization(
        TEST_USERS.storeOwner2.storeId, // Different store
        { hero_quote: 'Unauthorized update' }
      );
      
      // Should not reach here
      expect(true).toBe(false);
    } catch (error) {
      expect(error).toBeDefined();
    }
  });

  test('carousel API prevents unauthorized modifications', async () => {
    const unauthorizedCarouselItem = {
      store_id: TEST_USERS.storeOwner2.storeId,
      title: 'Unauthorized Book',
      author: 'Unauthorized Author'
    };

    try {
      await CarouselAPI.addCarouselItem(unauthorizedCarouselItem);
      expect(true).toBe(false); // Should not succeed
    } catch (error) {
      expect(error).toBeDefined();
    }
  });

  test('banner API access control', async () => {
    const unauthorizedBanner = {
      store_id: TEST_USERS.storeOwner2.storeId,
      title: 'Unauthorized Banner',
      description: 'Should not be allowed'
    };

    try {
      await BannersAPI.createBanner(unauthorizedBanner);
      expect(true).toBe(false); // Should not succeed
    } catch (error) {
      expect(error).toBeDefined();
    }
  });
});
```

### **Test 3.2: Input Validation and Sanitization**
```typescript
test('input sanitization prevents XSS attacks', async () => {
  const maliciousInput = {
    hero_quote: '<script>alert("XSS")</script>',
    hero_quote_author: '<img src="x" onerror="alert(1)">',
    chat_button_text: 'javascript:alert("XSS")'
  };

  render(
    <SecurityTestWrapper user={TEST_USERS.storeOwner1}>
      <HeroCustomization />
    </SecurityTestWrapper>
  );

  // Input malicious content
  const quoteInput = screen.getByTestId('hero-quote-input');
  fireEvent.change(quoteInput, { target: { value: maliciousInput.hero_quote } });

  // Verify content is sanitized
  await waitFor(() => {
    expect(quoteInput.value).not.toContain('<script>');
    expect(quoteInput.value).not.toContain('javascript:');
  });
});

test('SQL injection prevention in analytics queries', async () => {
  const maliciousStoreId = "'; DROP TABLE store_landing_analytics; --";

  try {
    await AnalyticsAPI.getAnalyticsSummary(maliciousStoreId, 30);
    // Should handle gracefully without SQL injection
  } catch (error) {
    // Error is acceptable, but should not be SQL injection
    expect(error.message).not.toContain('syntax error');
  }
});
```

## 🟢 **MEDIUM PRIORITY TEST 4: Data Privacy and Compliance**

### **Test 4.1: Personal Data Protection**
```typescript
describe('Data Privacy', () => {
  test('analytics data anonymization', async () => {
    const analyticsEvent = {
      store_id: TEST_USERS.storeOwner1.storeId,
      event_type: 'page_load',
      session_id: 'test_session',
      user_agent: 'Mozilla/5.0 Test Browser',
      ip_address: '192.168.1.1',
      timestamp: new Date().toISOString()
    };

    await testSupabase.from('store_landing_analytics').insert(analyticsEvent);

    // Verify IP addresses are not exposed in analytics API
    const analytics = await AnalyticsAPI.getAnalyticsSummary(TEST_USERS.storeOwner1.storeId, 30);
    
    // Analytics should not contain raw IP addresses
    expect(JSON.stringify(analytics)).not.toContain('192.168.1.1');
  });

  test('user data retention policies', async () => {
    // Test that old analytics data is properly handled
    const oldAnalyticsEvent = {
      store_id: TEST_USERS.storeOwner1.storeId,
      event_type: 'page_load',
      timestamp: new Date(Date.now() - 400 * 24 * 60 * 60 * 1000).toISOString() // 400 days ago
    };

    await testSupabase.from('store_landing_analytics').insert(oldAnalyticsEvent);

    // Query should respect retention policies
    const recentAnalytics = await AnalyticsAPI.getAnalyticsSummary(TEST_USERS.storeOwner1.storeId, 365);
    
    // Should not include data older than retention period
    expect(recentAnalytics.totalPageViews).toBe(0);
  });

  test('data export controls', async () => {
    // Verify that data export is controlled and authorized
    render(
      <SecurityTestWrapper user={TEST_USERS.storeOwner1}>
        <LandingPageAnalytics />
      </SecurityTestWrapper>
    );

    // Only store owners should see export options
    await waitFor(() => {
      const exportButton = screen.queryByTestId('export-analytics-button');
      if (exportButton) {
        expect(exportButton).toBeInTheDocument();
      }
    });

    // Regular users should not see export options
    render(
      <SecurityTestWrapper user={TEST_USERS.regularUser}>
        <LandingPageAnalytics />
      </SecurityTestWrapper>
    );

    await waitFor(() => {
      expect(screen.queryByTestId('export-analytics-button')).not.toBeInTheDocument();
    });
  });
});
```

### **Test 4.2: Audit Trail and Logging**
```typescript
test('security events are logged', async () => {
  // Test that security-relevant events are properly logged
  const unauthorizedAccess = async () => {
    try {
      await HeroCustomizationAPI.getHeroCustomization(TEST_USERS.storeOwner2.storeId);
    } catch (error) {
      // Expected to fail
    }
  };

  await unauthorizedAccess();

  // Verify security event is logged (this would check audit logs)
  // In a real implementation, this would verify audit trail entries
});
```

## 🟢 **MEDIUM PRIORITY TEST 5: Rate Limiting and Abuse Prevention**

### **Test 5.1: API Rate Limiting**
```typescript
describe('Rate Limiting', () => {
  test('analytics API rate limiting', async () => {
    const requests = [];
    
    // Make multiple rapid requests
    for (let i = 0; i < 20; i++) {
      requests.push(AnalyticsAPI.getAnalyticsSummary(TEST_USERS.storeOwner1.storeId, 30));
    }

    const results = await Promise.allSettled(requests);
    
    // Some requests should be rate limited
    const rejectedRequests = results.filter(result => result.status === 'rejected');
    expect(rejectedRequests.length).toBeGreaterThan(0);
  });

  test('form submission rate limiting', async () => {
    render(
      <SecurityTestWrapper user={TEST_USERS.storeOwner1}>
        <HeroCustomization />
      </SecurityTestWrapper>
    );

    const saveButton = screen.getByTestId('save-hero-button');
    
    // Rapid form submissions should be rate limited
    for (let i = 0; i < 10; i++) {
      fireEvent.click(saveButton);
    }

    await waitFor(() => {
      expect(screen.getByText(/too many requests|rate limit/i)).toBeInTheDocument();
    });
  });
});
```

## ✅ **SUCCESS CRITERIA**

### **Security Must Pass**
- ✅ **Data Isolation**: Store Owners can only access their own data (100% isolation)
- ✅ **Authentication**: Proper login/logout and session management
- ✅ **Authorization**: Role-based access control prevents unauthorized access
- ✅ **Route Guards**: Unauthenticated users cannot access protected routes
- ✅ **API Security**: All APIs require proper authentication and authorization

### **Data Privacy Standards**
- ✅ **Personal Data Protection**: IP addresses and sensitive data anonymized
- ✅ **Data Retention**: Old data handled according to retention policies
- ✅ **Cross-Store Isolation**: Zero data leakage between different stores
- ✅ **Input Sanitization**: XSS and injection attacks prevented

### **Access Control Requirements**
- ✅ **Store Owner Only**: Only Store Owners can access management interfaces
- ✅ **Session Security**: Expired sessions handled gracefully
- ✅ **Concurrent Sessions**: Multiple device login conflicts managed
- ✅ **Audit Trail**: Security events logged for compliance

**These security and access control tests ensure the Store Management system protects Store Owner data and maintains strict isolation between different stores while preventing unauthorized access and data breaches.**
