# Second-Hand Book Listings Feature Documentation

## Overview

The Second-Hand Book Listings feature allows customers to submit books they want to sell to the bookstore. Store owners can review these submissions through the admin panel and approve or reject them. This feature facilitates the acquisition of second-hand books for the store's inventory.

## Feature Requirements Met

✅ **Optional Fields**: ISBN, description, and asking price are optional in the form  
✅ **Direct Contact**: Store owners contact customers directly via phone/email  
✅ **Status Management**: Store owners can update listing status for record-keeping  
✅ **SQL Migrations**: All database changes implemented via SQL migration files  
✅ **Established Patterns**: Follows existing codebase architecture and patterns  

## Architecture Overview

### Database Schema
- **Table**: `book_listings`
- **Storage Bucket**: `book-listing-images`
- **Migration File**: `supabase/migrations/20250625_book_listings_system.sql`

### Key Components
1. **Customer Interface**: Landing page form for book submissions
2. **Admin Interface**: Store owner management panel
3. **Service Layer**: Business logic and API integration
4. **Storage**: Image upload and management

## Database Schema

### book_listings Table

```sql
CREATE TABLE book_listings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id UUID REFERENCES stores(id) ON DELETE CASCADE NOT NULL,
    
    -- Customer Information
    customer_name TEXT NOT NULL CHECK (char_length(customer_name) <= 100),
    customer_email TEXT NOT NULL CHECK (char_length(customer_email) <= 255),
    customer_phone TEXT CHECK (char_length(customer_phone) <= 20),
    
    -- Book Information
    book_title TEXT NOT NULL CHECK (char_length(book_title) <= 200),
    book_author TEXT NOT NULL CHECK (char_length(book_author) <= 100),
    book_isbn TEXT CHECK (char_length(book_isbn) <= 20), -- Optional
    book_condition TEXT NOT NULL CHECK (book_condition IN ('excellent', 'very_good', 'good', 'fair', 'poor')),
    book_description TEXT CHECK (char_length(book_description) <= 1000), -- Optional
    asking_price DECIMAL(10,2) CHECK (asking_price >= 0), -- Optional
    
    -- Book Images (3 images max)
    image_1_url TEXT,
    image_2_url TEXT,
    image_3_url TEXT,
    
    -- Status and Management
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    store_owner_notes TEXT CHECK (char_length(store_owner_notes) <= 500),
    reviewed_by UUID REFERENCES auth.users(id),
    reviewed_at TIMESTAMPTZ,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);
```

### Storage Bucket

- **Bucket Name**: `book-listing-images`
- **File Size Limit**: 3MB per image
- **Allowed Types**: JPEG, PNG, WebP
- **Public Access**: Yes (for viewing images)

## Component Structure

### Customer-Facing Components

#### BookListingSection.tsx
- **Location**: `src/components/landing/BookListingSection.tsx`
- **Purpose**: Landing page section with feature overview and call-to-action
- **Features**: 
  - Feature highlights
  - Guidelines for acceptable books
  - Toggle to show/hide form

#### BookListingForm.tsx
- **Location**: `src/components/landing/BookListingForm.tsx`
- **Purpose**: Customer form for submitting book listings
- **Features**:
  - Required fields: Customer info, book title, author, condition
  - Optional fields: Phone, ISBN, description, asking price
  - Image upload (up to 3 images)
  - Real-time validation
  - Success/error handling

### Admin Components

#### BookListingsManagement.tsx
- **Location**: `src/pages/admin/store/BookListingsManagement.tsx`
- **Purpose**: Store owner interface for managing book listings
- **Features**:
  - Tabbed view (Pending, Approved, Rejected, All)
  - Search functionality
  - Listing cards with quick actions
  - Detailed view dialog
  - Status update with notes

## Service Layer

### BookListingService
- **Location**: `src/lib/services/bookListingService.ts`
- **Methods**:
  - `submitBookListing()`: Create new listing with images
  - `getStoreBookListings()`: Fetch listings for a store
  - `updateBookListingStatus()`: Update listing status
  - `getBookListing()`: Get single listing
  - `deleteBookListing()`: Delete listing and cleanup images

