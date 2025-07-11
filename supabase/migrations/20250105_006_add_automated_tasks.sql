-- Automated Subscription Management Tasks
-- Migration: 20250105_006_add_automated_tasks.sql
-- Purpose: Create automated tasks for subscription maintenance and monitoring
-- Development Phase: Basic automation for subscription system health

-- Enable pgcrypto for UUID generation if not already enabled
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =========================
-- Create scheduled_tasks table
-- =========================
CREATE TABLE IF NOT EXISTS scheduled_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_name TEXT UNIQUE NOT NULL,
  task_type TEXT NOT NULL CHECK (task_type IN (
    'subscription_expiry_check',
    'entitlement_validation',
    'health_monitoring',
    'cache_cleanup',
    'backup_creation',
    'metrics_aggregation'
  )),
  
  -- Task configuration
  is_enabled BOOLEAN DEFAULT TRUE,
  schedule_expression TEXT, -- Cron-like expression (for future use)
  run_interval_minutes INTEGER DEFAULT 60,
  
  -- Execution tracking
  last_run_at TIMESTAMPTZ,
  next_run_at TIMESTAMPTZ,
  last_run_status TEXT CHECK (last_run_status IN ('success', 'error', 'running', 'skipped')),
  last_run_duration_ms INTEGER,
  last_error_message TEXT,
  
  -- Statistics
  total_runs INTEGER DEFAULT 0,
  successful_runs INTEGER DEFAULT 0,
  failed_runs INTEGER DEFAULT 0,
  
  -- Configuration
  task_config JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

-- =========================
-- Create task_execution_logs table
-- =========================
CREATE TABLE IF NOT EXISTS task_execution_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_name TEXT NOT NULL,
  execution_id UUID DEFAULT gen_random_uuid(),
  
  -- Execution details
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  status TEXT NOT NULL CHECK (status IN ('running', 'success', 'error', 'timeout')),
  duration_ms INTEGER,
  
  -- Results and metrics
  items_processed INTEGER DEFAULT 0,
  items_updated INTEGER DEFAULT 0,
  items_failed INTEGER DEFAULT 0,
  execution_result JSONB DEFAULT '{}',
  error_details TEXT,
  
  -- Context
  triggered_by TEXT DEFAULT 'system' CHECK (triggered_by IN ('system', 'manual', 'api')),
  triggered_by_user UUID REFERENCES auth.users(id)
);

-- =========================
-- Indexes for performance
-- =========================
CREATE INDEX IF NOT EXISTS idx_scheduled_tasks_enabled_next_run ON scheduled_tasks(is_enabled, next_run_at);
CREATE INDEX IF NOT EXISTS idx_scheduled_tasks_type_status ON scheduled_tasks(task_type, last_run_status);
CREATE INDEX IF NOT EXISTS idx_task_execution_logs_task_started ON task_execution_logs(task_name, started_at DESC);
CREATE INDEX IF NOT EXISTS idx_task_execution_logs_status_started ON task_execution_logs(status, started_at DESC);

-- =========================
-- RLS Policies
-- =========================
ALTER TABLE scheduled_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_execution_logs ENABLE ROW LEVEL SECURITY;

-- Store administrators can manage scheduled tasks
CREATE POLICY "Store admins can manage scheduled tasks" ON scheduled_tasks
FOR ALL TO authenticated USING (
  EXISTS (
    SELECT 1 FROM store_administrators
    WHERE user_id = auth.uid()
  )
);

-- Store administrators can view task execution logs
CREATE POLICY "Store admins can view task logs" ON task_execution_logs
FOR SELECT TO authenticated USING (
  EXISTS (
    SELECT 1 FROM store_administrators
    WHERE user_id = auth.uid()
  )
);

-- =========================
-- Task Management Functions
-- =========================

-- Function to execute subscription expiry check task
CREATE OR REPLACE FUNCTION execute_subscription_expiry_task()
RETURNS JSONB AS $$
DECLARE
  execution_id UUID := gen_random_uuid();
  start_time TIMESTAMPTZ := NOW();
  result JSONB;
  processed_count INTEGER := 0;
  error_message TEXT;
