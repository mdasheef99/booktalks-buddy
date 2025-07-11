import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import SimpleProfileForm from "@/components/profile/SimpleProfileForm";
import { toast } from "sonner";
import { UserRound } from "lucide-react";

interface SimpleProfileDialogProps {
  open: boolean;
  onClose: () => void;
}

/**
 * SimpleProfileDialog - Anonymous Chat Profile Component
 * 
 * This component provides a lightweight profile interface for anonymous chat users.
 * It operates completely independently from authenticated user profiles and uses
 * only localStorage for data persistence.
 * 
 * Key Features:
 * - No authentication dependencies
 * - localStorage-only data storage
 * - Integration with SimpleProfileForm
 * - Isolated from authenticated profile system
 */
export const SimpleProfileDialog: React.FC<SimpleProfileDialogProps> = ({ open, onClose }) => {
  // Anonymous user data state - uses localStorage only
  const [username, setUsername] = useState<string>("");
  const [favoriteAuthor, setFavoriteAuthor] = useState<string>("");
  const [favoriteGenre, setFavoriteGenre] = useState<string>("");
  const [bio, setBio] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);

  // Load anonymous user data from localStorage on dialog open
  useEffect(() => {
    if (open) {
      loadAnonymousProfileData();
    }
  }, [open]);

  /**
   * Load anonymous profile data from localStorage
   * No database calls or authentication required
   */
  const loadAnonymousProfileData = () => {
    try {
      // Load username from anonymous storage
      const storedUsername = localStorage.getItem("anon_username") || 
                           localStorage.getItem("username") || 
                           "";
      setUsername(storedUsername);

      // Load profile data from localStorage
      const storedFavoriteAuthor = localStorage.getItem("anon_favorite_author") || "";
      const storedFavoriteGenre = localStorage.getItem("anon_favorite_genre") || 
                                 localStorage.getItem("favorite_genre") || 
                                 "Fiction";
      const storedBio = localStorage.getItem("anon_bio") || "";

      setFavoriteAuthor(storedFavoriteAuthor);
      setFavoriteGenre(storedFavoriteGenre);
      setBio(storedBio);
    } catch (error) {
      console.error("Error loading anonymous profile data:", error);
      toast.error("Failed to load profile data");
    }
  };

  /**
   * Save anonymous profile data to localStorage
   * No database calls or authentication required
   */
  const handleSaveProfile = async () => {
    setIsLoading(true);
    
    try {
      // Save all anonymous profile data to localStorage
      localStorage.setItem("anon_favorite_author", favoriteAuthor);
      localStorage.setItem("anon_favorite_genre", favoriteGenre);
      localStorage.setItem("anon_bio", bio);
      
      // Also update the general favorite_genre for consistency
      localStorage.setItem("favorite_genre", favoriteGenre);

      toast.success("Profile updated successfully!");
      onClose();
    } catch (error) {
      console.error("Error saving anonymous profile:", error);
      toast.error("Failed to save profile");
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && handleClose()}>
      <DialogContent
        className="max-w-lg w-[95%] mx-auto bg-bookconnect-cream flex flex-col !h-[85vh] !max-h-[85vh]"
        style={{
          backgroundImage: `url('https://images.unsplash.com/photo-1528459105426-b9548367069b?q=80&w=1412&auto=format&fit=crop')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundBlendMode: 'overlay',
          backgroundColor: 'rgba(246, 241, 229, 0.92)',
          border: '1px solid #B8A088',
          boxShadow: '0 4px 30px rgba(0, 0, 0, 0.15)',
          height: '85vh !important',
          maxHeight: '85vh !important'
        }}
      >
        <DialogHeader className="pb-4">
          <div className="flex items-center gap-3">
            <div className="bg-bookconnect-sage/20 p-2 rounded-full">
              <UserRound className="h-6 w-6 text-bookconnect-brown" />
            </div>
            <div>
              <DialogTitle className="text-2xl font-serif font-bold text-bookconnect-brown">
                Anonymous Profile
              </DialogTitle>
              <p className="text-sm text-bookconnect-brown/70 font-serif">
                Customize your reading preferences for chat discussions
              </p>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 min-h-0 overflow-hidden">
          <div className="h-full overflow-y-auto pr-4 scrollbar-thin scrollbar-thumb-bookconnect-brown/30 scrollbar-track-transparent">
            <div className="space-y-6 font-serif pb-4">
              {/* Username Display (Read-only for anonymous users) */}
              <div className="space-y-2">
                <Label htmlFor="username" className="text-bookconnect-brown font-medium">
                  Chat Username
                </Label>
                <Input
                  id="username"
                  value={username}
                  readOnly
                  className="bg-bookconnect-cream/50 border-bookconnect-brown/30 text-bookconnect-brown font-serif"
                  placeholder="Anonymous Reader"
                />
                <p className="text-xs text-bookconnect-brown/60">
                  Your username for anonymous chat discussions
                </p>
              </div>

              {/* Anonymous Profile Form */}
              <SimpleProfileForm
                favoriteAuthor={favoriteAuthor}
                setFavoriteAuthor={setFavoriteAuthor}
                favoriteGenre={favoriteGenre}
                setFavoriteGenre={setFavoriteGenre}
                bio={bio}
                setBio={setBio}
              />

              {/* Anonymous Chat Notice */}
              <div className="bg-bookconnect-sage/10 border border-bookconnect-sage/30 rounded-lg p-4">
                <h4 className="font-semibold text-bookconnect-brown mb-2">
                  Anonymous Chat Profile
                </h4>
                <p className="text-sm text-bookconnect-brown/70">
                  This profile is used only for anonymous book discussions. 
                  Your information is stored locally and not linked to any account.
                </p>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="pt-4 gap-2">
          <Button
            variant="outline"
            onClick={handleClose}
            className="border-bookconnect-brown/30 text-bookconnect-brown hover:bg-bookconnect-brown/10"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSaveProfile}
            disabled={isLoading}
            className="bg-bookconnect-terracotta hover:bg-bookconnect-terracotta/90 text-white"
          >
            {isLoading ? "Saving..." : "Save Profile"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default SimpleProfileDialog;
