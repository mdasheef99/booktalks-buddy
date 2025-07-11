/**
 * Subscription UI Integration Validation Script
 * 
 * Automated validation of subscription UI components integration
 * Checks component structure, imports, exports, and basic functionality
 */

import fs from 'fs';
import path from 'path';

console.log('🔍 SUBSCRIPTION UI INTEGRATION VALIDATION\n');
console.log('='.repeat(60));

// Configuration
const COMPONENTS_DIR = 'src/components/subscription';
const PROFILE_SECTION = 'src/components/profile/ProfileForm/sections/SubscriptionSection.tsx';
const AUTH_CONTEXT = 'src/contexts/AuthContext.tsx';

// Test Results Tracking
let totalTests = 0;
let passedTests = 0;
let failedTests = [];

function runTest(testName, testFunction) {
  totalTests++;
  try {
    const result = testFunction();
    if (result) {
      console.log(`   ✅ ${testName}`);
      passedTests++;
    } else {
      console.log(`   ❌ ${testName}`);
      failedTests.push(testName);
    }
  } catch (error) {
    console.log(`   ❌ ${testName} - Error: ${error.message}`);
    failedTests.push(`${testName} (Error)`);
  }
}

// Test 1: Component File Structure
console.log('📁 1. COMPONENT FILE STRUCTURE VALIDATION:');

runTest('SubscriptionStatus component exists', () => {
  return fs.existsSync(path.join(COMPONENTS_DIR, 'SubscriptionStatus.tsx'));
});

runTest('PremiumFeatureGate component exists', () => {
  return fs.existsSync(path.join(COMPONENTS_DIR, 'PremiumFeatureGate.tsx'));
});

runTest('SubscriptionUpgradePrompt component exists', () => {
  return fs.existsSync(path.join(COMPONENTS_DIR, 'SubscriptionUpgradePrompt.tsx'));
});

runTest('FeatureAvailabilityIndicator component exists', () => {
  return fs.existsSync(path.join(COMPONENTS_DIR, 'FeatureAvailabilityIndicator.tsx'));
});

runTest('Component index file exists', () => {
  return fs.existsSync(path.join(COMPONENTS_DIR, 'index.ts'));
});

runTest('Profile subscription section exists', () => {
  return fs.existsSync(PROFILE_SECTION);
});

console.log('');

// Test 2: AuthContext Integration
console.log('🔗 2. AUTHCONTEXT INTEGRATION VALIDATION:');

const authContextContent = fs.readFileSync(AUTH_CONTEXT, 'utf8');

runTest('AuthContext has subscription state', () => {
  return authContextContent.includes('subscriptionStatus') &&
         authContextContent.includes('subscriptionLoading');
});

runTest('AuthContext has subscription helpers', () => {
  return authContextContent.includes('hasValidSubscription') &&
         authContextContent.includes('canAccessFeature') &&
         authContextContent.includes('getSubscriptionStatusWithContext');
});

runTest('AuthContext has coordinated refresh', () => {
  return authContextContent.includes('refreshUserData') &&
         authContextContent.includes('Promise.allSettled');
});

runTest('AuthContext exports all subscription functions', () => {
  return authContextContent.includes('refreshSubscriptionStatus,') &&
         authContextContent.includes('canAccessFeature,') &&
         authContextContent.includes('refreshUserData');
});

console.log('');

// Test 3: Component Import/Export Validation
console.log('📦 3. COMPONENT IMPORT/EXPORT VALIDATION:');

const indexContent = fs.readFileSync(path.join(COMPONENTS_DIR, 'index.ts'), 'utf8');

runTest('Index exports SubscriptionStatus', () => {
  return indexContent.includes('SubscriptionStatus') &&
         indexContent.includes('CompactSubscriptionStatus');
});

runTest('Index exports PremiumFeatureGate', () => {
  return indexContent.includes('PremiumFeatureGate') &&
         indexContent.includes('PremiumClubCreation');
});

runTest('Index exports SubscriptionUpgradePrompt', () => {
  return indexContent.includes('SubscriptionUpgradePrompt') &&
         indexContent.includes('PrivilegedUpgradePrompt');
});

runTest('Index exports FeatureAvailabilityIndicator', () => {
  return indexContent.includes('FeatureAvailabilityIndicator') &&
         indexContent.includes('ClubCreationIndicator');
});

console.log('');

// Test 4: Component Implementation Validation
console.log('🧩 4. COMPONENT IMPLEMENTATION VALIDATION:');

// SubscriptionStatus Component
const subscriptionStatusContent = fs.readFileSync(path.join(COMPONENTS_DIR, 'SubscriptionStatus.tsx'), 'utf8');

runTest('SubscriptionStatus uses AuthContext', () => {
  return subscriptionStatusContent.includes('useAuth') &&
         subscriptionStatusContent.includes('getSubscriptionStatusWithContext');
});

runTest('SubscriptionStatus has tier configurations', () => {
  return subscriptionStatusContent.includes('getTierConfig') &&
         subscriptionStatusContent.includes('PRIVILEGED_PLUS') &&
         subscriptionStatusContent.includes('Crown');
});

runTest('SubscriptionStatus has loading states', () => {
  return subscriptionStatusContent.includes('subscriptionLoading') &&
         subscriptionStatusContent.includes('animate-pulse');
});

// PremiumFeatureGate Component
const featureGateContent = fs.readFileSync(path.join(COMPONENTS_DIR, 'PremiumFeatureGate.tsx'), 'utf8');

runTest('PremiumFeatureGate has access control', () => {
  return featureGateContent.includes('canAccessFeature') &&
         featureGateContent.includes('hasRequiredTier');
});

