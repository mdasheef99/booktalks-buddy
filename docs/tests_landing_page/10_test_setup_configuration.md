# Test Setup Configuration - Phase 8 Integration Testing

**Purpose**: Test Environment Setup, Dependencies, Mocks, Test Data  
**Scope**: Complete testing infrastructure for Store Management Landing Page  

## 🔧 **TEST ENVIRONMENT SETUP**

### **1. Testing Dependencies**
```json
{
  "devDependencies": {
    "@testing-library/react": "^13.4.0",
    "@testing-library/jest-dom": "^5.16.5",
    "@testing-library/user-event": "^14.4.3",
    "jest": "^29.5.0",
    "jest-environment-jsdom": "^29.5.0",
    "cypress": "^12.17.0",
    "@cypress/react": "^7.0.3",
    "msw": "^1.2.2",
    "vitest": "^0.32.0",
    "@vitest/ui": "^0.32.0",
    "jsdom": "^22.1.0"
  }
}
```

### **2. Jest Configuration**
```javascript
// jest.config.js
module.exports = {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/src/test/setup.ts'],
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy'
  },
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/test/**/*',
    '!src/main.tsx'
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    }
  },
  testMatch: [
    '<rootDir>/src/**/__tests__/**/*.{ts,tsx}',
    '<rootDir>/src/**/*.{test,spec}.{ts,tsx}'
  ]
};
```

### **3. Test Setup File**
```typescript
// src/test/setup.ts
import '@testing-library/jest-dom';
import { server } from './mocks/server';

// Mock environment variables
process.env.VITE_SUPABASE_URL = 'https://test.supabase.co';
process.env.VITE_SUPABASE_ANON_KEY = 'test-anon-key';

// Setup MSW
beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

// Mock IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
  constructor() {}
  observe() { return null; }
  disconnect() { return null; }
  unobserve() { return null; }
};

// Mock ResizeObserver
global.ResizeObserver = class ResizeObserver {
  constructor() {}
  observe() { return null; }
  disconnect() { return null; }
  unobserve() { return null; }
};

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});
```

## 🎭 **MOCK CONFIGURATIONS**

### **4. Supabase Client Mock**
```typescript
// src/test/mocks/supabase.ts
import { createClient } from '@supabase/supabase-js';

export const mockSupabase = {
  from: jest.fn(() => ({
    select: jest.fn(() => ({
      eq: jest.fn(() => ({
        gte: jest.fn(() => ({
          order: jest.fn(() => ({
            not: jest.fn(() => Promise.resolve({ data: [], error: null })),
            limit: jest.fn(() => Promise.resolve({ data: [], error: null })),
            single: jest.fn(() => Promise.resolve({ data: null, error: null }))
          }))
        }))
      }))
    })),
    insert: jest.fn(() => ({
      select: jest.fn(() => Promise.resolve({ data: [], error: null }))
    })),
    upsert: jest.fn(() => ({
      select: jest.fn(() => Promise.resolve({ data: [], error: null }))
    })),
    update: jest.fn(() => ({
      eq: jest.fn(() => Promise.resolve({ data: [], error: null }))
    })),
    delete: jest.fn(() => ({
      eq: jest.fn(() => Promise.resolve({ data: [], error: null }))
    }))
  })),
  auth: {
    getUser: jest.fn(() => Promise.resolve({ data: { user: null }, error: null })),
    signInWithPassword: jest.fn(() => Promise.resolve({ data: { user: null }, error: null })),
    signOut: jest.fn(() => Promise.resolve({ error: null }))
  }
};

jest.mock('@/lib/supabase', () => ({
  supabase: mockSupabase
}));
```

