
import { useState, useEffect } from "react";
import { Book } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface LoginDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function LoginDialog({ open, onOpenChange }: LoginDialogProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [loginTimeout, setLoginTimeout] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Reset timeout when dialog opens/closes
    setLoginTimeout(false);
    
    // Clear any timeout when the component unmounts or dialog state changes
    return () => clearTimeout(timeoutId);
  }, [open]);

  let timeoutId: number;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setLoginTimeout(false);
    
    // Set a timeout to display a message if login takes too long
    timeoutId = window.setTimeout(() => {
      setLoginTimeout(true);
      // Don't set isLoading to false so the user knows the process is still ongoing
    }, 3000);

    try {
      console.log("Dialog login attempt with:", email);
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      clearTimeout(timeoutId);

      if (error) {
        throw error;
      }

      console.log("Dialog login successful, user:", data.user);
      toast.success("Welcome to Book Club!");
      navigate("/book-club");
      onOpenChange(false); // Close dialog on successful login
    } catch (error: any) {
      clearTimeout(timeoutId);
      console.error("Login error:", error);
      toast.error(error.message || "Failed to login. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-[#f0e6d2] border-[#5c4033]">
        <DialogHeader>
          <DialogTitle className="text-center text-[#5c4033] flex items-center justify-center gap-2 text-2xl font-serif">
            <Book className="h-6 w-6" />
            Book Club Login
          </DialogTitle>
          <DialogDescription className="text-center text-[#5c4033]/80">
            Login to access the Book Club feature
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleLogin} className="space-y-4 py-4">
          <div className="space-y-2">
            <label htmlFor="email" className="text-sm font-medium text-[#5c4033]">
              Email
            </label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="email@bookconnect.com"
              required
              className="bg-[#f0e6d2] border-[#5c4033]/40 text-[#5c4033]"
              disabled={isLoading}
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="password" className="text-sm font-medium text-[#5c4033]">
              Password
            </label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              className="bg-[#f0e6d2] border-[#5c4033]/40 text-[#5c4033]"
              disabled={isLoading}
            />
          </div>
          
          <div className="pt-2">
            <Button 
              type="submit" 
              className="w-full bg-[#5c4033] hover:bg-[#5c4033]/80"
              disabled={isLoading}
            >
              {isLoading ? "Logging in..." : "Login"}
            </Button>
          </div>

          {loginTimeout && (
            <div className="text-amber-600 text-xs mt-2 text-center">
              Login is taking longer than usual. Please wait while we authenticate you...
            </div>
          )}
        </form>
      </DialogContent>
    </Dialog>
  );
}

