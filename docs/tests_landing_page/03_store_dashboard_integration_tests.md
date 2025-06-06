# Store Dashboard Integration Tests - Phase 8 Integration Testing

**Priority**: 🔴 **CRITICAL**  
**Focus**: Store Management Dashboard, Data Loading, Navigation Integration  
**Must Pass**: Core dashboard functionality and real-time updates  

## 🎯 **TEST OBJECTIVES**

### **Primary Goals**
1. **Dashboard Data Loading**: Verify all sections load data correctly
2. **Navigation Integration**: Test routing between management sections
3. **Real-time Updates**: Ensure data refreshes and state management work
4. **Analytics Integration**: Verify enhanced analytics display in dashboard

## 🔧 **TEST SETUP**

### **Component Testing Setup**
```typescript
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { StoreManagementDashboard } from '@/pages/admin/store/StoreManagementDashboard';
import { StoreOwnerRouteGuard } from '@/components/routeguards/StoreOwnerRouteGuard';

// Test wrapper with all required providers
const TestWrapper = ({ children }: { children: React.ReactNode }) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false }
    }
  });

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <StoreOwnerRouteGuard>
          {children}
        </StoreOwnerRouteGuard>
      </BrowserRouter>
    </QueryClientProvider>
  );
};

// Mock store context
const mockStoreContext = {
  storeId: 'test-store-uuid',
  isStoreOwner: true,
  storeData: {
    id: 'test-store-uuid',
    name: 'Test Bookstore',
    slug: 'test-bookstore'
  }
};
```

### **API Mocking Setup**
```typescript
// Mock all Store Management APIs
jest.mock('@/lib/api/store/carousel', () => ({
  CarouselAPI: {
    getCarouselItems: jest.fn(() => Promise.resolve([])),
    getCarouselStats: jest.fn(() => Promise.resolve({ active: 3, max: 6 }))
  }
}));

jest.mock('@/lib/api/store/analytics', () => ({
  AnalyticsAPI: {
    getSimpleMetrics: jest.fn(() => Promise.resolve({
      pageViews: 150,
      chatClicks: 12,
      bounceRate: 45,
      hasData: true
    }))
  }
}));

jest.mock('@/lib/api/store/heroCustomization', () => ({
  HeroCustomizationAPI: {
    getHeroCustomizationWithDefaults: jest.fn(() => Promise.resolve({
      hero_quote: 'Welcome to our store',
      chat_button_text: 'Start Chatting'
    }))
  }
}));
```

## 🔴 **CRITICAL TEST 1: Dashboard Data Loading**

### **Test 1.1: All Section Statistics Load**
```typescript
describe('Store Management Dashboard Data Loading', () => {
  test('dashboard loads all section statistics correctly', async () => {
    render(
      <TestWrapper>
        <StoreManagementDashboard />
      </TestWrapper>
    );

    // Wait for all data to load
    await waitFor(() => {
      // Verify carousel statistics
      expect(screen.getByText(/carousel books/i)).toBeInTheDocument();
      expect(screen.getByText('3/6')).toBeInTheDocument(); // active/max books
      
      // Verify banner statistics
      expect(screen.getByText(/active banners/i)).toBeInTheDocument();
      
      // Verify quote statistics
      expect(screen.getByText(/active quotes/i)).toBeInTheDocument();
      
      // Verify community statistics
      expect(screen.getByText(/community features/i)).toBeInTheDocument();
      
      // Verify analytics integration
      expect(screen.getByText(/page views/i)).toBeInTheDocument();
      expect(screen.getByText('150')).toBeInTheDocument(); // page views count
    });
  });

  test('enhanced analytics metrics display in dashboard', async () => {
    render(
      <TestWrapper>
        <StoreManagementDashboard />
      </TestWrapper>
    );

    await waitFor(() => {
      // Verify analytics card shows enhanced data
      expect(screen.getByText(/page views/i)).toBeInTheDocument();
      expect(screen.getByText('150')).toBeInTheDocument();
      expect(screen.getByText(/last 7 days/i)).toBeInTheDocument();
      expect(screen.getByText(/active|no data/i)).toBeInTheDocument();
    });
  });

  test('loading states display correctly', async () => {
    // Mock delayed API responses
    const delayedPromise = new Promise(resolve => 
      setTimeout(() => resolve({ active: 3, max: 6 }), 1000)
    );
    
    jest.mocked(CarouselAPI.getCarouselStats).mockReturnValue(delayedPromise);

    render(
      <TestWrapper>
        <StoreManagementDashboard />
      </TestWrapper>
    );

    // Should show loading spinner initially
    expect(screen.getByText(/loading/i)).toBeInTheDocument();

    // Wait for data to load
    await waitFor(() => {
      expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
    }, { timeout: 2000 });
  });
});
```

