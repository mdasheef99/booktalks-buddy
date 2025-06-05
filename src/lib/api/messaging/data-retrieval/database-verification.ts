/**
 * Database Verification Module
 * 
 * Handles verification of database tables and schema integrity
 */

import { supabase } from '@/lib/supabase';
import type { DatabaseTableStatus } from './types';

/**
 * Verify that the required database tables exist and are accessible
 */
export async function verifyDatabaseTables(): Promise<DatabaseTableStatus> {
  const results: DatabaseTableStatus = {
    conversations: false,
    conversation_participants: false,
    direct_messages: false,
    users: false
  };

  try {
    // Test conversations table
    const { error: convError } = await supabase
      .from('conversations')
      .select('id')
      .limit(1);
    results.conversations = !convError;

    // Test conversation_participants table
    const { error: partError } = await supabase
      .from('conversation_participants')
      .select('conversation_id')
      .limit(1);
    results.conversation_participants = !partError;

    // Test direct_messages table
    const { error: msgError } = await supabase
      .from('direct_messages')
      .select('id')
      .limit(1);
    results.direct_messages = !msgError;

    // Test users table
    const { error: userError } = await supabase
      .from('users')
      .select('id')
      .limit(1);
    results.users = !userError;

  } catch (error) {
    console.error('Database verification failed:', error);
  }

  return results;
}

/**
 * Check if all required tables are accessible
 */
export async function areAllTablesAccessible(): Promise<boolean> {
  const status = await verifyDatabaseTables();
  return Object.values(status).every(accessible => accessible);
}

/**
 * Get detailed table status report
 */
export async function getTableStatusReport(): Promise<{
  accessible: string[];
  inaccessible: string[];
  allAccessible: boolean;
}> {
  const status = await verifyDatabaseTables();
  
  const accessible: string[] = [];
  const inaccessible: string[] = [];
  
  Object.entries(status).forEach(([table, isAccessible]) => {
    if (isAccessible) {
      accessible.push(table);
    } else {
      inaccessible.push(table);
    }
  });
  
  return {
    accessible,
    inaccessible,
    allAccessible: inaccessible.length === 0
  };
}
