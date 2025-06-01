
import React from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import SimpleProfileForm from "./SimpleProfileForm";
import ChatSettings from "./ChatSettings";
import ChatRequestsList, { ChatRequest } from "./ChatRequestsList";
import ReadingActivity from "./ReadingActivity";
import DisplayNameEditor from "./DisplayNameEditor";
import { useAuth } from "@/contexts/AuthContext";

interface ProfileDialogContentProps {
  username: string;
  displayName: string | null;
  favoriteAuthor: string;
  setFavoriteAuthor: (author: string) => void;
  favoriteGenre: string;
  setFavoriteGenre: (genre: string) => void;
  bio: string;
  setBio: (bio: string) => void;
  allowChats: boolean;
  setAllowChats: (allow: boolean) => void;
  chatRequests: ChatRequest[];
  activeChatsCount: number;
  onChatAction: (chatId: string, action: 'accept' | 'reject') => void;
  onDisplayNameUpdate?: (newDisplayName: string | null) => void;
}

const ProfileDialogContent: React.FC<ProfileDialogContentProps> = ({
  username,
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
  onChatAction,
  onDisplayNameUpdate
}) => {
  const { user } = useAuth();
  return (
    <div className="flex-1 overflow-hidden py-2">
      <ScrollArea className="h-full pr-4">
        <div className="space-y-6 font-serif px-2">
          {/* Display Name Editor - Only editable field for user identity */}
          {user && (
            <DisplayNameEditor
              userId={user.id}
              currentDisplayName={displayName}
              username={username}
              onUpdate={onDisplayNameUpdate}
            />
          )}

          <SimpleProfileForm
            favoriteAuthor={favoriteAuthor}
            setFavoriteAuthor={setFavoriteAuthor}
            favoriteGenre={favoriteGenre}
            setFavoriteGenre={setFavoriteGenre}
            bio={bio}
            setBio={setBio}
          />

          <ChatSettings
            allowChats={allowChats}
            setAllowChats={setAllowChats}
            activeChatsCount={activeChatsCount}
          />

          {chatRequests.length > 0 && (
            <ChatRequestsList
              chatRequests={chatRequests}
              onChatAction={onChatAction}
            />
          )}

          <ReadingActivity />
        </div>
      </ScrollArea>
    </div>
  );
};

export default ProfileDialogContent;
