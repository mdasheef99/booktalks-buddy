
import React from "react";
import { Button } from "@/components/ui/button";
import { Check, X } from "lucide-react";

export interface ChatRequest {
  id: string;
  requester_id: string;
  requester_username: string;
  receiver_id: string;
  status: string;
  created_at: string;
}

interface ChatRequestsListProps {
  chatRequests: ChatRequest[];
  onChatAction: (chatId: string, action: 'accept' | 'reject') => void;
}

const ChatRequestsList: React.FC<ChatRequestsListProps> = ({ 
  chatRequests,
  onChatAction
}) => {
  if (chatRequests.length === 0) return null;
  
  return (
    <div className="space-y-2">
      <h3 className="text-sm font-medium text-bookconnect-brown">Chat Requests</h3>
      <div className="space-y-3">
        {chatRequests.map((request) => (
          <div 
            key={request.id}
            className="flex items-center justify-between p-2 bg-white/70 rounded-md border border-bookconnect-brown/20"
          >
            <div>
              <p className="font-medium text-sm">{request.requester_username}</p>
              <p className="text-xs text-bookconnect-brown/70">
                {new Date(request.created_at).toLocaleDateString()}
              </p>
            </div>
            <div className="flex gap-2">
              <Button 
                size="sm" 
                variant="ghost"
                onClick={() => onChatAction(request.id, 'accept')}
                className="text-green-600 hover:text-green-700 hover:bg-green-50"
              >
                <Check className="w-4 h-4" />
              </Button>
              <Button 
                size="sm" 
                variant="ghost"
                onClick={() => onChatAction(request.id, 'reject')}
                className="text-bookconnect-terracotta hover:text-bookconnect-terracotta/90 hover:bg-bookconnect-terracotta/10"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ChatRequestsList;
