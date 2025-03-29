
import { useState } from "react";
import * as Sentry from "@sentry/react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { validateUsername, generateLiteraryUsername } from "@/utils/usernameGenerator";

interface UsernameDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onComplete: (username: string) => void;
}

export const UsernameDialog = ({ open, onOpenChange, onComplete }: UsernameDialogProps) => {
  const [username, setUsername] = useState("");
  const { toast } = useToast();

  const handleNext = () => {
    if (username.trim() && validateUsername(username)) {
      // Store username in both localStorage keys for consistency
      localStorage.setItem("anon_username", username);
      localStorage.setItem("username", username);
      onComplete(username);
    } else if (username.trim()) {
      Sentry.captureMessage("Invalid name used", {
        level: "warning",
        extra: { input: username }
      });
      toast({
        title: "Invalid name!",
        description: "Please enter a valid name without special characters or code.",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Name required",
        description: "Please enter a username or click Skip to get a random one.",
        variant: "destructive",
      });
    }
  };

  const handleSkip = () => {
    const randomUsername = generateLiteraryUsername();
    localStorage.setItem("anon_username", randomUsername);
    localStorage.setItem("username", randomUsername);
    toast({
      title: "Random username generated",
      description: `You'll be known as ${randomUsername}`,
    });
    onComplete(randomUsername);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-gradient-to-br from-bookconnect-cream to-white border-bookconnect-brown/30 shadow-lg">
        <DialogHeader>
          <DialogTitle className="text-3xl font-serif text-bookconnect-brown text-center font-bold">
            Join the Discussion
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6 pt-4">
          <div className="space-y-2">
            <p className="text-center text-bookconnect-brown/80 font-serif text-lg">
              Choose a username to identify yourself
            </p>
            <p className="text-center text-bookconnect-brown/60 text-sm">
              Maximum 8 characters
            </p>
          </div>
          
          <Input
            placeholder="Enter username..."
            value={username}
            onChange={(e) => setUsername(e.target.value.slice(0, 8))}
            className="border-2 border-bookconnect-brown/30 focus-visible:ring-bookconnect-terracotta text-lg font-serif text-center tracking-wide"
            maxLength={8}
          />
          
          <div className="flex justify-between space-x-4 pt-2">
            <Button 
              variant="outline"
              onClick={handleSkip}
              className="flex-1 border-2 border-bookconnect-brown/30 text-bookconnect-brown hover:bg-bookconnect-brown/10 font-medium"
            >
              Skip
            </Button>
            <Button 
              onClick={handleNext}
              className="flex-1 bg-gradient-to-r from-bookconnect-terracotta to-bookconnect-terracotta/90 hover:from-bookconnect-terracotta/90 hover:to-bookconnect-terracotta text-white font-medium shadow-md"
            >
              Next
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
