# OCR Book Scanning - REVISED Technical Architecture

## **System Architecture Overview**

The OCR book scanning feature follows BookTalks Buddy's established patterns while introducing new capabilities for image processing, OCR, and direct inventory management integration. **MAJOR REVISION**: Direct integration with main store inventory, new/used categorization, and comprehensive duplicate management with quantity updates.

## **Architecture Patterns**

### **Existing Patterns Leveraged**
1. **Modular Service Layer**: Following `/src/services/` pattern
2. **API Layer Structure**: Using `/src/lib/api/` organization
3. **Component Architecture**: Feature-based components in `/src/components/`
4. **Authentication Integration**: Leveraging existing `AuthContext` and entitlements
5. **Error Handling**: Using established error management patterns
6. **Image Upload**: Extending existing `ImageUploadService`

### **New Patterns Introduced - REVISED**
1. **OCR Processing Pipeline**: Multi-stage processing with manual entry fallback
2. **Temporary Data Management**: Session-based workflow with 3-day automatic cleanup
3. **Duplicate Detection**: Quantity-aware matching with location consideration
4. **Analytics Aggregation**: Real-time metrics with new/used categorization
5. **Scanning Mode Selection**: Workflow branching based on book type
6. **Direct Inventory Integration**: Main inventory table integration patterns

## **Directory Structure**

```
src/
├── components/
│   └── ocr/
│       ├── scanner/
│       │   ├── OCRScannerInterface.tsx
│       │   ├── ScanningModeSelector.tsx          # NEW: New/Used selection
│       │   ├── LocationInput.tsx                 # NEW: Mandatory location input
│       │   ├── CameraCapture.tsx
│       │   ├── ImageUpload.tsx
│       │   └── ScanningProgress.tsx
│       ├── results/
│       │   ├── BookDetectionResults.tsx
│       │   ├── BookConfirmationModal.tsx
│       │   ├── ManualEntryInterface.tsx          # NEW: Complete manual entry
│       │   ├── DuplicateResolutionDialog.tsx     # ENHANCED: Quantity management
│       │   └── BatchConfirmationInterface.tsx
│       ├── inventory/
│       │   ├── MainInventoryDashboard.tsx        # RENAMED: Main inventory integration
│       │   ├── BookInventoryGrid.tsx
│       │   ├── InventoryFilters.tsx              # ENHANCED: New/Used filtering
│       │   ├── QuantityManagement.tsx            # NEW: Quantity update interface
│       │   └── BookDetailsModal.tsx
│       └── analytics/
│           ├── OCRAnalyticsDashboard.tsx
│           ├── ScanningMetrics.tsx               # ENHANCED: Mode-based metrics
│           ├── AccuracyCharts.tsx
│           └── UsageStatistics.tsx
├── services/
│   └── ocr/
│       ├── ocrProcessingService.ts
│       ├── bookValidationService.ts
│       ├── mainInventoryService.ts               # RENAMED: Direct inventory integration
│       ├── duplicateDetectionService.ts          # ENHANCED: Quantity management
│       ├── manualEntryService.ts                 # NEW: Manual entry fallback
│       ├── quantityManagementService.ts          # NEW: Quantity update logic
│       ├── analyticsService.ts                   # ENHANCED: Mode-based analytics
│       ├── cleanupService.ts                     # NEW: 3-day cleanup automation
│       └── types/
│           ├── ocrTypes.ts
│           ├── inventoryTypes.ts                 # ENHANCED: New/Used types
│           ├── duplicateTypes.ts                 # NEW: Duplicate management types
│           └── analyticsTypes.ts
├── lib/
│   └── api/
│       └── ocr/
│           ├── scanning.ts
│           ├── inventory.ts
│           ├── analytics.ts
│           └── validation.ts
├── hooks/
│   └── ocr/
│       ├── useOCRScanning.ts
│       ├── useInventoryManagement.ts
│       ├── useDuplicateDetection.ts
│       └── useOCRAnalytics.ts
└── pages/
    └── admin/
        └── store/
            ├── OCRScanningInterface.tsx
            ├── InventoryManagement.tsx
            └── OCRAnalytics.tsx
```

## **Service Layer Architecture**

### **OCR Processing Service**
```typescript
// src/services/ocr/ocrProcessingService.ts
export class OCRProcessingService {
  // Google Vision API integration
  static async processImage(imageFile: File): Promise<OCRResult>
  static async detectBooks(ocrText: string): Promise<DetectedBook[]>
  static async calculateConfidence(detection: any): Promise<number>
  
  // Session management
  static async createScanSession(storeId: string): Promise<ScanSession>
  static async updateSessionProgress(sessionId: string, progress: SessionProgress): Promise<void>
  static async completeScanSession(sessionId: string): Promise<void>
}
```

