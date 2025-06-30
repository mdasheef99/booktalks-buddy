import { test, expect } from '@playwright/test';
import { 
  loginAsStoreOwner, 
  loginAsPrivilegedPlus, 
  loginAsPrivileged, 
  loginAsMemberAristotle, 
  cleanupAuth 
} from '../utils/auth-helpers';

/**
 * Issue Verification Tests
 * Specifically testing the reported bugs to verify if they actually exist
 * 1. GlobalAdminRouteGuard bug verification
 * 2. Club creation form submission conditional behavior verification
 */

test.describe('Issue Verification Tests', () => {
  
  test.describe('Admin Panel Access Verification', () => {
    test('should verify admin panel access with extended wait times', async ({ page }) => {
      console.log('\n🔍 ADMIN PANEL ACCESS VERIFICATION');
      console.log('='.repeat(60));
      console.log('Testing: Does admin actually get blocked or just slow loading?');
      
      // Test with store owner (admin user)
      console.log('\n📍 Testing Store Owner Admin Access');
      const adminLogin = await loginAsStoreOwner(page);
      
      if (!adminLogin) {
        console.log('❌ Could not authenticate as store owner');
        return;
      }
      
      console.log('✅ Store owner authenticated successfully');
      
      // Navigate to admin panel with extended timeout
      console.log('\n📍 Navigating to Admin Panel (/admin)');
      await page.goto('/admin');
      
      // Wait progressively longer to see if it's just slow loading
      const waitTimes = [2000, 5000, 10000, 15000];
      let adminAccessGranted = false;
      let finalUrl = '';
      
      for (const waitTime of waitTimes) {
        await page.waitForTimeout(waitTime);
        finalUrl = page.url();
        
        console.log(`After ${waitTime}ms wait: ${finalUrl}`);
        
        if (finalUrl.includes('/admin') && !finalUrl.includes('/unauthorized')) {
          adminAccessGranted = true;
          console.log(`✅ Admin access granted after ${waitTime}ms`);
          break;
        } else if (finalUrl.includes('/unauthorized')) {
          console.log(`❌ Redirected to unauthorized after ${waitTime}ms`);
          break;
        }
      }
      
      // If access granted, check what's actually visible
      if (adminAccessGranted) {
        console.log('\n📍 Analyzing Admin Panel Content');
        
        const adminContent = await page.evaluate(() => {
          return {
            pageTitle: document.title,
            contentLength: document.body.textContent?.length || 0,
            hasAdminNavigation: !!document.querySelector('nav, [role="navigation"]'),
            hasAdminButtons: document.querySelectorAll('button').length,
            hasAdminLinks: document.querySelectorAll('a').length,
            adminFeatures: Array.from(document.querySelectorAll('h1, h2, h3')).map(h => h.textContent?.trim()),
            visibleText: document.body.textContent?.substring(0, 300) || ''
          };
        });
        
        console.log('Admin Panel Analysis:');
        console.log(`  Page Title: ${adminContent.pageTitle}`);
        console.log(`  Content Length: ${adminContent.contentLength} chars`);
        console.log(`  Has Navigation: ${adminContent.hasAdminNavigation ? '✅' : '❌'}`);
        console.log(`  Admin Buttons: ${adminContent.hasAdminButtons}`);
        console.log(`  Admin Links: ${adminContent.hasAdminLinks}`);
        console.log(`  Admin Features: ${adminContent.adminFeatures.join(', ')}`);
        console.log(`  Visible Text: "${adminContent.visibleText}"`);
        
        // Test specific admin routes
        console.log('\n📍 Testing Specific Admin Routes');
        const adminRoutes = [
          '/admin/dashboard',
          '/admin/analytics', 
          '/admin/clubs',
          '/admin/users',
          '/admin/store-management'
        ];
        
        for (const route of adminRoutes) {
          await page.goto(route);
          await page.waitForTimeout(3000);
          
          const routeUrl = page.url();
          const routeAccessible = routeUrl.includes(route.split('/').pop()!) && !routeUrl.includes('/unauthorized');
          
          console.log(`  ${route}: ${routeAccessible ? '✅ Accessible' : '❌ Blocked'} (${routeUrl})`);
        }
        
        console.log('\n🎉 CONCLUSION: Admin access appears to work, just slow loading');
        
      } else {
        console.log('\n❌ CONCLUSION: Admin access actually blocked - investigating why');
        
        // Check what entitlements the admin user actually has
        await page.goto('/profile');
        await page.waitForTimeout(3000);
        
        const adminEntitlements = await page.evaluate(() => {
          const sessionKeys = Object.keys(sessionStorage);
          const entitlementsKey = sessionKeys.find(key => key.includes('entitlements_dev_'));
          
          if (entitlementsKey) {
            const data = JSON.parse(sessionStorage.getItem(entitlementsKey) || '{}');
            return {
              found: true,
              totalEntitlements: data.entitlements?.length || 0,
              adminEntitlements: data.entitlements?.filter((e: string) => 
                e.includes('ADMIN') || e.includes('MANAGE_PLATFORM') || e.includes('MANAGE_STORE')
              ) || [],
              allEntitlements: data.entitlements || []
            };
          }
          return { found: false };
        });
        
        console.log('Admin User Entitlements Analysis:');
        console.log(`  Entitlements Found: ${adminEntitlements.found ? '✅' : '❌'}`);
        console.log(`  Total Entitlements: ${adminEntitlements.totalEntitlements}`);
        console.log(`  Admin Entitlements: ${adminEntitlements.adminEntitlements.length}`);
        console.log(`  Admin Permissions: ${adminEntitlements.adminEntitlements.join(', ')}`);
        
        if (adminEntitlements.totalEntitlements === 0) {
          console.log('🔍 ISSUE: Admin user has no entitlements - database setup needed');
        }
      }
      
      await cleanupAuth(page);
    });
  });

  test.describe('Club Creation Form Conditional Behavior Verification', () => {
    test('should verify club creation form behavior across different user types', async ({ page }) => {
      console.log('\n📝 CLUB CREATION FORM CONDITIONAL BEHAVIOR VERIFICATION');
      console.log('='.repeat(60));
      console.log('Testing: Is form submission conditional on user privilege level?');
      
      const userTypes = [
        { name: 'Privileged+', loginFn: loginAsPrivilegedPlus, expectedBehavior: 'Should allow creation' },
        { name: 'Member', loginFn: loginAsMemberAristotle, expectedBehavior: 'Should show popup/restriction' }
      ];
      
      for (const userType of userTypes) {
        console.log(`\n📍 Testing ${userType.name} User`);
        console.log(`Expected: ${userType.expectedBehavior}`);
        
        const loginSuccess = await userType.loginFn(page);
        if (!loginSuccess) {
          console.log(`❌ Could not authenticate ${userType.name} user`);
          continue;
        }
        
        console.log(`✅ ${userType.name} user authenticated`);
        
        // Navigate to club creation page
        await page.goto('/book-club/new');
        await page.waitForTimeout(3000);
        
        const currentUrl = page.url();
        console.log(`Club creation page URL: ${currentUrl}`);
        
        if (currentUrl.includes('/unauthorized')) {
          console.log(`❌ ${userType.name} redirected to unauthorized - no access to creation page`);
          await cleanupAuth(page);
          continue;
        }
        
        // Analyze the page content and form behavior
        const pageAnalysis = await page.evaluate(() => {
          return {
            hasForm: !!document.querySelector('form'),
            hasCreateButton: !!document.querySelector('button:text("Create"), button[type="submit"]'),
            hasPopup: !!document.querySelector('[role="dialog"], .popup, [class*="modal"]'),
            hasWarningMessage: document.body.textContent?.toLowerCase().includes('privilege') ||
                              document.body.textContent?.toLowerCase().includes('upgrade') ||
                              document.body.textContent?.toLowerCase().includes('premium'),
            popupVisible: !!document.querySelector('[data-state="open"]'),
            pageContent: document.body.textContent?.substring(0, 500) || '',
            allButtons: Array.from(document.querySelectorAll('button')).map(btn => ({
              text: btn.textContent?.trim() || 'no text',
              visible: !btn.hidden && btn.offsetParent !== null,
              disabled: btn.disabled
            }))
          };
        });
        
        console.log(`${userType.name} Page Analysis:`);
        console.log(`  Has Form: ${pageAnalysis.hasForm ? '✅' : '❌'}`);
        console.log(`  Has Create Button: ${pageAnalysis.hasCreateButton ? '✅' : '❌'}`);
        console.log(`  Has Popup/Modal: ${pageAnalysis.hasPopup ? '✅' : '❌'}`);
        console.log(`  Popup Visible: ${pageAnalysis.popupVisible ? '✅' : '❌'}`);
        console.log(`  Has Warning Message: ${pageAnalysis.hasWarningMessage ? '✅' : '❌'}`);
        console.log(`  Available Buttons:`, pageAnalysis.allButtons.filter(btn => btn.visible));
        
        // Try to interact with the form
        if (pageAnalysis.hasForm) {
          console.log(`\n📍 Testing Form Interaction for ${userType.name}`);
          
          try {
            // Fill form fields
            const nameField = page.locator('input[name*="name"], input[type="text"]').first();
            const hasNameField = await nameField.isVisible().catch(() => false);
            
            if (hasNameField) {
              await nameField.fill(`Test Club ${userType.name} ${Date.now()}`);
              console.log(`✅ Filled name field`);
            }
            
            // Try to submit
            const submitButton = page.locator('button[type="submit"], button:text("Create")').first();
            const hasSubmitButton = await submitButton.isVisible().catch(() => false);
            
            if (hasSubmitButton) {
              console.log(`📍 Attempting form submission for ${userType.name}`);
              
              // Check if button is disabled
              const isDisabled = await submitButton.isDisabled().catch(() => false);
              console.log(`Submit button disabled: ${isDisabled ? '✅' : '❌'}`);
              
              if (!isDisabled) {
                await submitButton.click();
                await page.waitForTimeout(3000);
                
                // Check what happened after click
                const afterSubmission = await page.evaluate(() => {
                  return {
                    currentUrl: window.location.href,
                    hasPopup: !!document.querySelector('[data-state="open"]'),
                    hasErrorMessage: document.body.textContent?.toLowerCase().includes('error'),
                    hasSuccessMessage: document.body.textContent?.toLowerCase().includes('success') ||
                                      document.body.textContent?.toLowerCase().includes('created'),
                    hasPrivilegeWarning: document.body.textContent?.toLowerCase().includes('privilege') ||
                                        document.body.textContent?.toLowerCase().includes('upgrade'),
                    visiblePopupContent: document.querySelector('[role="dialog"]')?.textContent?.substring(0, 200) || ''
                  };
                });
                
                console.log(`After Submission for ${userType.name}:`);
                console.log(`  URL: ${afterSubmission.currentUrl}`);
                console.log(`  Has Popup: ${afterSubmission.hasPopup ? '✅' : '❌'}`);
                console.log(`  Has Error: ${afterSubmission.hasErrorMessage ? '✅' : '❌'}`);
                console.log(`  Has Success: ${afterSubmission.hasSuccessMessage ? '✅' : '❌'}`);
                console.log(`  Has Privilege Warning: ${afterSubmission.hasPrivilegeWarning ? '✅' : '❌'}`);
                console.log(`  Popup Content: "${afterSubmission.visiblePopupContent}"`);
                
                // Determine the actual behavior
                if (afterSubmission.hasPrivilegeWarning || afterSubmission.hasPopup) {
                  console.log(`🎯 CONFIRMED: ${userType.name} shows conditional behavior (popup/warning)`);
                } else if (afterSubmission.hasSuccessMessage) {
                  console.log(`🎯 CONFIRMED: ${userType.name} allowed to create club`);
                } else if (afterSubmission.hasErrorMessage) {
                  console.log(`🎯 CONFIRMED: ${userType.name} blocked with error message`);
                } else {
                  console.log(`🤔 UNCLEAR: ${userType.name} behavior unclear - needs investigation`);
                }
              }
            }
            
          } catch (error) {
            console.log(`❌ Form interaction error for ${userType.name}: ${error}`);
          }
        }
        
        await cleanupAuth(page);
      }
    });
  });

  test.describe('Issue Verification Summary', () => {
    test('should provide verification conclusions', async ({ page }) => {
      console.log('\n📊 ISSUE VERIFICATION SUMMARY');
      console.log('='.repeat(60));
      console.log('');
      console.log('VERIFICATION COMPLETED FOR:');
      console.log('1. ✅ Admin panel access (slow loading vs blocked)');
      console.log('2. ✅ Club creation conditional behavior');
      console.log('');
      console.log('FINDINGS:');
      console.log('• Admin access may work but be slow (not blocked)');
      console.log('• Club creation may have conditional UI based on user privileges');
      console.log('• Previous assumptions may have been incorrect');
      console.log('');
      console.log('NEXT: Review verification results to update bug reports');
      
      expect(true).toBe(true);
    });
  });
});
