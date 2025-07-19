/**
 * Subscription Management Page
 * 
 * Dedicated admin page for comprehensive subscription monitoring and management.
 * Provides store owners with tools to monitor subscription health, manage user entitlements,
 * and resolve subscription-related issues.
 * 
 * Created: 2025-01-16
 * Part of: Admin Dashboard Implementation - Dedicated Navigation
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, CreditCard, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  SubscriptionOverviewCard,
  ProblematicUsersTable,
  SystemHealthMonitor
} from '@/components/admin/subscription';

const SubscriptionManagementPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
        <div className="flex-1">
          <div className="flex items-center gap-4 mb-2">
            <Button
              variant="ghost"
              onClick={() => navigate('/admin/dashboard')}
              className="flex items-center gap-2 text-bookconnect-brown hover:bg-bookconnect-brown/10"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Dashboard
            </Button>
          </div>
          
          <div className="flex items-center gap-3 mb-2">
            <CreditCard className="h-8 w-8 text-bookconnect-brown" />
            <h1 className="text-4xl font-serif text-bookconnect-brown">
              Subscription Management
            </h1>
          </div>
          
          <p className="text-lg text-muted-foreground">
            Monitor subscription health, manage user entitlements, and resolve subscription issues
          </p>
        </div>

        <div className="flex gap-3">
          <Button
            onClick={() => window.location.reload()}
            variant="outline"
            size="sm"
            className="flex items-center gap-2 hover:bg-bookconnect-sage/10"
            title="Refresh all subscription data"
          >
            <RefreshCw className="h-4 w-4 text-bookconnect-sage" />
            <span className="hidden sm:inline">Refresh All</span>
          </Button>
        </div>
      </div>

      {/* Subscription Overview and Health Monitor Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <SubscriptionOverviewCard 
            refreshInterval={0} // Manual refresh only
            className="h-full"
          />
        </div>
        <div className="lg:col-span-1">
          <SystemHealthMonitor 
            autoRefresh={true}
            refreshInterval={30}
            compact={true}
            className="h-full"
          />
        </div>
      </div>

      {/* Problematic Users Management */}
      <div className="space-y-4">
        <div>
          <h2 className="text-2xl font-serif text-bookconnect-brown mb-2">
            User Management
          </h2>
          <p className="text-muted-foreground">
            Identify and resolve users with subscription or tier mismatches
          </p>
        </div>
        
        <ProblematicUsersTable 
          maxHeight="600px"
          onUserAction={(userId, action) => {
            // Handle user actions - could navigate to user profile or show modal
            console.log(`Action ${action} for user ${userId}`);
            if (action === 'view_profile') {
              // Navigate to user profile or show user details
              navigate(`/admin/users/${userId}`);
            }
          }}
        />
      </div>

      {/* Quick Actions Section */}
      <div className="bg-bookconnect-cream/50 rounded-lg p-6 border border-bookconnect-sage/20">
        <h3 className="text-xl font-serif text-bookconnect-brown mb-4">
          Quick Actions
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <Button
            variant="outline"
            className="flex items-center justify-center gap-2 p-4 h-auto hover:bg-bookconnect-brown/10"
            onClick={() => {
              // TODO: Implement batch subscription processing
              console.log('Process expired subscriptions');
            }}
          >
            <div className="text-center">
              <div className="font-medium">Process Expired</div>
              <div className="text-sm text-muted-foreground">Clean up expired subscriptions</div>
            </div>
          </Button>

          <Button
            variant="outline"
            className="flex items-center justify-center gap-2 p-4 h-auto hover:bg-bookconnect-brown/10"
            onClick={() => {
              // TODO: Implement entitlements validation
              console.log('Validate entitlements');
            }}
          >
            <div className="text-center">
              <div className="font-medium">Validate Entitlements</div>
              <div className="text-sm text-muted-foreground">Check user tier consistency</div>
            </div>
          </Button>

          <Button
            variant="outline"
            className="flex items-center justify-center gap-2 p-4 h-auto hover:bg-bookconnect-brown/10"
            onClick={() => {
              // TODO: Implement health check
              console.log('Run health check');
            }}
          >
            <div className="text-center">
              <div className="font-medium">Run Health Check</div>
              <div className="text-sm text-muted-foreground">Comprehensive system check</div>
            </div>
          </Button>
        </div>

        <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-md">
          <p className="text-sm text-blue-800">
            <strong>Note:</strong> Quick actions are currently in development. 
            Use the individual component interfaces above for subscription management tasks.
          </p>
        </div>
      </div>

      {/* Help and Documentation */}
      <div className="bg-white rounded-lg p-6 border border-gray-200">
        <h3 className="text-xl font-serif text-bookconnect-brown mb-4">
          Subscription Management Guide
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-semibold text-bookconnect-brown mb-2">
              Understanding Subscription Health
            </h4>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• <strong>Healthy (90-100):</strong> All subscriptions valid, no issues</li>
              <li>• <strong>Warning (70-89):</strong> Minor issues, expired subscriptions</li>
              <li>• <strong>Critical (&lt;70):</strong> Invalid entitlements, system issues</li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-semibold text-bookconnect-brown mb-2">
              Managing Problematic Users
            </h4>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• <strong>Downgrade Tier:</strong> User has premium tier without subscription</li>
              <li>• <strong>Verify Subscription:</strong> Check for missed subscription records</li>
              <li>• <strong>Contact User:</strong> Resolve payment or renewal issues</li>
              <li>• <strong>Manual Review:</strong> Complex cases requiring investigation</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SubscriptionManagementPage;
