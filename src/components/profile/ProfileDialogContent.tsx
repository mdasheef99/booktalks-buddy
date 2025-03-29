
import React from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import UsernameEditor from "./UsernameEditor";
import ProfileForm from "./ProfileForm";
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
    <ScrollArea className="flex-1 h-full pr-4 max-h-[50vh]">
      <div className="space-y-4 py-2 font-serif px-1">
        <UsernameEditor username={username} setUsername={setUsername} />

        <ProfileForm 
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
  );
};

export default ProfileDialogContent;
