/**
 * Library Statistics Module
 * 
 * Statistics and analytics functions for personal book library
 */

import { throwIfInvalid, validateUserId } from '@/lib/api/books/validation';
import { PersonalBook, LibraryStats, GenreStats } from './types/personalBooks';
import { getUserBooks } from './libraryOperations';
import { getUserInteractionStats } from './interactionTracking';

// =====================================================
// Library Statistics Functions
// =====================================================

/**
 * Get user's library statistics
 */
export async function getLibraryStats(userId: string): Promise<LibraryStats> {
  try {
    // Input validation
    throwIfInvalid(validateUserId(userId), 'userId');

    const books = await getUserBooks(userId);
    
    const genreDistribution: Record<string, number> = {};
    books.forEach(book => {
      const genre = book.genre || 'Uncategorized';
      genreDistribution[genre] = (genreDistribution[genre] || 0) + 1;
    });

    const recentlyAdded = books
      .sort((a, b) => new Date(b.added_at).getTime() - new Date(a.added_at).getTime())
      .slice(0, 5);

    return {
      totalBooks: books.length,
      genreDistribution,
      recentlyAdded
    };
    
  } catch (error) {
    console.error("Error getting library stats:", error);
    return {
      totalBooks: 0,
      genreDistribution: {},
      recentlyAdded: []
    };
  }
}

/**
 * Get detailed genre statistics
 */
export async function getGenreStats(userId: string): Promise<GenreStats[]> {
  try {
    const books = await getUserBooks(userId);
    const totalBooks = books.length;

    if (totalBooks === 0) {
      return [];
    }

    const genreDistribution: Record<string, number> = {};
    books.forEach(book => {
      const genre = book.genre || 'Uncategorized';
      genreDistribution[genre] = (genreDistribution[genre] || 0) + 1;
    });

    return Object.entries(genreDistribution)
      .map(([genre, count]) => ({
        genre,
        count,
        percentage: Math.round((count / totalBooks) * 100)
      }))
      .sort((a, b) => b.count - a.count);
    
  } catch (error) {
    console.error("Error getting genre stats:", error);
    return [];
  }
}

/**
 * Get reading progress statistics
 */
export async function getReadingProgressStats(userId: string): Promise<{
  totalBooks: number;
  booksThisYear: number;
  booksThisMonth: number;
  averageBooksPerMonth: number;
  longestStreak: number;
  currentStreak: number;
}> {
  try {
    const books = await getUserBooks(userId);
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();

    // Books added this year
    const booksThisYear = books.filter(book => {
      const addedDate = new Date(book.added_at);
      return addedDate.getFullYear() === currentYear;
    }).length;

    // Books added this month
    const booksThisMonth = books.filter(book => {
      const addedDate = new Date(book.added_at);
      return addedDate.getFullYear() === currentYear && addedDate.getMonth() === currentMonth;
    }).length;

    // Calculate average books per month (based on account age)
    const oldestBook = books.reduce((oldest, book) => {
      const bookDate = new Date(book.added_at);
      const oldestDate = new Date(oldest.added_at);
      return bookDate < oldestDate ? book : oldest;
    }, books[0]);

    let averageBooksPerMonth = 0;
    if (oldestBook) {
      const accountAgeMonths = Math.max(1, 
        (now.getTime() - new Date(oldestBook.added_at).getTime()) / (1000 * 60 * 60 * 24 * 30)
      );
      averageBooksPerMonth = Math.round((books.length / accountAgeMonths) * 100) / 100;
    }

    // Calculate reading streaks (simplified - based on consecutive days with book additions)
    const streaks = calculateReadingStreaks(books);

    return {
      totalBooks: books.length,
      booksThisYear,
      booksThisMonth,
      averageBooksPerMonth,
      longestStreak: streaks.longest,
      currentStreak: streaks.current
    };
    
  } catch (error) {
    console.error("Error getting reading progress stats:", error);
    return {
      totalBooks: 0,
      booksThisYear: 0,
      booksThisMonth: 0,
      averageBooksPerMonth: 0,
      longestStreak: 0,
      currentStreak: 0
    };
  }
}

