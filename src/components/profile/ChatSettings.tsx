
import React from "react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

interface ChatSettingsProps {
  allowChats: boolean;
  setAllowChats: (allow: boolean) => void;
  activeChatsCount: number;
}

const ChatSettings: React.FC<ChatSettingsProps> = ({ 
  allowChats, 
  setAllowChats,
  activeChatsCount 
}) => {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-medium text-bookconnect-brown">Chat Settings</h3>
          <p className="text-xs text-bookconnect-brown/70">
            {activeChatsCount > 0 
              ? `You have ${activeChatsCount} active chat${activeChatsCount !== 1 ? 's' : ''}`
              : "No active chats"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Switch
            checked={allowChats}
            onCheckedChange={setAllowChats}
            id="allow-chats"
          />
          <Label htmlFor="allow-chats" className="text-xs">
            {allowChats ? "Chats Allowed" : "Chats Disabled"}
          </Label>
        </div>
      </div>
    </div>
  );
};

export default ChatSettings;
