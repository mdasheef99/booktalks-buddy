
import React, { useEffect } from "react";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";

import ProfileDialogHeader from "./ProfileDialogHeader";
import ProfileDialogContent from "./ProfileDialogContent";
import ProfileDialogFooter from "./ProfileDialogFooter";
import { useProfileData } from "@/hooks/useProfileData";
import { toast } from "sonner";

interface ProfileDialogProps {
  open: boolean;
  onClose: () => void;
}

const ProfileDialog: React.FC<ProfileDialogProps> = ({ open, onClose }) => {
  const {
    // State
    username, // Read-only
    displayName,
    favoriteAuthor,
    setFavoriteAuthor,
    favoriteGenre,
    setFavoriteGenre,
    bio,
    setBio,
    allowChats,
    setAllowChats,
    chatRequests,
    activeChatsCount,
    isLoading,

    // Methods
    initialize,
    setupRealtimeSubscription,
    handleSaveProfile,
    handleChatActionRequest,
    handleDisplayNameUpdate
  } = useProfileData();

  useEffect(() => {
    if (open) {
      initialize();
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;

    return setupRealtimeSubscription();
  }, [open]);

  const handleSaveProfileAndRefresh = async () => {
    await handleSaveProfile();

    // Note: Username is no longer editable, so no need to update localStorage
    // Only profile data (bio, favorite author/genre, etc.) is saved

    toast("Profile updated", {
      description: "Your profile has been updated successfully."
    });

    // Close the dialog after saving
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent
        className="max-w-xl w-[95%] h-[85vh] mx-auto bg-bookconnect-cream overflow-hidden flex flex-col"
        style={{
          backgroundImage: `url('https://images.unsplash.com/photo-1528459105426-b9548367069b?q=80&w=1412&auto=format&fit=crop')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundBlendMode: 'overlay',
          backgroundColor: 'rgba(246, 241, 229, 0.92)',
          border: '1px solid #B8A088',
          boxShadow: '0 4px 30px rgba(0, 0, 0, 0.15)'
        }}
      >
        <ProfileDialogHeader />
        <ProfileDialogContent
          username={username}
          displayName={displayName}
          favoriteAuthor={favoriteAuthor}
          setFavoriteAuthor={setFavoriteAuthor}
          favoriteGenre={favoriteGenre}
          setFavoriteGenre={setFavoriteGenre}
          bio={bio}
          setBio={setBio}
          allowChats={allowChats}
          setAllowChats={setAllowChats}
          chatRequests={chatRequests}
          activeChatsCount={activeChatsCount}
          onChatAction={handleChatActionRequest}
          onDisplayNameUpdate={handleDisplayNameUpdate}
        />
        <ProfileDialogFooter
          isLoading={isLoading}
          onSave={handleSaveProfileAndRefresh}
          onClose={onClose}
        />
      </DialogContent>
    </Dialog>
  );
};

export default ProfileDialog;
