/**
 * Batch Validation Processing Module
 *
 * Handles batch validation, parallel processing, and performance optimization
 * for validating multiple users' subscriptions efficiently.
 *
 * Created: 2025-07-10
 * Part of: Phase 1B - validation.ts Refactoring
 */

import type { SubscriptionValidationResult, ValidationOptions } from '../types';
import type { BatchValidationConfig } from './types';
import { DEFAULT_BATCH_CONFIG, VALIDATION_ERROR_CODES } from './types';
import { createValidationError, createFailSecureValidationResult } from './error-handling';

// =========================
// Batch Validation Functions
// =========================

/**
 * Validates multiple users' subscriptions in batch with optimized processing
 */
export async function batchValidateSubscriptions(
  userIds: string[],
  options: ValidationOptions = {},
  batchConfig: Partial<BatchValidationConfig> = {}
): Promise<SubscriptionValidationResult[]> {
  const config = { ...DEFAULT_BATCH_CONFIG, ...batchConfig };

  console.log(`[Batch Validation] Starting batch validation for ${userIds.length} users`);
  console.log(`[Batch Validation] Config:`, {
    batchSize: config.batchSize,
    batchDelay: config.batchDelay,
    maxConcurrency: config.maxConcurrency,
    continueOnError: config.continueOnError,
  });

  const results: SubscriptionValidationResult[] = [];
  const totalBatches = Math.ceil(userIds.length / config.batchSize);

  for (let i = 0; i < userIds.length; i += config.batchSize) {
    const batch = userIds.slice(i, i + config.batchSize);
    const batchNumber = Math.floor(i / config.batchSize) + 1;

    console.log(`[Batch Validation] Processing batch ${batchNumber}/${totalBatches} (${batch.length} users)`);

    try {
      const batchResults = await processBatch(batch, options, config);
      results.push(...batchResults);

      // Add delay between batches to avoid overwhelming the database
      if (i + config.batchSize < userIds.length && config.batchDelay > 0) {
        await new Promise(resolve => setTimeout(resolve, config.batchDelay));
      }

    } catch (error) {
      console.error(`[Batch Validation] Batch ${batchNumber} failed:`, error);

      if (config.continueOnError) {
        // Create fail-secure results for the entire batch
        const failSecureResults = batch.map(userId =>
          createFailSecureValidationResult(userId, [
            createValidationError(
              VALIDATION_ERROR_CODES.BATCH_VALIDATION_FAILED,
              `Batch validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
              { userId, batchNumber, error: String(error) },
              'high'
            )
          ], Date.now())
        );
        results.push(...failSecureResults);
      } else {
        throw error;
      }
    }
  }

  console.log(`[Batch Validation] Completed: ${results.length} results, ${results.filter(r => r.success).length} successful`);
  return results;
}

/**
 * Process a single batch of users with controlled concurrency
 */
async function processBatch(
  userIds: string[],
  options: ValidationOptions,
  config: BatchValidationConfig
): Promise<SubscriptionValidationResult[]> {
  // Import validateUserSubscription here to avoid circular dependency
  const { validateUserSubscription } = await import('./index');

  // Create validation promises with error handling
  const validationPromises = userIds.map(async (userId) => {
    try {
      return await validateUserSubscription(userId, options);
    } catch (error) {
      console.error(`[Batch Validation] Individual validation failed for user ${userId}:`, error);

      return createFailSecureValidationResult(userId, [
        createValidationError(
          VALIDATION_ERROR_CODES.BATCH_VALIDATION_FAILED,
          `Individual validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
          { userId, error: String(error) },
          'high'
        )
      ], Date.now());
    }
  });

  // Process with controlled concurrency
  if (config.maxConcurrency >= userIds.length) {
    // Process all at once if concurrency limit allows
    return await Promise.all(validationPromises);
  } else {
    // Process in chunks to respect concurrency limit
    return await processWithConcurrencyLimit(validationPromises, config.maxConcurrency);
  }
}

/**
 * Process promises with concurrency limit
 */
async function processWithConcurrencyLimit<T>(
  promises: Promise<T>[],
  concurrencyLimit: number
): Promise<T[]> {
  const results: T[] = [];

  for (let i = 0; i < promises.length; i += concurrencyLimit) {
    const chunk = promises.slice(i, i + concurrencyLimit);
    const chunkResults = await Promise.all(chunk);
    results.push(...chunkResults);
  }

  return results;
}

// =========================
// Batch Optimization Utilities
// =========================

/**
 * Optimize batch configuration based on user count and system load
 */
export function optimizeBatchConfig(
  userCount: number,
  systemLoad: 'low' | 'medium' | 'high' = 'medium'
): BatchValidationConfig {
  let config = { ...DEFAULT_BATCH_CONFIG };

  // Adjust batch size based on user count
  if (userCount < 50) {
    config.batchSize = Math.min(userCount, 5);
  } else if (userCount < 200) {
    config.batchSize = 10;
  } else if (userCount < 1000) {
    config.batchSize = 20;
  } else {
    config.batchSize = 50;
  }

  // Adjust based on system load
  switch (systemLoad) {
    case 'low':
      config.maxConcurrency = config.batchSize;
      config.batchDelay = 50;
      break;
    case 'high':
      config.maxConcurrency = Math.max(1, Math.floor(config.batchSize / 2));
      config.batchDelay = 500;
      break;
    default: // medium
      config.maxConcurrency = Math.max(2, Math.floor(config.batchSize * 0.7));
      config.batchDelay = 100;
  }

  return config;
}
