/**
 * Testimonial Manager Component
 * Refactored main component using focused sub-components and custom hooks
 */

import React from 'react';
import type { Testimonial } from '@/lib/api/store/types/communityShowcaseTypes';
import type { TestimonialManagerProps } from './types/testimonialTypes';
import { useTestimonialManager } from './hooks/useTestimonialManager';
import { TestimonialList } from './components/TestimonialList';
import { TestimonialFormDialog } from './components/TestimonialForm';
import { DeleteConfirmationDialog } from './components/DeleteConfirmationDialog';

export const TestimonialManager: React.FC<TestimonialManagerProps> = ({
  storeId,
  testimonials,
  onRefresh
}) => {
  // Use the custom hook for all state management and actions
  const {
    formState,
    showCreateDialog,
    setShowCreateDialog,
    deleteTestimonialId,
    setDeleteTestimonialId,
    handleCreateTestimonial,
    handleEditTestimonial,
    handleSubmit,
    handleDeleteConfirm,
    handleApprovalChange,
    updateFormData,
    mutations,
    formHook,
  } = useTestimonialManager(storeId, onRefresh);

  return (
    <div className="space-y-6">
      {/* Main Testimonial List */}
      <TestimonialList
        testimonials={testimonials}
        onEdit={handleEditTestimonial}
        onDelete={setDeleteTestimonialId}
        onApprovalChange={handleApprovalChange}
        onCreateNew={handleCreateTestimonial}
        isLoading={mutations.isLoading}
      />

      {/* Create/Edit Form Dialog */}
      <TestimonialFormDialog
        isOpen={showCreateDialog}
        onClose={() => setShowCreateDialog(false)}
        formData={formState.formData}
        onFormDataChange={updateFormData}
        isEditing={formState.isEditing}
        isLoading={mutations.isLoading}
        onSubmit={handleSubmit}
        onCancel={() => setShowCreateDialog(false)}
      />

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmationDialog
        isOpen={!!deleteTestimonialId}
        onClose={() => setDeleteTestimonialId(null)}
        onConfirm={handleDeleteConfirm}
        isLoading={mutations.deleteMutation.isPending}
      />
    </div>
  );
};
