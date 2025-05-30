# Landing Page Rendering Tests - Phase 8 Integration Testing

**Priority**: 🟡 **HIGH**  
**Focus**: Landing Page Display, Customization Rendering, Section Integration  
**Coverage**: Hero, Carousel, Banners, Community, Quotes Display  

## 🎯 **TEST OBJECTIVES**

### **Primary Goals**
1. **Customization Display**: Verify all Store Management customizations render correctly
2. **Section Integration**: Test how different sections work together on landing page
3. **Responsive Rendering**: Ensure landing page adapts to different screen sizes
4. **Fallback Behavior**: Test section hiding when no customizations exist

## 🔧 **TEST SETUP**

### **Landing Page Test Environment**
```typescript
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { Landing } from '@/pages/Landing';

// Mock store data for testing
const mockStoreData = {
  id: 'test-store-uuid',
  name: 'Test Bookstore',
  slug: 'test-bookstore'
};

// Test wrapper with providers
const LandingTestWrapper = ({ children }: { children: React.ReactNode }) => {
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

// Mock all Store Management APIs with test data
const mockCustomizationData = {
  hero: {
    hero_quote: 'Welcome to our amazing bookstore community',
    hero_quote_author: 'Store Owner',
    hero_font_style: 'elegant',
    chat_button_text: 'Chat with us now',
    chat_button_position: 'center',
    chat_button_color_scheme: 'sage',
    is_chat_button_enabled: true,
    sections_enabled: { hero_quote: true }
  },
  carousel: [
    {
      id: '1',
      title: 'The Great Gatsby',
      author: 'F. Scott Fitzgerald',
      image_url: 'https://example.com/gatsby.jpg',
      position: 1,
      is_active: true
    },
    {
      id: '2',
      title: 'To Kill a Mockingbird',
      author: 'Harper Lee',
      image_url: 'https://example.com/mockingbird.jpg',
      position: 2,
      is_active: true
    }
  ],
  banners: [
    {
      id: '1',
      title: 'Summer Reading Sale',
      description: '50% off selected books',
      cta_text: 'Shop Now',
      cta_url: '/shop/summer-sale',
      is_active: true,
      priority: 1
    }
  ],
  quotes: [
    {
      id: '1',
      quote_text: 'A room without books is like a body without a soul',
      author: 'Cicero',
      is_active: true
    }
  ],
  community: {
    spotlights: [
      {
        id: '1',
        member_name: 'Sarah Johnson',
        spotlight_text: 'Active community member and book lover',
        is_active: true
      }
    ],
    testimonials: [
      {
        id: '1',
        testimonial_text: 'Amazing bookstore with great community!',
        customer_name: 'John Doe',
        is_active: true
      }
    ]
  }
};
```

## 🟡 **HIGH PRIORITY TEST 1: Hero Section Rendering**

### **Test 1.1: Hero Customization Display**
```typescript
describe('Hero Section Rendering', () => {
  beforeEach(() => {
    // Mock hero customization API
    jest.mock('@/lib/api/store/heroCustomization', () => ({
      HeroCustomizationAPI: {
        getHeroCustomizationWithDefaults: jest.fn(() => 
          Promise.resolve(mockCustomizationData.hero)
        )
      }
    }));
  });

  test('displays custom hero quote and author', async () => {
    render(
      <LandingTestWrapper>
        <Landing />
      </LandingTestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('Welcome to our amazing bookstore community')).toBeInTheDocument();
      expect(screen.getByText('— Store Owner')).toBeInTheDocument();
    });
  });

  test('applies correct typography styling', async () => {
    render(
      <LandingTestWrapper>
        <Landing />
      </LandingTestWrapper>
    );

    await waitFor(() => {
      const quoteElement = screen.getByText('Welcome to our amazing bookstore community');
      expect(quoteElement).toHaveClass('font-elegant'); // Based on hero_font_style
    });
  });

  test('displays customized chat button', async () => {
    render(
      <LandingTestWrapper>
        <Landing />
      </LandingTestWrapper>
    );

    await waitFor(() => {
      const chatButton = screen.getByText('Chat with us now');
      expect(chatButton).toBeInTheDocument();
      expect(chatButton).toHaveClass('bg-sage'); // Based on color scheme
      expect(chatButton.closest('div')).toHaveClass('justify-center'); // Based on position
    });
  });

  test('hides hero section when no customization exists', async () => {
    // Mock empty hero data
    jest.mocked(HeroCustomizationAPI.getHeroCustomizationWithDefaults)
      .mockResolvedValue({
        sections_enabled: { hero_quote: false },
        hero_quote: null,
        is_chat_button_enabled: false
      });

    render(
      <LandingTestWrapper>
        <Landing />
      </LandingTestWrapper>
    );

    await waitFor(() => {
      expect(screen.queryByTestId('hero-section')).not.toBeInTheDocument();
    });
  });
});
```

