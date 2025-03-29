
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
      localStorage.setItem("anon_username", username);
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
    toast({
      title: "Random username generated",
      description: `You'll be known as ${randomUsername}`,
    });
    onComplete(randomUsername);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-bookconnect-cream border-bookconnect-brown/30 shadow-md">
        <DialogHeader>
          <DialogTitle className="text-2xl font-serif text-bookconnect-brown text-center">
            Pick a Username
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 pt-2">
          <p className="text-center text-bookconnect-brown/80">
            Choose a username to identify yourself in book discussions
          </p>
          
          <Input
            placeholder="Enter a username (min 3 characters)"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="border-bookconnect-brown/30 focus-visible:ring-bookconnect-terracotta"
          />
          
          <div className="flex justify-between space-x-4 pt-2">
            <Button 
              variant="outline"
              onClick={handleSkip}
              className="flex-1 border-bookconnect-brown/30 text-bookconnect-brown hover:bg-bookconnect-brown/10"
            >
              Skip
            </Button>
            <Button 
              onClick={handleNext}
              className="flex-1 bg-bookconnect-terracotta hover:bg-bookconnect-terracotta/90 text-white"
            >
              Next
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
