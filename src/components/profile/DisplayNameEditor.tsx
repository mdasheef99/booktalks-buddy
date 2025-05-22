import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Edit2, Check, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import DisplayNameField from '@/components/forms/DisplayNameField';
import { updateUserProfile } from '@/services/profileService';
import { formatUserIdentity } from '@/utils/usernameValidation';

interface DisplayNameEditorProps {
  userId: string;
  currentDisplayName: string | null;
  username: string;
  onUpdate?: (newDisplayName: string | null) => void;
  className?: string;
}

const DisplayNameEditor: React.FC<DisplayNameEditorProps> = ({
  userId,
  currentDisplayName,
  username,
  onUpdate,
  className = ''
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [displayName, setDisplayName] = useState(currentDisplayName || '');
  const [isValid, setIsValid] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSave = async () => {
    if (!isValid) {
      toast({
        title: "Invalid display name",
        description: "Please fix the issues before saving.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const updatedProfile = await updateUserProfile(userId, {
        displayname: displayName.trim() || null
      });

      if (updatedProfile) {
        setIsEditing(false);
        onUpdate?.(displayName.trim() || null);
        
        toast({
          title: "Display name updated",
          description: displayName.trim() 
            ? `You're now known as ${displayName.trim()}`
            : "Display name removed",
        });
      } else {
        throw new Error('Failed to update profile');
      }
    } catch (error) {
      console.error('Error updating display name:', error);
      toast({
        title: "Update failed",
        description: "Failed to update display name. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setDisplayName(currentDisplayName || '');
    setIsEditing(false);
  };

  if (isEditing) {
    return (
      <div className={`space-y-3 ${className}`}>
        <DisplayNameField
          value={displayName}
          onChange={setDisplayName}
          onValidationChange={setIsValid}
          placeholder="Enter your display name"
        />
        
        {/* Preview */}
        <div className="bg-gray-50 p-2 rounded border">
          <p className="text-xs text-gray-600 mb-1">Preview:</p>
          <p className="text-sm font-medium">
            {formatUserIdentity(displayName.trim() || null, username, 'full')}
          </p>
        </div>
        
        <div className="flex gap-2">
          <Button
            size="sm"
            onClick={handleSave}
            disabled={!isValid || isLoading}
            className="flex items-center gap-1"
          >
            <Check className="h-3 w-3" />
            {isLoading ? 'Saving...' : 'Save'}
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={handleCancel}
            disabled={isLoading}
            className="flex items-center gap-1"
          >
            <X className="h-3 w-3" />
            Cancel
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <span className="font-medium">
            {formatUserIdentity(currentDisplayName, username, 'display-primary')}
          </span>
          {currentDisplayName && (
            <span className="text-gray-500 text-sm">(@{username})</span>
          )}
        </div>
        <p className="text-xs text-gray-500 mt-1">
          {currentDisplayName 
            ? "Your display name and username" 
            : "Click edit to add a display name"
          }
        </p>
      </div>
      
      <Button
        size="sm"
        variant="ghost"
        onClick={() => setIsEditing(true)}
        className="flex items-center gap-1 text-bookconnect-brown hover:text-bookconnect-brown/80"
      >
        <Edit2 className="h-3 w-3" />
        Edit
      </Button>
    </div>
  );
};

export default DisplayNameEditor;
