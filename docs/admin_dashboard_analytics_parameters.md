# **Admin Dashboard Analytics - Technical Parameters Reference**

**Version**: 1.0  
**Last Updated**: 2025-01-31  
**Maintainer**: Development Team  

---

## **🔧 API Endpoint Parameters**

### **useAnalyticsData Hook Parameters**

#### **Hook Configuration**
```typescript
interface UseAnalyticsDataParams {
  timeRange: 'week' | 'month' | '6months' | '12months' | 'all';
  refreshKey: number;
  enabled: boolean;
  storeId?: string;
}
```

**Parameter Details**:
- **timeRange**: 
  - Type: `string`
  - Default: `'month'`
  - Options: `'week'`, `'month'`, `'6months'`, `'12months'`, `'all'`
  - Description: Time period for analytics data filtering
  - Validation: Must be one of the predefined options

- **refreshKey**: 
  - Type: `number`
  - Default: `0`
  - Range: `0` to `Number.MAX_SAFE_INTEGER`
  - Description: Trigger for data refresh, increment to force reload
  - Usage: Incremented on manual refresh or periodic updates

- **enabled**: 
  - Type: `boolean`
  - Default: `true`
  - Description: Controls whether the hook should fetch data
  - Usage: Set to `false` to pause data fetching

- **storeId**: 
  - Type: `string | undefined`
  - Default: `undefined`
  - Format: UUID string
  - Description: Store identifier for store-specific analytics
  - Required: For landing page and book club analytics

### **AnalyticsAPI Method Parameters**

#### **getAnalyticsData(timeRange, refreshKey)**
```typescript
static async getAnalyticsData(
  timeRange: TimeRange,
  refreshKey: number
): Promise<AnalyticsData>
```

**Parameters**:
- **timeRange**: Time period filter (see TimeRange type above)
- **refreshKey**: Cache-busting parameter for forced refresh

**Returns**:
```typescript
interface AnalyticsData {
  totalUsers: number;
  totalClubs: number;
  totalDiscussions: number;
  totalMembers: number;
  newUsers: number;
  newClubs: number;
  activeDiscussions: number;
  userTiers: {
    free: number;
    privileged: number;
    privilegedPlus: number;
  };
  activityData: MonthlyActivityData[];
  userGrowthData: MonthlyGrowthData[];
}
```

#### **getLandingPageAnalytics(storeId, timeRange)**
```typescript
static async getLandingPageAnalytics(
  storeId: string,
  timeRange: TimeRange
): Promise<LandingPageAnalytics>
```

**Parameters**:
- **storeId**: 
  - Type: `string`
  - Format: UUID
  - Required: `true`
  - Validation: Must be valid UUID format
  - Description: Store identifier for analytics scope

- **timeRange**: Time period filter (see TimeRange type above)

**Returns**:
```typescript
interface LandingPageAnalytics {
  pageViews: number;
  uniqueVisitors: number;
  averageTimeOnPage: number;
  bounceRate: number;
  clickThroughRate: number;
  performanceScore: number;
  sectionAnalytics: {
    hero: SectionMetrics;
    carousel: SectionMetrics;
    banner: SectionMetrics;
    community: SectionMetrics;
  };
  alerts: PerformanceAlert[];
  recommendations: Recommendation[];
}
```

#### **getBookClubAnalytics(storeId, timeRange)**
```typescript
static async getBookClubAnalytics(
  storeId: string,
  timeRange: TimeRange
): Promise<BookClubAnalytics>
```

**Parameters**: Same as `getLandingPageAnalytics`

**Returns**:
```typescript
interface BookClubAnalytics {
  totalBookClubs: number;
  activeBookClubs: number;
  totalMembers: number;
  averageMembersPerClub: number;
  discussionMetrics: DiscussionMetrics;
  engagementRates: EngagementRates;
  popularBooks: PopularBook[];
  clubPerformance: ClubPerformanceData[];
}
```

---

## **📊 Component Props & Configuration**

### **AdminAnalyticsPage Component**

#### **Props Interface**
```typescript
interface AdminAnalyticsPageProps {
  // No external props - uses internal state management
}
```

#### **Internal State**
```typescript
interface AdminAnalyticsState {
  timeRange: TimeRange;
  activeTab: 'user-growth' | 'platform-activity';
  refreshKey: number;
  loading: boolean;
  error: string | null;
}
```

### **StatsCard Component**

#### **Props Interface**
```typescript
interface StatsCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ComponentType<{ className?: string }>;
  trend?: {
    value: number;
    isPositive: boolean;
    label: string;
  };
  className?: string;
}
```

**Parameter Details**:
- **title**: 
  - Type: `string`
  - Required: `true`
  - Description: Main heading for the stat card
  - Example: `"Total Users"`

- **value**: 
  - Type: `string | number`
  - Required: `true`
  - Description: Primary metric value to display
  - Format: Numbers formatted with locale-specific separators
  - Example: `10`, `"1,234"`, `"$5,678"`

