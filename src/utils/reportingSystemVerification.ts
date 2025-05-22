// Reporting System Verification Utilities
// Verify Phase 2 implementation is working correctly

import { supabase } from '@/lib/supabase';
import { createReport, getReports, getReportStats } from '@/services/reportingService';
import type { CreateReportData } from '@/types/reporting';

/**
 * Verify database schema is correctly set up
 */
export async function verifyDatabaseSchema(): Promise<boolean> {
  try {
    console.log('🔍 Verifying database schema...');

    // Check if reports table exists and has correct structure
    const { data: reportsTable, error: reportsError } = await supabase
      .from('reports')
      .select('*')
      .limit(1);

    if (reportsError && reportsError.code !== 'PGRST116') {
      console.error('❌ Reports table verification failed:', reportsError);
      return false;
    }

    // Check if report_evidence table exists
    const { data: evidenceTable, error: evidenceError } = await supabase
      .from('report_evidence')
      .select('*')
      .limit(1);

    if (evidenceError && evidenceError.code !== 'PGRST116') {
      console.error('❌ Report evidence table verification failed:', evidenceError);
      return false;
    }

    // Check if moderation_actions table exists
    const { data: actionsTable, error: actionsError } = await supabase
      .from('moderation_actions')
      .select('*')
      .limit(1);

    if (actionsError && actionsError.code !== 'PGRST116') {
      console.error('❌ Moderation actions table verification failed:', actionsError);
      return false;
    }

    // Check if user_warnings table exists
    const { data: warningsTable, error: warningsError } = await supabase
      .from('user_warnings')
      .select('*')
      .limit(1);

    if (warningsError && warningsError.code !== 'PGRST116') {
      console.error('❌ User warnings table verification failed:', warningsError);
      return false;
    }

    console.log('✅ All database tables verified successfully');
    return true;
  } catch (error) {
    console.error('❌ Database schema verification failed:', error);
    return false;
  }
}

/**
 * Test report creation functionality
 */
export async function testReportCreation(userId: string): Promise<boolean> {
  try {
    console.log('🧪 Testing report creation...');

    const testReportData: CreateReportData = {
      target_type: 'user_behavior',
      target_user_id: userId, // Self-report for testing (will be filtered in UI)
      reason: 'spam',
      description: 'This is a test report to verify the reporting system is working correctly.',
    };

    const report = await createReport(userId, testReportData);

    if (!report) {
      console.error('❌ Report creation failed');
      return false;
    }

    console.log('✅ Report created successfully:', report.id);

    // Clean up test report
    await supabase
      .from('reports')
      .delete()
      .eq('id', report.id);

    console.log('✅ Test report cleaned up');
    return true;
  } catch (error) {
    console.error('❌ Report creation test failed:', error);
    return false;
  }
}

/**
 * Test report querying functionality
 */
export async function testReportQuerying(): Promise<boolean> {
  try {
    console.log('🧪 Testing report querying...');

    const result = await getReports({}, { page: 1, limit: 10 });

    if (!result) {
      console.error('❌ Report querying failed');
      return false;
    }

    console.log('✅ Report querying successful:', {
      totalReports: result.total_count,
      currentPage: result.page,
      totalPages: result.total_pages
    });

    return true;
  } catch (error) {
    console.error('❌ Report querying test failed:', error);
    return false;
  }
}

/**
 * Test report statistics functionality
 */
export async function testReportStatistics(): Promise<boolean> {
  try {
    console.log('🧪 Testing report statistics...');

    const stats = await getReportStats();

    if (!stats) {
      console.error('❌ Report statistics failed');
      return false;
    }

    console.log('✅ Report statistics successful:', {
      totalReports: stats.total_reports,
      pendingReports: stats.pending_reports,
      resolvedReports: stats.resolved_reports
    });

    return true;
  } catch (error) {
    console.error('❌ Report statistics test failed:', error);
    return false;
  }
}

/**
 * Run comprehensive verification of the reporting system
 */
