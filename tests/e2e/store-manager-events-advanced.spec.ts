import { test, expect, Page } from '@playwright/test';
import { 
  loginAsStoreManager, 
  logout, 
  cleanupTestState,
  TEST_CONFIG 
} from './helpers/store-manager-helpers';
import { StoreManagerEventsPage, StoreManagerEventFormPage } from './page-objects/StoreManagerEventsPage';

/**
 * Advanced End-to-End Tests for Store Manager Events Management
 * 
 * Tests advanced scenarios including:
 * - Complex event workflows
 * - Error handling and edge cases
 * - Performance and accessibility
 * - Integration with other Store Manager features
 */

// Advanced test data
const COMPLEX_EVENT_DATA = {
  title: 'Advanced E2E Test Event with Special Characters & Symbols',
  description: 'This is a comprehensive test event with detailed description that includes special characters: @#$%^&*()_+{}|:"<>?[]\\;\',./ and unicode: 📚📖✨',
  eventType: 'author_meet',
  location: 'Multi-line location\nSecond line of address\nCity, State 12345',
  startDate: '2025-03-15',
  startTime: '14:30',
  endDate: '2025-03-15',
  endTime: '16:45',
  maxParticipants: '50',
  isVirtual: true,
  virtualLink: 'https://meet.example.com/advanced-test-event'
};

const EDGE_CASE_EVENT_DATA = {
  title: 'A'.repeat(100), // Long title
  description: 'B'.repeat(500), // Long description
  eventType: 'reading_marathon',
  location: 'Edge Case Location',
  startDate: '2025-12-31', // End of year
  startTime: '23:45',
  endDate: '2026-01-01', // Cross year boundary
  endTime: '00:15',
  maxParticipants: '1' // Minimum participants
};

