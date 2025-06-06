# End-to-End Integration Tests - Phase 8 Integration Testing

**Priority**: 🟡 **HIGH**  
**Focus**: Complete User Workflows, Cross-Component Integration  
**Tools**: Cypress/Playwright for full browser automation  

## 🎯 **TEST OBJECTIVES**

### **Primary Goals**
1. **Complete Store Customization Workflow**: End-to-end store setup process
2. **Cross-Component Integration**: Verify components work together seamlessly
3. **Navigation Flow**: Test routing and state persistence across sections
4. **Data Consistency**: Ensure changes persist across the entire system

## 🔧 **TEST SETUP**

### **Cypress Configuration**
```typescript
// cypress.config.ts
import { defineConfig } from 'cypress';

export default defineConfig({
  e2e: {
    baseUrl: 'http://localhost:5173',
    supportFile: 'cypress/support/e2e.ts',
    specPattern: 'cypress/e2e/**/*.cy.{js,jsx,ts,tsx}',
    viewportWidth: 1280,
    viewportHeight: 720,
    video: true,
    screenshotOnRunFailure: true
  }
});

// cypress/support/commands.ts
declare global {
  namespace Cypress {
    interface Chainable {
      loginAsStoreOwner(): Chainable<void>;
      navigateToStoreManagement(): Chainable<void>;
      waitForAnalyticsLoad(): Chainable<void>;
    }
  }
}

Cypress.Commands.add('loginAsStoreOwner', () => {
  cy.visit('/login');
  cy.get('[data-testid="email-input"]').type('storeowner@test.com');
  cy.get('[data-testid="password-input"]').type('testpassword');
  cy.get('[data-testid="login-button"]').click();
  cy.url().should('include', '/admin');
});

Cypress.Commands.add('navigateToStoreManagement', () => {
  cy.visit('/admin/store-management');
  cy.get('[data-testid="store-management-dashboard"]').should('be.visible');
});
```

## 🟡 **HIGH PRIORITY TEST 1: Complete Store Customization Workflow**