### **Test 1.2: Hero Responsive Design**
```typescript
test('hero section adapts to different screen sizes', async () => {
  render(
    <LandingTestWrapper>
      <Landing />
    </LandingTestWrapper>
  );

  // Test mobile layout
  Object.defineProperty(window, 'innerWidth', { value: 375 });
  window.dispatchEvent(new Event('resize'));

  await waitFor(() => {
    const heroSection = screen.getByTestId('hero-section');
    expect(heroSection).toHaveClass('px-4'); // Mobile padding
  });

  // Test desktop layout
  Object.defineProperty(window, 'innerWidth', { value: 1920 });
  window.dispatchEvent(new Event('resize'));

  await waitFor(() => {
    const heroSection = screen.getByTestId('hero-section');
    expect(heroSection).toHaveClass('px-8'); // Desktop padding
  });
});
```

## 🟡 **HIGH PRIORITY TEST 2: Carousel Section Rendering**

### **Test 2.1: Book Carousel Display**
```typescript
describe('Carousel Section Rendering', () => {
  beforeEach(() => {
    jest.mock('@/lib/api/store/carousel', () => ({
      CarouselAPI: {
        getActiveCarouselItems: jest.fn(() => 
          Promise.resolve(mockCustomizationData.carousel)
        )
      }
    }));
  });

  test('displays all active carousel books', async () => {
    render(
      <LandingTestWrapper>
        <Landing />
      </LandingTestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('The Great Gatsby')).toBeInTheDocument();
      expect(screen.getByText('F. Scott Fitzgerald')).toBeInTheDocument();
      expect(screen.getByText('To Kill a Mockingbird')).toBeInTheDocument();
      expect(screen.getByText('Harper Lee')).toBeInTheDocument();
    });
  });

  test('carousel images load with proper alt text', async () => {
    render(
      <LandingTestWrapper>
        <Landing />
      </LandingTestWrapper>
    );

    await waitFor(() => {
      const gatsbyImage = screen.getByAltText('The Great Gatsby by F. Scott Fitzgerald');
      expect(gatsbyImage).toBeInTheDocument();
      expect(gatsbyImage).toHaveAttribute('src', 'https://example.com/gatsby.jpg');
    });
  });

  test('carousel responsive behavior', async () => {
    render(
      <LandingTestWrapper>
        <Landing />
      </LandingTestWrapper>
    );

    // Test mobile: should show 2-3 books
    Object.defineProperty(window, 'innerWidth', { value: 375 });
    window.dispatchEvent(new Event('resize'));

    await waitFor(() => {
      const carouselContainer = screen.getByTestId('carousel-container');
      expect(carouselContainer).toHaveClass('grid-cols-2'); // Mobile layout
    });

    // Test desktop: should show 6 books
    Object.defineProperty(window, 'innerWidth', { value: 1920 });
    window.dispatchEvent(new Event('resize'));

    await waitFor(() => {
      const carouselContainer = screen.getByTestId('carousel-container');
      expect(carouselContainer).toHaveClass('lg:grid-cols-6'); // Desktop layout
    });
  });

  test('hides carousel section when no books exist', async () => {
    jest.mocked(CarouselAPI.getActiveCarouselItems).mockResolvedValue([]);

    render(
      <LandingTestWrapper>
        <Landing />
      </LandingTestWrapper>
    );

    await waitFor(() => {
      expect(screen.queryByTestId('carousel-section')).not.toBeInTheDocument();
    });
  });
});
```

## 🟡 **HIGH PRIORITY TEST 3: Banner Section Rendering**

### **Test 3.1: Promotional Banner Display**
```typescript
describe('Banner Section Rendering', () => {
  beforeEach(() => {
    jest.mock('@/lib/api/store/banners', () => ({
      BannersAPI: {
        getActiveBanners: jest.fn(() => 
          Promise.resolve(mockCustomizationData.banners)
        )
      }
    }));
  });

  test('displays active promotional banners', async () => {
    render(
      <LandingTestWrapper>
        <Landing />
      </LandingTestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('Summer Reading Sale')).toBeInTheDocument();
      expect(screen.getByText('50% off selected books')).toBeInTheDocument();
      expect(screen.getByText('Shop Now')).toBeInTheDocument();
    });
  });

  test('banner CTA links work correctly', async () => {
    render(
      <LandingTestWrapper>
        <Landing />
      </LandingTestWrapper>
    );

    await waitFor(() => {
      const ctaLink = screen.getByText('Shop Now').closest('a');
      expect(ctaLink).toHaveAttribute('href', '/shop/summer-sale');
    });
  });

  test('banners display in priority order', async () => {
    const multipleBanners = [
      { ...mockCustomizationData.banners[0], priority: 2, title: 'Second Banner' },
      { ...mockCustomizationData.banners[0], priority: 1, title: 'First Banner' }
    ];

    jest.mocked(BannersAPI.getActiveBanners).mockResolvedValue(multipleBanners);

    render(
      <LandingTestWrapper>
        <Landing />
      </LandingTestWrapper>
    );

    await waitFor(() => {
      const banners = screen.getAllByTestId(/banner-/);
      expect(banners[0]).toHaveTextContent('First Banner');
      expect(banners[1]).toHaveTextContent('Second Banner');
    });
  });

  test('hides banner section when no active banners', async () => {
    jest.mocked(BannersAPI.getActiveBanners).mockResolvedValue([]);

    render(
      <LandingTestWrapper>
        <Landing />
      </LandingTestWrapper>
    );

    await waitFor(() => {
      expect(screen.queryByTestId('banner-section')).not.toBeInTheDocument();
    });
  });
});
```

