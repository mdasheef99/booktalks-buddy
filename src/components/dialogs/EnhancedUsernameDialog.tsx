import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import UsernameField from "@/components/forms/UsernameField";
import DisplayNameField from "@/components/forms/DisplayNameField";
import { generateUsernameSuggestions } from "@/utils/usernameValidation";
import * as Sentry from "@sentry/react";

interface EnhancedUsernameDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onComplete: (username: string, displayName?: string) => void;
  title?: string;
  description?: string;
}

export const EnhancedUsernameDialog = ({ 
  open, 
  onOpenChange, 
  onComplete,
  title = "Create Your Identity",
  description = "Choose how you'd like to be known in the community"
}: EnhancedUsernameDialogProps) => {
  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [isUsernameValid, setIsUsernameValid] = useState(false);
  const [isDisplayNameValid, setIsDisplayNameValid] = useState(true);
  const { toast } = useToast();

  const handleNext = () => {
    if (!username.trim()) {
      toast({
        title: "Username required",
        description: "Please enter a username to continue.",
        variant: "destructive",
      });
      return;
    }

    if (!isUsernameValid) {
      toast({
        title: "Invalid username",
        description: "Please fix the username issues before continuing.",
        variant: "destructive",
      });
      return;
    }

    if (!isDisplayNameValid) {
      toast({
        title: "Invalid display name",
        description: "Please fix the display name issues before continuing.",
        variant: "destructive",
      });
      return;
    }

    try {
      // Store username in localStorage for consistency with existing system
      localStorage.setItem("username", username);
      localStorage.setItem("anon_username", username);
      
      onComplete(username, displayName.trim() || undefined);
      
      toast({
        title: "Identity created!",
        description: `Welcome, ${displayName || username}!`,
      });
    } catch (error) {
      Sentry.captureException(error, {
        tags: { component: "EnhancedUsernameDialog" },
        extra: { username, displayName }
      });
      
      toast({
        title: "Error",
        description: "Failed to create identity. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleSkip = () => {
    // Generate a random username suggestion
    const suggestions = generateUsernameSuggestions("reader");
    const randomUsername = suggestions[0] || `reader${Math.floor(Math.random() * 1000)}`;
    
    localStorage.setItem("username", randomUsername);
    localStorage.setItem("anon_username", randomUsername);
    
    onComplete(randomUsername);
    
    toast({
      title: "Random username generated",
      description: `You'll be known as ${randomUsername}`,
    });
  };

  const canProceed = username.trim() && isUsernameValid && isDisplayNameValid;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg bg-gradient-to-br from-bookconnect-cream to-white border-bookconnect-brown/30 shadow-lg">
        <DialogHeader>
          <DialogTitle className="text-2xl font-serif text-bookconnect-brown text-center font-bold">
            {title}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6 pt-4">
          <div className="space-y-2">
            <p className="text-center text-bookconnect-brown/80 font-serif text-base">
              {description}
            </p>
            <p className="text-center text-bookconnect-brown/60 text-sm">
              Your username is permanent, but you can change your display name anytime
            </p>
          </div>
          
          {/* Username Field */}
          <UsernameField
            value={username}
            onChange={setUsername}
            onValidationChange={setIsUsernameValid}
            placeholder="Choose your unique username"
            required
          />
          
          {/* Display Name Field */}
          <DisplayNameField
            value={displayName}
            onChange={setDisplayName}
            onValidationChange={setIsDisplayNameValid}
            placeholder="Your friendly display name (optional)"
          />
          
          {/* Preview */}
          {username && (
            <div className="bg-bookconnect-cream/50 p-3 rounded-lg border border-bookconnect-brown/20">
              <p className="text-sm text-bookconnect-brown/70 mb-1">Preview:</p>
              <p className="font-medium text-bookconnect-brown">
                {displayName ? (
                  <>
                    <span className="font-semibold">{displayName}</span>
                    <span className="text-gray-500 text-sm ml-1">(@{username})</span>
                  </>
                ) : (
                  <span className="font-semibold">{username}</span>
                )}
              </p>
            </div>
          )}
          
          <div className="flex justify-between space-x-4 pt-2">
            <Button 
              variant="outline"
              onClick={handleSkip}
              className="flex-1 border-2 border-bookconnect-brown/30 text-bookconnect-brown hover:bg-bookconnect-brown/10 font-medium"
            >
              Generate Random
            </Button>
            <Button 
              onClick={handleNext}
              disabled={!canProceed}
              className="flex-1 bg-gradient-to-r from-bookconnect-terracotta to-bookconnect-terracotta/90 hover:from-bookconnect-terracotta/90 hover:to-bookconnect-terracotta text-white font-medium shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Create Identity
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
