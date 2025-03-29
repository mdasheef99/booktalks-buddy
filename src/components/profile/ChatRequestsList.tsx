
import React from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Bell } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";

export interface ChatRequest {
  id: string;
  requester_id: string;
  requester_username: string;
  receiver_id: string;
  status: 'pending' | 'accepted' | 'rejected';
  created_at: string;
}

interface ChatRequestsListProps {
  chatRequests: ChatRequest[];
  activeChatsCount: number;
  allowChats: boolean;
  setAllowChats: (allow: boolean) => void;
  onChatAction: (chatId: string, action: 'accept' | 'reject') => Promise<void>;
}

const ChatRequestsList: React.FC<ChatRequestsListProps> = ({
  chatRequests,
  activeChatsCount,
  allowChats,
  setAllowChats,
  onChatAction
}) => {
  const { toast } = useToast();

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="block text-sm font-medium text-bookconnect-brown">
          Private Chats
          {activeChatsCount > 0 && (
            <Badge className="ml-2 bg-bookconnect-terracotta" variant="default">
              {activeChatsCount} {activeChatsCount === 1 ? "chat" : "chats"}
            </Badge>
          )}
        </label>
        <div className="flex items-center gap-2">
          <span className="text-xs text-bookconnect-brown/80">
            Allow requests
          </span>
          <Switch 
            checked={allowChats} 
            onCheckedChange={setAllowChats} 
          />
        </div>
      </div>

      {chatRequests.length > 0 ? (
        <div className="space-y-2 max-h-40 overflow-y-auto">
          {chatRequests.map((request) => (
            <div 
              key={request.id}
              className="p-2 border border-bookconnect-brown/30 rounded bg-white/70 shadow-sm"
            >
              <div className="flex items-center justify-between">
                <span className="font-mono text-sm text-bookconnect-brown">
                  {request.requester_username} wants to chat
                </span>
                <div className="flex gap-1">
                  <Button 
                    size="sm" 
                    variant="outline"
                    className="text-green-600 border-green-600 hover:bg-green-50"
                    onClick={() => onChatAction(request.id, 'accept')}
                    style={{ transform: 'rotate(-5deg)' }}
                  >
                    Accept
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline"
                    className="text-red-600 border-red-600 hover:bg-red-50"
                    onClick={() => onChatAction(request.id, 'reject')}
                    style={{ transform: 'rotate(3deg)' }}
                  >
                    Reject
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-2 italic text-sm text-bookconnect-brown/50">
          No pending chat requests
        </div>
      )}
    </div>
  );
};

export default ChatRequestsList;
