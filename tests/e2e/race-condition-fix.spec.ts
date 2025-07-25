import { test, expect, Browser } from '@playwright/test';

test.describe('Race Condition Fix - Real-time Chat', () => {
  test('should handle presence tracking without race conditions', async ({ browser }) => {
    // Create two browser contexts (simulating different users)
    const context1 = await browser.newContext();
    const context2 = await browser.newContext();
    
    const page1 = await context1.newPage();
    const page2 = await context2.newPage();

    // Setup User 1
    await page1.goto('/chat-selection');
    await page1.fill('[data-testid="username-input"]', 'RaceTestUser1');
    await page1.selectOption('[data-testid="genre-select"]', 'Fiction');
    await page1.click('[data-testid="start-chat-button"]');
    
    // Navigate to book discussion
    await page1.goto('/book-discussion/race-test-book');
    
    // Wait for initial subscription setup
    await page1.waitForTimeout(1000);

    // Setup User 2
    await page2.goto('/chat-selection');
    await page2.fill('[data-testid="username-input"]', 'RaceTestUser2');
    await page2.selectOption('[data-testid="genre-select"]', 'Fiction');
    await page2.click('[data-testid="start-chat-button"]');
    await page2.goto('/book-discussion/race-test-book');

    // Wait for presence synchronization
    await page2.waitForTimeout(2000);

    // Verify presence tracking works for both users
    const onlineCount1 = await page1.locator('[data-testid="online-count"]').textContent();
    const onlineCount2 = await page2.locator('[data-testid="online-count"]').textContent();

    expect(onlineCount1).toContain('2');
    expect(onlineCount2).toContain('2');

    // Test username change scenario (simulating race condition trigger)
    await page1.evaluate(() => {
      localStorage.setItem('anon_username', 'RaceTestUser1Modified');
    });
    
    // Refresh to trigger useEffect with new username
    await page1.reload();
    await page1.waitForTimeout(2000);

    // Verify presence still works after username change
    const onlineCountAfterChange = await page2.locator('[data-testid="online-count"]').textContent();
    expect(onlineCountAfterChange).toContain('2');

    await context1.close();
    await context2.close();
  });

  test('should synchronize messages without race conditions', async ({ browser }) => {
    const context1 = await browser.newContext();
    const context2 = await browser.newContext();
    
    const page1 = await context1.newPage();
    const page2 = await context2.newPage();

    // Setup both users in same book discussion
    await setupUserInChat(page1, 'MessageUser1', 'message-sync-test-book');
    await setupUserInChat(page2, 'MessageUser2', 'message-sync-test-book');

    // User 1 sends message
    await page1.fill('[data-testid="message-input"]', 'Race condition test message');
    await page1.click('[data-testid="send-button"]');

    // Verify message appears in User 2's session within 2 seconds
    await expect(page2.locator('[data-testid="message-list"]'))
      .toContainText('Race condition test message', { timeout: 2000 });

    // Verify message attribution
    await expect(page2.locator('[data-testid="message-list"]'))
      .toContainText('MessageUser1');

    // Test rapid message exchange (stress test for race conditions)
    for (let i = 0; i < 3; i++) {
      await page1.fill('[data-testid="message-input"]', `Rapid message ${i} from User1`);
      await page1.click('[data-testid="send-button"]');
      
      await page2.fill('[data-testid="message-input"]', `Rapid reply ${i} from User2`);
      await page2.click('[data-testid="send-button"]');
      
      // Small delay between rapid messages
      await page1.waitForTimeout(500);
    }

    // Verify all messages are synchronized
    for (let i = 0; i < 3; i++) {
      await expect(page1.locator('[data-testid="message-list"]'))
        .toContainText(`Rapid message ${i} from User1`);
      await expect(page1.locator('[data-testid="message-list"]'))
        .toContainText(`Rapid reply ${i} from User2`);
        
      await expect(page2.locator('[data-testid="message-list"]'))
        .toContainText(`Rapid message ${i} from User1`);
      await expect(page2.locator('[data-testid="message-list"]'))
        .toContainText(`Rapid reply ${i} from User2`);
    }

    await context1.close();
    await context2.close();
  });

  test('should handle subscription cleanup without memory leaks', async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();

    // Setup user
    await setupUserInChat(page, 'CleanupTestUser', 'cleanup-test-book');

    // Navigate away and back multiple times to test cleanup
    for (let i = 0; i < 3; i++) {
      await page.goto('/explore-books');
      await page.waitForTimeout(1000);
      
      await page.goto('/book-discussion/cleanup-test-book');
      await page.waitForTimeout(1000);
    }

    // Check console for cleanup messages (no errors should appear)
    const consoleLogs = await page.evaluate(() => {
      return (window as any).testConsoleLogs || [];
    });

    // Should see cleanup messages without errors
    const cleanupLogs = consoleLogs.filter((log: string) => 
      log.includes('Cleaning up unified subscriptions')
    );
    
    expect(cleanupLogs.length).toBeGreaterThan(0);

    await context.close();
  });
});

// Helper function to setup user in chat
async function setupUserInChat(page: any, username: string, bookId: string) {
  await page.goto('/chat-selection');
  await page.fill('[data-testid="username-input"]', username);
  await page.selectOption('[data-testid="genre-select"]', 'Fiction');
  await page.click('[data-testid="start-chat-button"]');
  await page.goto(`/book-discussion/${bookId}`);
  await page.waitForTimeout(1000);
}