### **5. API Mocks with MSW**
```typescript
// src/test/mocks/handlers.ts
import { rest } from 'msw';

export const handlers = [
  // Analytics API mocks
  rest.get('/api/store/analytics/summary', (req, res, ctx) => {
    return res(
      ctx.json({
        totalPageViews: 150,
        totalUniqueVisitors: 120,
        returnVisitorRate: 25,
        mobileVsDesktopRatio: { mobile: 60, desktop: 40 },
        totalChatClicks: 15,
        averageTimeOnPage: 180
      })
    );
  }),

  rest.get('/api/store/analytics/enhanced', (req, res, ctx) => {
    return res(
      ctx.json({
        summary: {
          totalPageViews: 150,
          totalUniqueVisitors: 120,
          returnVisitorRate: 25,
          mobileVsDesktopRatio: { mobile: 60, desktop: 40 }
        },
        heroAnalytics: {
          customQuoteViews: 100,
          chatButtonClickRate: 10,
          heroEngagementRate: 15
        },
        carouselAnalytics: {
          totalBookClicks: 25,
          carouselInteractionRate: 20,
          mostPopularBooks: []
        },
        bannerAnalytics: {
          totalImpressions: 80,
          clickThroughRate: 12,
          bannerPerformance: []
        },
        communityAnalytics: {
          spotlightViews: 45,
          testimonialEngagement: 8,
          communityInteractionRate: 18
        }
      })
    );
  }),

  // Hero customization API mocks
  rest.get('/api/store/hero-customization', (req, res, ctx) => {
    return res(
      ctx.json({
        hero_quote: 'Welcome to our bookstore',
        hero_quote_author: 'Store Owner',
        hero_font_style: 'elegant',
        chat_button_text: 'Start Chatting',
        chat_button_position: 'center',
        chat_button_color_scheme: 'terracotta',
        is_chat_button_enabled: true,
        sections_enabled: { hero_quote: true }
      })
    );
  }),

  rest.post('/api/store/hero-customization', (req, res, ctx) => {
    return res(ctx.json({ success: true }));
  }),

  // Carousel API mocks
  rest.get('/api/store/carousel', (req, res, ctx) => {
    return res(
      ctx.json([
        {
          id: '1',
          title: 'The Great Gatsby',
          author: 'F. Scott Fitzgerald',
          image_url: 'https://example.com/gatsby.jpg',
          position: 1,
          is_active: true
        }
      ])
    );
  }),

  // Error simulation
  rest.get('/api/store/error-test', (req, res, ctx) => {
    return res(ctx.status(500), ctx.json({ error: 'Test error' }));
  })
];

// src/test/mocks/server.ts
import { setupServer } from 'msw/node';
import { handlers } from './handlers';

export const server = setupServer(...handlers);
```

## 📊 **TEST DATA FIXTURES**

### **6. Test Data Factory**
```typescript
// src/test/fixtures/testData.ts
export const createTestStore = (overrides = {}) => ({
  id: 'test-store-uuid',
  name: 'Test Bookstore',
  slug: 'test-bookstore',
  ...overrides
});

export const createTestUser = (overrides = {}) => ({
  id: 'test-user-uuid',
  email: 'test@example.com',
  user_metadata: {
    store_id: 'test-store-uuid'
  },
  ...overrides
});

export const createTestHeroCustomization = (overrides = {}) => ({
  store_id: 'test-store-uuid',
  hero_quote: 'Welcome to our amazing bookstore',
  hero_quote_author: 'Store Owner',
  hero_font_style: 'elegant',
  chat_button_text: 'Chat with us',
  chat_button_position: 'center',
  chat_button_color_scheme: 'terracotta',
  chat_button_size: 'large',
  is_chat_button_enabled: true,
  sections_enabled: { hero_quote: true },
  ...overrides
});

export const createTestAnalyticsData = (overrides = {}) => ({
  store_id: 'test-store-uuid',
  event_type: 'page_load',
  section_name: 'hero',
  session_id: 'test-session-123',
  user_agent: 'Mozilla/5.0 Test Browser',
  timestamp: new Date().toISOString(),
  ...overrides
});

export const createTestCarouselItem = (overrides = {}) => ({
  id: 'test-book-uuid',
  store_id: 'test-store-uuid',
  title: 'Test Book Title',
  author: 'Test Author',
  image_url: 'https://example.com/book.jpg',
  position: 1,
  is_active: true,
  ...overrides
});

export const createTestBanner = (overrides = {}) => ({
  id: 'test-banner-uuid',
  store_id: 'test-store-uuid',
  title: 'Test Banner',
  description: 'Test banner description',
  cta_text: 'Click Here',
  cta_url: '/test-link',
  is_active: true,
  priority: 1,
  ...overrides
});
```