/**
 * Get comprehensive library analytics
 */
export async function getLibraryAnalytics(userId: string): Promise<{
  libraryStats: LibraryStats;
  genreStats: GenreStats[];
  progressStats: any;
  interactionStats: any;
  topAuthors: Array<{ author: string; count: number }>;
  readingTrends: Array<{ month: string; count: number }>;
}> {
  try {
    const [libraryStats, genreStats, progressStats, interactionStats] = await Promise.all([
      getLibraryStats(userId),
      getGenreStats(userId),
      getReadingProgressStats(userId),
      getUserInteractionStats(userId)
    ]);

    const books = await getUserBooks(userId);

    // Calculate top authors
    const authorCounts: Record<string, number> = {};
    books.forEach(book => {
      const author = book.author || 'Unknown Author';
      authorCounts[author] = (authorCounts[author] || 0) + 1;
    });

    const topAuthors = Object.entries(authorCounts)
      .map(([author, count]) => ({ author, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // Calculate reading trends (last 12 months)
    const readingTrends = calculateReadingTrends(books);

    return {
      libraryStats,
      genreStats,
      progressStats,
      interactionStats,
      topAuthors,
      readingTrends
    };
    
  } catch (error) {
    console.error("Error getting library analytics:", error);
    return {
      libraryStats: { totalBooks: 0, genreDistribution: {}, recentlyAdded: [] },
      genreStats: [],
      progressStats: {},
      interactionStats: {},
      topAuthors: [],
      readingTrends: []
    };
  }
}

// =====================================================
// Helper Functions
// =====================================================

/**
 * Calculate reading streaks based on book addition dates
 */
function calculateReadingStreaks(books: PersonalBook[]): { longest: number; current: number } {
  if (books.length === 0) {
    return { longest: 0, current: 0 };
  }

  // Group books by date
  const booksByDate: Record<string, number> = {};
  books.forEach(book => {
    const date = new Date(book.added_at).toDateString();
    booksByDate[date] = (booksByDate[date] || 0) + 1;
  });

  const dates = Object.keys(booksByDate).sort();
  let longestStreak = 0;
  let currentStreak = 0;
  let tempStreak = 0;

  for (let i = 0; i < dates.length; i++) {
    if (i === 0) {
      tempStreak = 1;
    } else {
      const prevDate = new Date(dates[i - 1]);
      const currDate = new Date(dates[i]);
      const dayDiff = (currDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24);

      if (dayDiff === 1) {
        tempStreak++;
      } else {
        longestStreak = Math.max(longestStreak, tempStreak);
        tempStreak = 1;
      }
    }
  }

  longestStreak = Math.max(longestStreak, tempStreak);

  // Calculate current streak (from today backwards)
  const today = new Date().toDateString();
  const todayIndex = dates.indexOf(today);
  
  if (todayIndex !== -1) {
    currentStreak = 1;
    for (let i = todayIndex - 1; i >= 0; i--) {
      const prevDate = new Date(dates[i]);
      const currDate = new Date(dates[i + 1]);
      const dayDiff = (currDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24);

      if (dayDiff === 1) {
        currentStreak++;
      } else {
        break;
      }
    }
  }

  return { longest: longestStreak, current: currentStreak };
}

/**
 * Calculate reading trends for the last 12 months
 */
function calculateReadingTrends(books: PersonalBook[]): Array<{ month: string; count: number }> {
  const now = new Date();
  const trends: Array<{ month: string; count: number }> = [];

  for (let i = 11; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const monthKey = date.toISOString().substring(0, 7); // YYYY-MM format
    const monthName = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });

    const count = books.filter(book => {
      const bookDate = new Date(book.added_at);
      return bookDate.toISOString().substring(0, 7) === monthKey;
    }).length;

    trends.push({ month: monthName, count });
  }

  return trends;
}
