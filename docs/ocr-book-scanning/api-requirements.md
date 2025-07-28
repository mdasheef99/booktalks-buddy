# OCR Book Scanning - API Requirements & Integration Guide

## **Overview**

This document outlines the external API requirements for the OCR book scanning feature, including Google Vision API for OCR processing and enhanced Google Books API integration.

## **Google Vision API Requirements**

### **API Configuration**
```typescript
interface GoogleVisionConfig {
  apiKey: string; // Server-side only
  projectId: string;
  endpoint: 'https://vision.googleapis.com/v1/images:annotate';
  features: ['TEXT_DETECTION', 'DOCUMENT_TEXT_DETECTION'];
  maxImageSize: 10 * 1024 * 1024; // 10MB
  supportedFormats: ['image/jpeg', 'image/png', 'image/webp'];
}
```

### **Required API Features**
1. **TEXT_DETECTION**: For general text recognition
2. **DOCUMENT_TEXT_DETECTION**: For structured text extraction
3. **Image preprocessing**: Automatic image enhancement
4. **Confidence scoring**: Text detection confidence levels

### **API Quota Requirements**
- **Monthly Requests**: 10,000 requests/month (estimated)
- **Daily Limit**: 500 requests/day
- **Rate Limiting**: 60 requests/minute
- **Concurrent Requests**: 10 simultaneous requests

### **Cost Estimation**
- **TEXT_DETECTION**: $1.50 per 1,000 requests
- **DOCUMENT_TEXT_DETECTION**: $1.50 per 1,000 requests
- **Monthly Cost**: ~$30 for 10,000 requests
- **Per Store Cost**: ~$3-5/month for active stores

### **Request Format**
```json
{
  "requests": [
    {
      "image": {
        "content": "base64-encoded-image-data"
      },
      "features": [
        {
          "type": "TEXT_DETECTION",
          "maxResults": 50
        },
        {
          "type": "DOCUMENT_TEXT_DETECTION",
          "maxResults": 50
        }
      ],
      "imageContext": {
        "languageHints": ["en", "hi", "ta", "te", "bn"]
      }
    }
  ]
}
```

### **Response Processing**
```typescript
interface VisionAPIResponse {
  responses: [
    {
      textAnnotations: TextAnnotation[];
      fullTextAnnotation: {
        text: string;
        pages: Page[];
      };
      error?: {
        code: number;
        message: string;
      };
    }
  ];
}

interface TextAnnotation {
  description: string;
  boundingPoly: {
    vertices: Array<{ x: number; y: number }>;
  };
  confidence: number;
}
```

## **Google Books API Enhancement**

### **Current Integration Analysis**
Based on existing `googleBooksService.ts`, the current implementation provides:
- Basic book search by query
- Book details retrieval
- Trending books by genre
- Error handling with Sentry integration

### **Required Enhancements**
1. **Advanced Search Capabilities**
2. **ISBN-specific searches**
3. **Enhanced metadata extraction**
4. **Improved matching algorithms**
5. **Caching layer for performance**

### **Enhanced API Configuration**
```typescript
interface EnhancedGoogleBooksConfig {
  apiKey?: string; // Optional for higher quotas
  baseUrl: 'https://www.googleapis.com/books/v1/volumes';
  maxResults: 40; // Increased from current 10
  rateLimitPerMinute: 100;
  cacheEnabled: true;
  cacheDurationHours: 24;
  retryAttempts: 3;
  retryDelayMs: 1000;
}
```

### **New Search Methods**
```typescript
// Enhanced search capabilities
export async function searchBooksByISBN(isbn: string): Promise<BookType[]>
export async function searchBooksByTitle(title: string, exactMatch?: boolean): Promise<BookType[]>
export async function searchBooksByAuthor(author: string): Promise<BookType[]>
export async function searchBooksAdvanced(query: AdvancedSearchQuery): Promise<BookType[]>
export async function getBookByGoogleId(googleBooksId: string): Promise<BookType | null>

// Matching and validation
export async function findBestMatches(
  detectedBook: DetectedBook, 
  maxResults?: number
): Promise<BookMatch[]>
export async function validateBookMetadata(book: BookType): Promise<ValidationResult>
export async function enhanceBookMetadata(book: Partial<BookType>): Promise<BookType>
```

