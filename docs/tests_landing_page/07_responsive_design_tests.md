# Responsive Design Tests - Phase 8 Integration Testing

**Priority**: 🟢 **MEDIUM**  
**Focus**: Cross-Device Compatibility, Layout Adaptation, Mobile-First Design  
**Coverage**: Mobile, Tablet, Desktop layouts for all Store Management features  

## 🎯 **TEST OBJECTIVES**

### **Primary Goals**
1. **Mobile-First Design**: Verify mobile layouts work correctly (375px+)
2. **Tablet Optimization**: Test intermediate screen sizes (768px-1024px)
3. **Desktop Enhancement**: Ensure optimal desktop experience (1280px+)
4. **Touch Interactions**: Test touch-friendly interfaces on mobile devices

## 🔧 **TEST SETUP**

### **Responsive Testing Utilities**
```typescript
import { render, screen, fireEvent } from '@testing-library/react';

// Viewport testing utilities
const setViewport = (width: number, height: number = 800) => {
  Object.defineProperty(window, 'innerWidth', {
    writable: true,
    configurable: true,
    value: width
  });
  Object.defineProperty(window, 'innerHeight', {
    writable: true,
    configurable: true,
    value: height
  });
  window.dispatchEvent(new Event('resize'));
};

// Common viewport sizes
const VIEWPORTS = {
  mobile: { width: 375, height: 667 },
  mobileLarge: { width: 414, height: 896 },
  tablet: { width: 768, height: 1024 },
  tabletLarge: { width: 1024, height: 768 },
  desktop: { width: 1280, height: 720 },
  desktopLarge: { width: 1920, height: 1080 }
};

// Test wrapper for responsive components
const ResponsiveTestWrapper = ({ children }: { children: React.ReactNode }) => {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <div className="min-h-screen">
          {children}
        </div>
      </BrowserRouter>
    </QueryClientProvider>
  );
};
```

## 🟢 **MEDIUM PRIORITY TEST 1: Enhanced Analytics Dashboard Responsive Design**

### **Test 1.1: Analytics Metrics Grid Responsiveness**
```typescript
import { LandingPageAnalytics } from '@/pages/admin/store/LandingPageAnalytics';

describe('Analytics Dashboard Responsive Design', () => {
  test('metrics grid adapts correctly across screen sizes', async () => {
    render(
      <ResponsiveTestWrapper>
        <LandingPageAnalytics />
      </ResponsiveTestWrapper>
    );

    // Test mobile layout (1 column)
    setViewport(VIEWPORTS.mobile.width);
    await waitFor(() => {
      const metricsGrid = screen.getByTestId('metrics-grid');
      expect(metricsGrid).toHaveClass('grid-cols-1');
    });

    // Test tablet layout (2-3 columns)
    setViewport(VIEWPORTS.tablet.width);
    await waitFor(() => {
      const metricsGrid = screen.getByTestId('metrics-grid');
      expect(metricsGrid).toHaveClass('md:grid-cols-2', 'lg:grid-cols-3');
    });

    // Test desktop layout (6 columns)
    setViewport(VIEWPORTS.desktop.width);
    await waitFor(() => {
      const metricsGrid = screen.getByTestId('metrics-grid');
      expect(metricsGrid).toHaveClass('xl:grid-cols-6');
    });
  });

  test('section-specific analytics cards responsive layout', async () => {
    render(
      <ResponsiveTestWrapper>
        <LandingPageAnalytics />
      </ResponsiveTestWrapper>
    );

    // Test mobile: single column
    setViewport(VIEWPORTS.mobile.width);
    await waitFor(() => {
      const sectionGrid = screen.getByTestId('section-analytics-grid');
      expect(sectionGrid).toHaveClass('grid-cols-1');
    });

    // Test desktop: two columns
    setViewport(VIEWPORTS.desktop.width);
    await waitFor(() => {
      const sectionGrid = screen.getByTestId('section-analytics-grid');
      expect(sectionGrid).toHaveClass('lg:grid-cols-2');
    });
  });

  test('analytics cards content readability on mobile', async () => {
    setViewport(VIEWPORTS.mobile.width);
    
    render(
      <ResponsiveTestWrapper>
        <LandingPageAnalytics />
      </ResponsiveTestWrapper>
    );

    await waitFor(() => {
      // Verify metric cards have proper mobile spacing
      const metricCards = screen.getAllByTestId(/metric-card/);
      metricCards.forEach(card => {
        expect(card).toHaveClass('p-6'); // Adequate padding for touch
      });

      // Verify text sizes are readable on mobile
      const metricValues = screen.getAllByTestId(/metric-value/);
      metricValues.forEach(value => {
        expect(value).toHaveClass('text-2xl'); // Large enough for mobile
      });
    });
  });
});
```