### **Test 1.1: Full Store Setup Process**
```typescript
describe('Complete Store Customization Workflow', () => {
  beforeEach(() => {
    cy.loginAsStoreOwner();
    cy.navigateToStoreManagement();
  });

  it('completes full store customization from start to finish', () => {
    // Step 1: Customize Hero Section
    cy.get('[data-testid="hero-customization-link"]').click();
    cy.url().should('include', '/hero');
    
    cy.get('[data-testid="hero-quote-input"]')
      .clear()
      .type('Welcome to our amazing bookstore community');
    
    cy.get('[data-testid="hero-author-input"]')
      .clear()
      .type('Store Owner');
    
    cy.get('[data-testid="chat-button-text-input"]')
      .clear()
      .type('Chat with us now');
    
    cy.get('[data-testid="chat-button-position-select"]').select('center');
    cy.get('[data-testid="chat-button-color-select"]').select('sage');
    
    cy.get('[data-testid="save-hero-button"]').click();
    cy.get('[data-testid="success-message"]').should('contain', 'Hero customization saved');

    // Step 2: Add Books to Carousel
    cy.get('[data-testid="back-to-dashboard"]').click();
    cy.get('[data-testid="carousel-management-link"]').click();
    cy.url().should('include', '/carousel');
    
    cy.get('[data-testid="add-book-button"]').click();
    cy.get('[data-testid="book-search-input"]').type('The Great Gatsby');
    cy.get('[data-testid="search-books-button"]').click();
    
    cy.get('[data-testid="book-result-0"]').click();
    cy.get('[data-testid="add-to-carousel-button"]').click();
    cy.get('[data-testid="success-message"]').should('contain', 'Book added to carousel');

    // Step 3: Create Promotional Banner
    cy.get('[data-testid="back-to-dashboard"]').click();
    cy.get('[data-testid="banner-management-link"]').click();
    cy.url().should('include', '/banners');
    
    cy.get('[data-testid="create-banner-button"]').click();
    cy.get('[data-testid="banner-title-input"]').type('Summer Reading Sale');
    cy.get('[data-testid="banner-description-input"]').type('50% off selected books');
    cy.get('[data-testid="banner-cta-text-input"]').type('Shop Now');
    cy.get('[data-testid="banner-cta-url-input"]').type('/shop/summer-sale');
    
    cy.get('[data-testid="save-banner-button"]').click();
    cy.get('[data-testid="success-message"]').should('contain', 'Banner created successfully');

    // Step 4: Add Community Spotlight
    cy.get('[data-testid="back-to-dashboard"]').click();
    cy.get('[data-testid="community-management-link"]').click();
    cy.url().should('include', '/community');
    
    cy.get('[data-testid="add-spotlight-button"]').click();
    cy.get('[data-testid="member-name-input"]').type('Sarah Johnson');
    cy.get('[data-testid="spotlight-text-input"]').type('Active community member and book lover');
    
    cy.get('[data-testid="save-spotlight-button"]').click();
    cy.get('[data-testid="success-message"]').should('contain', 'Member spotlight added');

    // Step 5: Add Quote
    cy.get('[data-testid="back-to-dashboard"]').click();
    cy.get('[data-testid="quote-management-link"]').click();
    cy.url().should('include', '/quotes');
    
    cy.get('[data-testid="add-quote-button"]').click();
    cy.get('[data-testid="quote-text-input"]').type('A room without books is like a body without a soul');
    cy.get('[data-testid="quote-author-input"]').type('Cicero');
    
    cy.get('[data-testid="save-quote-button"]').click();
    cy.get('[data-testid="success-message"]').should('contain', 'Quote added successfully');

    // Step 6: Verify Dashboard Shows All Changes
    cy.get('[data-testid="back-to-dashboard"]').click();
    cy.get('[data-testid="carousel-stats"]').should('contain', '1/6'); // 1 book added
    cy.get('[data-testid="banner-stats"]').should('contain', '1'); // 1 banner active
    cy.get('[data-testid="quote-stats"]').should('contain', '1'); // 1 quote active
    cy.get('[data-testid="community-stats"]').should('contain', '1'); // 1 spotlight

    // Step 7: View Landing Page with All Customizations
    cy.get('[data-testid="view-landing-page-link"]').click();
    cy.url().should('include', '/landing');
    
    // Verify all customizations appear on landing page
    cy.get('[data-testid="hero-section"]').should('contain', 'Welcome to our amazing bookstore community');
    cy.get('[data-testid="chat-button"]').should('contain', 'Chat with us now');
    cy.get('[data-testid="carousel-section"]').should('contain', 'The Great Gatsby');
    cy.get('[data-testid="banner-section"]').should('contain', 'Summer Reading Sale');
    cy.get('[data-testid="community-section"]').should('contain', 'Sarah Johnson');
    cy.get('[data-testid="quote-section"]').should('contain', 'A room without books is like a body without a soul');
  });
});
```

### **Test 1.2: Data Persistence Across Sessions**
```typescript
it('maintains customizations across browser sessions', () => {
  // Set up customizations
  cy.loginAsStoreOwner();
  cy.navigateToStoreManagement();
  
  cy.get('[data-testid="hero-customization-link"]').click();
  cy.get('[data-testid="hero-quote-input"]').clear().type('Persistent Quote');
  cy.get('[data-testid="save-hero-button"]').click();
  
  // Simulate session end
  cy.clearCookies();
  cy.clearLocalStorage();
  
  // Login again and verify data persists
  cy.loginAsStoreOwner();
  cy.navigateToStoreManagement();
  cy.get('[data-testid="hero-customization-link"]').click();
  
  cy.get('[data-testid="hero-quote-input"]').should('have.value', 'Persistent Quote');
});
```

## 🟡 **HIGH PRIORITY TEST 2: Enhanced Analytics Integration**

