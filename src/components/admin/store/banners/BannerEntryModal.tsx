import React from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Megaphone, Save, X } from 'lucide-react';

// Import extracted utilities, types, and hooks
import {
  isEditMode,
  BannerEntryModalProps
} from './utils';

import {
  useBannerForm,
  useBannerValidation,
  useBannerImageUpload
} from './hooks';

import {
  BannerBasicInfoForm,
  BannerContentForm,
  BannerStylingForm,
  BannerSchedulingForm
} from './forms';

/**
 * Modal for adding/editing promotional banners
 */
export const BannerEntryModal: React.FC<BannerEntryModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  storeId,
  editingBanner
}) => {
  // Custom hooks for form management
  const {
    formData,
    errors,
    isLoading,
    updateFormData,
    resetForm,
    handleSubmit,
    setErrors
  } = useBannerForm(storeId, editingBanner, onSuccess);

  // Image upload hook
  const {
    imageUrl,
    handleUploadComplete,
    handleUploadError,
    clearImage,
    setImageUrl
  } = useBannerImageUpload(storeId, editingBanner);

  // Validation hook
  const { validateForm } = useBannerValidation(formData, imageUrl, editingBanner, setErrors);

  // Handle form submission with validation
  const onSubmit = (e: React.FormEvent) => {
    handleSubmit(e, imageUrl, validateForm);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Megaphone className="h-5 w-5" />
            {editingBanner ? 'Edit Banner' : 'Create Promotional Banner'}
          </DialogTitle>
          <DialogDescription>
            {editingBanner
              ? 'Update the banner information and settings'
              : 'Create a new promotional banner for your landing page'
            }
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} className="space-y-6">
          {/* Basic Information */}
          <BannerBasicInfoForm
            formData={formData}
            errors={errors}
            onUpdate={updateFormData}
          />

          {/* Content */}
          <BannerContentForm
            formData={formData}
            errors={errors}
            imageUrl={imageUrl}
            storeId={storeId}
            onUpdate={updateFormData}
            onImageUploadComplete={handleUploadComplete}
            onImageUploadError={handleUploadError}
          />

          {/* Styling */}
          <BannerStylingForm
            formData={formData}
            errors={errors}
            onUpdate={updateFormData}
          />

          {/* Scheduling */}
          <BannerSchedulingForm
            formData={formData}
            errors={errors}
            editingBanner={editingBanner}
            onUpdate={updateFormData}
          />

          {/* Error Alert */}
          {Object.keys(errors).length > 0 && (
            <Alert variant="destructive">
              <AlertDescription>
                Please fix the errors above before submitting.
              </AlertDescription>
            </Alert>
          )}
        </form>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isLoading}
          >
            <X className="h-4 w-4 mr-2" />
            Cancel
          </Button>
          <Button
            type="submit"
            onClick={onSubmit}
            disabled={isLoading}
          >
            <Save className="h-4 w-4 mr-2" />
            {isLoading ? 'Saving...' : editingBanner ? 'Update Banner' : 'Create Banner'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
