# Component Unit Tests - Phase 8 Integration Testing

**Priority**: 🟡 **HIGH**  
**Focus**: Individual Component Testing, Form Validation, UI Interactions  
**Coverage**: Hero, Analytics, Carousel, Banner, Quote, Community Components  

## 🎯 **TEST OBJECTIVES**

### **Primary Goals**
1. **Component Isolation**: Test each Store Management component independently
2. **Form Validation**: Verify input validation and error handling
3. **UI Interactions**: Test user interactions and state changes
4. **Props and State**: Ensure proper data flow and state management

## 🔧 **TEST SETUP**

### **Common Test Utilities**
```typescript
import { render, screen, fireEvent, waitFor, userEvent } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';

// Test wrapper for components requiring providers
const ComponentTestWrapper = ({ children }: { children: React.ReactNode }) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false }
    }
  });

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        {children}
      </BrowserRouter>
    </QueryClientProvider>
  );
};

// Mock store context
const mockStoreContext = {
  storeId: 'test-store-uuid',
  isStoreOwner: true
};

jest.mock('@/components/routeguards/StoreOwnerRouteGuard', () => ({
  useStoreOwnerContext: () => mockStoreContext
}));
```

## 🟡 **HIGH PRIORITY TEST 1: Hero Customization Component**

### **Test 1.1: Hero Form Validation**
```typescript
import { HeroCustomization } from '@/pages/admin/store/HeroCustomization';

describe('HeroCustomization Component', () => {
  test('validates quote length limits correctly', async () => {
    render(
      <ComponentTestWrapper>
        <HeroCustomization />
      </ComponentTestWrapper>
    );

    const quoteInput = screen.getByLabelText(/custom quote/i);
    
    // Test exceeding 200 character limit
    const longQuote = 'A'.repeat(201);
    await userEvent.type(quoteInput, longQuote);

    await waitFor(() => {
      expect(screen.getByText(/quote must be 200 characters or less/i)).toBeInTheDocument();
    });

    // Test valid quote length
    await userEvent.clear(quoteInput);
    await userEvent.type(quoteInput, 'Valid quote under limit');

    await waitFor(() => {
      expect(screen.queryByText(/quote must be 200 characters or less/i)).not.toBeInTheDocument();
    });
  });

  test('validates author name length limits', async () => {
    render(
      <ComponentTestWrapper>
        <HeroCustomization />
      </ComponentTestWrapper>
    );

    const authorInput = screen.getByLabelText(/author name/i);
    
    // Test exceeding 100 character limit
    const longAuthor = 'B'.repeat(101);
    await userEvent.type(authorInput, longAuthor);

    await waitFor(() => {
      expect(screen.getByText(/author name must be 100 characters or less/i)).toBeInTheDocument();
    });
  });

  test('chat button customization options work', async () => {
    render(
      <ComponentTestWrapper>
        <HeroCustomization />
      </ComponentTestWrapper>
    );

    // Test chat button text input
    const chatButtonInput = screen.getByLabelText(/chat button text/i);
    await userEvent.type(chatButtonInput, 'Custom Chat Text');

    expect(chatButtonInput).toHaveValue('Custom Chat Text');

    // Test position selection
    const positionSelect = screen.getByLabelText(/button position/i);
    await userEvent.selectOptions(positionSelect, 'right');

    expect(positionSelect).toHaveValue('right');

    // Test color scheme selection
    const colorSelect = screen.getByLabelText(/color scheme/i);
    await userEvent.selectOptions(colorSelect, 'sage');

    expect(colorSelect).toHaveValue('sage');
  });

  test('form submission with valid data', async () => {
    const mockSave = jest.fn();
    jest.mock('@/hooks/useHeroCustomization', () => ({
      useHeroCustomization: () => ({
        heroData: {},
        updateHeroData: jest.fn(),
        saveHeroCustomization: mockSave,
        isLoading: false,
        error: null
      })
    }));

    render(
      <ComponentTestWrapper>
        <HeroCustomization />
      </ComponentTestWrapper>
    );

    // Fill form with valid data
    await userEvent.type(screen.getByLabelText(/custom quote/i), 'Welcome to our store');
    await userEvent.type(screen.getByLabelText(/author name/i), 'Store Owner');

    // Submit form
    const saveButton = screen.getByText(/save changes/i);
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(mockSave).toHaveBeenCalled();
    });
  });
});
```

