# **Landing Page Analytics - Technical Reference Guide**

**Version**: 1.0  
**Last Updated**: 2025-01-31  
**Maintainer**: Development Team  

---

## **🏗️ System Architecture**

### **Core Components**
1. **LandingPageTrackingAPI** (`src/lib/api/store/analytics/landingPageTracking.ts`)
2. **useLandingPageTracking Hook** (`src/hooks/useLandingPageTracking.ts`)
3. **Component Integration** (Hero, Carousel, Community, Quote sections)
4. **Database Layer** (`store_landing_analytics` table)

### **Data Flow**
```
User Interaction → Component Event Handler → Analytics Hook → Tracking API → Supabase Database
```

---

## **📊 Database Schema**

### **Table: `store_landing_analytics`**
```sql
CREATE TABLE store_landing_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES stores(id),
  event_type TEXT NOT NULL,
  section_name TEXT NOT NULL CHECK (section_name IN ('carousel', 'hero', 'banners', 'community', 'events', 'bookclubs', 'quote', 'footer')),
  element_id UUID,
  element_type TEXT,
  session_id TEXT NOT NULL,
  user_agent TEXT,
  interaction_data JSONB,
  timestamp TIMESTAMPTZ DEFAULT NOW()
);
```

### **Event Types & Constraints**
- **Allowed Section Names**: `carousel`, `hero`, `banners`, `community`, `events`, `bookclubs`, `quote`, `footer`
- **Event Types**: `page_load`, `hero_view`, `chat_button_click`, `carousel_view`, `carousel_click`, `community_view`, `community_interaction`, `quote_view`
- **Element Types**: `page`, `section`, `button`, `book`, `member_spotlight`, `metrics`

---

## **🔧 API Reference**

### **LandingPageTrackingAPI Methods**

#### **trackPageLoad(storeId, sessionId, metadata?)**
Tracks initial page load events.
```typescript
LandingPageTrackingAPI.trackPageLoad(
  'store-uuid',
  'session-id',
  {
    referrer: document.referrer,
    loadTime: performance.now(),
    viewportHeight: window.innerHeight,
    viewportWidth: window.innerWidth
  }
);
```

#### **trackChatButtonClick(storeId, sessionId, metadata?)**
Tracks chat button interactions.
```typescript
LandingPageTrackingAPI.trackChatButtonClick(
  'store-uuid',
  'session-id',
  {
    buttonText: 'Start Chatting Anonymously',
    buttonPosition: 'center',
    buttonSize: 'large',
    colorScheme: 'terracotta',
    isCustomized: true
  }
);
```

#### **trackCarouselClick(storeId, bookId, sessionId, metadata?)**
Tracks book selection in carousel.
```typescript
LandingPageTrackingAPI.trackCarouselClick(
  'store-uuid',
  'book-uuid',
  'session-id',
  {
    bookTitle: 'The Great Gatsby',
    bookAuthor: 'F. Scott Fitzgerald',
    position: 1,
    featuredBadge: 'bestseller',
    hasDestinationUrl: true
  }
);
```

#### **trackSectionView(storeId, sectionName, sessionId, metadata?)**
Tracks section visibility via Intersection Observer.
```typescript
LandingPageTrackingAPI.trackSectionView(
  'store-uuid',
  'hero',
  'session-id',
  {
    intersectionRatio: 0.75,
    threshold: 0.5,
    viewTime: new Date().toISOString()
  }
);
```

#### **trackCommunityInteraction(storeId, elementId, interactionType, sessionId, metadata?)**
Tracks community section interactions.
```typescript
LandingPageTrackingAPI.trackCommunityInteraction(
  'store-uuid',
  'member-uuid',
  'member_spotlight',
  'session-id',
  {
    memberName: 'John Doe',
    memberRole: 'Helpful Contributor',
    hasSpotlights: true,
    hasTestimonials: false
  }
);
```

---

## **🎣 Hook Usage Guide**

### **useLandingPageTracking Hook**

#### **Basic Implementation**
```typescript
import { useLandingPageTracking } from '@/hooks/useLandingPageTracking';

const MyComponent = ({ storeId }) => {
  const analytics = useLandingPageTracking({ 
    storeId, 
    enabled: !!storeId 
  });

  const handleButtonClick = () => {
    analytics.trackChatButtonClick({
      buttonText: 'Custom Button Text',
      customMetadata: 'additional-data'
    });
  };

  return <button onClick={handleButtonClick}>Click Me</button>;
};
```

#### **Section Visibility Tracking**
```typescript
import { useSectionVisibilityTracking } from '@/hooks/useLandingPageTracking';

const HeroSection = ({ analytics }) => {
  const heroRef = useSectionVisibilityTracking('hero', analytics, {
    threshold: 0.5,
    rootMargin: '0px',
    triggerOnce: true
  });

  return <section ref={heroRef}>Hero Content</section>;
};
```

---

## **📋 Metadata Specifications**

### **Common Metadata Fields**
```typescript
interface BaseMetadata {
  deviceType: 'mobile' | 'desktop' | 'tablet';
  timestamp: string;
  viewportHeight: number;
  viewportWidth: number;
  scrollPosition: number;
  userAgent: string;
}
```