export async function runReportingSystemVerification(userId?: string): Promise<boolean> {
  console.log('🚀 Starting Reporting System Verification...\n');

  const tests = [
    { name: 'Database Schema', test: () => verifyDatabaseSchema() },
    { name: 'Report Querying', test: () => testReportQuerying() },
    { name: 'Report Statistics', test: () => testReportStatistics() },
  ];

  // Add report creation test if user ID is provided
  if (userId) {
    tests.push({ name: 'Report Creation', test: () => testReportCreation(userId) });
  }

  let allPassed = true;
  const results: { name: string; passed: boolean }[] = [];

  for (const { name, test } of tests) {
    try {
      const passed = await test();
      results.push({ name, passed });
      if (!passed) {
        allPassed = false;
      }
    } catch (error) {
      console.error(`Test "${name}" threw an error:`, error);
      results.push({ name, passed: false });
      allPassed = false;
    }
    console.log(''); // Add spacing between tests
  }

  // Print results summary
  console.log('📊 Verification Results Summary:');
  console.log('================================');
  results.forEach(({ name, passed }) => {
    console.log(`${passed ? '✅' : '❌'} ${name}`);
  });
  console.log('================================');
  console.log(`Overall Result: ${allPassed ? '✅ ALL TESTS PASSED' : '❌ SOME TESTS FAILED'}`);

  if (allPassed) {
    console.log('\n🎉 Reporting System is fully operational!');
    console.log('You can now:');
    console.log('• Submit reports through the UI');
    console.log('• View reports in the moderation dashboard');
    console.log('• Access reporting functionality in discussions');
  } else {
    console.log('\n⚠️  Some issues were detected. Please review the errors above.');
  }

  return allPassed;
}

/**
 * Quick health check for the reporting system
 */
export async function reportingSystemHealthCheck(): Promise<{
  healthy: boolean;
  issues: string[];
  stats: any;
}> {
  const issues: string[] = [];
  let stats = null;

  try {
    // Check database connectivity
    const { error: dbError } = await supabase
      .from('reports')
      .select('count')
      .limit(1);

    if (dbError && dbError.code !== 'PGRST116') {
      issues.push('Database connectivity issue');
    }

    // Get basic stats
    try {
      stats = await getReportStats();
    } catch (error) {
      issues.push('Statistics calculation error');
    }

    // Check if tables exist
    const tables = ['reports', 'report_evidence', 'moderation_actions', 'user_warnings'];
    for (const table of tables) {
      try {
        await supabase.from(table).select('*').limit(1);
      } catch (error) {
        issues.push(`Table ${table} not accessible`);
      }
    }

  } catch (error) {
    issues.push('General system error');
  }

  return {
    healthy: issues.length === 0,
    issues,
    stats
  };
}

/**
 * Demo data creation for testing the reporting system
 */
export async function createDemoReports(userId: string): Promise<boolean> {
  try {
    console.log('🎭 Creating demo reports for testing...');

    const demoReports: CreateReportData[] = [
      {
        target_type: 'user_behavior',
        target_user_id: userId,
        reason: 'spam',
        description: 'Demo report: User posting repetitive promotional content'
      },
      {
        target_type: 'discussion_post',
        target_id: 'demo-post-1',
        target_user_id: userId,
        reason: 'inappropriate_content',
        description: 'Demo report: Post contains inappropriate language'
      },
      {
        target_type: 'user_profile',
        target_id: userId,
        target_user_id: userId,
        reason: 'harassment',
        description: 'Demo report: Profile contains harassing content'
      }
    ];

    let successCount = 0;
    for (const reportData of demoReports) {
      const report = await createReport(userId, reportData);
      if (report) {
        successCount++;
        console.log(`✅ Created demo report: ${report.reason} (${report.severity})`);
      }
    }

    console.log(`🎉 Created ${successCount}/${demoReports.length} demo reports`);
    return successCount === demoReports.length;
  } catch (error) {
    console.error('❌ Demo report creation failed:', error);
    return false;
  }
}
