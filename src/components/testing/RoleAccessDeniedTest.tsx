/**
 * Role Access Denied Alert Test Component
 * 
 * Test component to verify role_access_denied alert integration
 * with PremiumFeatureGate components.
 * 
 * Created: 2025-01-29
 * Part of: Alert System Implementation - role_access_denied
 */

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Shield, Crown, Star, Users, MessageCircle, BarChart3 } from 'lucide-react';
import { 
  PremiumFeatureGate, 
  PremiumClubCreation, 
  PremiumContentAccess, 
  ExclusiveFeatureAccess 
} from '@/components/subscription';

export function RoleAccessDeniedTest() {
  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Role Access Denied Alert Test
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <p className="text-gray-600">
            Test the role_access_denied alert integration by clicking the buttons below. 
            If you don't have the required subscription, you should see toast notifications 
            with "Contact Store" buttons.
          </p>

          {/* Test Club Creation Access */}
          <div className="space-y-3">
            <h3 className="font-semibold flex items-center gap-2">
              <Users className="h-4 w-4" />
              Club Creation (Requires PRIVILEGED)
            </h3>
            <PremiumClubCreation>
              <Button className="w-full">
                ✅ Create New Book Club (Access Granted)
              </Button>
            </PremiumClubCreation>
          </div>

          {/* Test Premium Content Access */}
          <div className="space-y-3">
            <h3 className="font-semibold flex items-center gap-2">
              <Star className="h-4 w-4" />
              Premium Content (Requires PRIVILEGED)
            </h3>
            <PremiumContentAccess>
              <Button className="w-full" variant="outline">
                ✅ Access Premium Discussions (Access Granted)
              </Button>
            </PremiumContentAccess>
          </div>

          {/* Test Exclusive Features Access */}
          <div className="space-y-3">
            <h3 className="font-semibold flex items-center gap-2">
              <Crown className="h-4 w-4" />
              Exclusive Features (Requires PRIVILEGED_PLUS)
            </h3>
            <ExclusiveFeatureAccess>
              <Button className="w-full" variant="outline">
                ✅ Access Exclusive Content (Access Granted)
              </Button>
            </ExclusiveFeatureAccess>
          </div>

          {/* Test Direct Messaging */}
          <div className="space-y-3">
            <h3 className="font-semibold flex items-center gap-2">
              <MessageCircle className="h-4 w-4" />
              Direct Messaging (Requires PRIVILEGED)
            </h3>
            <PremiumFeatureGate
              feature="CAN_SEND_DIRECT_MESSAGES"
              requiredTier="PRIVILEGED"
              featureName="Direct Messaging"
              featureDescription="Send direct messages to other members"
            >
              <Button className="w-full" variant="outline">
                ✅ Send Direct Message (Access Granted)
              </Button>
            </PremiumFeatureGate>
          </div>

          {/* Test Store Management */}
          <div className="space-y-3">
            <h3 className="font-semibold flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Store Management (Requires PRIVILEGED_PLUS)
            </h3>
            <PremiumFeatureGate
              feature="CAN_MANAGE_STORE"
              requiredTier="PRIVILEGED_PLUS"
              featureName="Store Management"
              featureDescription="Manage store settings and inventory"
            >
              <Button className="w-full" variant="outline">
                ✅ Manage Store Settings (Access Granted)
              </Button>
            </PremiumFeatureGate>
          </div>

          {/* Instructions */}
          <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h4 className="font-semibold text-blue-900 mb-2">Testing Instructions:</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• If you have the required subscription, you'll see the buttons and can click them</li>
              <li>• If you don't have the required subscription, you'll see upgrade prompts instead</li>
              <li>• When you click buttons without proper access, toast notifications should appear</li>
              <li>• Toast notifications should include "Contact Store" buttons</li>
              <li>• Check browser console for alert trigger logs</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default RoleAccessDeniedTest;