## 🟡 **HIGH PRIORITY TEST 4: Community Showcase Rendering**

### **Test 4.1: Community Features Display**
```typescript
describe('Community Showcase Rendering', () => {
  beforeEach(() => {
    jest.mock('@/lib/api/store/communityShowcase', () => ({
      CommunityShowcaseAPI: {
        getCommunityShowcaseData: jest.fn(() => 
          Promise.resolve(mockCustomizationData.community)
        )
      }
    }));
  });

  test('displays member spotlights', async () => {
    render(
      <LandingTestWrapper>
        <Landing />
      </LandingTestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('Sarah Johnson')).toBeInTheDocument();
      expect(screen.getByText('Active community member and book lover')).toBeInTheDocument();
    });
  });

  test('displays customer testimonials', async () => {
    render(
      <LandingTestWrapper>
        <Landing />
      </LandingTestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('Amazing bookstore with great community!')).toBeInTheDocument();
      expect(screen.getByText('— John Doe')).toBeInTheDocument();
    });
  });

  test('community section responsive layout', async () => {
    render(
      <LandingTestWrapper>
        <Landing />
      </LandingTestWrapper>
    );

    // Test mobile layout
    Object.defineProperty(window, 'innerWidth', { value: 375 });
    window.dispatchEvent(new Event('resize'));

    await waitFor(() => {
      const communityGrid = screen.getByTestId('community-grid');
      expect(communityGrid).toHaveClass('grid-cols-1'); // Single column on mobile
    });

    // Test desktop layout
    Object.defineProperty(window, 'innerWidth', { value: 1920 });
    window.dispatchEvent(new Event('resize'));

    await waitFor(() => {
      const communityGrid = screen.getByTestId('community-grid');
      expect(communityGrid).toHaveClass('lg:grid-cols-2'); // Two columns on desktop
    });
  });
});
```

## 🟡 **HIGH PRIORITY TEST 5: Quote Section Rendering**

### **Test 5.1: Quote Display and Rotation**
```typescript
describe('Quote Section Rendering', () => {
  beforeEach(() => {
    jest.mock('@/lib/api/store/quotes', () => ({
      QuotesAPI: {
        getActiveQuotes: jest.fn(() => 
          Promise.resolve(mockCustomizationData.quotes)
        )
      }
    }));
  });

  test('displays active quotes', async () => {
    render(
      <LandingTestWrapper>
        <Landing />
      </LandingTestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('A room without books is like a body without a soul')).toBeInTheDocument();
      expect(screen.getByText('— Cicero')).toBeInTheDocument();
    });
  });

  test('quote rotation functionality', async () => {
    const multipleQuotes = [
      mockCustomizationData.quotes[0],
      {
        id: '2',
        quote_text: 'The more that you read, the more things you will know',
        author: 'Dr. Seuss',
        is_active: true
      }
    ];

    jest.mocked(QuotesAPI.getActiveQuotes).mockResolvedValue(multipleQuotes);

    render(
      <LandingTestWrapper>
        <Landing />
      </LandingTestWrapper>
    );

    // Initial quote should be displayed
    await waitFor(() => {
      expect(screen.getByText('A room without books is like a body without a soul')).toBeInTheDocument();
    });

    // Wait for rotation (if implemented)
    // This would test automatic quote rotation functionality
    await waitFor(() => {
      // Quote should rotate after specified interval
      expect(screen.getByText('The more that you read, the more things you will know')).toBeInTheDocument();
    }, { timeout: 10000 });
  });
});
```

## 🟡 **HIGH PRIORITY TEST 6: Complete Landing Page Integration**

