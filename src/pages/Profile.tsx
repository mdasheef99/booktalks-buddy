
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import Layout from "@/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

const GENRE_OPTIONS = [
  "Fiction", "Mystery", "Sci-Fi", "Romance", "Fantasy", 
  "Thriller", "Non-Fiction", "Biography", "Poetry", 
  "History", "Young Adult", "Classics"
];

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
    <Layout>
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
              <form onSubmit={handleUpdateProfile} className="space-y-4">
                <div className="space-y-2">
                  <label htmlFor="email" className="text-sm font-medium">Email</label>
                  <Input
                    id="email"
                    type="email"
                    value={user.email}
                    disabled
                    className="bg-muted/50"
                  />
                  <p className="text-xs text-muted-foreground">
                    Email cannot be changed
                  </p>
                </div>
                
                <div className="space-y-2">
                  <label htmlFor="username" className="text-sm font-medium">Username</label>
                  <Input
                    id="username"
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="favoriteAuthor" className="text-sm font-medium">Favorite Author</label>
                  <Input
                    id="favoriteAuthor"
                    type="text"
                    value={favoriteAuthor}
                    onChange={(e) => setFavoriteAuthor(e.target.value)}
                    placeholder="Favorite Author"
                    maxLength={50}
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="favoriteGenre" className="text-sm font-medium">Favorite Genre</label>
                  <Select value={favoriteGenre} onValueChange={setFavoriteGenre}>
                    <SelectTrigger id="favoriteGenre">
                      <SelectValue placeholder="Select a genre" />
                    </SelectTrigger>
                    <SelectContent>
                      {GENRE_OPTIONS.map((genre) => (
                        <SelectItem key={genre} value={genre}>
                          {genre}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label htmlFor="bio" className="text-sm font-medium">Bio</label>
                  <Textarea
                    id="bio"
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="About me"
                    maxLength={50}
                  />
                </div>
                
                <Button 
                  type="submit" 
                  disabled={isUpdating}
                  className="bg-bookconnect-sage hover:bg-bookconnect-sage/90"
                >
                  {isUpdating ? "Updating..." : "Update Profile"}
                </Button>
              </form>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Reading Activity</CardTitle>
              <CardDescription>
                Track your reading progress and discussions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <p>No reading activity yet.</p>
                <p>Join discussions on book pages to see your activity here!</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
};

export default Profile;
