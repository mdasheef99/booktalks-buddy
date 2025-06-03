import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { ImageIcon, Upload, X, AlertCircle } from 'lucide-react';
import { ClubPhotoService, ClubPhotoData } from '@/lib/services/clubPhotoService';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface ClubPhotoUploadProps {
  clubId?: string; // For management mode
  onUploadComplete: (result: ClubPhotoData) => void;
  onUploadError: (error: string) => void;
  currentPhotoUrl?: string;
  disabled?: boolean;
  mode: 'creation' | 'management';
  className?: string;
}

export const ClubPhotoUpload: React.FC<ClubPhotoUploadProps> = ({
  clubId,
  onUploadComplete,
  onUploadError,
  currentPhotoUrl,
  disabled = false,
  mode,
  className = ""
}) => {
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentPhotoUrl || null);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);

  const handleFileSelect = async (file: File) => {
    if (!user?.id) {
      onUploadError('User not authenticated');
      return;
    }

    if (mode === 'management' && !clubId) {
      onUploadError('Club ID required for photo management');
      return;
    }

    setError(null);
    setUploading(true);
    setProgress(0);

    try {
      // Create preview
      const preview = URL.createObjectURL(file);
      setPreviewUrl(preview);

      // Simulate progress for compression
      setProgress(20);

      // Upload photo
      const result = await ClubPhotoService.uploadClubPhoto({
        file,
        clubId: clubId || 'temp', // For creation mode, actual clubId set later
        userId: user.id
      });

      setProgress(100);
      onUploadComplete(result);
      toast.success('Photo uploaded successfully');

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Upload failed';
      setError(errorMessage);
      onUploadError(errorMessage);
      
      // Remove preview on error
      if (previewUrl && previewUrl !== currentPhotoUrl) {
        URL.revokeObjectURL(previewUrl);
        setPreviewUrl(currentPhotoUrl || null);
      }
    } finally {
      setUploading(false);
      setProgress(0);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      handleFileSelect(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = () => {
    setDragOver(false);
  };

  const handleRemovePhoto = async () => {
    if (!user?.id || !clubId) return;

    try {
      await ClubPhotoService.deleteClubPhoto(clubId, user.id);
      setPreviewUrl(null);
      toast.success('Photo removed successfully');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to remove photo';
      toast.error(errorMessage);
    }
  };

  const openFileDialog = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className={className}>
      <Card
        className={`
          relative overflow-hidden cursor-pointer transition-all duration-200
          ${dragOver ? 'border-bookconnect-terracotta bg-bookconnect-terracotta/5' : 'border-gray-200'}
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:border-bookconnect-brown'}
        `}
        onClick={disabled ? undefined : openFileDialog}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
      >
        <div className="aspect-[3/2] min-h-[200px] flex items-center justify-center p-6">
          {previewUrl ? (
            // Photo Preview
            <div className="relative w-full h-full">
              <img
                src={previewUrl}
                alt="Club photo preview"
                className="w-full h-full object-cover rounded-lg"
              />
              
              {/* Overlay with actions */}
              <div className="absolute inset-0 bg-black/50 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={(e) => {
                    e.stopPropagation();
                    openFileDialog();
                  }}
                  disabled={disabled || uploading}
                >
                  <Upload className="h-4 w-4 mr-1" />
                  Replace
                </Button>
                
                {mode === 'management' && (
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemovePhoto();
                    }}
                    disabled={disabled || uploading}
                  >
                    <X className="h-4 w-4 mr-1" />
                    Remove
                  </Button>
                )}
              </div>
            </div>
          ) : (
            // Upload Placeholder
            <div className="text-center space-y-4">
              {uploading ? (
                <div className="space-y-3">
                  <Upload className="h-12 w-12 mx-auto text-bookconnect-terracotta animate-pulse" />
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Uploading photo...</p>
                    <Progress value={progress} className="w-full max-w-xs mx-auto" />
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <ImageIcon className="h-12 w-12 mx-auto text-gray-400" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {dragOver ? 'Drop photo here' : 'Upload club photo'}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      Drag and drop or click to select • Max 3MB • JPEG, PNG, WebP
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Error Display */}
        {error && (
          <div className="absolute bottom-0 left-0 right-0 bg-red-50 border-t border-red-200 p-3">
            <div className="flex items-center gap-2 text-red-700">
              <AlertCircle className="h-4 w-4" />
              <span className="text-sm">{error}</span>
            </div>
          </div>
        )}

        {/* Hidden File Input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={handleFileInputChange}
          className="hidden"
          disabled={disabled || uploading}
        />
      </Card>
    </div>
  );
};

export default ClubPhotoUpload;