### **Test 6.1: Full Landing Page Rendering**
```typescript
describe('Complete Landing Page Integration', () => {
  test('renders all sections with customizations', async () => {
    // Mock all APIs with test data
    jest.mocked(HeroCustomizationAPI.getHeroCustomizationWithDefaults)
      .mockResolvedValue(mockCustomizationData.hero);
    jest.mocked(CarouselAPI.getActiveCarouselItems)
      .mockResolvedValue(mockCustomizationData.carousel);
    jest.mocked(BannersAPI.getActiveBanners)
      .mockResolvedValue(mockCustomizationData.banners);
    jest.mocked(CommunityShowcaseAPI.getCommunityShowcaseData)
      .mockResolvedValue(mockCustomizationData.community);
    jest.mocked(QuotesAPI.getActiveQuotes)
      .mockResolvedValue(mockCustomizationData.quotes);

    render(
      <LandingTestWrapper>
        <Landing />
      </LandingTestWrapper>
    );

    // Verify all sections are present
    await waitFor(() => {
      expect(screen.getByTestId('hero-section')).toBeInTheDocument();
      expect(screen.getByTestId('carousel-section')).toBeInTheDocument();
      expect(screen.getByTestId('banner-section')).toBeInTheDocument();
      expect(screen.getByTestId('community-section')).toBeInTheDocument();
      expect(screen.getByTestId('quote-section')).toBeInTheDocument();
    });

    // Verify content from all sections
    expect(screen.getByText('Welcome to our amazing bookstore community')).toBeInTheDocument();
    expect(screen.getByText('The Great Gatsby')).toBeInTheDocument();
    expect(screen.getByText('Summer Reading Sale')).toBeInTheDocument();
    expect(screen.getByText('Sarah Johnson')).toBeInTheDocument();
    expect(screen.getByText('A room without books is like a body without a soul')).toBeInTheDocument();
  });

  test('handles mixed customization states correctly', async () => {
    // Some sections have data, others don't
    jest.mocked(HeroCustomizationAPI.getHeroCustomizationWithDefaults)
      .mockResolvedValue(mockCustomizationData.hero);
    jest.mocked(CarouselAPI.getActiveCarouselItems)
      .mockResolvedValue([]); // No carousel items
    jest.mocked(BannersAPI.getActiveBanners)
      .mockResolvedValue(mockCustomizationData.banners);
    jest.mocked(CommunityShowcaseAPI.getCommunityShowcaseData)
      .mockResolvedValue({ spotlights: [], testimonials: [] }); // No community data
    jest.mocked(QuotesAPI.getActiveQuotes)
      .mockResolvedValue(mockCustomizationData.quotes);

    render(
      <LandingTestWrapper>
        <Landing />
      </LandingTestWrapper>
    );

    await waitFor(() => {
      // Should show sections with data
      expect(screen.getByTestId('hero-section')).toBeInTheDocument();
      expect(screen.getByTestId('banner-section')).toBeInTheDocument();
      expect(screen.getByTestId('quote-section')).toBeInTheDocument();
      
      // Should hide sections without data
      expect(screen.queryByTestId('carousel-section')).not.toBeInTheDocument();
      expect(screen.queryByTestId('community-section')).not.toBeInTheDocument();
    });
  });

  test('landing page performance with all sections', async () => {
    const startTime = performance.now();

    render(
      <LandingTestWrapper>
        <Landing />
      </LandingTestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByTestId('hero-section')).toBeInTheDocument();
    });

    const loadTime = performance.now() - startTime;
    expect(loadTime).toBeLessThan(3000); // 3 second budget
  });
});
```

## ✅ **SUCCESS CRITERIA**

### **Landing Page Rendering Must Pass**
- ✅ **Hero Section**: Custom quotes, chat buttons, typography display correctly
- ✅ **Carousel Section**: Books display with proper images and responsive layout
- ✅ **Banner Section**: Promotional banners show with correct CTAs and priority
- ✅ **Community Section**: Spotlights and testimonials render properly
- ✅ **Quote Section**: Quotes display with rotation functionality
- ✅ **Section Hiding**: Sections hide when no customizations exist

### **Responsive Design Requirements**
- ✅ **Mobile Layout**: All sections adapt to mobile viewport (375px)
- ✅ **Tablet Layout**: Proper layout on tablet viewport (768px)
- ✅ **Desktop Layout**: Optimal layout on desktop viewport (1920px)
- ✅ **Grid Responsiveness**: Carousel and community grids adapt correctly

### **Integration Standards**
- ✅ **Data Consistency**: All customizations from Store Management appear
- ✅ **Performance**: Landing page loads within 3 seconds with all sections
- ✅ **Error Handling**: Graceful fallbacks when API data unavailable
- ✅ **Visual Hierarchy**: Sections display in correct order and styling

**These landing page rendering tests ensure all Store Management customizations display correctly and provide visitors with the intended user experience.**