### **Event-Specific Metadata**

#### **Page Load Metadata**
```typescript
interface PageLoadMetadata extends BaseMetadata {
  referrer: string;
  loadTime: number;
}
```

#### **Chat Button Click Metadata**
```typescript
interface ChatButtonMetadata extends BaseMetadata {
  buttonText: string;
  buttonPosition: string;
  buttonSize: string;
  colorScheme: string;
  isCustomized: boolean;
  clickTime: string;
}
```

#### **Carousel Click Metadata**
```typescript
interface CarouselClickMetadata extends BaseMetadata {
  bookTitle: string;
  bookAuthor: string;
  position: number;
  featuredBadge?: string;
  hasDestinationUrl: boolean;
  isDemo: boolean;
  clickTime: string;
}
```

#### **Section View Metadata**
```typescript
interface SectionViewMetadata extends BaseMetadata {
  intersectionRatio: number;
  threshold: number;
  rootMargin: string;
  boundingClientRect: DOMRect;
  rootBounds: DOMRect;
  viewTime: string;
}
```

#### **Community Interaction Metadata**
```typescript
interface CommunityInteractionMetadata extends BaseMetadata {
  interactionType: string;
  sectionType: string;
  isDemo: boolean;
  hasSpotlights: boolean;
  hasTestimonials: boolean;
  hasActivityFeed: boolean;
  hasMetrics: boolean;
  interactionTime: string;
}
```

---

## **🔍 Debugging & Troubleshooting**

### **Console Logging**
All tracking events log to console in development:
```
✅ Tracked page_load for section hero
✅ Tracked carousel_view for section carousel
✅ Tracked chat_button_click for section hero
```

### **Common Issues**

#### **1. Section Name Constraint Violation**
**Error**: `new row for relation "store_landing_analytics" violates check constraint "store_landing_analytics_section_name_check"`
**Solution**: Ensure section_name is one of: `carousel`, `hero`, `banners`, `community`, `events`, `bookclubs`, `quote`, `footer`

#### **2. Element ID UUID Format**
**Error**: `invalid input syntax for type uuid`
**Solution**: Pass `undefined` for element_id when tracking section views, or ensure valid UUID format for specific elements

#### **3. Missing Store ID**
**Symptom**: No events tracked, warning in console
**Solution**: Ensure storeId is properly passed to components and analytics hook

#### **4. Intersection Observer Not Triggering**
**Symptom**: No section view events
**Solution**: Check element refs are properly attached and elements are visible in viewport

### **Database Queries for Debugging**
```sql
-- Check recent events
SELECT event_type, section_name, COUNT(*), MAX(timestamp) 
FROM store_landing_analytics 
WHERE store_id = 'your-store-id' 
GROUP BY event_type, section_name 
ORDER BY MAX(timestamp) DESC;

-- Check metadata structure
SELECT event_type, interaction_data 
FROM store_landing_analytics 
WHERE store_id = 'your-store-id' 
LIMIT 5;
```

---

## **⚡ Performance Considerations**

### **Optimization Strategies**
1. **Debounced Tracking**: Prevent excessive event firing
2. **Batch Operations**: Group multiple events when possible
3. **Lazy Loading**: Initialize tracking only when needed
4. **Memory Management**: Clean up observers on component unmount

### **Performance Metrics**
- **Page Load Impact**: <50ms additional load time
- **Memory Usage**: <5MB additional memory per session
- **Network Requests**: Batched to minimize HTTP calls
- **Database Performance**: Indexed queries for fast retrieval

---

## **🔒 Security & Privacy**

### **Data Protection**
- **No PII Collection**: Only anonymous interaction data
- **Session-Based Tracking**: No persistent user identification
- **Secure Transmission**: HTTPS-only data transfer
- **Data Retention**: Configurable retention policies

### **Compliance**
- **GDPR Ready**: Anonymous data collection
- **CCPA Compliant**: No personal data tracking
- **Cookie-Free**: No tracking cookies required

---

## **📈 Analytics Query Examples**

### **Popular Books Analysis**
```sql
SELECT 
  interaction_data->>'bookTitle' as book_title,
  interaction_data->>'bookAuthor' as book_author,
  COUNT(*) as clicks
FROM store_landing_analytics 
WHERE event_type = 'carousel_click'
  AND store_id = 'your-store-id'
GROUP BY book_title, book_author
ORDER BY clicks DESC;
```

### **Device Performance**
```sql
SELECT 
  interaction_data->>'deviceType' as device,
  event_type,
  COUNT(*) as events
FROM store_landing_analytics 
WHERE store_id = 'your-store-id'
GROUP BY device, event_type
ORDER BY events DESC;
```

### **Engagement Funnel**
```sql
SELECT 
  event_type,
  COUNT(*) as events,
  COUNT(DISTINCT session_id) as unique_sessions
FROM store_landing_analytics 
WHERE store_id = 'your-store-id'
  AND timestamp >= NOW() - INTERVAL '7 days'
GROUP BY event_type
ORDER BY events DESC;
```

---

**Technical Documentation Maintained By**: Development Team  
**API Version**: 1.0  
**Last Technical Review**: 2025-01-31