### **Test 1.2: Analytics Dashboard Touch Interactions**
```typescript
test('analytics dashboard touch-friendly on mobile devices', async () => {
  setViewport(VIEWPORTS.mobile.width);
  
  render(
    <ResponsiveTestWrapper>
      <LandingPageAnalytics />
    </ResponsiveTestWrapper>
  );

  await waitFor(() => {
    // Test refresh button touch target size
    const refreshButton = screen.getByTestId('refresh-analytics-button');
    const buttonRect = refreshButton.getBoundingClientRect();
    expect(buttonRect.height).toBeGreaterThanOrEqual(44); // Minimum touch target
    expect(buttonRect.width).toBeGreaterThanOrEqual(44);

    // Test navigation links are touch-friendly
    const viewLandingLink = screen.getByTestId('view-landing-page-link');
    const linkRect = viewLandingLink.getBoundingClientRect();
    expect(linkRect.height).toBeGreaterThanOrEqual(44);
  });
});
```

## 🟢 **MEDIUM PRIORITY TEST 2: Store Management Dashboard Responsive Design**

### **Test 2.1: Dashboard Statistics Grid**
```typescript
import { StoreManagementDashboard } from '@/pages/admin/store/StoreManagementDashboard';

describe('Store Management Dashboard Responsive Design', () => {
  test('statistics cards grid responsive behavior', async () => {
    render(
      <ResponsiveTestWrapper>
        <StoreManagementDashboard />
      </ResponsiveTestWrapper>
    );

    // Test mobile: single column
    setViewport(VIEWPORTS.mobile.width);
    await waitFor(() => {
      const statsGrid = screen.getByTestId('stats-grid');
      expect(statsGrid).toHaveClass('grid-cols-1');
    });

    // Test tablet: 2 columns
    setViewport(VIEWPORTS.tablet.width);
    await waitFor(() => {
      const statsGrid = screen.getByTestId('stats-grid');
      expect(statsGrid).toHaveClass('md:grid-cols-2');
    });

    // Test desktop: 5 columns (including analytics)
    setViewport(VIEWPORTS.desktop.width);
    await waitFor(() => {
      const statsGrid = screen.getByTestId('stats-grid');
      expect(statsGrid).toHaveClass('lg:grid-cols-5');
    });
  });

  test('quick actions responsive layout', async () => {
    render(
      <ResponsiveTestWrapper>
        <StoreManagementDashboard />
      </ResponsiveTestWrapper>
    );

    // Test mobile: stacked layout
    setViewport(VIEWPORTS.mobile.width);
    await waitFor(() => {
      const quickActions = screen.getByTestId('quick-actions-grid');
      expect(quickActions).toHaveClass('grid-cols-1');
    });

    // Test desktop: multi-column layout
    setViewport(VIEWPORTS.desktop.width);
    await waitFor(() => {
      const quickActions = screen.getByTestId('quick-actions-grid');
      expect(quickActions).toHaveClass('lg:grid-cols-3');
    });
  });
});
```

## 🟢 **MEDIUM PRIORITY TEST 3: Hero Customization Responsive Design**

### **Test 3.1: Hero Form Layout Adaptation**
```typescript
import { HeroCustomization } from '@/pages/admin/store/HeroCustomization';

describe('Hero Customization Responsive Design', () => {
  test('hero form adapts to mobile layout', async () => {
    setViewport(VIEWPORTS.mobile.width);
    
    render(
      <ResponsiveTestWrapper>
        <HeroCustomization />
      </ResponsiveTestWrapper>
    );

    await waitFor(() => {
      // Form should stack vertically on mobile
      const formContainer = screen.getByTestId('hero-form-container');
      expect(formContainer).toHaveClass('space-y-6'); // Vertical spacing

      // Input fields should be full width
      const quoteInput = screen.getByTestId('hero-quote-input');
      expect(quoteInput).toHaveClass('w-full');

      // Buttons should be full width on mobile
      const saveButton = screen.getByTestId('save-hero-button');
      expect(saveButton).toHaveClass('w-full');
    });
  });

  test('hero preview responsive behavior', async () => {
    render(
      <ResponsiveTestWrapper>
        <HeroCustomization />
      </ResponsiveTestWrapper>
    );

    // Test mobile: preview below form
    setViewport(VIEWPORTS.mobile.width);
    await waitFor(() => {
      const previewContainer = screen.getByTestId('hero-preview-container');
      expect(previewContainer).toHaveClass('mt-8'); // Margin top for mobile stacking
    });

    // Test desktop: preview beside form
    setViewport(VIEWPORTS.desktop.width);
    await waitFor(() => {
      const formGrid = screen.getByTestId('hero-form-grid');
      expect(formGrid).toHaveClass('lg:grid-cols-2'); // Side-by-side layout
    });
  });
});
```

