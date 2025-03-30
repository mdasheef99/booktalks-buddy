
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";

import AccountInfoForm from "@/components/profile/AccountInfoForm";
import { ProfileForm } from "@/components/profile";
import ReadingActivity from "@/components/profile/ReadingActivity";

const Profile = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState(user?.username || "");
  const [favoriteAuthor, setFavoriteAuthor] = useState(user?.favorite_author || "");
  const [favoriteGenre, setFavoriteGenre] = useState(user?.favorite_genre || "Fiction");
  const [bio, setBio] = useState(user?.bio || "");
  const [isUpdating, setIsUpdating] = useState(false);
  
  // Redirect if not logged in
  useEffect(() => {
    if (!user) {
      navigate("/login");
    }
  }, [user, navigate]);
  
  // Load user data when component mounts
  useEffect(() => {
    if (user) {
      setUsername(user.username || "");
      setFavoriteAuthor(user.favorite_author || "");
      setFavoriteGenre(user.favorite_genre || "Fiction");
      setBio(user.bio || "");
    }
  }, [user]);
  
  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdating(true);
    
    try {
      const { error } = await supabase
        .from('users')
        .update({ 
          username, 
          favorite_author: favoriteAuthor,
          favorite_genre: favoriteGenre,
          bio
        })
        .eq('id', user?.id);

      if (error) throw error;
      
      // Update local storage for consistency
      localStorage.setItem("username", username);
      localStorage.setItem("favorite_genre", favoriteGenre);
      
      toast.success("Profile updated successfully!");
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error("Failed to update profile. Please try again.");
    } finally {
      setIsUpdating(false);
    }
  };
  
  if (!user) {
    return null;
  }
  
  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-4xl font-serif font-bold mb-8 text-bookconnect-brown">Your Profile</h1>
      
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Account Information</CardTitle>
            <CardDescription>
              Update your account details
            </CardDescription>
          </CardHeader>
          <CardContent>
            <AccountInfoForm 
              email={user.email} 
              username={username} 
              setUsername={setUsername}
              isUpdating={isUpdating}
              onSubmit={handleUpdateProfile}
            />
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Profile Details</CardTitle>
            <CardDescription>
              Tell the community about yourself
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ProfileForm
              favoriteAuthor={favoriteAuthor}
              setFavoriteAuthor={setFavoriteAuthor}
              favoriteGenre={favoriteGenre}
              setFavoriteGenre={setFavoriteGenre}
              bio={bio}
              setBio={setBio}
            />
          </CardContent>
        </Card>
        
        <ReadingActivity />
      </div>
    </div>
  );
};

export default Profile;
