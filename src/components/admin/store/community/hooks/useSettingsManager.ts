/**
 * Settings Manager Hook
 * Custom hook for managing community showcase settings
 */

import { useCallback } from 'react';
import type { 
  CommunityShowcaseSettings,
  SettingsKey,
  UseSettingsManagerResult 
} from '../types/metricsConfigTypes';
import { 
  isFeatureEnabled, 
  getEnabledFeaturesCount,
  validateSettings,
  createDefaultSettings
} from '../utils/metricsConfigUtils';

/**
 * Custom hook for managing settings state and operations
 */
export const useSettingsManager = (
  settings: CommunityShowcaseSettings,
  onSettingsUpdate: (settings: Partial<CommunityShowcaseSettings>) => void
): UseSettingsManagerResult => {
  
  /**
   * Update a single setting
   */
  const updateSetting = useCallback(<K extends SettingsKey>(
    key: K, 
    value: CommunityShowcaseSettings[K]
  ) => {
    onSettingsUpdate({ [key]: value });
  }, [onSettingsUpdate]);

  /**
   * Update multiple settings at once
   */
  const updateMultipleSettings = useCallback((updates: Partial<CommunityShowcaseSettings>) => {
    onSettingsUpdate(updates);
  }, [onSettingsUpdate]);

  /**
   * Reset settings to defaults
   */
  const resetSettings = useCallback(() => {
    const defaultSettings = createDefaultSettings();
    onSettingsUpdate(defaultSettings);
  }, [onSettingsUpdate]);

  /**
   * Check if a specific feature is enabled
   */
  const isFeatureEnabledCallback = useCallback((feature: SettingsKey): boolean => {
    return isFeatureEnabled(settings, feature);
  }, [settings]);

  /**
   * Get count of enabled features
   */
  const getEnabledFeaturesCountCallback = useCallback((): number => {
    return getEnabledFeaturesCount(settings);
  }, [settings]);

  return {
    settings,
    updateSetting,
    updateMultipleSettings,
    resetSettings,
    isFeatureEnabled: isFeatureEnabledCallback,
    getEnabledFeaturesCount: getEnabledFeaturesCountCallback,
  };
};

/**
 * Hook for settings validation
 */
export const useSettingsValidation = (settings: CommunityShowcaseSettings) => {
  const isValid = useCallback(() => {
    return validateSettings(settings);
  }, [settings]);

  const getValidationErrors = useCallback(() => {
    const errors: string[] = [];
    
    if (settings.activity_feed_limit < 3 || settings.activity_feed_limit > 10) {
      errors.push('Activity feed limit must be between 3 and 10');
    }
    
    if (settings.max_spotlights_display < 1 || settings.max_spotlights_display > 6) {
      errors.push('Spotlights limit must be between 1 and 6');
    }
    
    return errors;
  }, [settings]);

  return {
    isValid,
    getValidationErrors,
  };
};