BEGIN
  -- Log task start
  INSERT INTO task_execution_logs (
    task_name,
    execution_id,
    status,
    triggered_by
  ) VALUES (
    'subscription_expiry_check',
    execution_id,
    'running',
    'system'
  );
  
  BEGIN
    -- Process expired subscriptions
    result := process_expired_subscriptions();
    processed_count := (result->>'processed_count')::INTEGER;
    
    -- Run health check
    PERFORM check_subscription_health();
    
    -- Update task execution log
    UPDATE task_execution_logs
    SET 
      status = 'success',
      completed_at = NOW(),
      duration_ms = EXTRACT(EPOCH FROM (NOW() - start_time)) * 1000,
      items_processed = processed_count,
      execution_result = result
    WHERE execution_id = execute_subscription_expiry_task.execution_id;
    
    -- Update scheduled task
    UPDATE scheduled_tasks
    SET 
      last_run_at = start_time,
      next_run_at = start_time + (run_interval_minutes || ' minutes')::INTERVAL,
      last_run_status = 'success',
      last_run_duration_ms = EXTRACT(EPOCH FROM (NOW() - start_time)) * 1000,
      total_runs = total_runs + 1,
      successful_runs = successful_runs + 1,
      last_error_message = NULL,
      updated_at = NOW()
    WHERE task_name = 'subscription_expiry_check';
    
  EXCEPTION WHEN OTHERS THEN
    error_message := SQLERRM;
    
    -- Update task execution log with error
    UPDATE task_execution_logs
    SET 
      status = 'error',
      completed_at = NOW(),
      duration_ms = EXTRACT(EPOCH FROM (NOW() - start_time)) * 1000,
      error_details = error_message
    WHERE execution_id = execute_subscription_expiry_task.execution_id;
    
    -- Update scheduled task with error
    UPDATE scheduled_tasks
    SET 
      last_run_at = start_time,
      next_run_at = start_time + (run_interval_minutes || ' minutes')::INTERVAL,
      last_run_status = 'error',
      last_run_duration_ms = EXTRACT(EPOCH FROM (NOW() - start_time)) * 1000,
      total_runs = total_runs + 1,
      failed_runs = failed_runs + 1,
      last_error_message = error_message,
      updated_at = NOW()
    WHERE task_name = 'subscription_expiry_check';
    
    RAISE;
  END;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to execute entitlement validation task
CREATE OR REPLACE FUNCTION execute_entitlement_validation_task()
RETURNS JSONB AS $$
DECLARE
  execution_id UUID := gen_random_uuid();
  start_time TIMESTAMPTZ := NOW();
  result JSONB;
  processed_count INTEGER := 0;
  updated_count INTEGER := 0;
  error_message TEXT;
BEGIN
  -- Log task start
  INSERT INTO task_execution_logs (
    task_name,
    execution_id,
    status,
    triggered_by
  ) VALUES (
    'entitlement_validation',
    execution_id,
    'running',
    'system'
  );
  
  BEGIN
    -- Batch validate entitlements
    result := batch_validate_entitlements(50); -- Smaller batch for automated task
    processed_count := (result->>'total_processed')::INTEGER;
    updated_count := (result->>'total_updated')::INTEGER;
    
    -- Update task execution log
    UPDATE task_execution_logs
    SET 
      status = 'success',
      completed_at = NOW(),
      duration_ms = EXTRACT(EPOCH FROM (NOW() - start_time)) * 1000,
      items_processed = processed_count,
      items_updated = updated_count,
      execution_result = result
    WHERE execution_id = execute_entitlement_validation_task.execution_id;
    
    -- Update scheduled task
    UPDATE scheduled_tasks
    SET 
      last_run_at = start_time,
      next_run_at = start_time + (run_interval_minutes || ' minutes')::INTERVAL,
      last_run_status = 'success',
      last_run_duration_ms = EXTRACT(EPOCH FROM (NOW() - start_time)) * 1000,
      total_runs = total_runs + 1,
      successful_runs = successful_runs + 1,
      last_error_message = NULL,
      updated_at = NOW()
    WHERE task_name = 'entitlement_validation';
    
  EXCEPTION WHEN OTHERS THEN
    error_message := SQLERRM;
    
    -- Update task execution log with error
    UPDATE task_execution_logs
    SET 
      status = 'error',
      completed_at = NOW(),
      duration_ms = EXTRACT(EPOCH FROM (NOW() - start_time)) * 1000,
      error_details = error_message
    WHERE execution_id = execute_entitlement_validation_task.execution_id;
    
    -- Update scheduled task with error
    UPDATE scheduled_tasks
    SET 
      last_run_at = start_time,
      next_run_at = start_time + (run_interval_minutes || ' minutes')::INTERVAL,
      last_run_status = 'error',
      last_run_duration_ms = EXTRACT(EPOCH FROM (NOW() - start_time)) * 1000,
      total_runs = total_runs + 1,
      failed_runs = failed_runs + 1,
      last_error_message = error_message,
      updated_at = NOW()
    WHERE task_name = 'entitlement_validation';
    
    RAISE;
  END;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to execute health monitoring task
CREATE OR REPLACE FUNCTION execute_health_monitoring_task()
RETURNS JSONB AS $$
DECLARE
  execution_id UUID := gen_random_uuid();
  start_time TIMESTAMPTZ := NOW();
  health_check_id UUID;
  backup_id TEXT;
  result JSONB;
  error_message TEXT;
