import { Page, Locator } from '@playwright/test';
import { MCPPageObject, MCPTestHelpers } from '../utils/mcp-test-helpers';

/**
 * Book Club Page Object for MCP Testing
 * Encapsulates book club functionality with semantic selectors
 */
export class BookClubPage extends MCPPageObject {
  // Semantic selectors using MCP's understanding
  private get clubHeader() {
    return this.page.getByRole('heading').first();
  }

  private get joinButton() {
    return this.page.getByRole('button', { name: /join/i });
  }

  private get leaveButton() {
    return this.page.getByRole('button', { name: /leave/i });
  }

  private get requestButton() {
    return this.page.getByRole('button', { name: /request/i });
  }

  private get cancelRequestButton() {
    return this.page.getByRole('button', { name: /cancel.*request/i });
  }

  private get membersSection() {
    return this.page.getByText(/member/i).first();
  }

  private get discussionsLink() {
    return this.page.getByRole('link', { name: /discussion/i });
  }

  private get currentBookSection() {
    return this.page.getByText(/current.*book|reading.*now/i);
  }

  private get settingsButton() {
    return this.page.getByRole('button', { name: /setting|manage|edit/i });
  }

  constructor(page: Page, private clubId?: string) {
    super(page);
  }

  async navigate(clubId?: string): Promise<void> {
    const id = clubId || this.clubId || 'test-club-id';
    await this.helpers.navigateAndVerify(`/book-club/${id}`, /club|book/i);
  }

  async isLoaded(): Promise<boolean> {
    try {
      await this.clubHeader.waitFor({ timeout: 5000 });
      return true;
    } catch {
      return false;
    }
  }

  async getClubName(): Promise<string> {
    return await this.clubHeader.textContent() || '';
  }

  async joinClub(): Promise<{ success: boolean; message?: string }> {
    if (await this.joinButton.isVisible()) {
      await this.joinButton.click();
      await this.page.waitForTimeout(2000);

      // Check for success indicators
      const successMessage = this.page.getByText(/joined|success|welcome/i);
      const pendingMessage = this.page.getByText(/pending|request.*sent/i);
      const leaveButtonVisible = await this.leaveButton.isVisible();

      if (await successMessage.isVisible()) {
        return { success: true, message: await successMessage.textContent() || undefined };
      } else if (await pendingMessage.isVisible()) {
        return { success: true, message: await pendingMessage.textContent() || undefined };
      } else if (leaveButtonVisible) {
        return { success: true, message: 'Successfully joined club' };
      }
    }

    return { success: false, message: 'Join button not available' };
  }

  async leaveClub(): Promise<{ success: boolean; message?: string }> {
    if (await this.leaveButton.isVisible()) {
      await this.leaveButton.click();
      await this.page.waitForTimeout(1000);

      // Handle confirmation dialog if present
      const confirmButton = this.page.getByRole('button', { name: /confirm|yes|leave/i });
      if (await confirmButton.isVisible()) {
        await confirmButton.click();
        await this.page.waitForTimeout(2000);
      }

      // Check for success
      const joinButtonVisible = await this.joinButton.isVisible();
      const successMessage = this.page.getByText(/left|removed|success/i);

      if (joinButtonVisible || await successMessage.isVisible()) {
        return { success: true, message: 'Successfully left club' };
      }
    }

    return { success: false, message: 'Leave button not available' };
  }

  async requestToJoin(): Promise<{ success: boolean; message?: string }> {
    if (await this.requestButton.isVisible()) {
      await this.requestButton.click();
      await this.page.waitForTimeout(2000);

      const pendingMessage = this.page.getByText(/pending|request.*sent/i);
      const cancelButtonVisible = await this.cancelRequestButton.isVisible();

      if (await pendingMessage.isVisible() || cancelButtonVisible) {
        return { success: true, message: 'Join request sent' };
      }
    }

    return { success: false, message: 'Request button not available' };
  }

  async cancelJoinRequest(): Promise<{ success: boolean; message?: string }> {
    if (await this.cancelRequestButton.isVisible()) {
      await this.cancelRequestButton.click();
      await this.page.waitForTimeout(2000);

      const joinButtonVisible = await this.joinButton.isVisible();
      const requestButtonVisible = await this.requestButton.isVisible();

      if (joinButtonVisible || requestButtonVisible) {
        return { success: true, message: 'Join request cancelled' };
      }
    }

    return { success: false, message: 'Cancel button not available' };
  }

  async navigateToDiscussions(): Promise<boolean> {
    if (await this.discussionsLink.isVisible()) {
      await this.discussionsLink.click();
      await this.page.waitForTimeout(1000);
      return this.page.url().includes('discussion');
    }

    // Try alternative navigation
    await this.page.goto(`/book-club/${this.clubId}/discussions`);
    return this.page.url().includes('discussion');
  }

  async getMemberCount(): Promise<number> {
    const memberText = await this.membersSection.textContent();
    if (memberText) {
      const match = memberText.match(/(\d+)/);
      return match ? parseInt(match[1]) : 0;
    }
    return 0;
  }

