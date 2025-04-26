
import React from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import UsernameEditor from "./UsernameEditor";
import SimpleProfileForm from "./SimpleProfileForm";
import ChatSettings from "./ChatSettings";
import ChatRequestsList, { ChatRequest } from "./ChatRequestsList";
import ReadingActivity from "./ReadingActivity";

interface ProfileDialogContentProps {
  username: string;
  setUsername: (username: string) => void;
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
}

const ProfileDialogContent: React.FC<ProfileDialogContentProps> = ({
  username,
  setUsername,
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
  onChatAction
}) => {
  return (
    <div className="flex-1 overflow-hidden py-2">
      <ScrollArea className="h-full pr-4">
        <div className="space-y-6 font-serif px-2">
          <UsernameEditor username={username} setUsername={setUsername} />

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