### **Test 1.2: Hero Real-time Preview**
```typescript
test('real-time preview updates with form changes', async () => {
  render(
    <ComponentTestWrapper>
      <HeroCustomization />
    </ComponentTestWrapper>
  );

  // Type in quote field
  const quoteInput = screen.getByLabelText(/custom quote/i);
  await userEvent.type(quoteInput, 'Preview Quote');

  // Preview should update (assuming preview component exists)
  await waitFor(() => {
    const preview = screen.getByTestId('hero-preview') || screen.getByText(/preview quote/i);
    expect(preview).toBeInTheDocument();
  });
});
```

## 🟡 **HIGH PRIORITY TEST 2: Enhanced Analytics Dashboard Component**

### **Test 2.1: Analytics Dashboard Rendering**
```typescript
import { LandingPageAnalytics } from '@/pages/admin/store/LandingPageAnalytics';

describe('LandingPageAnalytics Component', () => {
  beforeEach(() => {
    // Mock enhanced analytics API
    jest.mock('@/lib/api/store/analytics', () => ({
      AnalyticsAPI: {
        getEnhancedAnalytics: jest.fn(() => Promise.resolve({
          summary: {
            totalPageViews: 150,
            totalUniqueVisitors: 120,
            returnVisitorRate: 25,
            mobileVsDesktopRatio: { mobile: 60, desktop: 40 },
            totalChatClicks: 15,
            averageTimeOnPage: 180
          },
          heroAnalytics: {
            customQuoteViews: 100,
            chatButtonClickRate: 10,
            heroEngagementRate: 15
          },
          carouselAnalytics: {
            totalBookClicks: 25,
            carouselInteractionRate: 20,
            mostPopularBooks: [
              { bookTitle: 'Popular Book 1', clicks: 10 },
              { bookTitle: 'Popular Book 2', clicks: 8 }
            ]
          }
        })),
        getPerformanceAlerts: jest.fn(() => Promise.resolve([])),
        getBasicRecommendations: jest.fn(() => Promise.resolve([]))
      }
    }));
  });

  test('renders all 6 enhanced metric cards', async () => {
    render(
      <ComponentTestWrapper>
        <LandingPageAnalytics />
      </ComponentTestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('Page Views')).toBeInTheDocument();
      expect(screen.getByText('Unique Visitors')).toBeInTheDocument();
      expect(screen.getByText('Return Rate')).toBeInTheDocument();
      expect(screen.getByText('Mobile Users')).toBeInTheDocument();
      expect(screen.getByText('Chat Clicks')).toBeInTheDocument();
      expect(screen.getByText('Avg. Time')).toBeInTheDocument();
    });
  });

  test('displays section-specific analytics cards', async () => {
    render(
      <ComponentTestWrapper>
        <LandingPageAnalytics />
      </ComponentTestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('Hero Section Performance')).toBeInTheDocument();
      expect(screen.getByText('Carousel Performance')).toBeInTheDocument();
      expect(screen.getByText('Banner Performance')).toBeInTheDocument();
      expect(screen.getByText('Community Performance')).toBeInTheDocument();
    });
  });

  test('handles loading state correctly', async () => {
    // Mock delayed response
    jest.mocked(AnalyticsAPI.getEnhancedAnalytics).mockReturnValue(
      new Promise(resolve => setTimeout(() => resolve(mockData), 1000))
    );

    render(
      <ComponentTestWrapper>
        <LandingPageAnalytics />
      </ComponentTestWrapper>
    );

    // Should show loading spinner
    expect(screen.getByText(/loading analytics/i)).toBeInTheDocument();

    // Wait for data to load
    await waitFor(() => {
      expect(screen.queryByText(/loading analytics/i)).not.toBeInTheDocument();
    }, { timeout: 2000 });
  });

  test('refresh button updates analytics data', async () => {
    let callCount = 0;
    jest.mocked(AnalyticsAPI.getEnhancedAnalytics).mockImplementation(() => {
      callCount++;
      return Promise.resolve({
        summary: { totalPageViews: callCount === 1 ? 150 : 200 }
      });
    });

    render(
      <ComponentTestWrapper>
        <LandingPageAnalytics />
      </ComponentTestWrapper>
    );

    // Wait for initial load
    await waitFor(() => {
      expect(screen.getByText('150')).toBeInTheDocument();
    });

    // Click refresh
    const refreshButton = screen.getByText(/refresh data/i);
    fireEvent.click(refreshButton);

    // Wait for updated data
    await waitFor(() => {
      expect(screen.getByText('200')).toBeInTheDocument();
    });
  });
});
```

