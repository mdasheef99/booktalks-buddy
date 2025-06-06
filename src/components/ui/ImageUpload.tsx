import React, { useState, useRef } from 'react';
import { Upload, X, Image as ImageIcon, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ImageUploadService, ImageUploadOptions, ImageUploadResult, UploadProgress } from '@/lib/services/imageUpload';

interface ImageUploadProps {
  onUploadComplete: (result: ImageUploadResult) => void;
  onUploadError?: (error: string) => void;
  uploadOptions: ImageUploadOptions;
  currentImageUrl?: string;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

/**
 * Reusable image upload component with preview, progress, and validation
 */
export const ImageUpload: React.FC<ImageUploadProps> = ({
  onUploadComplete,
  onUploadError,
  uploadOptions,
  currentImageUrl,
  placeholder = "Click to upload image",
  className = "",
  disabled = false
}) => {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState<UploadProgress | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentImageUrl || null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setError(null);
    setUploading(true);
    setProgress({ loaded: 0, total: file.size, percentage: 0 });

    try {
      // Create preview URL
      const preview = URL.createObjectURL(file);
      setPreviewUrl(preview);

      // Upload image
      const result = await ImageUploadService.uploadImage(
        file,
        uploadOptions,
        (uploadProgress) => {
          setProgress(uploadProgress);
        }
      );

      // Clean up preview URL
      URL.revokeObjectURL(preview);

      // Update preview with uploaded image
      setPreviewUrl(result.url);
      onUploadComplete(result);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Upload failed';
      setError(errorMessage);
      onUploadError?.(errorMessage);

      // Remove preview on error
      if (previewUrl && previewUrl !== currentImageUrl) {
        URL.revokeObjectURL(previewUrl);
        setPreviewUrl(currentImageUrl || null);
      }
    } finally {
      setUploading(false);
      setProgress(null);

      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemoveImage = () => {
    if (previewUrl && previewUrl !== currentImageUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setPreviewUrl(null);
    setError(null);

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const triggerFileSelect = () => {
    if (!disabled && !uploading) {
      fileInputRef.current?.click();
    }
  };

  const maxSizeMB = uploadOptions.maxSizeBytes
    ? (uploadOptions.maxSizeBytes / (1024 * 1024)).toFixed(1)
    : '5';

  const allowedTypes = uploadOptions.allowedTypes
    ?.map(type => type.split('/')[1])
    .join(', ') || 'jpg, png, webp';

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Upload Area */}
      <div
        onClick={triggerFileSelect}
        className={`
          relative border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors
          ${disabled || uploading
            ? 'border-gray-200 bg-gray-50 cursor-not-allowed'
            : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
          }
          ${previewUrl ? 'border-solid' : ''}
        `}
      >
        {previewUrl ? (
          // Image Preview
          <div className="relative">
            <img
              src={previewUrl}
              alt="Upload preview"
              className="max-w-full max-h-48 mx-auto rounded-lg object-cover"
            />
            {!uploading && (
              <Button
                type="button"
                variant="destructive"
                size="sm"
                className="absolute top-2 right-2"
                onClick={(e) => {
                  e.stopPropagation();
                  handleRemoveImage();
                }}
                disabled={disabled}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
            {uploading && (
              <div className="absolute inset-0 bg-black/50 rounded-lg flex items-center justify-center">
                <div className="text-white text-center">
                  <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
                  <p className="text-sm">Uploading...</p>
                </div>
              </div>
            )}
          </div>
        ) : (
          // Upload Placeholder
          <div className="space-y-2">
            {uploading ? (
              <Loader2 className="h-12 w-12 animate-spin mx-auto text-gray-400" />
            ) : (
              <ImageIcon className="h-12 w-12 mx-auto text-gray-400" />
            )}
            <div>
              <p className="text-sm font-medium text-gray-900">
                {uploading ? 'Uploading...' : placeholder}
              </p>
              <p className="text-xs text-gray-500">
                {uploading ? 'Please wait...' : `Max ${maxSizeMB}MB • ${allowedTypes}`}
              </p>
            </div>
          </div>
        )}

        {/* Hidden File Input */}
        <input
          ref={fileInputRef}
          type="file"
          accept={uploadOptions.allowedTypes?.join(',') || 'image/*'}
          onChange={handleFileSelect}
          className="hidden"
          disabled={disabled || uploading}
        />
      </div>

      {/* Upload Progress */}
      {progress && (
        <div className="space-y-2">
          <div className="flex justify-between text-sm text-gray-600">
            <span>Uploading...</span>
            <span>{progress.percentage.toFixed(0)}%</span>
          </div>
          <Progress value={progress.percentage} className="h-2" />
        </div>
      )}

      {/* Error Message */}
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Upload Button (Alternative) */}
      {!previewUrl && !uploading && (
        <Button
          type="button"
          variant="outline"
          onClick={triggerFileSelect}
          disabled={disabled}
          className="w-full"
        >
          <Upload className="h-4 w-4 mr-2" />
          Choose Image
        </Button>
      )}
    </div>
  );
};

/**
 * Simple image upload hook for form integration
 */
export const useImageUpload = (uploadOptions: ImageUploadOptions) => {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleUploadComplete = (result: ImageUploadResult) => {
    console.log('🔍 useImageUpload - Upload completed with result:', result);
    console.log('🔍 useImageUpload - Setting imageUrl to:', result.url);
    setImageUrl(result.url);
    setError(null);
  };

  const handleUploadError = (errorMessage: string) => {
    setError(errorMessage);
  };

  const clearImage = () => {
    setImageUrl(null);
    setError(null);
  };

  return {
    imageUrl,
    uploading,
    error,
    handleUploadComplete,
    handleUploadError,
    clearImage,
    setImageUrl
  };
};
