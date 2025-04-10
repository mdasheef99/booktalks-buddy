
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
  const [username, setUsername] = useState(user?.user_metadata?.username || "");
  const [favoriteAuthor, setFavoriteAuthor] = useState(user?.user_metadata?.favorite_author || "");
  const [favoriteGenre, setFavoriteGenre] = useState(user?.user_metadata?.favorite_genre || "Fiction");
  const [bio, setBio] = useState(user?.user_metadata?.bio || "");
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
      setUsername(user.user_metadata?.username || "");
      setFavoriteAuthor(user.user_metadata?.favorite_author || "");
      setFavoriteGenre(user.user_metadata?.favorite_genre || "Fiction");
      setBio(user.user_metadata?.bio || "");
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
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left column: Avatar and basic info */}
        <div className="flex flex-col items-center md:items-start space-y-4 md:col-span-1 bg-white rounded-lg shadow p-4">
          <div className="relative group">
            <img
              src="/placeholder.svg"
              alt="Profile avatar"
              className="w-32 h-32 rounded-full object-cover border-2 border-gray-300"
            />
            <div className="absolute inset-0 rounded-full bg-black bg-opacity-0 group-hover:bg-opacity-40 flex items-center justify-center transition duration-300 cursor-pointer">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white opacity-0 group-hover:opacity-100 transition duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 002.828 2.828L18 9.828M16 5h6v6M4 19h16" />
              </svg>
            </div>
          </div>
          <div className="text-center md:text-left space-y-1">
            <h2 className="text-xl font-semibold">{username}</h2>
            <p className="text-gray-600">{user.email}</p>
            {/* Placeholder for social links */}
            <div className="flex justify-center md:justify-start space-x-3 mt-2">
              <span className="text-gray-400 hover:text-blue-500 cursor-pointer transition-colors duration-200">
                <i className="fab fa-twitter"></i>
              </span>
              <span className="text-gray-400 hover:text-blue-600 cursor-pointer transition-colors duration-200">
                <i className="fab fa-facebook"></i>
              </span>
              <span className="text-gray-400 hover:text-pink-500 cursor-pointer transition-colors duration-200">
                <i className="fab fa-instagram"></i>
              </span>
            </div>
          </div>
        </div>

        {/* Right column: Forms */}
        <div className="md:col-span-2 space-y-6">
          <Card className="shadow rounded-lg">
            <CardHeader>
              <CardTitle className="text-lg font-bold text-gray-800">Account Information</CardTitle>
              <CardDescription className="text-gray-500">
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
          
          <Card className="shadow rounded-lg">
            <CardHeader>
              <CardTitle className="text-lg font-bold text-gray-800">Profile Details</CardTitle>
              <CardDescription className="text-gray-500">
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
    </div>
  );
};

export default Profile;