### **Advanced Search Query Interface**
```typescript
interface AdvancedSearchQuery {
  title?: string;
  author?: string;
  isbn?: string;
  publisher?: string;
  subject?: string;
  publishedDate?: {
    from?: string;
    to?: string;
  };
  language?: string;
  exactMatch?: boolean;
  maxResults?: number;
}
```

### **Book Matching Algorithm**
```typescript
interface BookMatch {
  book: BookType;
  matchScore: number; // 0-1 confidence score
  matchReasons: MatchReason[];
  confidence: 'high' | 'medium' | 'low';
}

interface MatchReason {
  field: 'title' | 'author' | 'isbn' | 'publisher';
  similarity: number;
  exactMatch: boolean;
}

export async function calculateMatchScore(
  detected: DetectedBook,
  candidate: BookType
): Promise<number> {
  // Title similarity (40% weight)
  const titleScore = calculateStringSimilarity(detected.title, candidate.title);
  
  // Author similarity (35% weight)
  const authorScore = calculateStringSimilarity(detected.author, candidate.author);
  
  // ISBN match (25% weight)
  const isbnScore = detected.isbn && candidate.isbn && 
    detected.isbn === candidate.isbn ? 1.0 : 0.0;
  
  return (titleScore * 0.4) + (authorScore * 0.35) + (isbnScore * 0.25);
}
```

## **API Rate Limiting & Throttling**

### **Rate Limiting Strategy**
```typescript
interface RateLimitConfig {
  googleVision: {
    requestsPerMinute: 60;
    requestsPerDay: 500;
    burstLimit: 10;
  };
  googleBooks: {
    requestsPerMinute: 100;
    requestsPerDay: 1000;
    burstLimit: 20;
  };
}

export class APIRateLimiter {
  static async throttleRequest(apiType: 'vision' | 'books'): Promise<void>
  static async checkQuotaRemaining(apiType: 'vision' | 'books'): Promise<QuotaStatus>
  static async handleRateLimit(error: RateLimitError): Promise<void>
  static async queueRequest(request: APIRequest): Promise<void>
}
```

### **Queue Management**
```typescript
interface RequestQueue {
  vision: APIRequest[];
  books: APIRequest[];
  processing: boolean;
  maxQueueSize: 100;
}

export class RequestQueueManager {
  static async addToQueue(request: APIRequest, priority?: 'high' | 'normal'): Promise<void>
  static async processQueue(): Promise<void>
  static async clearQueue(apiType?: 'vision' | 'books'): Promise<void>
  static getQueueStatus(): QueueStatus
}
```

## **Error Handling & Recovery**

### **API Error Types**
```typescript
enum APIErrorType {
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  QUOTA_EXCEEDED = 'QUOTA_EXCEEDED',
  INVALID_API_KEY = 'INVALID_API_KEY',
  NETWORK_ERROR = 'NETWORK_ERROR',
  INVALID_REQUEST = 'INVALID_REQUEST',
  SERVICE_UNAVAILABLE = 'SERVICE_UNAVAILABLE',
  TIMEOUT = 'TIMEOUT'
}

export class APIError extends Error {
  constructor(
    public type: APIErrorType,
    message: string,
    public statusCode?: number,
    public retryAfter?: number,
    public quotaReset?: Date
  ) {
    super(message);
  }
}
```

### **Recovery Strategies**
```typescript
export class APIErrorRecovery {
  static async handleVisionAPIError(error: APIError): Promise<RecoveryAction>
  static async handleBooksAPIError(error: APIError): Promise<RecoveryAction>
  static async retryWithExponentialBackoff(
    operation: () => Promise<any>,
    maxRetries: number
  ): Promise<any>
  static async fallbackToCache(cacheKey: string): Promise<any>
  static async notifyAdminOfCriticalError(error: APIError): Promise<void>
}

interface RecoveryAction {
  action: 'retry' | 'fallback' | 'manual' | 'abort';
  delay?: number;
  fallbackData?: any;
  userMessage?: string;
}
```

## **Caching Strategy**

