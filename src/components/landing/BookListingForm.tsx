import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { BookOpen, Upload, X, AlertCircle, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import { BookListingService } from '@/lib/services/bookListingService';
import { 
  BookListingFormData, 
  BookListingFormErrors, 
  BOOK_CONDITIONS,
  VALIDATION_RULES,
  IMAGE_UPLOAD_CONFIG
} from '@/types/bookListings';

interface BookListingFormProps {
  storeId: string;
  onSuccess?: () => void;
  className?: string;
}

interface ImagePreview {
  file: File;
  preview: string;
  position: number;
}

export const BookListingForm: React.FC<BookListingFormProps> = ({
  storeId,
  onSuccess,
  className = ""
}) => {
  const [formData, setFormData] = useState<BookListingFormData>({
    customer_name: '',
    customer_email: '',
    customer_phone: '',
    book_title: '',
    book_author: '',
    book_isbn: '',
    book_condition: 'good',
    book_description: '',
    asking_price: undefined
  });

  const [errors, setErrors] = useState<BookListingFormErrors>({});
  const [images, setImages] = useState<ImagePreview[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  // Form field update handler
  const updateField = <K extends keyof BookListingFormData>(
    field: K,
    value: BookListingFormData[K]
  ) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  // Image handling
  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    
    if (images.length + files.length > IMAGE_UPLOAD_CONFIG.maxImages) {
      toast.error(`Maximum ${IMAGE_UPLOAD_CONFIG.maxImages} images allowed`);
      return;
    }

    files.forEach(file => {
      // Validate file
      if (file.size > IMAGE_UPLOAD_CONFIG.maxSizeBytes) {
        toast.error(`Image "${file.name}" is too large. Maximum size is 3MB.`);
        return;
      }

      if (!IMAGE_UPLOAD_CONFIG.allowedTypes.includes(file.type)) {
        toast.error(`Image "${file.name}" is not a supported format. Use JPEG, PNG, or WebP.`);
        return;
      }

      // Create preview
      const preview = URL.createObjectURL(file);
      const newImage: ImagePreview = {
        file,
        preview,
        position: images.length + 1
      };

      setImages(prev => [...prev, newImage]);
    });

    // Clear the input
    event.target.value = '';
  };

  const removeImage = (index: number) => {
    setImages(prev => {
      const updated = prev.filter((_, i) => i !== index);
      // Clean up object URL
      URL.revokeObjectURL(prev[index].preview);
      return updated.map((img, i) => ({ ...img, position: i + 1 }));
    });
  };

  // Form validation
  const validateForm = (): boolean => {
    const newErrors: BookListingFormErrors = {};

    // Required fields
    if (!formData.customer_name.trim()) {
      newErrors.customer_name = 'Name is required';
    } else if (formData.customer_name.length > VALIDATION_RULES.customer_name.maxLength) {
      newErrors.customer_name = `Name must be ${VALIDATION_RULES.customer_name.maxLength} characters or less`;
    }

    if (!formData.customer_email.trim()) {
      newErrors.customer_email = 'Email is required';
    } else if (!VALIDATION_RULES.customer_email.pattern.test(formData.customer_email)) {
      newErrors.customer_email = 'Please enter a valid email address';
    }

    if (!formData.book_title.trim()) {
      newErrors.book_title = 'Book title is required';
    } else if (formData.book_title.length > VALIDATION_RULES.book_title.maxLength) {
      newErrors.book_title = `Title must be ${VALIDATION_RULES.book_title.maxLength} characters or less`;
    }

    if (!formData.book_author.trim()) {
      newErrors.book_author = 'Author is required';
    } else if (formData.book_author.length > VALIDATION_RULES.book_author.maxLength) {
      newErrors.book_author = `Author must be ${VALIDATION_RULES.book_author.maxLength} characters or less`;
    }

    if (!formData.customer_phone?.trim()) {
      newErrors.customer_phone = 'Phone number is required';
    } else if (!VALIDATION_RULES.customer_phone.pattern.test(formData.customer_phone)) {
      newErrors.customer_phone = 'Please enter a valid phone number';
    }

    // Optional field validation

    if (formData.book_isbn && !VALIDATION_RULES.book_isbn.pattern.test(formData.book_isbn.replace(/[-\s]/g, ''))) {
      newErrors.book_isbn = 'Please enter a valid ISBN';
    }

    if (formData.asking_price !== undefined && (formData.asking_price < 0 || formData.asking_price > 9999.99)) {
      newErrors.asking_price = 'Price must be between $0 and $9,999.99';
    }

    // Images validation
    if (images.length === 0) {
      newErrors.images = 'At least one image is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Form submission
  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    
    if (!validateForm()) {
      toast.error('Please fix the errors below');
      return;
    }

    setIsSubmitting(true);

    try {
      const submission = {
        formData: {
          ...formData,
          customer_name: formData.customer_name.trim(),
          customer_email: formData.customer_email.trim(),
          customer_phone: formData.customer_phone?.trim() || undefined,
          book_title: formData.book_title.trim(),
          book_author: formData.book_author.trim(),
          book_isbn: formData.book_isbn?.trim() || undefined,
          book_description: formData.book_description?.trim() || undefined
        },
        storeId,
        images: images.map(img => img.file)
      };

      await BookListingService.submitBookListing(submission);
      
      setSubmitSuccess(true);
      toast.success('Your book listing has been submitted successfully!');
      
      // Reset form
      setFormData({
        customer_name: '',
        customer_email: '',
        customer_phone: '',
        book_title: '',
        book_author: '',
        book_isbn: '',
        book_condition: 'good',
        book_description: '',
        asking_price: undefined
      });
      
      // Clean up image previews
      images.forEach(img => URL.revokeObjectURL(img.preview));
      setImages([]);
      
      onSuccess?.();
    } catch (error) {
      console.error('Error submitting book listing:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to submit book listing');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitSuccess) {
    return (
      <Card className={`border-green-200 bg-green-50 ${className}`}>
        <CardContent className="p-6 text-center">
          <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-green-800 mb-2">
            Book Listing Submitted!
          </h3>
          <p className="text-green-700 mb-4">
            Thank you for your submission. The store owner will review your book and contact you directly.
          </p>
          <Button
            onClick={() => setSubmitSuccess(false)}
            variant="outline"
            className="border-green-300 text-green-700 hover:bg-green-100"
          >
            Submit Another Book
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`border-bookconnect-terracotta/20 ${className}`}>
      <CardHeader className="bg-gradient-to-r from-bookconnect-sage/10 to-bookconnect-olive/10">
        <CardTitle className="flex items-center gap-2 text-bookconnect-brown">
          <BookOpen className="h-5 w-5" />
          Sell Your Books to Us
        </CardTitle>
        <p className="text-sm text-bookconnect-brown/70">
          Fill out the form below to list a book you'd like to sell. We'll review it and contact you directly.
        </p>
      </CardHeader>
      
      <CardContent className="p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Customer Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-bookconnect-brown">Your Information</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="customer_name">
                  Full Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="customer_name"
                  value={formData.customer_name}
                  onChange={(e) => updateField('customer_name', e.target.value)}
                  placeholder="Enter your full name"
                  className={errors.customer_name ? 'border-red-500' : ''}
                />
                {errors.customer_name && (
                  <p className="text-sm text-red-600 flex items-center gap-1">
                    <AlertCircle className="h-4 w-4" />
                    {errors.customer_name}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="customer_email">
                  Email Address <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="customer_email"
                  type="email"
                  value={formData.customer_email}
                  onChange={(e) => updateField('customer_email', e.target.value)}
                  placeholder="Enter your email"
                  className={errors.customer_email ? 'border-red-500' : ''}
                />
                {errors.customer_email && (
                  <p className="text-sm text-red-600 flex items-center gap-1">
                    <AlertCircle className="h-4 w-4" />
                    {errors.customer_email}
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="customer_phone">
                Phone Number <span className="text-red-500">*</span>
              </Label>
              <Input
                id="customer_phone"
                type="tel"
                value={formData.customer_phone}
                onChange={(e) => updateField('customer_phone', e.target.value)}
                placeholder="Enter your phone number"
                className={errors.customer_phone ? 'border-red-500' : ''}
              />
              {errors.customer_phone && (
                <p className="text-sm text-red-600 flex items-center gap-1">
                  <AlertCircle className="h-4 w-4" />
                  {errors.customer_phone}
                </p>
              )}
            </div>
          </div>

          {/* Book Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-bookconnect-brown">Book Details</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="book_title">
                  Book Title <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="book_title"
                  value={formData.book_title}
                  onChange={(e) => updateField('book_title', e.target.value)}
                  placeholder="Enter the book title"
                  className={errors.book_title ? 'border-red-500' : ''}
                />
                {errors.book_title && (
                  <p className="text-sm text-red-600 flex items-center gap-1">
                    <AlertCircle className="h-4 w-4" />
                    {errors.book_title}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="book_author">
                  Author <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="book_author"
                  value={formData.book_author}
                  onChange={(e) => updateField('book_author', e.target.value)}
                  placeholder="Enter the author's name"
                  className={errors.book_author ? 'border-red-500' : ''}
                />
                {errors.book_author && (
                  <p className="text-sm text-red-600 flex items-center gap-1">
                    <AlertCircle className="h-4 w-4" />
                    {errors.book_author}
                  </p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="book_condition">
                  Condition <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={formData.book_condition}
                  onValueChange={(value) => updateField('book_condition', value as any)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select condition" />
                  </SelectTrigger>
                  <SelectContent>
                    {BOOK_CONDITIONS.map(condition => (
                      <SelectItem key={condition.value} value={condition.value}>
                        {condition.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="asking_price">Asking Price (Optional)</Label>
                <Input
                  id="asking_price"
                  type="number"
                  step="0.01"
                  min="0"
                  max="9999.99"
                  value={formData.asking_price || ''}
                  onChange={(e) => updateField('asking_price', e.target.value ? parseFloat(e.target.value) : undefined)}
                  placeholder="Enter asking price"
                  className={errors.asking_price ? 'border-red-500' : ''}
                />
                {errors.asking_price && (
                  <p className="text-sm text-red-600 flex items-center gap-1">
                    <AlertCircle className="h-4 w-4" />
                    {errors.asking_price}
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="book_isbn">ISBN (Optional)</Label>
              <Input
                id="book_isbn"
                value={formData.book_isbn}
                onChange={(e) => updateField('book_isbn', e.target.value)}
                placeholder="Enter ISBN if available"
                className={errors.book_isbn ? 'border-red-500' : ''}
              />
              {errors.book_isbn && (
                <p className="text-sm text-red-600 flex items-center gap-1">
                  <AlertCircle className="h-4 w-4" />
                  {errors.book_isbn}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="book_description">Description (Optional)</Label>
              <Textarea
                id="book_description"
                value={formData.book_description}
                onChange={(e) => updateField('book_description', e.target.value)}
                placeholder="Any additional details about the book's condition, edition, etc."
                rows={3}
                maxLength={1000}
              />
              <p className="text-xs text-gray-500">
                {formData.book_description?.length || 0}/1000 characters
              </p>
            </div>
          </div>

          {/* Image Upload */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-bookconnect-brown">
              Book Photos <span className="text-red-500">*</span>
            </h3>
            <p className="text-sm text-bookconnect-brown/70">
              Upload up to 3 clear photos of your book (front cover, back cover, and any damage or special features)
            </p>

            {/* Image Upload Area */}
            <div className="border-2 border-dashed border-bookconnect-sage/50 rounded-lg p-6 text-center">
              <input
                type="file"
                multiple
                accept={IMAGE_UPLOAD_CONFIG.allowedTypes.join(',')}
                onChange={handleImageSelect}
                className="hidden"
                id="image-upload"
                disabled={images.length >= IMAGE_UPLOAD_CONFIG.maxImages}
              />
              <label
                htmlFor="image-upload"
                className={`cursor-pointer ${images.length >= IMAGE_UPLOAD_CONFIG.maxImages ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <Upload className="h-8 w-8 text-bookconnect-sage mx-auto mb-2" />
                <p className="text-bookconnect-brown font-medium">
                  {images.length >= IMAGE_UPLOAD_CONFIG.maxImages 
                    ? 'Maximum images reached' 
                    : 'Click to upload images'
                  }
                </p>
                <p className="text-sm text-bookconnect-brown/70">
                  JPEG, PNG, or WebP • Max 3MB each • {images.length}/{IMAGE_UPLOAD_CONFIG.maxImages} uploaded
                </p>
              </label>
            </div>

            {/* Image Previews */}
            {images.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {images.map((image, index) => (
                  <div key={index} className="relative">
                    <img
                      src={image.preview}
                      alt={`Book photo ${index + 1}`}
                      className="w-full h-32 object-cover rounded-lg border border-gray-200"
                    />
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                    >
                      <X className="h-4 w-4" />
                    </button>
                    <p className="text-xs text-center mt-1 text-gray-600">
                      Photo {index + 1}
                    </p>
                  </div>
                ))}
              </div>
            )}

            {errors.images && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{errors.images}</AlertDescription>
              </Alert>
            )}
          </div>

          {/* Submit Button */}
          <div className="pt-4">
            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-bookconnect-terracotta hover:bg-bookconnect-terracotta/90 text-white"
            >
              {isSubmitting ? 'Submitting...' : 'Submit Book Listing'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default BookListingForm;