  async getCurrentBook(): Promise<{ title?: string; author?: string } | null> {
    if (await this.currentBookSection.isVisible()) {
      const bookTitle = this.page.getByRole('heading').filter({ hasText: /book/i });
      const bookAuthor = this.page.getByText(/author|by/i);

      return {
        title: await bookTitle.textContent() || undefined,
        author: await bookAuthor.textContent() || undefined
      };
    }
    return null;
  }

  async openSettings(): Promise<boolean> {
    if (await this.settingsButton.isVisible()) {
      await this.settingsButton.click();
      await this.page.waitForTimeout(1000);

      // Check if settings opened (modal, page, or panel)
      const settingsModal = this.page.getByRole('dialog');
      const settingsForm = this.page.getByRole('form');
      
      return await settingsModal.isVisible() || await settingsForm.isVisible();
    }
    return false;
  }

  async createDiscussion(title: string, content: string): Promise<boolean> {
    await this.navigateToDiscussions();

    const createButton = this.page.getByRole('button', { name: /create|new.*topic|start.*discussion/i });
    
    if (await createButton.isVisible()) {
      await createButton.click();
      await this.page.waitForTimeout(1000);

      // Fill discussion form
      const titleInput = await this.helpers.findFormField('title');
      const contentInput = await this.helpers.findFormField('content');

      if (titleInput && contentInput) {
        await titleInput.fill(title);
        await contentInput.fill(content);

        const submitButton = this.page.getByRole('button', { name: /create|post|submit/i });
        if (await submitButton.isVisible()) {
          await submitButton.click();
          await this.page.waitForTimeout(2000);
          return true;
        }
      }
    }

    return false;
  }

  async nominateBook(bookTitle: string): Promise<boolean> {
    const nominateButton = this.page.getByRole('button', { name: /nominate|suggest.*book/i });
    
    if (await nominateButton.isVisible()) {
      await nominateButton.click();
      await this.page.waitForTimeout(1000);

      // Search for book
      const searchInput = this.page.getByRole('searchbox');
      if (await searchInput.isVisible()) {
        await searchInput.fill(bookTitle);
        await this.page.waitForTimeout(2000);

        // Select first result
        const firstResult = this.page.locator('[data-testid*="book"]').first();
        if (await firstResult.isVisible()) {
          await firstResult.click();

          const confirmButton = this.page.getByRole('button', { name: /nominate|confirm/i });
          if (await confirmButton.isVisible()) {
            await confirmButton.click();
            await this.page.waitForTimeout(2000);
            return true;
          }
        }
      }
    }

    return false;
  }

  async getMembershipStatus(): Promise<'member' | 'pending' | 'not_member' | 'admin'> {
    if (await this.leaveButton.isVisible()) {
      // Check if admin
      if (await this.settingsButton.isVisible()) {
        return 'admin';
      }
      return 'member';
    } else if (await this.cancelRequestButton.isVisible()) {
      return 'pending';
    } else if (await this.joinButton.isVisible() || await this.requestButton.isVisible()) {
      return 'not_member';
    }

    return 'not_member';
  }

  async getClubInfo(): Promise<{
    name: string;
    memberCount: number;
    privacy: string;
    currentBook?: { title?: string; author?: string };
    membershipStatus: string;
  }> {
    return {
      name: await this.getClubName(),
      memberCount: await this.getMemberCount(),
      privacy: 'unknown', // Would need to implement privacy detection
      currentBook: await this.getCurrentBook() || undefined,
      membershipStatus: await this.getMembershipStatus()
    };
  }
}

/**
 * Book Clubs Discovery Page Object
 */
export class BookClubsDiscoveryPage extends MCPPageObject {
  private get searchInput() {
    return this.page.getByRole('searchbox');
  }

  private get clubCards() {
    return this.page.locator('[data-testid*="club"]');
  }

  private get createClubButton() {
    return this.page.getByRole('button', { name: /create.*club|new.*club/i });
  }

  async navigate(): Promise<void> {
    await this.helpers.navigateAndVerify('/book-clubs', /club|discover/i);
  }

  async isLoaded(): Promise<boolean> {
    try {
      await this.page.waitForSelector('main', { timeout: 5000 });
      return true;
    } catch {
      return false;
    }
  }

  async searchClubs(searchTerm: string): Promise<number> {
    if (await this.searchInput.isVisible()) {
      await this.searchInput.fill(searchTerm);
      await this.page.keyboard.press('Enter');
      await this.page.waitForTimeout(2000);
    }

    return await this.clubCards.count();
  }

  async getClubCards(): Promise<Array<{ name: string; memberCount?: number }>> {
    const cards = [];
    const count = await this.clubCards.count();

    for (let i = 0; i < count; i++) {
      const card = this.clubCards.nth(i);
      const name = await card.getByRole('heading').textContent() || '';
      const memberText = await card.getByText(/member/i).textContent();
      const memberCount = memberText ? parseInt(memberText.match(/(\d+)/)?.[1] || '0') : undefined;

      cards.push({ name, memberCount });
    }

    return cards;
  }

  async clickClub(index: number): Promise<void> {
    const card = this.clubCards.nth(index);
    await card.click();
    await this.page.waitForTimeout(1000);
  }

  async createNewClub(): Promise<boolean> {
    if (await this.createClubButton.isVisible()) {
      await this.createClubButton.click();
      await this.page.waitForTimeout(1000);
      return true;
    }
    return false;
  }
}