### **Test 2.1: Analytics Data Flow**
```typescript
describe('Enhanced Analytics Integration', () => {
  it('tracks user interactions and displays in analytics dashboard', () => {
    // Generate some analytics data by interacting with landing page
    cy.visit('/landing');
    
    // Interact with various sections
    cy.get('[data-testid="chat-button"]').click();
    cy.get('[data-testid="carousel-book-0"]').click();
    cy.get('[data-testid="banner-0"]').click();
    
    // Navigate to analytics dashboard
    cy.loginAsStoreOwner();
    cy.navigateToStoreManagement();
    cy.get('[data-testid="analytics-link"]').click();
    
    cy.waitForAnalyticsLoad();
    
    // Verify analytics data appears
    cy.get('[data-testid="page-views-metric"]').should('contain.text', '1');
    cy.get('[data-testid="chat-clicks-metric"]').should('contain.text', '1');
    cy.get('[data-testid="carousel-interactions-metric"]').should('contain.text', '1');
    
    // Verify section-specific analytics
    cy.get('[data-testid="hero-analytics-card"]').should('be.visible');
    cy.get('[data-testid="carousel-analytics-card"]').should('be.visible');
    cy.get('[data-testid="banner-analytics-card"]').should('be.visible');
    cy.get('[data-testid="community-analytics-card"]').should('be.visible');
  });

  it('displays enhanced metrics correctly', () => {
    cy.loginAsStoreOwner();
    cy.navigateToStoreManagement();
    cy.get('[data-testid="analytics-link"]').click();
    
    // Verify all 6 enhanced metrics are displayed
    cy.get('[data-testid="page-views-card"]').should('be.visible');
    cy.get('[data-testid="unique-visitors-card"]').should('be.visible');
    cy.get('[data-testid="return-rate-card"]').should('be.visible');
    cy.get('[data-testid="mobile-users-card"]').should('be.visible');
    cy.get('[data-testid="chat-clicks-card"]').should('be.visible');
    cy.get('[data-testid="avg-time-card"]').should('be.visible');
    
    // Test refresh functionality
    cy.get('[data-testid="refresh-analytics-button"]').click();
    cy.get('[data-testid="loading-spinner"]').should('be.visible');
    cy.get('[data-testid="loading-spinner"]').should('not.exist');
  });
});
```

## 🟡 **HIGH PRIORITY TEST 3: Navigation and State Management**

### **Test 3.1: Cross-Section Navigation**
```typescript
describe('Navigation and State Management', () => {
  it('maintains form state when navigating between sections', () => {
    cy.loginAsStoreOwner();
    cy.navigateToStoreManagement();
    
    // Start filling hero form
    cy.get('[data-testid="hero-customization-link"]').click();
    cy.get('[data-testid="hero-quote-input"]').type('Partial quote');
    
    // Navigate away without saving
    cy.get('[data-testid="carousel-management-link"]').click();
    cy.url().should('include', '/carousel');
    
    // Navigate back to hero
    cy.get('[data-testid="hero-customization-link"]').click();
    
    // Form should maintain state (if implemented with proper state management)
    // This test verifies if unsaved changes are preserved
    cy.get('[data-testid="hero-quote-input"]').should('have.value', 'Partial quote');
  });

  it('handles browser back/forward navigation correctly', () => {
    cy.loginAsStoreOwner();
    cy.navigateToStoreManagement();
    
    // Navigate through sections
    cy.get('[data-testid="hero-customization-link"]').click();
    cy.url().should('include', '/hero');
    
    cy.get('[data-testid="carousel-management-link"]').click();
    cy.url().should('include', '/carousel');
    
    cy.get('[data-testid="analytics-link"]').click();
    cy.url().should('include', '/analytics');
    
    // Use browser back button
    cy.go('back');
    cy.url().should('include', '/carousel');
    
    cy.go('back');
    cy.url().should('include', '/hero');
    
    // Use browser forward button
    cy.go('forward');
    cy.url().should('include', '/carousel');
  });
});
```

### **Test 3.2: Error Handling Across Components**
```typescript
it('handles errors gracefully across the entire system', () => {
  // Simulate network errors
  cy.intercept('GET', '/api/store/carousel*', { forceNetworkError: true }).as('carouselError');
  cy.intercept('GET', '/api/store/analytics*', { forceNetworkError: true }).as('analyticsError');
  
  cy.loginAsStoreOwner();
  cy.navigateToStoreManagement();
  
  // Dashboard should handle carousel error gracefully
  cy.wait('@carouselError');
  cy.get('[data-testid="carousel-error-message"]').should('be.visible');
  cy.get('[data-testid="carousel-stats"]').should('contain', '0'); // Fallback value
  
  // Analytics should handle error gracefully
  cy.get('[data-testid="analytics-link"]').click();
  cy.wait('@analyticsError');
  cy.get('[data-testid="analytics-error-message"]').should('be.visible');
  cy.get('[data-testid="page-views-metric"]').should('contain', '0'); // Fallback value
});
```

## 🟡 **HIGH PRIORITY TEST 4: Responsive Design Integration**