## 🟢 **MEDIUM PRIORITY TEST 4: Landing Page Responsive Design**

### **Test 4.1: Landing Page Section Responsiveness**
```typescript
import { Landing } from '@/pages/Landing';

describe('Landing Page Responsive Design', () => {
  test('hero section responsive layout', async () => {
    render(
      <ResponsiveTestWrapper>
        <Landing />
      </ResponsiveTestWrapper>
    );

    // Test mobile hero layout
    setViewport(VIEWPORTS.mobile.width);
    await waitFor(() => {
      const heroSection = screen.getByTestId('hero-section');
      expect(heroSection).toHaveClass('px-4', 'py-8'); // Mobile padding

      const heroContent = screen.getByTestId('hero-content');
      expect(heroContent).toHaveClass('text-center'); // Centered on mobile
    });

    // Test desktop hero layout
    setViewport(VIEWPORTS.desktop.width);
    await waitFor(() => {
      const heroSection = screen.getByTestId('hero-section');
      expect(heroSection).toHaveClass('px-8', 'py-16'); // Desktop padding
    });
  });

  test('carousel responsive grid', async () => {
    render(
      <ResponsiveTestWrapper>
        <Landing />
      </ResponsiveTestWrapper>
    );

    // Test mobile: 2-3 books visible
    setViewport(VIEWPORTS.mobile.width);
    await waitFor(() => {
      const carouselGrid = screen.getByTestId('carousel-grid');
      expect(carouselGrid).toHaveClass('grid-cols-2', 'sm:grid-cols-3');
    });

    // Test desktop: 6 books visible
    setViewport(VIEWPORTS.desktop.width);
    await waitFor(() => {
      const carouselGrid = screen.getByTestId('carousel-grid');
      expect(carouselGrid).toHaveClass('lg:grid-cols-6');
    });
  });

  test('banner section responsive design', async () => {
    render(
      <ResponsiveTestWrapper>
        <Landing />
      </ResponsiveTestWrapper>
    );

    // Test mobile banner layout
    setViewport(VIEWPORTS.mobile.width);
    await waitFor(() => {
      const bannerContainer = screen.getByTestId('banner-container');
      expect(bannerContainer).toHaveClass('px-4'); // Mobile padding

      // Banner content should stack on mobile
      const bannerContent = screen.getByTestId('banner-content');
      expect(bannerContent).toHaveClass('text-center'); // Centered on mobile
    });
  });

  test('community section responsive grid', async () => {
    render(
      <ResponsiveTestWrapper>
        <Landing />
      </ResponsiveTestWrapper>
    );

    // Test mobile: single column
    setViewport(VIEWPORTS.mobile.width);
    await waitFor(() => {
      const communityGrid = screen.getByTestId('community-grid');
      expect(communityGrid).toHaveClass('grid-cols-1');
    });

    // Test desktop: two columns
    setViewport(VIEWPORTS.desktop.width);
    await waitFor(() => {
      const communityGrid = screen.getByTestId('community-grid');
      expect(communityGrid).toHaveClass('lg:grid-cols-2');
    });
  });
});
```

## 🟢 **MEDIUM PRIORITY TEST 5: Form Components Responsive Design**

### **Test 5.1: Modal Responsive Behavior**
```typescript
describe('Modal Components Responsive Design', () => {
  test('book entry modal adapts to mobile', async () => {
    setViewport(VIEWPORTS.mobile.width);
    
    render(
      <ResponsiveTestWrapper>
        <CarouselManagement />
      </ResponsiveTestWrapper>
    );

    // Open book entry modal
    const addBookButton = screen.getByTestId('add-book-button');
    fireEvent.click(addBookButton);

    await waitFor(() => {
      const modal = screen.getByTestId('book-entry-modal');
      expect(modal).toHaveClass('max-w-full', 'mx-4'); // Full width with margin on mobile

      // Modal content should be scrollable on mobile
      const modalContent = screen.getByTestId('modal-content');
      expect(modalContent).toHaveClass('max-h-screen', 'overflow-y-auto');
    });
  });

  test('form inputs touch-friendly on mobile', async () => {
    setViewport(VIEWPORTS.mobile.width);
    
    render(
      <ResponsiveTestWrapper>
        <HeroCustomization />
      </ResponsiveTestWrapper>
    );

    await waitFor(() => {
      // Input fields should have adequate height for touch
      const inputs = screen.getAllByRole('textbox');
      inputs.forEach(input => {
        const inputRect = input.getBoundingClientRect();
        expect(inputRect.height).toBeGreaterThanOrEqual(44); // Minimum touch target
      });

      // Select dropdowns should be touch-friendly
      const selects = screen.getAllByRole('combobox');
      selects.forEach(select => {
        const selectRect = select.getBoundingClientRect();
        expect(selectRect.height).toBeGreaterThanOrEqual(44);
      });
    });
  });
});
```

