import { supabase } from '@/lib/supabase';

/**
 * Supported tables for count queries
 */
export type CountableTable = 
  | 'book_clubs' 
  | 'users' 
  | 'club_members' 
  | 'current_books' 
  | 'discussion_topics' 
  | 'discussion_posts';

/**
 * Condition operators for queries
 */
export type ConditionOperator = 'eq' | 'gte' | 'lt' | 'lte' | 'neq';

/**
 * Query condition type
 */
export interface QueryCondition {
  field: string;
  value: any;
  operator: ConditionOperator;
}

/**
 * Safely execute a count query for specific tables
 * @param tableName The table to query
 * @param conditions Optional array of conditions to apply to the query
 * @param fallbackValue Value to return if the query fails
 * @returns The count of records matching the query
 */
export const safeCountQuery = async (
  tableName: CountableTable,
  conditions?: QueryCondition[],
  fallbackValue = 0
): Promise<number> => {
  try {
    let query = supabase.from(tableName).select('*', { count: 'exact', head: true });

    // Add conditions if provided
    if (conditions && conditions.length > 0) {
      conditions.forEach(condition => {
        switch (condition.operator) {
          case 'eq':
            query = query.eq(condition.field, condition.value);
            break;
          case 'gte':
            query = query.gte(condition.field, condition.value);
            break;
          case 'lt':
            query = query.lt(condition.field, condition.value);
            break;
          case 'lte':
            query = query.lte(condition.field, condition.value);
            break;
          case 'neq':
            query = query.neq(condition.field, condition.value);
            break;
        }
      });
    }

    const result = await query;

    if (result.error) {
      console.error(`Error querying ${tableName}:`, result.error);
      return fallbackValue;
    }

    return result.count || fallbackValue;
  } catch (error) {
    console.error(`Exception querying ${tableName}:`, error);
    return fallbackValue;
  }
};

/**
 * Verify database connection with a simple query
 * @returns True if connection is successful, false otherwise
 */
export const verifyDatabaseConnection = async (): Promise<boolean> => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('id')
      .limit(1);

    if (error) {
      console.error('Database connection error:', error);
      return false;
    }

    return true;
  } catch (e) {
    console.error('Error connecting to database:', e);
    return false;
  }
};

/**
 * Check if Supabase is authenticated
 * @returns True if authenticated, false otherwise
 * @throws Error if authentication fails
 */
export const checkAuthentication = async (): Promise<boolean> => {
  const { data: authData, error: authError } = await supabase.auth.getSession();
  
  if (authError) {
    console.error('Auth error:', authError);
    throw new Error('Authentication error: ' + authError.message);
  }

  if (!authData?.session) {
    console.error('No active session found');
    throw new Error('Authentication error: No active session found. Please log in again.');
  }

  return true;
};