### **Test 4.1: Mobile Workflow**
```typescript
describe('Responsive Design Integration', () => {
  it('completes store customization workflow on mobile', () => {
    cy.viewport('iphone-x');
    
    cy.loginAsStoreOwner();
    cy.navigateToStoreManagement();
    
    // Verify mobile dashboard layout
    cy.get('[data-testid="mobile-menu-button"]').should('be.visible');
    cy.get('[data-testid="stats-grid"]').should('have.class', 'grid-cols-1');
    
    // Test mobile hero customization
    cy.get('[data-testid="hero-customization-link"]').click();
    cy.get('[data-testid="hero-form"]').should('be.visible');
    
    cy.get('[data-testid="hero-quote-input"]').type('Mobile quote test');
    cy.get('[data-testid="save-hero-button"]').click();
    cy.get('[data-testid="success-message"]').should('be.visible');
    
    // Test mobile analytics dashboard
    cy.get('[data-testid="analytics-link"]').click();
    cy.get('[data-testid="metrics-grid"]').should('have.class', 'grid-cols-1');
    cy.get('[data-testid="section-analytics-grid"]').should('have.class', 'grid-cols-1');
  });

  it('adapts layout correctly across different screen sizes', () => {
    cy.loginAsStoreOwner();
    cy.navigateToStoreManagement();
    cy.get('[data-testid="analytics-link"]').click();
    
    // Test tablet layout
    cy.viewport('ipad-2');
    cy.get('[data-testid="metrics-grid"]').should('have.class', 'lg:grid-cols-3');
    
    // Test desktop layout
    cy.viewport(1920, 1080);
    cy.get('[data-testid="metrics-grid"]').should('have.class', 'xl:grid-cols-6');
    cy.get('[data-testid="section-analytics-grid"]').should('have.class', 'lg:grid-cols-2');
  });
});
```

## 🟡 **HIGH PRIORITY TEST 5: Performance Integration**

### **Test 5.1: Page Load Performance**
```typescript
describe('Performance Integration', () => {
  it('loads all store management pages within performance budget', () => {
    cy.loginAsStoreOwner();
    
    // Test dashboard load time
    const dashboardStart = performance.now();
    cy.navigateToStoreManagement();
    cy.get('[data-testid="store-management-dashboard"]').should('be.visible');
    
    cy.window().then((win) => {
      const loadTime = win.performance.now() - dashboardStart;
      expect(loadTime).to.be.lessThan(3000); // 3 second budget
    });
    
    // Test analytics dashboard load time
    const analyticsStart = performance.now();
    cy.get('[data-testid="analytics-link"]').click();
    cy.waitForAnalyticsLoad();
    
    cy.window().then((win) => {
      const loadTime = win.performance.now() - analyticsStart;
      expect(loadTime).to.be.lessThan(3000); // 3 second budget
    });
  });

  it('handles large datasets efficiently', () => {
    // Simulate large analytics dataset
    cy.intercept('GET', '/api/store/analytics*', { 
      fixture: 'large-analytics-dataset.json' 
    }).as('largeAnalytics');
    
    cy.loginAsStoreOwner();
    cy.navigateToStoreManagement();
    cy.get('[data-testid="analytics-link"]').click();
    
    cy.wait('@largeAnalytics');
    cy.get('[data-testid="analytics-dashboard"]').should('be.visible');
    
    // Verify UI remains responsive
    cy.get('[data-testid="refresh-analytics-button"]').click();
    cy.get('[data-testid="loading-spinner"]').should('be.visible');
    cy.get('[data-testid="loading-spinner"]').should('not.exist');
  });
});
```

## ✅ **SUCCESS CRITERIA**

### **End-to-End Integration Must Pass**
- ✅ **Complete Workflow**: Full store customization from start to finish works
- ✅ **Data Persistence**: All changes persist across sessions and page reloads
- ✅ **Cross-Component Integration**: Components work together seamlessly
- ✅ **Navigation Flow**: Routing and state management work correctly
- ✅ **Analytics Integration**: Enhanced analytics track and display correctly

### **Performance Requirements**
- ✅ **Page Load Times**: All pages load within 3 seconds
- ✅ **Responsive Design**: Works correctly on mobile, tablet, desktop
- ✅ **Error Handling**: Graceful degradation for network/API errors
- ✅ **State Management**: Form state and navigation state persist correctly

### **User Experience Standards**
- ✅ **Workflow Completion**: Store Owners can complete full setup process
- ✅ **Visual Feedback**: Success/error messages display appropriately
- ✅ **Landing Page Integration**: All customizations appear on landing page
- ✅ **Analytics Accuracy**: User interactions tracked and displayed correctly

**These end-to-end integration tests ensure the complete Store Management system works as a cohesive unit and provides Store Owners with a reliable, performant platform for customizing their landing pages.**
