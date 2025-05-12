# Subscription System Implementation

## Overview

This document outlines the implementation of the subscription management system for BookTalks Buddy. The system allows store owners to upgrade users to privileged tiers with monthly or annual subscription plans and track payment information.

## Admin User Section Structure

The admin user section has been restructured to provide a more organized and user-friendly interface for managing users and their subscription tiers:

1. **User List Page**:
   - Displays a list of all users with their basic information
   - Includes search functionality to filter users
   - Shows user tier status with visual indicators
   - Provides tier management controls for each user

2. **User Tier Management**:
   - Implemented as a component that can be embedded in user cards
   - Provides a dropdown to select the user's tier
   - Shows a confirmation dialog before making changes
   - Includes fields for subscription details and payment information

3. **Subscription Information Display**:
   - Collapsible section in user cards for privileged users
   - Shows subscription details (tier, type, start/end dates)
   - Displays payment history with amounts and references
   - Provides a clean, organized view of subscription status

## Database Schema

### Tables

#### 1. user_subscriptions

Stores information about user subscriptions:

```sql
CREATE TABLE user_subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  store_id UUID NOT NULL,
  tier VARCHAR NOT NULL CHECK (tier IN ('privileged', 'privileged_plus')),
  subscription_type VARCHAR NOT NULL CHECK (subscription_type IN ('monthly', 'annual')),
  start_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  end_date TIMESTAMP WITH TIME ZONE NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  auto_renew BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
)
```

#### 2. payment_records

Tracks payment information for subscriptions:

```sql
CREATE TABLE payment_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  subscription_id UUID REFERENCES user_subscriptions(id) ON DELETE SET NULL,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  store_id UUID NOT NULL,
  amount DECIMAL(10, 2),
  currency VARCHAR DEFAULT 'USD',
  payment_method VARCHAR NOT NULL DEFAULT 'offline',
  payment_reference VARCHAR,
  payment_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  recorded_by UUID NOT NULL REFERENCES users(id),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
)
```

### Helper Functions

1. **has_active_subscription(user_id)**: Checks if a user has an active subscription
2. **get_active_subscription(user_id)**: Gets a user's active subscription details
3. **create_subscription_with_payment(...)**: Creates a subscription and payment record in one transaction

### Triggers

1. **set_subscription_end_date_insert_trigger**: Sets the end date for new subscriptions
2. **set_subscription_end_date_update_trigger**: Updates the end date when subscription type changes
3. **update_user_subscriptions_updated_at**: Updates the updated_at timestamp on changes

## Frontend Components

### UserTierManager

Enhanced to include:
- Subscription type selection (monthly/annual)
- Payment amount field
- Payment reference field
- Notes field
- Confirmation dialog

```tsx
// Key features
const [tier, setTier] = useState(currentTier);
const [subscriptionType, setSubscriptionType] = useState<'monthly' | 'annual'>('monthly');
const [paymentAmount, setPaymentAmount] = useState<string>('');
const [paymentReference, setPaymentReference] = useState('');
const [paymentNotes, setPaymentNotes] = useState('');
```

### UserSubscriptionInfo

New component to display:
- Subscription details (tier, type, start/end dates)
- Payment history
- Auto-renewal status

```tsx
// Key features
const [subscription, setSubscription] = useState<any>(null);
const [payments, setPayments] = useState<any[]>([]);

// Fetches subscription data
useEffect(() => {
  async function fetchSubscriptionData() {
    // Fetch the user's active subscription
    // Fetch payment records for this subscription
  }
}, [userId]);
```

## API Functions

### updateUserTier

Enhanced to:
- Update the user's tier in the database
- Create subscription and payment records for privileged tiers
- Use the helper function to ensure transaction safety

```typescript
// Key parameters
export async function updateUserTier(
  adminId: string,
  userId: string,
  tier: string,
  storeId: string,
  subscriptionType?: 'monthly' | 'annual',
  paymentReference?: string,
  amount?: number,
  notes?: string
) {
  // Implementation details
}
```

## User Interface Flow

1. Store owner selects a user in the admin panel
2. Store owner selects a new tier for the user
3. If upgrading to a privileged tier:
   - Store owner selects subscription type (monthly/annual)
   - Store owner enters payment details (optional)
   - Store owner confirms the upgrade
4. System updates the user's tier and creates subscription/payment records
5. Store owner can view subscription details in a collapsible section

## Security

- Row Level Security (RLS) policies ensure that:
  - Store owners and managers can view and manage subscriptions for their store
  - Users can view their own subscriptions
  - Payment records are properly secured

## Admin Panel Access Fix

A legacy condition was fixed that was incorrectly giving admin panel access to all users who had created a club. The following changes were made:

1. **Route Guards Update**:
   - `GlobalAdminRouteGuard.tsx` now uses entitlements instead of club roles
   - `AdminRouteGuard.tsx` properly checks for store-level admin entitlements
   - `MemberRouteGuard.tsx` updated to use the entitlements system

2. **Navigation Updates**:
   - `MainNavigation.tsx` now shows admin links only to users with proper entitlements
   - Admin section visibility is controlled by entitlements, not club roles

3. **Entitlements System**:
   - Enhanced to properly check for store-level admin permissions
   - Added helper functions to check specific entitlements
   - Implemented proper hierarchy of roles and permissions

## Future Enhancements

1. **Subscription Renewal**:
   - Implement automatic renewal for subscriptions
   - Send renewal notifications before expiration

2. **Payment Processing**:
   - Integrate with payment gateways for online payments
   - Implement recurring billing for subscriptions

3. **Reporting**:
   - Create reports for subscription revenue
   - Track subscription metrics (conversion, churn, etc.)

4. **User Portal**:
   - Allow users to manage their own subscriptions
   - Implement self-service upgrades and downgrades

## Migration Files

1. **20250525_add_subscription_tables.sql**: Creates the subscription and payment tables
2. **20250526_add_transaction_functions.sql**: Adds helper functions for subscription management

## Implementation Notes

- The subscription system is designed to work with offline payments initially
- Store owners manually record payment information
- The system calculates subscription end dates based on the subscription type
- Subscription information is displayed in the admin user list for privileged users
