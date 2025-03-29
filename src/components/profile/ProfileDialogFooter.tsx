
import React from "react";
import { DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Check, LogOut } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";

interface ProfileDialogFooterProps {
  isLoading: boolean;
  showSavedMessage: boolean;
  onSave: () => void;
  onClose: () => void;
}

const ProfileDialogFooter: React.FC<ProfileDialogFooterProps> = ({
  isLoading,
  showSavedMessage,
  onSave,
  onClose
}) => {
  const { signOut } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await signOut();
    onClose();
    navigate('/');
  };

  return (
    <DialogFooter className="mt-4 pt-4 border-t border-bookconnect-brown/20">
      {showSavedMessage && (
        <div className="text-center text-sm text-green-600 bg-green-50 rounded-md p-1 mb-2 flex items-center justify-center w-full">
          <Check className="h-4 w-4 mr-1" /> Changes saved successfully
        </div>
      )}
      
      <div className="flex flex-col sm:flex-row gap-2 w-full mt-2">
        <Button 
          onClick={onSave} 
          className="w-full bg-bookconnect-sage hover:bg-bookconnect-terracotta text-white transition-colors border border-bookconnect-brown/30 shadow-md"
          disabled={isLoading}
        >
          {isLoading ? "Saving..." : "Save Changes"}
        </Button>
        
        <Button 
          onClick={handleLogout}
          className="w-full bg-bookconnect-brown hover:bg-bookconnect-brown/80 text-white transition-colors border border-bookconnect-brown/30 shadow-md"
          type="button"
        >
          <LogOut className="h-4 w-4 mr-1" /> Log Out
        </Button>
      </div>
    </DialogFooter>
  );
};

export default ProfileDialogFooter;