### **Book Validation Service**
```typescript
// src/services/ocr/bookValidationService.ts
export class BookValidationService {
  // Google Books API integration
  static async validateBook(detectedBook: DetectedBook): Promise<BookValidation>
  static async searchByTitle(title: string): Promise<GoogleBooksResult[]>
  static async searchByISBN(isbn: string): Promise<GoogleBooksResult | null>
  static async enhanceMetadata(book: DetectedBook): Promise<EnhancedBook>
  
  // Matching algorithms
  static async calculateMatchScore(detected: DetectedBook, googleBook: GoogleBooksResult): Promise<number>
  static async findBestMatch(detected: DetectedBook, candidates: GoogleBooksResult[]): Promise<BookMatch>
}
```

### **Inventory Management Service**
```typescript
// src/services/ocr/inventoryManagementService.ts
export class InventoryManagementService {
  // CRUD operations
  static async addBookToInventory(book: ConfirmedBook, storeId: string): Promise<InventoryBook>
  static async updateInventoryBook(bookId: string, updates: Partial<InventoryBook>): Promise<InventoryBook>
  static async removeFromInventory(bookId: string): Promise<void>
  static async getStoreInventory(storeId: string, filters?: InventoryFilters): Promise<InventoryBook[]>
  
  // Batch operations
  static async addMultipleBooks(books: ConfirmedBook[], storeId: string): Promise<InventoryBook[]>
  static async bulkUpdateStatus(bookIds: string[], status: BookStatus): Promise<void>
}
```

## **Component Architecture**

### **Main Scanning Interface**
```typescript
// src/components/ocr/scanner/OCRScannerInterface.tsx
interface OCRScannerInterfaceProps {
  storeId: string;
  onScanComplete: (results: ScanResults) => void;
  onError: (error: OCRError) => void;
}

export const OCRScannerInterface: React.FC<OCRScannerInterfaceProps> = ({
  storeId,
  onScanComplete,
  onError
}) => {
  // Camera/upload selection
  // Progress tracking
  // Results display
  // Error handling
};
```

### **Camera Capture Component**
```typescript
// src/components/ocr/scanner/CameraCapture.tsx
interface CameraCaptureProps {
  onImageCapture: (imageFile: File) => void;
  onError: (error: string) => void;
  disabled?: boolean;
}

export const CameraCapture: React.FC<CameraCaptureProps> = ({
  onImageCapture,
  onError,
  disabled = false
}) => {
  // Camera access
  // Image capture
  // Preview functionality
  // Mobile optimization
};
```

## **API Integration Layer**

### **Google Vision API Integration**
```typescript
// src/lib/api/ocr/vision.ts
interface VisionAPIConfig {
  apiKey: string;
  endpoint: string;
  features: TextDetectionFeature[];
  imageConfig: ImageProcessingConfig;
}

export class VisionAPIClient {
  static async detectText(imageData: string): Promise<TextDetection>
  static async processImage(file: File): Promise<OCRResult>
  static async handleRateLimit(error: APIError): Promise<void>
}
```

### **Google Books API Enhancement**
```typescript
// src/lib/api/ocr/books.ts
interface BooksAPIConfig extends GoogleBooksConfig {
  cacheEnabled: boolean;
  cacheDurationHours: number;
  maxRetries: number;
  rateLimitPerMinute: number;
}

export class EnhancedBooksAPI {
  static async searchBooks(query: BookSearchQuery): Promise<GoogleBooksResult[]>
  static async getBookDetails(googleBooksId: string): Promise<BookDetails>
  static async validateISBN(isbn: string): Promise<ISBNValidation>
  static async getCachedResult(cacheKey: string): Promise<CachedResult | null>
}
```

## **Database Integration**

### **Repository Pattern**
```typescript
// src/lib/api/ocr/repositories/inventoryRepository.ts
export class InventoryRepository {
  static async create(inventory: CreateInventoryRequest): Promise<InventoryBook>
  static async findByStore(storeId: string, filters?: InventoryFilters): Promise<InventoryBook[]>
  static async findDuplicates(book: BookIdentifiers, storeId: string): Promise<DuplicateMatch[]>
  static async updateStatus(bookId: string, status: BookStatus): Promise<void>
  
  // Analytics queries
  static async getInventoryStats(storeId: string, dateRange?: DateRange): Promise<InventoryStats>
  static async getScanningMetrics(storeId: string, dateRange?: DateRange): Promise<ScanningMetrics>
}
```

### **Session Management**
```typescript
// src/lib/api/ocr/repositories/sessionRepository.ts
export class SessionRepository {
  static async createSession(session: CreateSessionRequest): Promise<ScanSession>
  static async updateSession(sessionId: string, updates: SessionUpdate): Promise<ScanSession>
  static async getSessionWithBooks(sessionId: string): Promise<SessionWithBooks>
  static async cleanupExpiredSessions(): Promise<number>
}
```

## **State Management**

### **OCR Scanning Hook**
```typescript
// src/hooks/ocr/useOCRScanning.ts
interface UseOCRScanningReturn {
  // State
  currentSession: ScanSession | null;
  detectedBooks: DetectedBook[];
  isProcessing: boolean;
  progress: ScanProgress;
  error: OCRError | null;
  
  // Actions
  startScanning: (imageFile: File) => Promise<void>;
  confirmBook: (bookId: string, modifications?: BookModifications) => Promise<void>;
  rejectBook: (bookId: string) => Promise<void>;
  resolveDuplicate: (bookId: string, resolution: DuplicateResolution) => Promise<void>;
  completeSession: () => Promise<void>;
  
  // Utilities
  resetSession: () => void;
  retryProcessing: () => Promise<void>;
}
```