- **subtitle**: 
  - Type: `string | undefined`
  - Required: `false`
  - Description: Additional context or secondary metric
  - Example: `"Estimated active: 7 (70%)"`

- **icon**: 
  - Type: `React.ComponentType<{ className?: string }>`
  - Required: `true`
  - Description: Icon component from lucide-react or similar
  - Usage: Passed as component reference, not JSX

- **trend**: 
  - Type: `TrendData | undefined`
  - Required: `false`
  - Description: Trend indicator with value and direction
  - Properties:
    - `value`: Numeric change value
    - `isPositive`: Boolean indicating positive/negative trend
    - `label`: Descriptive text for the trend

### **TimeRangeFilter Component**

#### **Props Interface**
```typescript
interface TimeRangeFilterProps {
  value: TimeRange;
  onChange: (timeRange: TimeRange) => void;
  options?: TimeRangeOption[];
  className?: string;
}
```

**Parameter Details**:
- **value**: 
  - Type: `TimeRange`
  - Required: `true`
  - Description: Currently selected time range
  - Controlled component pattern

- **onChange**: 
  - Type: `(timeRange: TimeRange) => void`
  - Required: `true`
  - Description: Callback function for time range changes
  - Usage: Updates parent component state

- **options**: 
  - Type: `TimeRangeOption[] | undefined`
  - Required: `false`
  - Default: `[{ value: '6months', label: '6 Months' }, { value: '12months', label: '12 Months' }, { value: 'all', label: 'All Time' }]`
  - Description: Available time range options

### **LandingPageAnalytics Component**

#### **Props Interface**
```typescript
interface LandingPageAnalyticsProps {
  storeId: string;
  timeRange: TimeRange;
  onRefresh?: () => void;
  className?: string;
}
```

**Parameter Details**:
- **storeId**: 
  - Type: `string`
  - Required: `true`
  - Format: UUID string
  - Validation: Must be valid UUID
  - Description: Store identifier for analytics scope

- **timeRange**: 
  - Type: `TimeRange`
  - Required: `true`
  - Description: Time period for analytics data
  - Inherited from parent component state

- **onRefresh**: 
  - Type: `() => void | undefined`
  - Required: `false`
  - Description: Optional callback for manual refresh trigger
  - Usage: Increments refreshKey in parent component

---

## **🗄️ Database Query Parameters**

### **Time-Based Filtering Parameters**

#### **Date Range Calculation**
```typescript
interface DateRangeParams {
  rangeStartStr: string;
  currentPeriodEnd: string;
  previousPeriodStart: string;
  previousPeriodEnd: string;
}
```

**Parameter Generation**:
```javascript
// From console logs - actual date range calculation
{
  timeRange: 'month',
  rangeStartStr: '2025-06-30T18:30:00.000Z',
  currentPeriodEnd: '2025-07-31T18:30:00.000Z',
  // Previous period for trend comparison
  previousPeriodStart: '2025-05-30T18:30:00.000Z',
  previousPeriodEnd: '2025-06-30T18:30:00.000Z'
}
```

#### **SQL Query Parameters**
```sql
-- Example parameterized query structure
SELECT 
  COUNT(*) as total_count,
  DATE_TRUNC('month', created_at) as month_period
FROM analytics_table 
WHERE created_at >= $1 
  AND created_at <= $2
  AND store_id = $3
GROUP BY month_period
ORDER BY month_period;
```

**Parameter Binding**:
- `$1`: `rangeStartStr` (ISO 8601 timestamp)
- `$2`: `currentPeriodEnd` (ISO 8601 timestamp)  
- `$3`: `storeId` (UUID string)

### **Aggregation Parameters**

#### **User Statistics Query**
```typescript
interface UserStatsQueryParams {
  timeRange: TimeRange;
  storeId?: string;
  includeInactive?: boolean;
  tierFilter?: UserTier[];
}
```

#### **Activity Metrics Query**
```typescript
interface ActivityQueryParams {
  timeRange: TimeRange;
  storeId?: string;
  activityTypes: ('discussions' | 'clubs' | 'members')[];
  groupBy: 'day' | 'week' | 'month';
}
```

---

## **🔍 Data Types & Validation Rules**

### **Core Data Types**

#### **TimeRange Type**
```typescript
type TimeRange = 'week' | 'month' | '6months' | '12months' | 'all';
```

**Validation Rules**:
- Must be one of the predefined string literals
- Case-sensitive matching required
- Default fallback to `'month'` if invalid

#### **UserTier Type**
```typescript
type UserTier = 'FREE' | 'PRIVILEGED' | 'PRIVILEGED_PLUS';
```

#### **AnalyticsMetric Type**
```typescript
interface AnalyticsMetric {
  value: number;
  change: number;
  changePercentage: number;
  trend: 'up' | 'down' | 'stable';
  period: TimeRange;
}
```

