/**
 * Member Spotlight Manager Component
 * Refactored main component using focused sub-components and custom hooks
 */

import React from 'react';
import type { MemberSpotlight } from '@/lib/api/store/types/communityShowcaseTypes';
import type { MemberSpotlightManagerProps } from './types/memberSpotlightTypes';
import { useMemberSpotlightManager } from './hooks/useMemberSpotlightManager';
import { SpotlightList } from './components/SpotlightList';
import { SpotlightFormDialog } from './components/SpotlightForm';
import { SpotlightDeleteDialog } from './components/SpotlightDeleteDialog';

export const MemberSpotlightManager: React.FC<MemberSpotlightManagerProps> = ({
  storeId,
  spotlights,
  onRefresh
}) => {
  // Use the custom hook for all state management and actions
  const {
    formState,
    showCreateDialog,
    setShowCreateDialog,
    deleteSpotlightId,
    setDeleteSpotlightId,
    handleCreateSpotlight,
    handleEditSpotlight,
    handleSubmit,
    handleDeleteConfirm,
    updateFormData,
    mutations,
  } = useMemberSpotlightManager(storeId, onRefresh);

  return (
    <div className="space-y-6">
      {/* Main Spotlight List */}
      <SpotlightList
        spotlights={spotlights}
        onEdit={handleEditSpotlight}
        onDelete={setDeleteSpotlightId}
        onCreateNew={handleCreateSpotlight}
        isLoading={mutations.isLoading}
      />

      {/* Create/Edit Form Dialog */}
      <SpotlightFormDialog
        isOpen={showCreateDialog}
        onClose={() => setShowCreateDialog(false)}
        formData={formState.formData}
        onFormDataChange={updateFormData}
        isEditing={formState.isEditing}
        isLoading={mutations.isLoading}
        onSubmit={handleSubmit}
        onCancel={() => setShowCreateDialog(false)}
        storeId={storeId}
      />

      {/* Delete Confirmation Dialog */}
      <SpotlightDeleteDialog
        isOpen={!!deleteSpotlightId}
        onClose={() => setDeleteSpotlightId(null)}
        onConfirm={handleDeleteConfirm}
        isLoading={mutations.deleteMutation.isPending}
      />
    </div>
  );
};
