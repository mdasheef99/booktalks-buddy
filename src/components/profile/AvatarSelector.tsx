import React, { useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Upload, Camera, User } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

// Standard avatars
const STANDARD_AVATARS = [
  '/avatars/avatar-1.png',
  '/avatars/avatar-2.png',
  '/avatars/avatar-3.png',
  '/avatars/avatar-4.png',
  '/avatars/avatar-5.png',
  '/avatars/avatar-6.png',
  '/avatars/avatar-7.png',
  '/avatars/avatar-8.png',
];

interface AvatarSelectorProps {
  currentAvatarUrl: string;
  onAvatarChange: (url: string) => void;
}

const AvatarSelector: React.FC<AvatarSelectorProps> = ({ 
  currentAvatarUrl, 
  onAvatarChange 
}) => {
  const { user } = useAuth();
  const [uploading, setUploading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  
  // Get initials for avatar fallback
  const getInitials = () => {
    if (!user?.email) return '?';
    
    const email = user.email;
    const namePart = email.split('@')[0];
    
    if (namePart.length <= 2) return namePart.toUpperCase();
    return namePart.substring(0, 2).toUpperCase();
  };
  
  // Handle file upload
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    
    // Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'image/gif'];
    if (!validTypes.includes(file.type)) {
      toast.error('Please upload a valid image file (JPEG, PNG, or GIF)');
      return;
    }
    
    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast.error('Image size should be less than 2MB');
      return;
    }
    
    setUploading(true);
    
    try {
      // Create a unique filename
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}-${Date.now()}.${fileExt}`;
      const filePath = `avatars/${fileName}`;
      
      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('profiles')
        .upload(filePath, file);
        
      if (uploadError) throw uploadError;
      
      // Get the public URL
      const { data } = supabase.storage
        .from('profiles')
        .getPublicUrl(filePath);
        
      // Update avatar URL
      onAvatarChange(data.publicUrl);
      setDialogOpen(false);
      toast.success('Avatar uploaded successfully');
    } catch (error) {
      console.error('Error uploading avatar:', error);
      toast.error('Failed to upload avatar');
    } finally {
      setUploading(false);
    }
  };
  
  // Handle standard avatar selection
  const handleStandardAvatarSelect = (avatarUrl: string) => {
    onAvatarChange(avatarUrl);
    setDialogOpen(false);
    toast.success('Avatar selected');
  };
  
  return (
    <div className="flex flex-col items-center">
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogTrigger asChild>
          <div className="relative cursor-pointer group">
            <Avatar className="h-24 w-24 border-4 border-white shadow-md">
              <AvatarImage src={currentAvatarUrl} alt="Profile" />
              <AvatarFallback className="bg-bookconnect-terracotta/20 text-bookconnect-terracotta text-xl">
                {getInitials()}
              </AvatarFallback>
            </Avatar>
            <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
              <Camera className="h-8 w-8 text-white" />
            </div>
          </div>
        </DialogTrigger>
        
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Choose an Avatar</DialogTitle>
          </DialogHeader>
          
          <Tabs defaultValue="upload" className="mt-4">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="upload">Upload</TabsTrigger>
              <TabsTrigger value="standard">Standard</TabsTrigger>
            </TabsList>
            
            <TabsContent value="upload" className="py-4">
              <div className="flex flex-col items-center justify-center gap-4">
                <label 
                  htmlFor="avatar-upload" 
                  className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100"
                >
                  {uploading ? (
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <div className="w-8 h-8 border-2 border-bookconnect-terracotta border-t-transparent rounded-full animate-spin mb-2"></div>
                      <p className="text-sm text-gray-500">Uploading...</p>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <Upload className="w-8 h-8 mb-2 text-gray-500" />
                      <p className="mb-2 text-sm text-gray-500">
                        <span className="font-semibold">Click to upload</span> or drag and drop
                      </p>
                      <p className="text-xs text-gray-500">PNG, JPG or GIF (MAX. 2MB)</p>
                    </div>
                  )}
                  <input
                    id="avatar-upload"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleFileUpload}
                    disabled={uploading}
                  />
                </label>
                
                <DialogClose asChild>
                  <Button variant="outline">Cancel</Button>
                </DialogClose>
              </div>
            </TabsContent>
            
            <TabsContent value="standard" className="py-4">
              <div className="grid grid-cols-4 gap-4">
                {STANDARD_AVATARS.map((avatar, index) => (
                  <div 
                    key={index}
                    className={`cursor-pointer rounded-lg p-1 ${
                      currentAvatarUrl === avatar ? 'ring-2 ring-bookconnect-terracotta' : 'hover:bg-gray-100'
                    }`}
                    onClick={() => handleStandardAvatarSelect(avatar)}
                  >
                    <Avatar className="h-16 w-16 mx-auto">
                      <AvatarImage src={avatar} alt={`Avatar ${index + 1}`} />
                      <AvatarFallback>
                        <User className="h-8 w-8 text-gray-400" />
                      </AvatarFallback>
                    </Avatar>
                  </div>
                ))}
              </div>
              
              <div className="flex justify-center mt-4">
                <DialogClose asChild>
                  <Button variant="outline">Cancel</Button>
                </DialogClose>
              </div>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>
      
      <p className="text-sm text-gray-500 mt-2">Click to change avatar</p>
    </div>
  );
};

export default AvatarSelector;
