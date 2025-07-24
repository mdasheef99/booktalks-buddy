/**
 * Store Managers Management Page
 * 
 * Main page component that orchestrates all Store Manager appointment functionality.
 * Serves as the container for Store Manager operations within the Store Owner admin panel.
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Users, Crown, HelpCircle } from 'lucide-react';
import { toast } from 'sonner';
import { useStoreOwnerAccess } from '@/hooks/useStoreOwnerAccess';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

// Import Store Manager components
import StoreManagersList from '@/components/admin/store/managers/StoreManagersList';
import UserSearchInterface from '@/components/admin/store/managers/UserSearchInterface';
import AppointManagerModal from '@/components/admin/store/managers/AppointManagerModal';
import RemoveManagerModal from '@/components/admin/store/managers/RemoveManagerModal';
import ManagerPermissionsView from '@/components/admin/store/managers/ManagerPermissionsView';

// Import services and types
import { storeManagerService } from '@/services/storeManagers/storeManagerService';
import type { StoreManager, StoreManagerCandidate } from '@/types/storeManagers';

// =========================
// Main Store Managers Management Component
// =========================

const StoreManagersManagement: React.FC = () => {
  const navigate = useNavigate();
  const { isStoreOwner, storeId, loading: storeAccessLoading } = useStoreOwnerAccess();

  // State management
  const [managers, setManagers] = useState<StoreManager[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Modal states
  const [appointModalOpen, setAppointModalOpen] = useState(false);
  const [removeModalOpen, setRemoveModalOpen] = useState(false);
  const [permissionsModalOpen, setPermissionsModalOpen] = useState(false);
  
  // Selected items
  const [selectedUser, setSelectedUser] = useState<StoreManagerCandidate | null>(null);
  const [selectedManager, setSelectedManager] = useState<StoreManager | null>(null);
  
  // Operation states
  const [appointing, setAppointing] = useState(false);
  const [removing, setRemoving] = useState(false);

  // =========================
  // Access Control
  // =========================

  useEffect(() => {
    if (!storeAccessLoading && !isStoreOwner) {
      toast.error('Access denied. Store Owner privileges required.');
      navigate('/admin/dashboard');
    }
  }, [isStoreOwner, storeAccessLoading, navigate]);

  // =========================
  // Data Loading
  // =========================

  const loadStoreManagers = async () => {
    if (!storeId) return;

    try {
      setLoading(true);
      setError(null);
      const managersData = await storeManagerService.getStoreManagers(storeId);
      setManagers(managersData);
    } catch (err) {
      console.error('Error loading Store Managers:', err);
      setError(err instanceof Error ? err.message : 'Failed to load Store Managers');
      toast.error('Failed to load Store Managers');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (storeId && !storeAccessLoading) {
      loadStoreManagers();
    }
  }, [storeId, storeAccessLoading]);

  // =========================
  // Event Handlers
  // =========================

  const handleUserSelect = (user: StoreManagerCandidate) => {
    setSelectedUser(user);
    setAppointModalOpen(true);
  };

  const handleAppointConfirm = async () => {
    if (!selectedUser || !storeId) return;

    try {
      setAppointing(true);
      await storeManagerService.appointStoreManager(storeId, selectedUser.id);
      
      // Refresh the managers list
      await loadStoreManagers();
      
      // Close modal and reset state
      setAppointModalOpen(false);
      setSelectedUser(null);
      
      toast.success(`Successfully appointed ${selectedUser.username} as Store Manager`);
    } catch (err) {
      console.error('Error appointing Store Manager:', err);
      // Error handling is done in the service layer
    } finally {
      setAppointing(false);
    }
  };

  const handleRemoveManager = (userId: string) => {
    const manager = managers.find(m => m.user_id === userId);
    if (manager) {
      setSelectedManager(manager);
      setRemoveModalOpen(true);
    }
  };

  const handleRemoveConfirm = async () => {
    if (!selectedManager || !storeId) return;

    try {
      setRemoving(true);
      await storeManagerService.removeStoreManager(storeId, selectedManager.user_id);
      
      // Refresh the managers list
      await loadStoreManagers();
      
      // Close modal and reset state
      setRemoveModalOpen(false);
      setSelectedManager(null);
      
      toast.success(`Successfully removed ${selectedManager.users.username} from Store Manager role`);
    } catch (err) {
      console.error('Error removing Store Manager:', err);
      // Error handling is done in the service layer
    } finally {
      setRemoving(false);
    }
  };

  // =========================
  // Loading State
  // =========================

  if (storeAccessLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="lg" />
        <span className="ml-3 text-muted-foreground">Loading Store Manager interface...</span>
      </div>
    );
  }

  if (!isStoreOwner) {
    return null; // Will redirect in useEffect
  }

  // =========================
  // Render
  // =========================

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/admin/store-management')}
            className="text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Store Management
          </Button>
        </div>
      </div>

      {/* Page Title */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-serif font-bold text-bookconnect-brown">
            Store Managers
          </h1>
          <p className="text-muted-foreground mt-1">
            Appoint and manage Store Managers who can help administer your store
          </p>
        </div>
        
        <Button
          variant="outline"
          onClick={() => setPermissionsModalOpen(true)}
          className="flex items-center space-x-2"
        >
          <HelpCircle className="h-4 w-4" />
          <span>View Permissions</span>
        </Button>
      </div>

      {/* Store Managers List */}
      <StoreManagersList
        storeId={storeId || ''}
        managers={managers}
        loading={loading}
        onRemoveManager={handleRemoveManager}
        onRefresh={loadStoreManagers}
      />

      {/* User Search Interface */}
      <UserSearchInterface
        storeId={storeId || ''}
        onUserSelect={handleUserSelect}
        excludeUserIds={managers.map(m => m.user_id)}
        loading={appointing}
      />

      {/* Modals */}
      <AppointManagerModal
        isOpen={appointModalOpen}
        onClose={() => {
          setAppointModalOpen(false);
          setSelectedUser(null);
        }}
        onConfirm={handleAppointConfirm}
        user={selectedUser}
        loading={appointing}
      />

      <RemoveManagerModal
        isOpen={removeModalOpen}
        onClose={() => {
          setRemoveModalOpen(false);
          setSelectedManager(null);
        }}
        onConfirm={handleRemoveConfirm}
        manager={selectedManager}
        loading={removing}
      />

      <ManagerPermissionsView
        isOpen={permissionsModalOpen}
        onClose={() => setPermissionsModalOpen(false)}
      />
    </div>
  );
};

export default StoreManagersManagement;