### Types
- **Location**: `src/types/bookListings.ts`
- **Exports**: Interfaces, types, constants, validation rules

## API Endpoints

### POST /api/book-listings
- **Purpose**: Create new book listing
- **Access**: Public (customers)
- **Validation**: Required fields, email format, string lengths

### GET /api/book-listings
- **Purpose**: Get listings for a store
- **Access**: Store owners only
- **Parameters**: `storeId`, `status` (optional)

### GET /api/book-listings/[listingId]
- **Purpose**: Get specific listing
- **Access**: Store owners only

### PUT /api/book-listings/[listingId]
- **Purpose**: Update listing status
- **Access**: Store owners only
- **Body**: `status`, `store_owner_notes`, `reviewed_by`

### DELETE /api/book-listings/[listingId]
- **Purpose**: Delete listing and cleanup images
- **Access**: Store owners only

## Security & Permissions

### Row Level Security (RLS)
- **Store owners** can view/update listings for their store only
- **Public** can create new listings
- **Image storage** allows public uploads and viewing

### Validation
- **Client-side**: Real-time form validation
- **Server-side**: API endpoint validation
- **Database**: CHECK constraints and foreign keys

## Integration Points

### Landing Page Integration
- Added `BookListingSection` between `BookClubsSection` and `CommunityShowcaseSection`
- Follows existing landing page component patterns
- Uses established design system colors and animations

### Admin Panel Integration
- Added navigation item in `AdminLayout.tsx`
- Added route in `App.tsx` under store management
- Follows existing admin panel patterns and permissions

### File Upload Integration
- Uses existing `ImageUploadService`
- Follows established storage bucket patterns
- Integrates with existing RLS policies

## Usage Flow

### Customer Flow
1. Customer visits landing page
2. Scrolls to "Sell Your Books" section
3. Clicks "List Your Books Now"
4. Fills out form with book details
5. Uploads 1-3 images of the book
6. Submits form
7. Receives confirmation message

### Store Owner Flow
1. Store owner logs into admin panel
2. Navigates to Store Management > Book Listings
3. Reviews pending submissions
4. Views detailed information and images
5. Approves or rejects listings with optional notes
6. Contacts customers directly via provided contact info

## Testing Checklist

### Customer Form Testing
- [ ] Required field validation
- [ ] Optional field handling
- [ ] Email format validation
- [ ] Phone number validation (optional)
- [ ] ISBN validation (optional)
- [ ] Price validation (optional)
- [ ] Image upload (1-3 images)
- [ ] File size validation (3MB limit)
- [ ] File type validation (JPEG, PNG, WebP)
- [ ] Form submission success
- [ ] Error handling

### Admin Panel Testing
- [ ] Store owner access control
- [ ] Listing display and filtering
- [ ] Search functionality
- [ ] Status updates (approve/reject)
- [ ] Notes functionality
- [ ] Image viewing
- [ ] Customer contact information display
- [ ] Responsive design

### API Testing
- [ ] Create listing endpoint
- [ ] Get listings endpoint
- [ ] Update listing endpoint
- [ ] Delete listing endpoint
- [ ] Authentication and authorization
- [ ] Input validation
- [ ] Error responses

### Database Testing
- [ ] Migration execution
- [ ] RLS policies
- [ ] Data integrity constraints
- [ ] Storage bucket configuration
- [ ] Image cleanup on deletion

## Deployment Notes

1. **Run Migration**: Execute `20250625_book_listings_system.sql`
2. **Storage Bucket**: Verify `book-listing-images` bucket is created
3. **RLS Policies**: Confirm all policies are active
4. **Admin Access**: Test store owner permissions
5. **Image Upload**: Verify image upload and storage

## Future Enhancements

- Email notifications for status changes
- Bulk operations for admin panel
- Advanced search and filtering
- Integration with inventory management
- Customer portal for tracking submissions
- Automated pricing suggestions
- Book condition assessment guidelines