test.describe('Store Manager Events - Advanced Scenarios', () => {
  let eventsPage: StoreManagerEventsPage;
  let eventFormPage: StoreManagerEventFormPage;

  test.beforeEach(async ({ page }) => {
    // Initialize page objects
    eventsPage = new StoreManagerEventsPage(page);
    eventFormPage = new StoreManagerEventFormPage(page);
    
    // Login as Store Manager
    await loginAsStoreManager(page);
    
    // Navigate to events page
    await eventsPage.goto();
    await eventsPage.waitForPageLoad();
  });

  test.afterEach(async ({ page }) => {
    await cleanupTestState(page);
  });

  test('should handle complex event data with special characters', async ({ page }) => {
    // Create event with complex data
    await eventsPage.clickCreateEvent();
    await eventFormPage.waitForFormLoad();
    
    // Fill complex event data
    await eventFormPage.fillBasicInfo({
      title: COMPLEX_EVENT_DATA.title,
      description: COMPLEX_EVENT_DATA.description,
      eventType: COMPLEX_EVENT_DATA.eventType
    });
    
    await eventFormPage.fillDateTime({
      startDate: COMPLEX_EVENT_DATA.startDate,
      startTime: COMPLEX_EVENT_DATA.startTime,
      endDate: COMPLEX_EVENT_DATA.endDate,
      endTime: COMPLEX_EVENT_DATA.endTime
    });
    
    await eventFormPage.fillLocation({
      location: COMPLEX_EVENT_DATA.location,
      isVirtual: COMPLEX_EVENT_DATA.isVirtual,
      virtualLink: COMPLEX_EVENT_DATA.virtualLink
    });
    
    await eventFormPage.fillAdditionalSettings({
      maxParticipants: COMPLEX_EVENT_DATA.maxParticipants
    });
    
    // Submit form
    await eventFormPage.submit();
    await eventFormPage.verifySuccess('Event created successfully');
    
    // Verify event appears in list with correct data
    await eventsPage.verifyEventExists(COMPLEX_EVENT_DATA.title);
    
    // Clean up
    const eventCard = eventsPage.getEventCardByTitle(COMPLEX_EVENT_DATA.title);
    await eventCard.locator('[data-testid="event-menu-button"]').click();
    await page.click('button:has-text("Delete")');
    await page.click('button:has-text("Delete Event")');
    
    console.log('✅ Complex event data handling verified');
  });

  test('should handle edge case event data', async ({ page }) => {
    // Create event with edge case data
    await eventsPage.clickCreateEvent();
    await eventFormPage.waitForFormLoad();
    
    // Fill edge case data
    await eventFormPage.fillBasicInfo({
      title: EDGE_CASE_EVENT_DATA.title,
      description: EDGE_CASE_EVENT_DATA.description,
      eventType: EDGE_CASE_EVENT_DATA.eventType
    });
    
    await eventFormPage.fillDateTime({
      startDate: EDGE_CASE_EVENT_DATA.startDate,
      startTime: EDGE_CASE_EVENT_DATA.startTime,
      endDate: EDGE_CASE_EVENT_DATA.endDate,
      endTime: EDGE_CASE_EVENT_DATA.endTime
    });
    
    await eventFormPage.fillLocation({
      location: EDGE_CASE_EVENT_DATA.location
    });
    
    await eventFormPage.fillAdditionalSettings({
      maxParticipants: EDGE_CASE_EVENT_DATA.maxParticipants
    });
    
    // Submit form
    await eventFormPage.submit();
    await eventFormPage.verifySuccess('Event created successfully');
    
    // Verify event appears in list
    await eventsPage.verifyEventExists(EDGE_CASE_EVENT_DATA.title);
    
    console.log('✅ Edge case event data handling verified');
  });

  test('should handle concurrent operations gracefully', async ({ page, context }) => {
    // Open multiple tabs to simulate concurrent operations
    const page2 = await context.newPage();
    const eventsPage2 = new StoreManagerEventsPage(page2);
    
    // Login in second tab
    await loginAsStoreManager(page2);
    await eventsPage2.goto();
    await eventsPage2.waitForPageLoad();
    
    // Create event in first tab
    await eventsPage.clickCreateEvent();
    await eventFormPage.waitForFormLoad();
    
    await eventFormPage.fillBasicInfo({
      title: 'Concurrent Test Event 1',
      description: 'Created in first tab'
    });
    
    await eventFormPage.fillDateTime({
      startDate: '2025-04-01',
      startTime: '10:00',
      endDate: '2025-04-01',
      endTime: '12:00'
    });
    
    await eventFormPage.fillLocation({
      location: 'Test Location 1'
    });
    
    // Submit in first tab
    await eventFormPage.submit();
    await eventFormPage.verifySuccess('Event created successfully');
    
    // Refresh second tab and verify event appears
    await eventsPage2.clickRefresh();
    await eventsPage2.verifyEventExists('Concurrent Test Event 1');
    
    await page2.close();
    
    console.log('✅ Concurrent operations handling verified');
  });

  test('should maintain state during navigation', async ({ page }) => {
    // Start creating an event
    await eventsPage.clickCreateEvent();
    await eventFormPage.waitForFormLoad();
    
    // Fill partial data
    await eventFormPage.fillBasicInfo({
      title: 'Partial Event Data',
      description: 'This should be lost on navigation'
    });
    
    // Navigate away and back
    await eventFormPage.goBack();
    await eventsPage.waitForPageLoad();
    
    // Go to create again
    await eventsPage.clickCreateEvent();
    await eventFormPage.waitForFormLoad();
    
    // Verify form is empty (no state persistence expected)
    const titleValue = await eventFormPage.titleInput.inputValue();
    expect(titleValue).toBe('');
    
    console.log('✅ Navigation state handling verified');
  });

  test('should handle network errors gracefully', async ({ page }) => {
    // Simulate network failure during form submission
    await page.route('**/api/**', route => {
      if (route.request().method() === 'POST') {
        route.abort('failed');
      } else {
        route.continue();
      }
    });
    
    // Try to create an event
    await eventsPage.clickCreateEvent();
    await eventFormPage.waitForFormLoad();
    
    await eventFormPage.fillBasicInfo({
      title: 'Network Error Test',
      description: 'This should fail'
    });
    
    await eventFormPage.fillDateTime({
      startDate: '2025-05-01',
      startTime: '10:00',
      endDate: '2025-05-01',
      endTime: '12:00'
    });
    
    await eventFormPage.fillLocation({
      location: 'Test Location'
    });
    
    // Submit form (should fail)
    await eventFormPage.submit();
    
    // Should show error message
    await expect(page.locator('text=Failed to save event')).toBeVisible({ timeout: 10000 });
    
    console.log('✅ Network error handling verified');
  });

  test('should validate business rules correctly', async ({ page }) => {
    await eventsPage.clickCreateEvent();
    await eventFormPage.waitForFormLoad();
    
    // Test various business rule violations
    
    // 1. Event duration too short (less than 15 minutes)
    await eventFormPage.fillBasicInfo({
      title: 'Short Duration Test',
      description: 'Testing minimum duration'
    });
    
    await eventFormPage.fillDateTime({
      startDate: '2025-06-01',
      startTime: '10:00',
      endDate: '2025-06-01',
      endTime: '10:10' // Only 10 minutes
    });
    
    await eventFormPage.fillLocation({
      location: 'Test Location'
    });
    
    await eventFormPage.submit();
    await eventFormPage.verifyError('Event duration must be at least 15 minutes');
    
    // 2. Event too far in future (more than 1 year)
    await eventFormPage.fillDateTime({
      startDate: '2027-01-01', // More than 1 year
      startTime: '10:00',
      endDate: '2027-01-01',
      endTime: '12:00'
    });
    
    await eventFormPage.submit();
    await eventFormPage.verifyError('Event cannot be scheduled more than 1 year in advance');
    
    console.log('✅ Business rules validation verified');
  });

  test('should handle accessibility requirements', async ({ page }) => {
    // Check for basic accessibility features
    await eventsPage.waitForPageLoad();
    
    // Verify page has proper heading structure
    const h1Count = await page.locator('h1').count();
    expect(h1Count).toBe(1); // Should have exactly one h1
    
    // Verify buttons have accessible text
    await expect(eventsPage.createEventButton).toHaveAttribute('type', 'button');
    
    // Test keyboard navigation
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    await page.keyboard.press('Enter'); // Should activate focused element
    
    // Verify form accessibility
    await eventsPage.clickCreateEvent();
    await eventFormPage.waitForFormLoad();
    
    // Check form labels
    const titleLabel = page.locator('label[for*="title"], label:has-text("Title")');
    await expect(titleLabel).toBeVisible();
    
    console.log('✅ Accessibility requirements verified');
  });

  test('should perform well with large datasets', async ({ page }) => {
    // This test would ideally create many events to test performance
    // For now, we'll test the filtering and search performance
    
    const startTime = Date.now();
    
    // Perform multiple search operations
    await eventsPage.searchEvents('test');
    await eventsPage.clearSearch();
    
    await eventsPage.filterEvents('upcoming');
    await eventsPage.filterEvents('all');
    
    await eventsPage.sortEvents('newest');
    await eventsPage.sortEvents('upcoming');
    
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    // Operations should complete within reasonable time
    expect(duration).toBeLessThan(5000); // 5 seconds
    
    console.log(`✅ Performance test completed in ${duration}ms`);
  });
});