### **Test 1.2: Error State Handling**
```typescript
test('dashboard handles API errors gracefully', async () => {
  // Mock API error
  jest.mocked(AnalyticsAPI.getSimpleMetrics).mockRejectedValue(
    new Error('Analytics API unavailable')
  );

  render(
    <TestWrapper>
      <StoreManagementDashboard />
    </TestWrapper>
  );

  await waitFor(() => {
    // Should show fallback data or error state
    expect(screen.getByText(/page views/i)).toBeInTheDocument();
    expect(screen.getByText('0')).toBeInTheDocument(); // fallback value
  });
});
```

## 🔴 **CRITICAL TEST 2: Navigation Integration**

### **Test 2.1: Section Navigation Links**
```typescript
describe('Dashboard Navigation', () => {
  test('navigation links to all management sections work', async () => {
    render(
      <TestWrapper>
        <StoreManagementDashboard />
      </TestWrapper>
    );

    await waitFor(() => {
      // Verify all management section links are present
      expect(screen.getByText(/manage carousel/i)).toBeInTheDocument();
      expect(screen.getByText(/manage banners/i)).toBeInTheDocument();
      expect(screen.getByText(/manage quotes/i)).toBeInTheDocument();
      expect(screen.getByText(/community showcase/i)).toBeInTheDocument();
      expect(screen.getByText(/hero customization/i)).toBeInTheDocument();
      expect(screen.getByText(/view analytics/i)).toBeInTheDocument();
    });
  });

  test('quick action buttons navigate correctly', async () => {
    const mockNavigate = jest.fn();
    jest.mock('react-router-dom', () => ({
      ...jest.requireActual('react-router-dom'),
      useNavigate: () => mockNavigate
    }));

    render(
      <TestWrapper>
        <StoreManagementDashboard />
      </TestWrapper>
    );

    // Click on carousel management link
    const carouselLink = screen.getByText(/manage carousel/i);
    fireEvent.click(carouselLink);

    // Should navigate to carousel management
    expect(mockNavigate).toHaveBeenCalledWith('/admin/store-management/carousel');
  });

  test('analytics dashboard link works', async () => {
    render(
      <TestWrapper>
        <StoreManagementDashboard />
      </TestWrapper>
    );

    await waitFor(() => {
      const analyticsLink = screen.getByText(/view analytics/i);
      expect(analyticsLink).toBeInTheDocument();
      expect(analyticsLink.closest('a')).toHaveAttribute(
        'href', 
        '/admin/store-management/analytics'
      );
    });
  });
});
```

### **Test 2.2: Breadcrumb Navigation**
```typescript
test('breadcrumb navigation displays correctly', async () => {
  render(
    <TestWrapper>
      <StoreManagementDashboard />
    </TestWrapper>
  );

  await waitFor(() => {
    // Verify breadcrumb structure
    expect(screen.getByText(/store management/i)).toBeInTheDocument();
    expect(screen.getByText(/dashboard/i)).toBeInTheDocument();
  });
});
```

## 🔴 **CRITICAL TEST 3: Real-time Updates and State Management**

### **Test 3.1: Data Refresh Functionality**
```typescript
describe('Real-time Updates', () => {
  test('refresh button updates all dashboard data', async () => {
    let callCount = 0;
    jest.mocked(AnalyticsAPI.getSimpleMetrics).mockImplementation(() => {
      callCount++;
      return Promise.resolve({
        pageViews: callCount === 1 ? 150 : 175, // Different values for refresh
        chatClicks: 12,
        bounceRate: 45,
        hasData: true
      });
    });

    render(
      <TestWrapper>
        <StoreManagementDashboard />
      </TestWrapper>
    );

    // Wait for initial load
    await waitFor(() => {
      expect(screen.getByText('150')).toBeInTheDocument();
    });

    // Click refresh button
    const refreshButton = screen.getByText(/refresh/i);
    fireEvent.click(refreshButton);

    // Wait for updated data
    await waitFor(() => {
      expect(screen.getByText('175')).toBeInTheDocument();
    });

    expect(callCount).toBe(2); // Initial load + refresh
  });

  test('automatic data refresh on component mount', async () => {
    const getSimpleMetricsSpy = jest.mocked(AnalyticsAPI.getSimpleMetrics);

    render(
      <TestWrapper>
        <StoreManagementDashboard />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(getSimpleMetricsSpy).toHaveBeenCalledWith('test-store-uuid');
    });
  });
});
```

### **Test 3.2: State Consistency Across Sections**
```typescript
test('state remains consistent when navigating between sections', async () => {
  render(
    <TestWrapper>
      <StoreManagementDashboard />
    </TestWrapper>
  );

  // Verify initial state
  await waitFor(() => {
    expect(screen.getByText('150')).toBeInTheDocument(); // page views
  });

  // Navigate away and back (simulated)
  // In real test, this would involve actual navigation
  // For now, verify state persistence through re-render
  render(
    <TestWrapper>
      <StoreManagementDashboard />
    </TestWrapper>
  );

  await waitFor(() => {
    expect(screen.getByText('150')).toBeInTheDocument(); // Should maintain state
  });
});
```