## 🟡 **HIGH PRIORITY TEST 3: Carousel Management Component**

### **Test 3.1: Carousel Book Management**
```typescript
import CarouselManagement from '@/pages/admin/store/CarouselManagement';

describe('CarouselManagement Component', () => {
  test('displays existing carousel items', async () => {
    const mockCarouselItems = [
      {
        id: '1',
        title: 'Test Book 1',
        author: 'Test Author 1',
        position: 1,
        is_active: true
      },
      {
        id: '2',
        title: 'Test Book 2',
        author: 'Test Author 2',
        position: 2,
        is_active: true
      }
    ];

    jest.mock('@/lib/api/store/carousel', () => ({
      CarouselAPI: {
        getCarouselItems: jest.fn(() => Promise.resolve(mockCarouselItems))
      }
    }));

    render(
      <ComponentTestWrapper>
        <CarouselManagement />
      </ComponentTestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('Test Book 1')).toBeInTheDocument();
      expect(screen.getByText('Test Book 2')).toBeInTheDocument();
    });
  });

  test('add new book button opens modal', async () => {
    render(
      <ComponentTestWrapper>
        <CarouselManagement />
      </ComponentTestWrapper>
    );

    const addButton = screen.getByText(/add book/i);
    fireEvent.click(addButton);

    await waitFor(() => {
      expect(screen.getByText(/add book to carousel/i)).toBeInTheDocument();
    });
  });

  test('book deletion with confirmation', async () => {
    const mockDelete = jest.fn();
    jest.mock('@/lib/api/store/carousel', () => ({
      CarouselAPI: {
        deleteCarouselItem: mockDelete
      }
    }));

    render(
      <ComponentTestWrapper>
        <CarouselManagement />
      </ComponentTestWrapper>
    );

    // Click delete button (assuming it exists)
    const deleteButton = screen.getByTestId('delete-book-1');
    fireEvent.click(deleteButton);

    // Confirm deletion
    const confirmButton = screen.getByText(/confirm delete/i);
    fireEvent.click(confirmButton);

    await waitFor(() => {
      expect(mockDelete).toHaveBeenCalledWith('1');
    });
  });
});
```

## 🟡 **HIGH PRIORITY TEST 4: Banner Management Component**

### **Test 4.1: Banner Creation and Validation**
```typescript
import BannerManagement from '@/pages/admin/store/BannerManagement';

describe('BannerManagement Component', () => {
  test('banner creation form validation', async () => {
    render(
      <ComponentTestWrapper>
        <BannerManagement />
      </ComponentTestWrapper>
    );

    const createButton = screen.getByText(/create banner/i);
    fireEvent.click(createButton);

    // Try to submit without required fields
    const submitButton = screen.getByText(/save banner/i);
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/title is required/i)).toBeInTheDocument();
    });
  });

  test('banner scheduling date validation', async () => {
    render(
      <ComponentTestWrapper>
        <BannerManagement />
      </ComponentTestWrapper>
    );

    const createButton = screen.getByText(/create banner/i);
    fireEvent.click(createButton);

    // Set end date before start date
    const startDateInput = screen.getByLabelText(/start date/i);
    const endDateInput = screen.getByLabelText(/end date/i);

    await userEvent.type(startDateInput, '2025-02-01');
    await userEvent.type(endDateInput, '2025-01-31');

    await waitFor(() => {
      expect(screen.getByText(/end date must be after start date/i)).toBeInTheDocument();
    });
  });
});
```

## 🟡 **HIGH PRIORITY TEST 5: Quote Management Component**