BEGIN
  -- Log task start
  INSERT INTO task_execution_logs (
    task_name,
    execution_id,
    status,
    triggered_by
  ) VALUES (
    'health_monitoring',
    execution_id,
    'running',
    'system'
  );
  
  BEGIN
    -- Run health check
    health_check_id := check_subscription_health();
    
    -- Create backup if it's been more than 24 hours
    IF NOT EXISTS (
      SELECT 1 FROM system_backups 
      WHERE backup_type = 'subscription_system' 
      AND created_at > NOW() - INTERVAL '24 hours'
    ) THEN
      backup_id := create_subscription_backup('Automated daily backup');
    END IF;
    
    -- Clean up old backups
    PERFORM cleanup_old_backups();
    
    result := json_build_object(
      'health_check_id', health_check_id,
      'backup_created', backup_id IS NOT NULL,
      'backup_id', backup_id,
      'completed_at', NOW()
    );
    
    -- Update task execution log
    UPDATE task_execution_logs
    SET 
      status = 'success',
      completed_at = NOW(),
      duration_ms = EXTRACT(EPOCH FROM (NOW() - start_time)) * 1000,
      items_processed = 1,
      execution_result = result
    WHERE execution_id = execute_health_monitoring_task.execution_id;
    
    -- Update scheduled task
    UPDATE scheduled_tasks
    SET 
      last_run_at = start_time,
      next_run_at = start_time + (run_interval_minutes || ' minutes')::INTERVAL,
      last_run_status = 'success',
      last_run_duration_ms = EXTRACT(EPOCH FROM (NOW() - start_time)) * 1000,
      total_runs = total_runs + 1,
      successful_runs = successful_runs + 1,
      last_error_message = NULL,
      updated_at = NOW()
    WHERE task_name = 'health_monitoring';
    
  EXCEPTION WHEN OTHERS THEN
    error_message := SQLERRM;
    
    -- Update task execution log with error
    UPDATE task_execution_logs
    SET 
      status = 'error',
      completed_at = NOW(),
      duration_ms = EXTRACT(EPOCH FROM (NOW() - start_time)) * 1000,
      error_details = error_message
    WHERE execution_id = execute_health_monitoring_task.execution_id;
    
    -- Update scheduled task with error
    UPDATE scheduled_tasks
    SET 
      last_run_at = start_time,
      next_run_at = start_time + (run_interval_minutes || ' minutes')::INTERVAL,
      last_run_status = 'error',
      last_run_duration_ms = EXTRACT(EPOCH FROM (NOW() - start_time)) * 1000,
      total_runs = total_runs + 1,
      failed_runs = failed_runs + 1,
      last_error_message = error_message,
      updated_at = NOW()
    WHERE task_name = 'health_monitoring';
    
    RAISE;
  END;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =========================
-- Insert default scheduled tasks
-- =========================
INSERT INTO scheduled_tasks (
  task_name,
  task_type,
  is_enabled,
  run_interval_minutes,
  next_run_at,
  task_config
) VALUES 
  (
    'subscription_expiry_check',
    'subscription_expiry_check',
    TRUE,
    60, -- Run every hour
    NOW() + INTERVAL '5 minutes', -- Start in 5 minutes
    json_build_object('batch_size', 50, 'max_runtime_minutes', 10)
  ),
  (
    'entitlement_validation',
    'entitlement_validation',
    TRUE,
    240, -- Run every 4 hours
    NOW() + INTERVAL '10 minutes', -- Start in 10 minutes
    json_build_object('batch_size', 50, 'max_runtime_minutes', 15)
  ),
  (
    'health_monitoring',
    'health_monitoring',
    TRUE,
    720, -- Run every 12 hours
    NOW() + INTERVAL '15 minutes', -- Start in 15 minutes
    json_build_object('create_backup', true, 'cleanup_old_data', true)
  )
ON CONFLICT (task_name) DO UPDATE SET
  is_enabled = EXCLUDED.is_enabled,
  run_interval_minutes = EXCLUDED.run_interval_minutes,
  task_config = EXCLUDED.task_config,
  updated_at = NOW();

-- =========================
-- Comments for documentation
-- =========================
COMMENT ON TABLE scheduled_tasks IS 'Configuration and tracking for automated subscription system maintenance tasks';
COMMENT ON TABLE task_execution_logs IS 'Detailed execution logs for all automated task runs';
COMMENT ON FUNCTION execute_subscription_expiry_task() IS 'Automated task to process expired subscriptions and validate entitlements';
COMMENT ON FUNCTION execute_entitlement_validation_task() IS 'Automated task to batch validate user entitlements';
COMMENT ON FUNCTION execute_health_monitoring_task() IS 'Automated task for system health monitoring and backup creation';