## 🟢 **MEDIUM PRIORITY TEST 6: Navigation Responsive Design**

### **Test 6.1: Mobile Navigation**
```typescript
describe('Navigation Responsive Design', () => {
  test('store management navigation adapts to mobile', async () => {
    setViewport(VIEWPORTS.mobile.width);
    
    render(
      <ResponsiveTestWrapper>
        <StoreManagementDashboard />
      </ResponsiveTestWrapper>
    );

    await waitFor(() => {
      // Mobile menu button should be visible
      const mobileMenuButton = screen.getByTestId('mobile-menu-button');
      expect(mobileMenuButton).toBeVisible();

      // Desktop navigation should be hidden
      const desktopNav = screen.getByTestId('desktop-navigation');
      expect(desktopNav).toHaveClass('hidden', 'lg:block');
    });
  });

  test('breadcrumb navigation responsive behavior', async () => {
    render(
      <ResponsiveTestWrapper>
        <HeroCustomization />
      </ResponsiveTestWrapper>
    );

    // Test mobile: simplified breadcrumbs
    setViewport(VIEWPORTS.mobile.width);
    await waitFor(() => {
      const breadcrumbs = screen.getByTestId('breadcrumbs');
      expect(breadcrumbs).toHaveClass('text-sm'); // Smaller text on mobile
    });

    // Test desktop: full breadcrumbs
    setViewport(VIEWPORTS.desktop.width);
    await waitFor(() => {
      const breadcrumbs = screen.getByTestId('breadcrumbs');
      expect(breadcrumbs).toHaveClass('text-base'); // Normal text on desktop
    });
  });
});
```

## 🟢 **MEDIUM PRIORITY TEST 7: Performance on Different Devices**

### **Test 7.1: Mobile Performance**
```typescript
describe('Responsive Performance', () => {
  test('mobile performance within budget', async () => {
    setViewport(VIEWPORTS.mobile.width);
    
    const startTime = performance.now();
    
    render(
      <ResponsiveTestWrapper>
        <LandingPageAnalytics />
      </ResponsiveTestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByTestId('analytics-dashboard')).toBeInTheDocument();
    });

    const loadTime = performance.now() - startTime;
    expect(loadTime).toBeLessThan(4000); // 4 second budget for mobile
  });

  test('image loading optimization on mobile', async () => {
    setViewport(VIEWPORTS.mobile.width);
    
    render(
      <ResponsiveTestWrapper>
        <Landing />
      </ResponsiveTestWrapper>
    );

    await waitFor(() => {
      // Images should have proper loading attributes
      const carouselImages = screen.getAllByTestId(/carousel-book-image/);
      carouselImages.forEach(img => {
        expect(img).toHaveAttribute('loading', 'lazy');
        expect(img).toHaveAttribute('decoding', 'async');
      });
    });
  });
});
```

## ✅ **SUCCESS CRITERIA**

### **Responsive Design Must Pass**
- ✅ **Mobile Layout**: All components work correctly on 375px+ screens
- ✅ **Tablet Layout**: Proper adaptation for 768px-1024px screens
- ✅ **Desktop Layout**: Optimal experience on 1280px+ screens
- ✅ **Touch Targets**: All interactive elements ≥44px for touch devices
- ✅ **Grid Responsiveness**: Analytics and content grids adapt correctly

### **Mobile-First Requirements**
- ✅ **Single Column**: Mobile layouts use single column where appropriate
- ✅ **Stacked Content**: Forms and content stack vertically on mobile
- ✅ **Touch-Friendly**: Buttons and inputs sized for touch interaction
- ✅ **Readable Text**: Font sizes appropriate for mobile screens

### **Cross-Device Standards**
- ✅ **Consistent Functionality**: All features work across device sizes
- ✅ **Performance**: Mobile performance within 4-second budget
- ✅ **Navigation**: Mobile navigation patterns implemented
- ✅ **Image Optimization**: Lazy loading and responsive images

**These responsive design tests ensure the Store Management system provides an excellent user experience across all device types and screen sizes.**
