/**
 * Test for Collections Click Functionality in ProfileCollectionsSection
 * 
 * This test verifies that clicking on collection cards opens the detailed view
 * and that the CollectionBooksView is rendered in read-only mode.
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import ProfileCollectionsSection from '../ProfileCollectionsSection';

// Mock the collections service
vi.mock('@/services/books/collections', () => ({
  getPublicCollections: vi.fn(),
  getCollectionBooks: vi.fn(),
}));

// Mock the CollectionBooksView component
vi.mock('@/components/books/collections/CollectionBooksView', () => ({
  CollectionBooksView: vi.fn(({ collection, onBack, showActions }) => (
    <div data-testid="collection-books-view">
      <h2>Collection: {collection.name}</h2>
      <button onClick={onBack} data-testid="back-button">Back</button>
      <div data-testid="show-actions">{showActions ? 'true' : 'false'}</div>
    </div>
  ))
}));

// Mock toast
vi.mock('sonner', () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
  },
}));

const mockCollections = [
  {
    id: '1',
    name: 'My Favorite Books',
    description: 'A collection of my all-time favorites',
    book_count: 5,
    is_public: true,
    preview_covers: ['cover1.jpg', 'cover2.jpg'],
    created_at: '2024-01-01',
    updated_at: '2024-01-01',
    user_id: 'user1'
  },
  {
    id: '2',
    name: 'Science Fiction',
    description: 'Great sci-fi novels',
    book_count: 3,
    is_public: true,
    preview_covers: ['cover3.jpg'],
    created_at: '2024-01-02',
    updated_at: '2024-01-02',
    user_id: 'user1'
  }
];

describe('ProfileCollectionsSection - Collections Click Functionality', () => {
  const defaultProps = {
    userId: 'user1',
    username: 'testuser',
    isCurrentUser: false,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock successful collections fetch
    const { getPublicCollections } = require('@/services/books/collections');
    getPublicCollections.mockResolvedValue(mockCollections);
  });

  it('should render collections grid initially', async () => {
    render(<ProfileCollectionsSection {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByText('Collections')).toBeInTheDocument();
      expect(screen.getByText('My Favorite Books')).toBeInTheDocument();
      expect(screen.getByText('Science Fiction')).toBeInTheDocument();
    });

    // Should not show the detailed view initially
    expect(screen.queryByTestId('collection-books-view')).not.toBeInTheDocument();
  });

  it('should open collection detailed view when clicking on a collection card', async () => {
    render(<ProfileCollectionsSection {...defaultProps} />);

    // Wait for collections to load
    await waitFor(() => {
      expect(screen.getByText('My Favorite Books')).toBeInTheDocument();
    });

    // Click on the first collection card
    const collectionCard = screen.getByText('My Favorite Books').closest('[role="button"], .cursor-pointer, [onClick]') || 
                          screen.getByText('My Favorite Books').closest('div');
    
    if (collectionCard) {
      fireEvent.click(collectionCard);
    }

    // Should show the detailed view
    await waitFor(() => {
      expect(screen.getByTestId('collection-books-view')).toBeInTheDocument();
      expect(screen.getByText('Collection: My Favorite Books')).toBeInTheDocument();
    });

    // Should not show the collections grid
    expect(screen.queryByText('Science Fiction')).not.toBeInTheDocument();
  });

  it('should render CollectionBooksView in read-only mode (showActions=false)', async () => {
    render(<ProfileCollectionsSection {...defaultProps} />);

    // Wait for collections to load and click on a collection
    await waitFor(() => {
      expect(screen.getByText('My Favorite Books')).toBeInTheDocument();
    });

    const collectionCard = screen.getByText('My Favorite Books').closest('div');
    if (collectionCard) {
      fireEvent.click(collectionCard);
    }

    // Verify that CollectionBooksView is rendered with showActions=false
    await waitFor(() => {
      expect(screen.getByTestId('collection-books-view')).toBeInTheDocument();
      expect(screen.getByTestId('show-actions')).toHaveTextContent('false');
    });
  });

  it('should return to collections grid when clicking back button', async () => {
    render(<ProfileCollectionsSection {...defaultProps} />);

    // Wait for collections to load and click on a collection
    await waitFor(() => {
      expect(screen.getByText('My Favorite Books')).toBeInTheDocument();
    });

    const collectionCard = screen.getByText('My Favorite Books').closest('div');
    if (collectionCard) {
      fireEvent.click(collectionCard);
    }

    // Verify detailed view is shown
    await waitFor(() => {
      expect(screen.getByTestId('collection-books-view')).toBeInTheDocument();
    });

    // Click back button
    const backButton = screen.getByTestId('back-button');
    fireEvent.click(backButton);

    // Should return to collections grid
    await waitFor(() => {
      expect(screen.queryByTestId('collection-books-view')).not.toBeInTheDocument();
      expect(screen.getByText('My Favorite Books')).toBeInTheDocument();
      expect(screen.getByText('Science Fiction')).toBeInTheDocument();
    });
  });
});
