/**
 * ReportActionDialog Test
 * Basic test to verify the component renders and integrates correctly
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import { ReportActionDialog } from '../ReportActionDialog';
import type { Report } from '@/types/reporting';

// Mock dependencies
jest.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 'test-user', email: 'test@example.com' }
  })
}));

jest.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: jest.fn()
  })
}));

jest.mock('@/services/reportingService', () => ({
  updateReport: jest.fn()
}));

jest.mock('@/lib/api/admin/accountManagement', () => ({
  getUserAccountStatus: jest.fn()
}));

jest.mock('@/components/admin/UserAccountManager', () => ({
  UserAccountManager: () => <div data-testid="user-account-manager">User Account Manager</div>
}));

jest.mock('@/components/common/UserName', () => ({
  __esModule: true,
  default: ({ userId }: { userId: string }) => <span>{userId}</span>
}));

const mockReport: Report = {
  id: 'test-report-id',
  reporter_id: 'reporter-user-id',
  reporter_username: 'reporter',
  target_type: 'user_profile',
  target_id: 'target-id',
  target_user_id: 'target-user-id',
  target_username: 'target-user',
  reason: 'harassment',
  description: 'Test report description',
  severity: 'high',
  club_id: null,
  store_id: null,
  status: 'pending',
  priority: 2,
  resolved_by: null,
  resolved_at: null,
  resolution_action: null,
  resolution_notes: null,
  created_at: '2025-01-01T00:00:00Z',
  updated_at: '2025-01-01T00:00:00Z'
};

describe('ReportActionDialog', () => {
  it('renders dialog when open with report', () => {
    render(
      <ReportActionDialog
        report={mockReport}
        open={true}
        onOpenChange={jest.fn()}
        onActionComplete={jest.fn()}
      />
    );

    expect(screen.getByText('Take Action on Report')).toBeInTheDocument();
    expect(screen.getByText('Report Details')).toBeInTheDocument();
    expect(screen.getByText('high severity')).toBeInTheDocument();
    expect(screen.getByText('Test report description')).toBeInTheDocument();
  });

  it('does not render when closed', () => {
    render(
      <ReportActionDialog
        report={mockReport}
        open={false}
        onOpenChange={jest.fn()}
        onActionComplete={jest.fn()}
      />
    );

    expect(screen.queryByText('Take Action on Report')).not.toBeInTheDocument();
  });

  it('does not render when no report provided', () => {
    render(
      <ReportActionDialog
        report={null}
        open={true}
        onOpenChange={jest.fn()}
        onActionComplete={jest.fn()}
      />
    );

    expect(screen.queryByText('Take Action on Report')).not.toBeInTheDocument();
  });
});
