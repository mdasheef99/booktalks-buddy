/**
 * Direct Messaging System - Database Debug Utilities
 * 
 * Utilities for debugging database schema and relationship issues
 */

import { supabase } from '@/lib/supabase';

/**
 * Comprehensive database schema verification
 */
export async function debugDatabaseSchema() {
  console.log('🔍 Starting database schema debug...');
  
  const results = {
    tables: {} as Record<string, boolean>,
    relationships: {} as Record<string, boolean>,
    sample_data: {} as Record<string, any>,
    errors: [] as string[]
  };

  // Test each table individually
  const tables = ['conversations', 'conversation_participants', 'direct_messages', 'users'];
  
  for (const table of tables) {
    try {
      console.log(`Testing table: ${table}`);
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .limit(1);
      
      if (error) {
        console.error(`❌ Error accessing ${table}:`, error);
        results.tables[table] = false;
        results.errors.push(`${table}: ${error.message}`);
      } else {
        console.log(`✅ Table ${table} accessible`);
        results.tables[table] = true;
        results.sample_data[table] = data;
      }
    } catch (err) {
      console.error(`❌ Exception testing ${table}:`, err);
      results.tables[table] = false;
      results.errors.push(`${table}: ${err}`);
    }
  }

  // Test relationships
  if (results.tables.conversations && results.tables.conversation_participants) {
    try {
      console.log('Testing conversations -> conversation_participants relationship');
      const { data, error } = await supabase
        .from('conversations')
        .select(`
          id,
          conversation_participants(user_id)
        `)
        .limit(1);
      
      if (error) {
        console.error('❌ Relationship error:', error);
        results.relationships['conversations_participants'] = false;
        results.errors.push(`Relationship error: ${error.message}`);
      } else {
        console.log('✅ Conversations -> participants relationship works');
        results.relationships['conversations_participants'] = true;
      }
    } catch (err) {
      console.error('❌ Exception testing relationship:', err);
      results.relationships['conversations_participants'] = false;
      results.errors.push(`Relationship exception: ${err}`);
    }
  }

  // Test users relationship
  if (results.tables.conversation_participants && results.tables.users) {
    try {
      console.log('Testing conversation_participants -> users relationship');
      const { data, error } = await supabase
        .from('conversation_participants')
        .select(`
          user_id,
          users(id, username, displayname)
        `)
        .limit(1);
      
      if (error) {
        console.error('❌ Users relationship error:', error);
        results.relationships['participants_users'] = false;
        results.errors.push(`Users relationship error: ${error.message}`);
      } else {
        console.log('✅ Participants -> users relationship works');
        results.relationships['participants_users'] = true;
      }
    } catch (err) {
      console.error('❌ Exception testing users relationship:', err);
      results.relationships['participants_users'] = false;
      results.errors.push(`Users relationship exception: ${err}`);
    }
  }

  console.log('🔍 Database debug complete');
  console.log('Results:', results);
  
  return results;
}

/**
 * Test the specific query that's failing
 */
export async function testFailingQuery(userId: string) {
  console.log('🧪 Testing the failing getUserConversations query...');
  
  try {
    // Test the original problematic query
    console.log('Testing original query structure...');
    const { data, error } = await supabase
      .from('conversations')
      .select(`
        id,
        store_id,
        created_at,
        updated_at,
        conversation_participants!inner(
          user_id,
          last_read_at,
          users(id, username, displayname)
        )
      `)
      .eq('conversation_participants.user_id', userId)
      .limit(1);
    
    if (error) {
      console.error('❌ Original query failed:', error);
      return { success: false, error: error.message };
    } else {
      console.log('✅ Original query works!', data);
      return { success: true, data };
    }
  } catch (err) {
    console.error('❌ Exception in original query:', err);
    return { success: false, error: err };
  }
}

/**
 * Create sample data for testing
 */
export async function createSampleData(userId: string, storeId: string) {
  console.log('🏗️ Creating sample data for testing...');
  
  try {
    // Create a test conversation
    const { data: conversation, error: convError } = await supabase
      .from('conversations')
      .insert({
        store_id: storeId
      })
      .select()
      .single();
    
    if (convError) {
      console.error('❌ Failed to create conversation:', convError);
      return { success: false, error: convError.message };
    }
    
    console.log('✅ Created conversation:', conversation.id);
    
    // Add user as participant
    const { error: partError } = await supabase
      .from('conversation_participants')
      .insert({
        conversation_id: conversation.id,
        user_id: userId
      });
    
    if (partError) {
      console.error('❌ Failed to add participant:', partError);
      return { success: false, error: partError.message };
    }
    
    console.log('✅ Added user as participant');
    
    // Send a test message
    const { error: msgError } = await supabase
      .from('direct_messages')
      .insert({
        conversation_id: conversation.id,
        sender_id: userId,
        content: 'Test message for debugging'
      });
    
    if (msgError) {
      console.error('❌ Failed to send message:', msgError);
      return { success: false, error: msgError.message };
    }
    
    console.log('✅ Sent test message');
    
    return { 
      success: true, 
      conversation_id: conversation.id,
      message: 'Sample data created successfully'
    };
    
  } catch (err) {
    console.error('❌ Exception creating sample data:', err);
    return { success: false, error: err };
  }
}
