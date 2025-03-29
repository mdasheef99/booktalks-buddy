
import React, { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { validateUsername } from "@/utils/usernameGenerator";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Check, Edit, X } from "lucide-react";
import * as Sentry from "@sentry/react";
import { toast } from "sonner";

interface UsernameEditorProps {
  username: string;
  setUsername: (username: string) => void;
}

const UsernameEditor: React.FC<UsernameEditorProps> = ({ username, setUsername }) => {
  const { toast: uiToast } = useToast();
  const [editingUsername, setEditingUsername] = useState(false);
  const [newUsername, setNewUsername] = useState("");

  const handleStartEditing = () => {
    setNewUsername(username);
    setEditingUsername(true);
  };

  const handleSaveUsername = () => {
    if (!validateUsername(newUsername)) {
      uiToast({
        title: "Username invalid!",
        description: "Username must be at least 3 characters and contain no special characters.",
        variant: "destructive",
      });
      
      Sentry.captureMessage("Invalid username attempt", {
        tags: {
          component: "UsernameEditor",
          action: "handleSaveUsername"
        },
        extra: {
          username: newUsername
        }
      });
      
      return;
    }

    setUsername(newUsername);
    
    // Update all username instances in localStorage for consistency
    localStorage.setItem("username", newUsername);
    localStorage.setItem("anon_username", newUsername);
    
    setEditingUsername(false);
    
    toast("Username updated!", {
      description: `You are now known as ${newUsername}`,
    });
  };

  const handleCancelEditUsername = () => {
    setEditingUsername(false);
    setNewUsername("");
  };

  return (
    <div className="space-y-2">
      <label htmlFor="username" className="block text-sm font-medium text-bookconnect-brown">
        Username
      </label>
      
      {editingUsername ? (
        <div className="flex items-center gap-2">
          <Input
            id="username"
            value={newUsername}
            onChange={(e) => setNewUsername(e.target.value)}
            className="font-mono"
            style={{ borderColor: '#B8A088' }}
            maxLength={20}
          />
          <Button 
            size="icon" 
            variant="ghost"
            onClick={handleSaveUsername}
            className="text-bookconnect-sage hover:text-bookconnect-sage/90"
            title="Save username"
          >
            <Check className="w-4 h-4" />
          </Button>
          <Button 
            size="icon" 
            variant="ghost" 
            onClick={handleCancelEditUsername}
            className="text-bookconnect-terracotta hover:text-bookconnect-terracotta/90"
            title="Cancel editing"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      ) : (
        <div className="flex items-center justify-between">
          <span className="font-mono text-bookconnect-brown/90">{username}</span>
          <Button 
            size="icon" 
            variant="ghost"
            onClick={handleStartEditing}
            className="text-bookconnect-brown/70 hover:text-bookconnect-brown"
          >
            <Edit className="w-4 h-4" />
          </Button>
        </div>
      )}
    </div>
  );
};

export default UsernameEditor;
