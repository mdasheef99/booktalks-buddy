import React, { useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { BookOpen, Save, X } from 'lucide-react';
import { BookEntryModalProps } from './types/bookFormTypes';
import {
  VALIDATION_MESSAGES,
  hasValidationErrors
} from './utils';
import {
  useBookForm,
  useBookImageUpload,
  useBookValidation
} from './hooks';
import {
  BookBasicInfoForm,
  BookContentForm,
  BookSettingsForm
} from './forms';

/**
 * Modal for adding/editing carousel book entries
 */
export const BookEntryModal: React.FC<BookEntryModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  storeId,
  editingItem
}) => {
  // Custom hooks for state management
  const {
    formData,
    errors: formErrors,
    isLoading,
    updateFormData,
    handleSubmit,
    setErrors: setFormErrors
  } = useBookForm(storeId, editingItem, onSuccess);

  const {
    imageUrl,
    handleUploadComplete,
    handleUploadError,
    clearImage,
    setImageUrl
  } = useBookImageUpload(storeId, editingItem);

  const {
    errors: validationErrors,
    validateForm,
    setErrors: setValidationErrors
  } = useBookValidation();

  // Combine errors from form and validation hooks
  const errors = { ...formErrors, ...validationErrors };
  const setErrors = (newErrors: typeof errors) => {
    setFormErrors(newErrors);
    setValidationErrors(newErrors);
  };

  // Initialize image URL when editing item changes (only for edit mode)
  useEffect(() => {
    if (editingItem) {
      // Only set image URL when editing an existing item
      setImageUrl(editingItem.book_image_url || null);
    }
    // Don't clear image when creating new item - let user uploads persist
  }, [editingItem, setImageUrl]);

  // Clear image when modal closes (for new items only)
  useEffect(() => {
    if (!isOpen && !editingItem) {
      clearImage();
    }
  }, [isOpen, editingItem, clearImage]);

  // Create validation function that uses the validation hook
  const validateFormData = () => {
    return validateForm(formData, imageUrl, editingItem);
  };

  // Handle form submission with validation
  const onSubmit = (e: React.FormEvent) => {
    console.log('🔍 BookEntryModal - Form submission started');
    console.log('📷 BookEntryModal - Current imageUrl:', imageUrl);
    console.log('📝 BookEntryModal - Form data:', formData);
    handleSubmit(e, imageUrl, validateFormData);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            {editingItem ? 'Edit Book' : 'Add Book to Carousel'}
          </DialogTitle>
          <DialogDescription>
            {editingItem
              ? 'Update the book information and settings'
              : 'Add a new book to your featured carousel (up to 6 books)'
            }
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} className="space-y-6">
          {/* Basic Information Section */}
          <BookBasicInfoForm
            formData={formData}
            errors={errors}
            editingItem={editingItem}
            onUpdate={updateFormData}
          />

          {/* Content and Media Section */}
          <BookContentForm
            formData={formData}
            errors={errors}
            imageUrl={imageUrl}
            storeId={storeId}
            onUpdate={updateFormData}
            onImageUploadComplete={handleUploadComplete}
            onImageUploadError={handleUploadError}
          />

          {/* Settings Section */}
          <BookSettingsForm
            formData={formData}
            errors={errors}
            imageUrl={imageUrl}
            onUpdate={updateFormData}
          />

          {/* Error Alert */}
          {hasValidationErrors(errors) && (
            <Alert variant="destructive">
              <AlertDescription>
                {VALIDATION_MESSAGES.FORM_HAS_ERRORS}
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
            {isLoading ? 'Saving...' : editingItem ? 'Update Book' : 'Add Book'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