### **Test 5.1: Quote CRUD Operations**
```typescript
import { QuoteManagement } from '@/pages/admin/store/QuoteManagement';

describe('QuoteManagement Component', () => {
  test('displays existing quotes', async () => {
    const mockQuotes = [
      {
        id: '1',
        quote_text: 'Reading is dreaming with open eyes',
        author: 'Anonymous',
        is_active: true
      }
    ];

    jest.mock('@/lib/api/store/quotes', () => ({
      QuotesAPI: {
        getQuotes: jest.fn(() => Promise.resolve(mockQuotes))
      }
    }));

    render(
      <ComponentTestWrapper>
        <QuoteManagement />
      </ComponentTestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('Reading is dreaming with open eyes')).toBeInTheDocument();
    });
  });

  test('quote text length validation', async () => {
    render(
      <ComponentTestWrapper>
        <QuoteManagement />
      </ComponentTestWrapper>
    );

    const addButton = screen.getByText(/add quote/i);
    fireEvent.click(addButton);

    const quoteInput = screen.getByLabelText(/quote text/i);
    const longQuote = 'A'.repeat(501); // Exceeds 500 char limit
    await userEvent.type(quoteInput, longQuote);

    await waitFor(() => {
      expect(screen.getByText(/quote must be 500 characters or less/i)).toBeInTheDocument();
    });
  });
});
```

## 🟡 **HIGH PRIORITY TEST 6: Community Showcase Component**

### **Test 6.1: Community Features Management**
```typescript
import { CommunityShowcaseManagement } from '@/pages/admin/store/CommunityShowcaseManagement';

describe('CommunityShowcaseManagement Component', () => {
  test('member spotlight creation', async () => {
    render(
      <ComponentTestWrapper>
        <CommunityShowcaseManagement />
      </ComponentTestWrapper>
    );

    const addSpotlightButton = screen.getByText(/add member spotlight/i);
    fireEvent.click(addSpotlightButton);

    // Fill spotlight form
    await userEvent.type(screen.getByLabelText(/member name/i), 'John Doe');
    await userEvent.type(screen.getByLabelText(/spotlight text/i), 'Great community member');

    const saveButton = screen.getByText(/save spotlight/i);
    fireEvent.click(saveButton);

    // Should show success message or updated list
    await waitFor(() => {
      expect(screen.getByText(/spotlight saved/i)).toBeInTheDocument();
    });
  });

  test('testimonial management', async () => {
    render(
      <ComponentTestWrapper>
        <CommunityShowcaseManagement />
      </ComponentTestWrapper>
    );

    const addTestimonialButton = screen.getByText(/add testimonial/i);
    fireEvent.click(addTestimonialButton);

    await userEvent.type(screen.getByLabelText(/testimonial text/i), 'Great bookstore!');
    await userEvent.type(screen.getByLabelText(/customer name/i), 'Jane Smith');

    const saveButton = screen.getByText(/save testimonial/i);
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(screen.getByText(/testimonial saved/i)).toBeInTheDocument();
    });
  });
});
```

## ✅ **SUCCESS CRITERIA**

### **Component Unit Tests Must Pass**
- ✅ **Hero Customization**: Form validation, real-time preview, data persistence
- ✅ **Enhanced Analytics**: 6 metric cards, section analytics, refresh functionality
- ✅ **Carousel Management**: Book CRUD operations, drag-and-drop, validation
- ✅ **Banner Management**: Creation, scheduling, image upload validation
- ✅ **Quote Management**: CRUD operations, text length validation
- ✅ **Community Showcase**: Spotlight and testimonial management

### **Form Validation Standards**
- ✅ **Input Limits**: Character limits enforced (quotes: 200, authors: 100)
- ✅ **Required Fields**: Proper validation for mandatory inputs
- ✅ **Date Validation**: Start/end date logic for banners
- ✅ **Error Messages**: Clear, user-friendly validation messages

### **UI Interaction Requirements**
- ✅ **Button Functionality**: All buttons trigger correct actions
- ✅ **Modal Behavior**: Modals open/close properly
- ✅ **Form Submission**: Data saves correctly with proper feedback
- ✅ **Loading States**: Appropriate loading indicators during operations

**These component unit tests ensure each Store Management component works correctly in isolation and provides proper user feedback.**