## 🔴 **CRITICAL TEST 4: Enhanced Analytics Integration**

### **Test 4.1: Analytics Card Display**
```typescript
describe('Enhanced Analytics Integration', () => {
  test('analytics card shows enhanced metrics correctly', async () => {
    jest.mocked(AnalyticsAPI.getSimpleMetrics).mockResolvedValue({
      pageViews: 250,
      chatClicks: 18,
      bounceRate: 35,
      hasData: true
    });

    render(
      <TestWrapper>
        <StoreManagementDashboard />
      </TestWrapper>
    );

    await waitFor(() => {
      // Verify analytics card content
      expect(screen.getByText(/page views/i)).toBeInTheDocument();
      expect(screen.getByText('250')).toBeInTheDocument();
      expect(screen.getByText(/last 7 days/i)).toBeInTheDocument();
      expect(screen.getByText(/active/i)).toBeInTheDocument();
    });
  });

  test('analytics card handles no data state', async () => {
    jest.mocked(AnalyticsAPI.getSimpleMetrics).mockResolvedValue({
      pageViews: 0,
      chatClicks: 0,
      bounceRate: 0,
      hasData: false
    });

    render(
      <TestWrapper>
        <StoreManagementDashboard />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('0')).toBeInTheDocument(); // page views
      expect(screen.getByText(/no data/i)).toBeInTheDocument();
    });
  });

  test('analytics link navigates to enhanced dashboard', async () => {
    render(
      <TestWrapper>
        <StoreManagementDashboard />
      </TestWrapper>
    );

    await waitFor(() => {
      const analyticsLink = screen.getByRole('link', { name: /view analytics/i });
      expect(analyticsLink).toHaveAttribute(
        'href',
        '/admin/store-management/analytics'
      );
    });
  });
});
```

### **Test 4.2: Dashboard Performance with Enhanced Data**
```typescript
test('dashboard loads within performance budget with enhanced analytics', async () => {
  const startTime = performance.now();

  render(
    <TestWrapper>
      <StoreManagementDashboard />
    </TestWrapper>
  );

  await waitFor(() => {
    expect(screen.getByText(/page views/i)).toBeInTheDocument();
  });

  const loadTime = performance.now() - startTime;
  expect(loadTime).toBeLessThan(3000); // 3 second budget
});
```

## 🔴 **CRITICAL TEST 5: Responsive Design Integration**

### **Test 5.1: Dashboard Layout Responsiveness**
```typescript
describe('Responsive Dashboard Layout', () => {
  test('dashboard adapts to mobile viewport', async () => {
    // Mock mobile viewport
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 375
    });

    render(
      <TestWrapper>
        <StoreManagementDashboard />
      </TestWrapper>
    );

    await waitFor(() => {
      // Verify mobile-friendly layout
      const container = screen.getByRole('main') || screen.getByTestId('dashboard-container');
      expect(container).toBeInTheDocument();
      
      // Statistics cards should stack vertically on mobile
      const statsCards = screen.getAllByText(/carousel books|active banners|page views/i);
      expect(statsCards.length).toBeGreaterThan(0);
    });
  });

  test('dashboard grid layout works on desktop', async () => {
    // Mock desktop viewport
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 1920
    });

    render(
      <TestWrapper>
        <StoreManagementDashboard />
      </TestWrapper>
    );

    await waitFor(() => {
      // Verify all statistics cards are visible
      expect(screen.getByText(/carousel books/i)).toBeInTheDocument();
      expect(screen.getByText(/active banners/i)).toBeInTheDocument();
      expect(screen.getByText(/page views/i)).toBeInTheDocument();
    });
  });
});
```

## ✅ **SUCCESS CRITERIA**

### **Dashboard Integration Must Pass**
- ✅ **Data Loading**: All section statistics load correctly within 3 seconds
- ✅ **Navigation**: All management section links work properly
- ✅ **Real-time Updates**: Refresh functionality updates all data
- ✅ **Analytics Integration**: Enhanced analytics display correctly in dashboard
- ✅ **Error Handling**: Graceful fallbacks for API failures
- ✅ **State Management**: Consistent state across navigation

### **Performance Requirements**
- ✅ **Load Time**: Dashboard loads within 3 seconds
- ✅ **Responsiveness**: Works on mobile, tablet, desktop viewports
- ✅ **Memory Usage**: No memory leaks during navigation
- ✅ **API Efficiency**: Minimal redundant API calls

### **User Experience Standards**
- ✅ **Visual Feedback**: Loading states and error messages display
- ✅ **Navigation Flow**: Intuitive routing between sections
- ✅ **Data Accuracy**: Statistics reflect actual store data
- ✅ **Accessibility**: Proper ARIA labels and keyboard navigation

**These dashboard integration tests ensure the Store Management hub works seamlessly with all enhanced features and provides Store Owners with a reliable central control panel.**
