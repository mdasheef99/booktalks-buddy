
import React from "react";
import { DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";

interface ProfileDialogFooterProps {
  isLoading: boolean;
  showSavedMessage: boolean;
  onSave: () => void;
}

const ProfileDialogFooter: React.FC<ProfileDialogFooterProps> = ({
  isLoading,
  showSavedMessage,
  onSave
}) => {
  return (
    <DialogFooter className="mt-6 pt-4 border-t border-bookconnect-brown/20">
      {showSavedMessage && (
        <div className="text-center text-sm text-green-600 bg-green-50 rounded-md p-1 mb-2 flex items-center justify-center">
          <Check className="h-4 w-4 mr-1" /> Changes saved successfully
        </div>
      )}
      <Button 
        onClick={onSave} 
        className="w-full bg-bookconnect-sage hover:bg-bookconnect-terracotta text-white transition-colors border border-bookconnect-brown/30 shadow-md"
        disabled={isLoading}
      >
        {isLoading ? "Saving..." : "Save Changes"}
      </Button>
    </DialogFooter>
  );
};

export default ProfileDialogFooter;
