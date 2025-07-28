/**
 * User Components Index
 * 
 * Centralized exports for all user-related UI components including payment history.
 */

// Payment History Components
export { PaymentHistoryComponent } from './PaymentHistoryComponent';
export { CompactPaymentHistory, PaymentSummaryCard } from './CompactPaymentHistory';
export { PaymentHistoryModal } from './PaymentHistoryModal';

/**
 * Usage Examples:
 * 
 * // Full payment history with filters and pagination
 * import { PaymentHistoryComponent } from '@/components/user';
 * <PaymentHistoryComponent showSummary={true} showFilters={true} />
 * 
 * // Compact version for profile sections
 * import { CompactPaymentHistory } from '@/components/user';
 * <CompactPaymentHistory maxItems={5} onViewAll={() => setShowModal(true)} />
 * 
 * // Payment summary card for dashboards
 * import { PaymentSummaryCard } from '@/components/user';
 * <PaymentSummaryCard onClick={() => navigate('/profile/payments')} />
 * 
 * // Modal for detailed payment history
 * import { PaymentHistoryModal } from '@/components/user';
 * <PaymentHistoryModal isOpen={showModal} onClose={() => setShowModal(false)} />
 */
