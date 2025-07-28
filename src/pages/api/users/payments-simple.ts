/**
 * Simple Payment History API
 * 
 * GET /api/users/payments-simple
 * Returns mock payment data for testing
 */

import { NextApiRequest, NextApiResponse } from 'next';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Return mock data for testing
    const mockPayments = [
      {
        id: '1',
        amount: 19.99,
        currency: 'USD',
        payment_method: 'cash',
        payment_reference: 'TEST-001',
        payment_date: '2025-01-15T10:00:00Z',
        notes: 'Test payment 1',
        created_at: '2025-01-15T10:00:00Z'
      },
      {
        id: '2',
        amount: 9.99,
        currency: 'USD',
        payment_method: 'card',
        payment_reference: 'TEST-002',
        payment_date: '2025-01-01T10:00:00Z',
        notes: 'Test payment 2',
        created_at: '2025-01-01T10:00:00Z'
      }
    ];

    const response = {
      payments: mockPayments,
      pagination: {
        total: 2,
        page: 1,
        limit: 20,
        hasMore: false
      },
      summary: {
        totalPayments: 2,
        totalAmount: 29.98,
        firstPaymentDate: '2025-01-01T10:00:00Z',
        lastPaymentDate: '2025-01-15T10:00:00Z',
        uniqueSubscriptions: 1
      }
    };

    return res.status(200).json(response);

  } catch (error) {
    console.error('Error in simple payments API:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
