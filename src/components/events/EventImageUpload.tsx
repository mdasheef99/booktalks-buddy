import React, { useState, useRef, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, X, Image as ImageIcon, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  ACCEPTED_IMAGE_FORMATS,
  MAX_IMAGE_SIZE,
  validateImage
} from '@/types/event-images';

interface EventImageUploadProps {
  onImageSelected: (file: File) => void;
  onImageRemoved?: () => void;
  existingImageUrl?: string | null;
  isUploading?: boolean;
  uploadProgress?: number;
  error?: string | null;
  className?: string;
}

/**
 * Component for uploading and previewing event images
 */
const EventImageUpload: React.FC<EventImageUploadProps> = ({
  onImageSelected,
  onImageRemoved,
  existingImageUrl,
  isUploading = false,
  uploadProgress = 0,
  error = null,
  className = ''
}) => {
  const [previewUrl, setPreviewUrl] = useState<string | null>(existingImageUrl || null);
  const [validationError, setValidationError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Format accepted file types for the file input
  const acceptedFileTypes = ACCEPTED_IMAGE_FORMATS.join(',');

  // Format max file size for display
  const maxFileSizeMB = (MAX_IMAGE_SIZE / (1024 * 1024)).toFixed(0);

  // Handle file drop
  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      const file = acceptedFiles[0];

      // Validate the file
      const validation = validateImage(file);
      if (!validation.isValid) {
        setValidationError(validation.errors.join(' '));
        return;
      }

      // Clear any previous errors
      setValidationError(null);

      // Create preview URL
      const objectUrl = URL.createObjectURL(file);
      setPreviewUrl(objectUrl);

      // Call the parent handler
      onImageSelected(file);
    }
  }, [onImageSelected]);

  // Configure dropzone
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/jpeg': [],
      'image/png': [],
      'image/webp': []
    },
    maxSize: MAX_IMAGE_SIZE,
    multiple: false
  });

  // Handle remove button click
  const handleRemove = () => {
    setPreviewUrl(null);
    if (onImageRemoved) {
      onImageRemoved();
    }
  };

  // Handle browse button click
  const handleBrowse = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex flex-col">
        <label className="text-sm font-medium mb-2">
          Event Image <span className="text-muted-foreground">(optional)</span>
        </label>

        {/* Error message */}
        {(error || validationError) && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {error || validationError}
            </AlertDescription>
          </Alert>
        )}

        {/* Image preview */}
        {previewUrl ? (
          <div className="relative rounded-md overflow-hidden border border-border">
            <img
              src={previewUrl}
              alt="Event preview"
              className="w-full h-64 object-cover"
            />

            {/* Remove button */}
            <Button
              variant="destructive"
              size="icon"
              className="absolute top-2 right-2 rounded-full opacity-90 hover:opacity-100"
              onClick={handleRemove}
              disabled={isUploading}
            >
              <X className="h-4 w-4" />
            </Button>

            {/* Upload progress */}
            {isUploading && (
              <div className="absolute bottom-0 left-0 right-0 bg-background/80 p-2">
                <Progress value={uploadProgress} className="h-2" />
                <p className="text-xs text-center mt-1">Uploading: {uploadProgress}%</p>
              </div>
            )}
          </div>
        ) : (
          /* Dropzone */
          <div
            {...getRootProps()}
            className={`
              border-2 border-dashed rounded-md p-8 text-center cursor-pointer
              transition-colors duration-200 flex flex-col items-center justify-center min-h-[200px]
              ${isDragActive ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'}
            `}
          >
            <input {...getInputProps()} ref={fileInputRef} accept={acceptedFileTypes} />

            <div className="p-3 rounded-full bg-primary/10 mb-4">
              {isDragActive ? (
                <Upload className="h-8 w-8 text-primary" />
              ) : (
                <ImageIcon className="h-8 w-8 text-primary" />
              )}
            </div>

            {isDragActive ? (
              <p className="text-primary font-medium">Drop the image here</p>
            ) : (
              <>
                <p className="font-medium mb-2">Drag & drop an image here, or click to browse</p>
                <p className="text-sm text-muted-foreground">
                  Supported formats: JPG, PNG, WebP (max {maxFileSizeMB}MB)
                </p>
                <Button
                  variant="outline"
                  className="mt-4"
                  onClick={handleBrowse}
                  type="button"
                >
                  Browse Files
                </Button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default EventImageUpload;
