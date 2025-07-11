/**
 * Edit Collection Modal Component
 * 
 * Modal for editing collection details with validation
 * Follows BookConnect design system patterns
 */

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Edit, Loader2, AlertCircle, Users, EyeOff } from 'lucide-react';
import { toast } from 'sonner';
import { updateCollection } from '@/services/books/collections';
import { EditCollectionModalProps, EditCollectionFormData } from './types';

export const EditCollectionModal: React.FC<EditCollectionModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  collection,
  userId
}) => {
  const [formData, setFormData] = useState<EditCollectionFormData>({
    name: '',
    description: '',
    is_public: true
  });
  const [errors, setErrors] = useState<Partial<EditCollectionFormData>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Initialize form data when collection changes
  useEffect(() => {
    if (collection && isOpen) {
      setFormData({
        name: collection.name,
        description: collection.description || '',
        is_public: collection.is_public
      });
      setErrors({});
      setIsSubmitting(false);
    }
  }, [collection, isOpen]);

  // Form validation
  const validateForm = (): boolean => {
    const newErrors: Partial<EditCollectionFormData> = {};

    // Name validation
    if (!formData.name.trim()) {
      newErrors.name = 'Collection name is required';
    } else if (formData.name.trim().length < 2) {
      newErrors.name = 'Collection name must be at least 2 characters';
    } else if (formData.name.trim().length > 100) {
      newErrors.name = 'Collection name must be less than 100 characters';
    }

    // Description validation (optional but with limits)
    if (formData.description && formData.description.length > 500) {
      newErrors.description = 'Description must be less than 500 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!collection || !validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const updatedCollection = await updateCollection(userId, collection.id, {
        name: formData.name.trim(),
        description: formData.description.trim() || undefined,
        is_public: formData.is_public
      });

      toast.success('Collection updated successfully!');
      onSuccess(updatedCollection);
      onClose();
    } catch (error) {
      console.error('Error updating collection:', error);
      toast.error('Failed to update collection. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle input changes
  const handleInputChange = (field: keyof EditCollectionFormData, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear error for this field when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      onClose();
    }
  };

  if (!collection) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-serif text-bookconnect-brown flex items-center gap-2">
            <Edit className="h-5 w-5 text-bookconnect-terracotta" />
            Edit Collection
          </DialogTitle>
          <DialogDescription>
            Update your collection details. Changes will be saved immediately.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Collection Name */}
          <div className="space-y-2">
            <Label htmlFor="edit-collection-name" className="text-bookconnect-brown">
              Collection Name <span className="text-red-500">*</span>
            </Label>
            <Input
              id="edit-collection-name"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              placeholder="e.g., Sci-Fi Favorites, Summer Reading..."
              disabled={isSubmitting}
              className={errors.name ? 'border-red-500' : ''}
              maxLength={100}
            />
            {errors.name && (
              <Alert variant="destructive" className="py-2">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="text-sm">{errors.name}</AlertDescription>
              </Alert>
            )}
          </div>

          {/* Collection Description */}
          <div className="space-y-2">
            <Label htmlFor="edit-collection-description" className="text-bookconnect-brown">
              Description (Optional)
            </Label>
            <Textarea
              id="edit-collection-description"
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="Describe what this collection is about..."
              disabled={isSubmitting}
              className={errors.description ? 'border-red-500' : ''}
              maxLength={500}
              rows={3}
            />
            <div className="flex justify-between items-center text-xs text-bookconnect-brown/60">
              <span>{errors.description && <span className="text-red-500">{errors.description}</span>}</span>
              <span>{formData.description.length}/500</span>
            </div>
          </div>

          {/* Privacy Setting */}
          <div className="space-y-3">
            <Label className="text-bookconnect-brown">Privacy Setting</Label>
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center gap-3">
                {formData.is_public ? (
                  <Users className="h-5 w-5 text-bookconnect-olive" />
                ) : (
                  <EyeOff className="h-5 w-5 text-bookconnect-brown/70" />
                )}
                <div>
                  <div className="font-medium text-bookconnect-brown">
                    {formData.is_public ? 'Public Collection' : 'Private Collection'}
                  </div>
                  <div className="text-sm text-bookconnect-brown/70">
                    {formData.is_public 
                      ? 'Other users can discover and view this collection'
                      : 'Only you can see this collection'
                    }
                  </div>
                </div>
              </div>
              <Switch
                checked={formData.is_public}
                onCheckedChange={(checked) => handleInputChange('is_public', checked)}
                disabled={isSubmitting}
              />
            </div>
          </div>
        </form>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={isSubmitting}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || !formData.name.trim()}
            className="flex-1 bg-bookconnect-terracotta hover:bg-bookconnect-terracotta/90"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                Updating...
              </>
            ) : (
              <>
                <Edit className="w-4 h-4 mr-2" />
                Update Collection
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