### **Multi-Level Caching**
```typescript
interface CacheConfig {
  levels: {
    memory: {
      maxSize: 100; // Number of items
      ttl: 300; // 5 minutes
    };
    redis: {
      ttl: 86400; // 24 hours
      keyPrefix: 'ocr:';
    };
    database: {
      ttl: 604800; // 7 days
      table: 'api_cache';
    };
  };
}

export class APICache {
  static async get(key: string): Promise<any>
  static async set(key: string, value: any, ttl?: number): Promise<void>
  static async invalidate(pattern: string): Promise<void>
  static async warmCache(keys: string[]): Promise<void>
  static getCacheStats(): CacheStats
}
```

### **Cache Key Strategies**
```typescript
export class CacheKeyGenerator {
  static visionAPIKey(imageHash: string): string {
    return `vision:${imageHash}`;
  }
  
  static booksAPIKey(query: string, type: 'search' | 'details'): string {
    const queryHash = createHash('md5').update(query).digest('hex');
    return `books:${type}:${queryHash}`;
  }
  
  static bookMatchKey(detectedBook: DetectedBook): string {
    const bookHash = createHash('md5')
      .update(`${detectedBook.title}:${detectedBook.author}`)
      .digest('hex');
    return `match:${bookHash}`;
  }
}
```

## **Performance Monitoring**

### **Metrics Collection**
```typescript
interface APIMetrics {
  vision: {
    requestCount: number;
    averageResponseTime: number;
    errorRate: number;
    quotaUsage: number;
    cacheHitRate: number;
  };
  books: {
    requestCount: number;
    averageResponseTime: number;
    errorRate: number;
    quotaUsage: number;
    cacheHitRate: number;
  };
}

export class APIMetricsCollector {
  static recordRequest(api: 'vision' | 'books', duration: number): void
  static recordError(api: 'vision' | 'books', error: APIError): void
  static recordCacheHit(api: 'vision' | 'books'): void
  static recordQuotaUsage(api: 'vision' | 'books', usage: number): void
  static getMetrics(timeRange?: DateRange): APIMetrics
}
```

### **Health Monitoring**
```typescript
export class APIHealthMonitor {
  static async checkVisionAPIHealth(): Promise<HealthStatus>
  static async checkBooksAPIHealth(): Promise<HealthStatus>
  static async runHealthChecks(): Promise<SystemHealth>
  static async alertOnHealthIssues(health: SystemHealth): Promise<void>
}

interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  responseTime: number;
  errorRate: number;
  lastChecked: Date;
  issues?: string[];
}
```

## **Security Considerations**

### **API Key Management**
```typescript
interface APIKeyConfig {
  vision: {
    key: string; // Server-side environment variable
    projectId: string;
    rotation: {
      enabled: true;
      intervalDays: 90;
    };
  };
  books: {
    key?: string; // Optional for higher quotas
    rotation: {
      enabled: false;
    };
  };
}

export class APIKeyManager {
  static getVisionAPIKey(): string
  static getBooksAPIKey(): string | undefined
  static rotateKeys(): Promise<void>
  static validateKeys(): Promise<KeyValidationResult>
}
```

### **Request Sanitization**
```typescript
export class RequestSanitizer {
  static sanitizeImageData(imageData: string): string
  static sanitizeSearchQuery(query: string): string
  static validateImageSize(file: File): ValidationResult
  static validateImageFormat(file: File): ValidationResult
}
```

## **Implementation Checklist**

### **Google Vision API Setup**
- [ ] Create Google Cloud Project
- [ ] Enable Vision API
- [ ] Generate API key
- [ ] Set up billing account
- [ ] Configure quotas and limits
- [ ] Test API connectivity

### **Google Books API Enhancement**
- [ ] Review current implementation
- [ ] Implement enhanced search methods
- [ ] Add caching layer
- [ ] Implement rate limiting
- [ ] Add error recovery
- [ ] Test matching algorithms

### **Infrastructure Setup**
- [ ] Configure environment variables
- [ ] Set up Redis for caching (optional)
- [ ] Implement monitoring and alerting
- [ ] Set up error tracking
- [ ] Configure backup API keys
- [ ] Test failover scenarios

### **Security Implementation**
- [ ] Secure API key storage
- [ ] Implement request validation
- [ ] Add rate limiting middleware
- [ ] Set up access logging
- [ ] Configure CORS policies
- [ ] Test security measures

This comprehensive API requirements document ensures robust, scalable, and secure integration with external services while maintaining optimal performance and cost efficiency.