### **Inventory Management Hook**
```typescript
// src/hooks/ocr/useInventoryManagement.ts
interface UseInventoryManagementReturn {
  // State
  inventory: InventoryBook[];
  loading: boolean;
  error: string | null;
  filters: InventoryFilters;
  pagination: PaginationState;
  
  // Actions
  loadInventory: (storeId: string) => Promise<void>;
  updateBook: (bookId: string, updates: BookUpdate) => Promise<void>;
  deleteBook: (bookId: string) => Promise<void>;
  bulkUpdate: (bookIds: string[], updates: BulkUpdate) => Promise<void>;
  
  // Filters
  setFilters: (filters: Partial<InventoryFilters>) => void;
  clearFilters: () => void;
  
  // Search
  searchInventory: (query: string) => Promise<void>;
}
```

## **Error Handling Strategy**

### **Error Types**
```typescript
// src/services/ocr/types/errors.ts
export enum OCRErrorType {
  IMAGE_PROCESSING_ERROR = 'IMAGE_PROCESSING_ERROR',
  OCR_API_ERROR = 'OCR_API_ERROR',
  BOOKS_API_ERROR = 'BOOKS_API_ERROR',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  NETWORK_ERROR = 'NETWORK_ERROR',
  PERMISSION_ERROR = 'PERMISSION_ERROR',
  STORAGE_ERROR = 'STORAGE_ERROR'
}

export class OCRError extends Error {
  constructor(
    public type: OCRErrorType,
    message: string,
    public context?: Record<string, any>,
    public recoverable: boolean = true
  ) {
    super(message);
  }
}
```

### **Error Recovery**
```typescript
// src/services/ocr/errorRecoveryService.ts
export class ErrorRecoveryService {
  static async handleOCRError(error: OCRError, context: ErrorContext): Promise<RecoveryResult>
  static async retryWithBackoff(operation: () => Promise<any>, maxRetries: number): Promise<any>
  static async fallbackToManualEntry(detectedBook: DetectedBook): Promise<ManualEntryData>
  static async reportError(error: OCRError, context: ErrorContext): Promise<void>
}
```

## **Performance Optimization**

### **Image Processing**
```typescript
// src/services/ocr/imageOptimizationService.ts
export class ImageOptimizationService {
  static async optimizeForOCR(file: File): Promise<OptimizedImage>
  static async compressImage(file: File, quality: number): Promise<File>
  static async resizeImage(file: File, maxDimensions: Dimensions): Promise<File>
  static async validateImageQuality(file: File): Promise<QualityAssessment>
}
```

### **Caching Strategy**
```typescript
// src/services/ocr/cachingService.ts
export class OCRCachingService {
  static async cacheOCRResult(imageHash: string, result: OCRResult): Promise<void>
  static async getCachedOCRResult(imageHash: string): Promise<OCRResult | null>
  static async cacheBookValidation(bookKey: string, validation: BookValidation): Promise<void>
  static async getCachedValidation(bookKey: string): Promise<BookValidation | null>
  static async clearExpiredCache(): Promise<number>
}
```

## **Security Implementation**

### **Access Control**
```typescript
// src/lib/api/ocr/middleware/authMiddleware.ts
export const withOCRPermissions = (requiredRole: 'owner' | 'manager') => {
  return async (req: Request, res: Response, next: NextFunction) => {
    // Validate user authentication
    // Check store administrator role
    // Verify store access permissions
    // Log access attempts
  };
};
```

### **Data Validation**
```typescript
// src/services/ocr/validationService.ts
export class OCRValidationService {
  static validateImageFile(file: File): ValidationResult
  static validateBookData(book: DetectedBook): ValidationResult
  static sanitizeOCRText(text: string): string
  static validateInventoryData(inventory: InventoryBook): ValidationResult
}
```

## **Integration Points**

### **Admin Panel Integration**
- **Navigation**: Add OCR scanning to admin sidebar
- **Route Guards**: Use existing `StoreOwnerRouteGuard` and `StoreManagerRouteGuard`
- **Layout**: Integrate with existing `AdminLayout` component
- **Permissions**: Leverage current entitlements system

### **Existing Services Integration**
- **Image Upload**: Extend `ImageUploadService` for OCR images
- **Google Books**: Enhance existing `googleBooksService`
- **Error Handling**: Use established error management patterns
- **Analytics**: Integrate with existing analytics infrastructure

### **Database Integration**
- **RLS Policies**: Follow existing store-scoped security patterns
- **Migrations**: Use established migration naming and structure
- **Indexes**: Optimize for existing query patterns
- **Functions**: Leverage PostgreSQL functions for complex operations

This technical architecture ensures the OCR book scanning feature integrates seamlessly with BookTalks Buddy's existing patterns while providing a robust, scalable foundation for future enhancements.