### **7. Database Test Utilities**
```typescript
// src/test/utils/database.ts
import { createClient } from '@supabase/supabase-js';

export const createTestSupabaseClient = () => {
  return createClient(
    process.env.VITE_SUPABASE_URL!,
    process.env.VITE_SUPABASE_ANON_KEY!
  );
};

export const cleanupTestData = async (storeId: string) => {
  const supabase = createTestSupabaseClient();
  
  // Clean up test data in correct order (respecting foreign keys)
  await supabase.from('store_landing_analytics').delete().eq('store_id', storeId);
  await supabase.from('store_carousel_items').delete().eq('store_id', storeId);
  await supabase.from('store_promotional_banners').delete().eq('store_id', storeId);
  await supabase.from('store_community_spotlights').delete().eq('store_id', storeId);
  await supabase.from('store_quotes').delete().eq('store_id', storeId);
  await supabase.from('store_landing_customization').delete().eq('store_id', storeId);
};

export const seedTestData = async (storeId: string) => {
  const supabase = createTestSupabaseClient();
  
  // Insert test data
  await supabase.from('store_landing_customization').upsert(
    createTestHeroCustomization({ store_id: storeId })
  );
  
  await supabase.from('store_carousel_items').insert(
    createTestCarouselItem({ store_id: storeId })
  );
  
  await supabase.from('store_promotional_banners').insert(
    createTestBanner({ store_id: storeId })
  );
};
```

## 🧪 **COMPONENT TEST UTILITIES**

### **8. Custom Render Function**
```typescript
// src/test/utils/render.ts
import { render, RenderOptions } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { ReactElement } from 'react';

interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  initialEntries?: string[];
  user?: any;
}

const AllTheProviders = ({ 
  children, 
  initialEntries = ['/'],
  user = null 
}: {
  children: React.ReactNode;
  initialEntries?: string[];
  user?: any;
}) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false }
    }
  });

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider value={{ user, isAuthenticated: !!user }}>
          {children}
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
};

const customRender = (
  ui: ReactElement,
  options: CustomRenderOptions = {}
) => {
  const { initialEntries, user, ...renderOptions } = options;
  
  return render(ui, {
    wrapper: (props) => (
      <AllTheProviders {...props} initialEntries={initialEntries} user={user} />
    ),
    ...renderOptions
  });
};

export * from '@testing-library/react';
export { customRender as render };
```

### **9. Test Hooks and Utilities**
```typescript
// src/test/utils/hooks.ts
import { renderHook } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

export const renderHookWithProviders = (hook: () => any) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false }
    }
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );

  return renderHook(hook, { wrapper });
};

export const waitForHookUpdate = async (result: any, timeout = 5000) => {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error('Hook update timeout'));
    }, timeout);

    const checkUpdate = () => {
      if (!result.current.isLoading) {
        clearTimeout(timer);
        resolve(result.current);
      } else {
        setTimeout(checkUpdate, 100);
      }
    };

    checkUpdate();
  });
};
```

## 🔧 **CYPRESS CONFIGURATION**

### **10. Cypress Setup**
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
    screenshotOnRunFailure: true,
    defaultCommandTimeout: 10000,
    requestTimeout: 10000,
    responseTimeout: 10000,
    env: {
      SUPABASE_URL: 'https://test.supabase.co',
      SUPABASE_ANON_KEY: 'test-anon-key'
    }
  },
  component: {
    devServer: {
      framework: 'react',
      bundler: 'vite'
    }
  }
});

// cypress/support/commands.ts
declare global {
  namespace Cypress {
    interface Chainable {
      loginAsStoreOwner(): Chainable<void>;
      navigateToStoreManagement(): Chainable<void>;
      waitForAnalyticsLoad(): Chainable<void>;
      cleanupTestData(): Chainable<void>;
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

Cypress.Commands.add('waitForAnalyticsLoad', () => {
  cy.get('[data-testid="loading-spinner"]', { timeout: 10000 }).should('not.exist');
  cy.get('[data-testid="analytics-dashboard"]').should('be.visible');
});

Cypress.Commands.add('cleanupTestData', () => {
  cy.task('cleanupDatabase', { storeId: 'test-store-uuid' });
});
```

## ✅ **SETUP CHECKLIST**

### **Environment Setup**
- ✅ **Dependencies Installed**: All testing libraries and tools configured
- ✅ **Jest Configuration**: Proper test environment and coverage settings
- ✅ **Mock Setup**: Supabase, APIs, and browser APIs mocked
- ✅ **Test Data**: Fixtures and factories for consistent test data

### **Testing Infrastructure**
- ✅ **Custom Render**: Wrapper with all required providers
- ✅ **Database Utils**: Cleanup and seeding utilities
- ✅ **Cypress Setup**: E2E testing configuration and commands
- ✅ **Performance Tools**: Measurement utilities for performance tests

### **Quality Assurance**
- ✅ **Coverage Thresholds**: 80% minimum coverage requirement
- ✅ **Error Handling**: Proper error simulation and testing
- ✅ **Isolation**: Each test runs in clean environment
- ✅ **Consistency**: Standardized test patterns and utilities

**This test setup configuration provides a robust foundation for comprehensive testing of the Store Management Landing Page system.**
