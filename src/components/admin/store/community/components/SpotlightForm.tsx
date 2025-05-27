/**
 * Spotlight Form Component
 * Form for creating and editing member spotlights
 */

import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import type { MemberSpotlightFormProps } from '../types/memberSpotlightTypes';
import { MemberSearch } from './MemberSearch';
import { SpotlightTypeSelect } from './SpotlightTypeSelect';
import {
  VALIDATION_LIMITS,
  UI_TEXT,
  DATE_CONFIG
} from '../constants/memberSpotlightConstants';

export const SpotlightForm: React.FC<MemberSpotlightFormProps> = ({
  formData,
  onFormDataChange,
  isEditing,
  isLoading,
  onSubmit,
  onCancel,
  storeId,
}) => {
  const [searchTerm, setSearchTerm] = React.useState('');

  const updateField = <K extends keyof typeof formData>(field: K, value: typeof formData[K]) => {
    onFormDataChange({ ...formData, [field]: value });
  };

  return (
    <div className="space-y-6">
      {/* Member Selection */}
      <MemberSearch
        storeId={storeId}
        selectedMemberId={formData.featured_member_id}
        onMemberSelect={(memberId) => updateField('featured_member_id', memberId)}
        searchTerm={searchTerm}
        onSearchTermChange={setSearchTerm}
      />

      {/* Spotlight Type */}
      <div className="space-y-2">
        <Label>{UI_TEXT.LABELS.SPOTLIGHT_TYPE} *</Label>
        <SpotlightTypeSelect
          value={formData.spotlight_type}
          onChange={(type) => updateField('spotlight_type', type)}
          showDescription={true}
        />
      </div>

      {/* Description */}
      <div className="space-y-2">
        <Label>{UI_TEXT.LABELS.DESCRIPTION} *</Label>
        <Textarea
          value={formData.spotlight_description}
          onChange={(e) => updateField('spotlight_description', e.target.value)}
          placeholder={UI_TEXT.PLACEHOLDERS.DESCRIPTION}
          className="min-h-[120px]"
          maxLength={VALIDATION_LIMITS.DESCRIPTION_MAX_LENGTH}
        />
        <div className="text-sm text-gray-500 text-right">
          {formData.spotlight_description.length}/{VALIDATION_LIMITS.DESCRIPTION_MAX_LENGTH} characters
        </div>
      </div>

      {/* End Date */}
      <div className="space-y-2">
        <Label>{UI_TEXT.LABELS.END_DATE}</Label>
        <Input
          type="date"
          value={formData.spotlight_end_date}
          onChange={(e) => updateField('spotlight_end_date', e.target.value)}
          min={DATE_CONFIG.MIN_DATE()}
        />
        <div className="text-sm text-gray-500">
          {UI_TEXT.HELP_TEXT.END_DATE}
        </div>
      </div>
    </div>
  );
};

/**
 * Spotlight Form Dialog Component
 */
interface SpotlightFormDialogProps extends MemberSpotlightFormProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SpotlightFormDialog: React.FC<SpotlightFormDialogProps> = ({
  isOpen,
  onClose,
  isEditing,
  isLoading,
  onSubmit,
  ...formProps
}) => {
  const handleSubmit = () => {
    onSubmit();
  };

  const isSubmitDisabled = isLoading ||
    !formProps.formData.featured_member_id.trim() ||
    !formProps.formData.spotlight_description.trim();

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle>
            {isEditing ? UI_TEXT.DIALOG_TITLES.EDIT : UI_TEXT.DIALOG_TITLES.CREATE}
          </DialogTitle>
          <DialogDescription>
            {UI_TEXT.DIALOG_DESCRIPTIONS.CREATE}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-1">
          <SpotlightForm
            {...formProps}
            isEditing={isEditing}
            isLoading={isLoading}
            onSubmit={onSubmit}
            onCancel={onClose}
          />
        </div>

        <DialogFooter className="flex-shrink-0 mt-6">
          <Button variant="outline" onClick={onClose}>
            {UI_TEXT.BUTTONS.CANCEL}
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitDisabled}
          >
            {isLoading ? UI_TEXT.BUTTONS.SAVING :
             isEditing ? UI_TEXT.BUTTONS.UPDATE_SPOTLIGHT : UI_TEXT.BUTTONS.CREATE_SPOTLIGHT}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
