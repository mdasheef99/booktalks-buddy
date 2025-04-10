import type { NextApiRequest, NextApiResponse } from 'next';
import { getClubTopics, updateBookClub, deleteBookClub } from '@/lib/api';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { clubId } = req.query;
  const userId = req.headers['x-user-id'] as string; // Placeholder: extract from auth/session in real app

  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (typeof clubId !== 'string') {
    return res.status(400).json({ error: 'Invalid clubId' });
  }

  try {
    if (req.method === 'GET') {
      // Fetch club details + topics
      const topics = await getClubTopics(userId, clubId);
      return res.status(200).json({ clubId, topics });
    }

    if (req.method === 'PUT') {
      const updates = req.body;
      const updatedClub = await updateBookClub(userId, clubId, updates);
      return res.status(200).json(updatedClub);
    }

    if (req.method === 'DELETE') {
      await deleteBookClub(userId, clubId);
      return res.status(200).json({ success: true });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error: any) {
    console.error(error);
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
}