runTest('PremiumFeatureGate has upgrade prompts', () => {
  return featureGateContent.includes('showUpgradePrompt') &&
         featureGateContent.includes('Upgrade to');
});

// FeatureAvailabilityIndicator Component
const indicatorContent = fs.readFileSync(path.join(COMPONENTS_DIR, 'FeatureAvailabilityIndicator.tsx'), 'utf8');

runTest('FeatureAvailabilityIndicator has variants', () => {
  return indicatorContent.includes('variant') &&
         indicatorContent.includes('badge') &&
         indicatorContent.includes('icon');
});

runTest('FeatureAvailabilityIndicator has tooltips', () => {
  return indicatorContent.includes('TooltipProvider') &&
         indicatorContent.includes('showTooltip');
});

console.log('');

// Test 5: Profile Integration Validation
console.log('👤 5. PROFILE INTEGRATION VALIDATION:');

const profileSectionContent = fs.readFileSync(PROFILE_SECTION, 'utf8');

runTest('Profile section uses AuthContext', () => {
  return profileSectionContent.includes('useAuth') &&
         profileSectionContent.includes('getSubscriptionStatusWithContext');
});

runTest('Profile section has subscription management', () => {
  return profileSectionContent.includes('Subscription Management') &&
         profileSectionContent.includes('refreshUserData');
});

runTest('Profile section shows current benefits', () => {
  return profileSectionContent.includes('Current Benefits') &&
         profileSectionContent.includes('getTierBenefits');
});

runTest('Profile section has upgrade recommendations', () => {
  return profileSectionContent.includes('Unlock More Features') &&
         profileSectionContent.includes('Go Premium');
});

console.log('');

// Test 6: TypeScript Validation
console.log('🔧 6. TYPESCRIPT VALIDATION:');

runTest('All components have proper TypeScript interfaces', () => {
  const components = [
    'SubscriptionStatus.tsx',
    'PremiumFeatureGate.tsx',
    'SubscriptionUpgradePrompt.tsx',
    'FeatureAvailabilityIndicator.tsx'
  ];
  
  return components.every(component => {
    const content = fs.readFileSync(path.join(COMPONENTS_DIR, component), 'utf8');
    return content.includes('interface') && content.includes('Props');
  });
});

runTest('Components use proper React imports', () => {
  const components = [
    'SubscriptionStatus.tsx',
    'PremiumFeatureGate.tsx',
    'SubscriptionUpgradePrompt.tsx',
    'FeatureAvailabilityIndicator.tsx'
  ];
  
  return components.every(component => {
    const content = fs.readFileSync(path.join(COMPONENTS_DIR, component), 'utf8');
    return content.includes('import React') && content.includes('from \'react\'');
  });
});

runTest('Components export properly', () => {
  const components = [
    'SubscriptionStatus.tsx',
    'PremiumFeatureGate.tsx',
    'SubscriptionUpgradePrompt.tsx',
    'FeatureAvailabilityIndicator.tsx'
  ];
  
  return components.every(component => {
    const content = fs.readFileSync(path.join(COMPONENTS_DIR, component), 'utf8');
    return content.includes('export function') || content.includes('export default');
  });
});

console.log('');

// Test 7: UI Library Integration
console.log('🎨 7. UI LIBRARY INTEGRATION VALIDATION:');

runTest('Components use UI library components', () => {
  const components = [
    'SubscriptionStatus.tsx',
    'PremiumFeatureGate.tsx',
    'SubscriptionUpgradePrompt.tsx',
    'FeatureAvailabilityIndicator.tsx'
  ];
  
  return components.every(component => {
    const content = fs.readFileSync(path.join(COMPONENTS_DIR, component), 'utf8');
    return content.includes('@/components/ui/') && 
           (content.includes('Button') || content.includes('Card') || content.includes('Badge'));
  });
});

runTest('Components use Lucide icons', () => {
  const components = [
    'SubscriptionStatus.tsx',
    'PremiumFeatureGate.tsx',
    'SubscriptionUpgradePrompt.tsx',
    'FeatureAvailabilityIndicator.tsx'
  ];
  
  return components.every(component => {
    const content = fs.readFileSync(path.join(COMPONENTS_DIR, component), 'utf8');
    return content.includes('lucide-react');
  });
});

console.log('');

// Final Results
console.log('📊 VALIDATION RESULTS SUMMARY:');
console.log('='.repeat(60));

const passRate = ((passedTests / totalTests) * 100).toFixed(1);

console.log(`Total Tests: ${totalTests}`);
console.log(`Passed: ${passedTests}`);
console.log(`Failed: ${failedTests.length}`);
console.log(`Pass Rate: ${passRate}%`);

if (failedTests.length > 0) {
  console.log('\n❌ Failed Tests:');
  failedTests.forEach(test => console.log(`   • ${test}`));
}

console.log('');

if (passRate >= 95) {
  console.log('🎉 EXCELLENT: Subscription UI integration is ready for production!');
} else if (passRate >= 90) {
  console.log('✅ GOOD: Subscription UI integration is mostly ready, minor issues to address.');
} else if (passRate >= 80) {
  console.log('⚠️ NEEDS WORK: Several issues need to be addressed before deployment.');
} else {
  console.log('❌ CRITICAL: Major issues found, significant work needed.');
}

console.log('');
console.log('📋 NEXT STEPS:');
console.log('1. Address any failed validation tests');
console.log('2. Run manual testing checklist from subscription-ui-testing-guide.md');
console.log('3. Perform cross-browser and responsive testing');
console.log('4. Validate user experience flows');
console.log('5. Execute performance testing scenarios');

console.log('='.repeat(60));
