import type { IncomingMessage, ServerResponse } from 'http';
import { listAdminMembers } from '@/lib/api';

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  const userId = req.headers['x-user-id'] as string; // Placeholder: extract from auth/session in real app

  if (!userId) {
    res.statusCode = 401;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: 'Unauthorized' }));
    return;
  }

  if (req.method !== 'GET') {
    res.statusCode = 405;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: 'Method not allowed' }));
    return;
  }

  try {
    const members = await listAdminMembers(userId);
    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify(members));
  } catch (error: any) {
    console.error(error);
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: error.message || 'Internal server error' }));
  }
}