**Validation Rules**:
- `value`: Must be non-negative number
- `change`: Can be positive, negative, or zero
- `changePercentage`: Calculated as `(change / previousValue) * 100`
- `trend`: Derived from change value (>5% = up, <-5% = down, else stable)

### **Landing Page Analytics Types**

#### **SectionMetrics Type**
```typescript
interface SectionMetrics {
  views: number;
  clicks: number;
  clickThroughRate: number;
  averageTimeViewed: number;
  interactionRate: number;
}
```

**Validation Rules**:
- All numeric values must be non-negative
- `clickThroughRate`: Percentage (0-100)
- `averageTimeViewed`: Time in seconds
- `interactionRate`: Percentage (0-100)

#### **PerformanceAlert Type**
```typescript
interface PerformanceAlert {
  id: string;
  type: 'warning' | 'error' | 'info';
  title: string;
  description: string;
  threshold: number;
  currentValue: number;
  createdAt: string;
}
```

---

## **⚙️ Configuration Options**

### **Analytics Configuration**

#### **Default Time Ranges**
```typescript
const DEFAULT_TIME_RANGES: TimeRangeOption[] = [
  { value: '6months', label: '6 Months', days: 180 },
  { value: '12months', label: '12 Months', days: 365 },
  { value: 'all', label: 'All Time', days: null }
];
```

#### **Refresh Intervals**
```typescript
const REFRESH_INTERVALS = {
  realTime: 30000,    // 30 seconds
  standard: 300000,   // 5 minutes
  background: 900000  // 15 minutes
};
```

#### **Performance Thresholds**
```typescript
const PERFORMANCE_THRESHOLDS = {
  pageLoadTime: 3000,     // 3 seconds
  bounceRate: 70,         // 70%
  clickThroughRate: 2,    // 2%
  timeOnPage: 30,         // 30 seconds
  performanceScore: 80    // 80/100
};
```

### **Chart Configuration**

#### **Chart Colors**
```typescript
const CHART_COLORS = {
  primary: '#8B4513',      // bookconnect-brown
  secondary: '#CD853F',    // bookconnect-terracotta
  success: '#22C55E',      // green-500
  warning: '#F59E0B',      // amber-500
  error: '#EF4444',        // red-500
  neutral: '#6B7280'       // gray-500
};
```

#### **Chart Dimensions**
```typescript
const CHART_DIMENSIONS = {
  height: 300,
  width: '100%',
  margin: { top: 20, right: 30, bottom: 20, left: 20 },
  responsive: true
};
```

---

## **🔒 Security Parameters**

### **Access Control Parameters**

#### **Entitlement Requirements**
```typescript
interface EntitlementParams {
  requiredEntitlements: string[];
  storeOwnerRequired: boolean;
  adminRequired: boolean;
  fallbackBehavior: 'redirect' | 'hide' | 'disable';
}
```

**Admin Analytics Requirements**:
- `requiredEntitlements`: `['admin_analytics_access']`
- `storeOwnerRequired`: `false`
- `adminRequired`: `true`

**Landing Page Analytics Requirements**:
- `requiredEntitlements`: `['store_analytics_access']`
- `storeOwnerRequired`: `true`
- `adminRequired`: `false`

### **Data Privacy Parameters**

#### **Anonymization Settings**
```typescript
interface PrivacyParams {
  anonymizeUserData: boolean;
  aggregationMinimum: number;
  retentionPeriod: number; // days
  excludePersonalData: boolean;
}
```

**Default Privacy Settings**:
- `anonymizeUserData`: `true`
- `aggregationMinimum`: `5` (minimum users for data display)
- `retentionPeriod`: `365` (1 year)
- `excludePersonalData`: `true`

---

## **📈 Performance Parameters**

### **Caching Configuration**

#### **Cache Settings**
```typescript
interface CacheParams {
  ttl: number;           // Time to live in seconds
  maxEntries: number;    // Maximum cache entries
  compression: boolean;  // Enable data compression
  invalidationKeys: string[];
}
```

**Analytics Cache Settings**:
- `ttl`: `300` (5 minutes)
- `maxEntries`: `100`
- `compression`: `true`
- `invalidationKeys`: `['timeRange', 'storeId', 'refreshKey']`

### **Query Optimization Parameters**

#### **Database Query Limits**
```typescript
interface QueryLimits {
  maxResults: number;
  timeoutMs: number;
  batchSize: number;
  concurrentQueries: number;
}
```

**Default Query Limits**:
- `maxResults`: `10000`
- `timeoutMs`: `30000` (30 seconds)
- `batchSize`: `1000`
- `concurrentQueries`: `5`

---

**Technical Documentation Maintained By**: Development Team  
**Parameter Reference Version**: 1.0  
**Last Technical Review**: 2025-01-31
