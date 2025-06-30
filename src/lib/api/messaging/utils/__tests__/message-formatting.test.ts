/**
 * Message Formatting Module Tests
 */

import { describe, it, expect } from 'vitest';
import {
  formatMessagingError,
  sanitizeContent,
  formatMessageContent,
  truncateMessage,
  extractMentions,
  highlightMentions,
  formatMessageTimestamp,
  formatSearchResult
} from '../message-formatting';

describe('Message Formatting Module', () => {
  describe('formatMessagingError', () => {
    it('should create error with code and message', () => {
      const error = formatMessagingError('VALIDATION_ERROR', 'Invalid input');
      expect(error.message).toBe('Invalid input');
      expect((error as any).code).toBe('VALIDATION_ERROR');
    });

    it('should include details when provided', () => {
      const details = { field: 'username', value: 'test' };
      const error = formatMessagingError('VALIDATION_ERROR', 'Invalid input', details);
      expect((error as any).details).toEqual(details);
    });
  });

  describe('sanitizeContent', () => {
    it('should sanitize HTML characters', () => {
      const result = sanitizeContent('<script>alert("xss")</script>');
      expect(result).toBe('&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;');
    });

    it('should handle quotes and apostrophes', () => {
      const result = sanitizeContent(`He said "Hello" and she said 'Hi'`);
      expect(result).toBe('He said &quot;Hello&quot; and she said &#x27;Hi&#x27;');
    });

    it('should trim whitespace', () => {
      const result = sanitizeContent('  hello world  ');
      expect(result).toBe('hello world');
    });

    it('should handle empty string', () => {
      const result = sanitizeContent('');
      expect(result).toBe('');
    });
  });

  describe('formatMessageContent', () => {
    it('should format basic content', () => {
      const result = formatMessageContent('Hello world');
      expect(result).toBe('Hello world');
    });

    it('should convert newlines to br tags', () => {
      const result = formatMessageContent('Line 1\nLine 2');
      expect(result).toBe('Line 1<br>Line 2');
    });

    it('should format bold text', () => {
      const result = formatMessageContent('This is **bold** text');
      expect(result).toBe('This is <strong>bold</strong> text');
    });

    it('should format italic text', () => {
      const result = formatMessageContent('This is *italic* text');
      expect(result).toBe('This is <em>italic</em> text');
    });

    it('should sanitize and format combined', () => {
      const result = formatMessageContent('**Bold** <script>alert("xss")</script>');
      expect(result).toBe('<strong>Bold</strong> &lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;');
    });

    it('should handle null or undefined input', () => {
      expect(formatMessageContent(null as any)).toBe('');
      expect(formatMessageContent(undefined as any)).toBe('');
    });
  });

  describe('truncateMessage', () => {
    it('should truncate long messages', () => {
      const longMessage = 'a'.repeat(150);
      const result = truncateMessage(longMessage, 100);
      expect(result).toBe('a'.repeat(100) + '...');
    });

    it('should not truncate short messages', () => {
      const shortMessage = 'Hello world';
      const result = truncateMessage(shortMessage, 100);
      expect(result).toBe('Hello world');
    });

    it('should handle empty string', () => {
      const result = truncateMessage('', 100);
      expect(result).toBe('');
    });

    it('should use default max length', () => {
      const longMessage = 'a'.repeat(150);
      const result = truncateMessage(longMessage);
      expect(result).toBe('a'.repeat(100) + '...');
    });
  });

  describe('extractMentions', () => {
    it('should extract single mention', () => {
      const result = extractMentions('Hello @john how are you?');
      expect(result).toEqual(['john']);
    });

    it('should extract multiple mentions', () => {
      const result = extractMentions('Hello @john and @jane!');
      expect(result).toEqual(['john', 'jane']);
    });

    it('should remove duplicate mentions', () => {
      const result = extractMentions('Hello @john and @john again!');
      expect(result).toEqual(['john']);
    });

    it('should handle no mentions', () => {
      const result = extractMentions('Hello world!');
      expect(result).toEqual([]);
    });

    it('should handle empty string', () => {
      const result = extractMentions('');
      expect(result).toEqual([]);
    });
  });

  describe('highlightMentions', () => {
    it('should highlight mentions with span tags', () => {
      const result = highlightMentions('Hello @john how are you?');
      expect(result).toBe('Hello <span class="mention">@john</span> how are you?');
    });

    it('should highlight multiple mentions', () => {
      const result = highlightMentions('Hello @john and @jane!');
      expect(result).toBe('Hello <span class="mention">@john</span> and <span class="mention">@jane</span>!');
    });

    it('should handle no mentions', () => {
      const result = highlightMentions('Hello world!');
      expect(result).toBe('Hello world!');
    });
  });

  describe('formatMessageTimestamp', () => {
    it('should format recent timestamp as "Just now"', () => {
      const now = new Date();
      const result = formatMessageTimestamp(now);
      expect(result).toBe('Just now');
    });

    it('should format minutes ago', () => {
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
      const result = formatMessageTimestamp(fiveMinutesAgo);
      expect(result).toBe('5m ago');
    });

    it('should format hours ago', () => {
      const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);
      const result = formatMessageTimestamp(twoHoursAgo);
      expect(result).toBe('2h ago');
    });

    it('should format days ago', () => {
      const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);
      const result = formatMessageTimestamp(threeDaysAgo);
      expect(result).toBe('3d ago');
    });

    it('should handle invalid date', () => {
      const result = formatMessageTimestamp('invalid-date');
      expect(result).toBe('Invalid date');
    });
  });

  describe('formatSearchResult', () => {
    it('should highlight search term', () => {
      const result = formatSearchResult('Hello world', 'world');
      expect(result).toBe('Hello <mark>world</mark>');
    });

    it('should be case insensitive', () => {
      const result = formatSearchResult('Hello World', 'world');
      expect(result).toBe('Hello <mark>World</mark>');
    });

    it('should handle empty search term', () => {
      const result = formatSearchResult('Hello world', '');
      expect(result).toBe('Hello world');
    });

    it('should sanitize content', () => {
      const result = formatSearchResult('<script>alert("xss")</script>', 'script');
      expect(result).toBe('&lt;<mark>script</mark>&gt;alert(&quot;xss&quot;)&lt;/<mark>script</mark>&gt;');
    });
  });
});
