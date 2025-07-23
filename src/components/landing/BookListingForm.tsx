import React, { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { EnhancedInput, EnhancedTextarea } from '@/components/ui/enhanced-input';
import { BookOpen, Upload, X, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { BookListingService } from '@/lib/services/bookListingService';
import {
  BookListingFormData,
  BookListingFormErrors,
  BOOK_CONDITIONS,
  VALIDATION_RULES,
  IMAGE_UPLOAD_CONFIG
} from '@/types/bookListings';
import {
  debounce,
  SubmissionThrottle,
  validateNameField,
  validateEmail,
  validatePhoneNumber,
  validateBookTitle,
  validateOptionalText
} from '@/lib/utils/formValidation';

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
  const [fieldTouched, setFieldTouched] = useState<Record<string, boolean>>({});
  const [submissionThrottle] = useState(() => new SubmissionThrottle(5));

  // Debounced validation for real-time feedback
  const debouncedValidateField = useCallback(
    debounce((field: keyof BookListingFormData, value: any) => {
      if (fieldTouched[field]) {
        const fieldErrors = validateSingleField(field, value);
        setErrors(prev => ({ ...prev, [field]: fieldErrors }));
      }
    }, 300),
    [fieldTouched]
  );

  // Enhanced field validation
  const validateSingleField = (field: keyof BookListingFormData, value: any): string | undefined => {
    switch (field) {
      case 'customer_name':
        const nameValidation = validateNameField(value, 'Customer name');
        return nameValidation.isValid ? undefined : nameValidation.error;
      case 'customer_email':
        const emailValidation = validateEmail(value);
        return emailValidation.isValid ? undefined : emailValidation.error;
      case 'customer_phone':
        const phoneValidation = validatePhoneNumber(value);
        return phoneValidation.isValid ? undefined : phoneValidation.error;
      case 'book_title':
        const titleValidation = validateBookTitle(value);
        return titleValidation.isValid ? undefined : titleValidation.error;
      case 'book_author':
        const authorValidation = validateNameField(value, 'Author name');
        return authorValidation.isValid ? undefined : authorValidation.error;
      case 'book_description':
        if (value) {
          const descValidation = validateOptionalText(value, VALIDATION_RULES.book_description.maxLength, 'Description');
          return descValidation.isValid ? undefined : descValidation.error;
        }
        return undefined;
      default:
        return undefined;
    }
  };

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

    // Trigger debounced validation
    debouncedValidateField(field, value);
  };

  const handleFieldBlur = (field: keyof BookListingFormData) => {
    setFieldTouched(prev => ({ ...prev, [field]: true }));

    // Validate immediately on blur
    const fieldError = validateSingleField(field, formData[field]);
    setErrors(prev => ({ ...prev, [field]: fieldError }));
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

    // Check rate limiting
    if (!submissionThrottle.canSubmit()) {
      const remainingSeconds = submissionThrottle.getRemainingCooldown();
      toast.error(`Please wait ${remainingSeconds} seconds before submitting again`);
      return;
    }

    if (!validateForm()) {
      toast.error('Please fix the errors below');
      return;
    }

    setIsSubmitting(true);
    submissionThrottle.recordSubmission();

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
              <EnhancedInput
                id="customer_name"
                label="Full Name"
                value={formData.customer_name}
                onChange={(value) => updateField('customer_name', value)}
                onBlur={() => handleFieldBlur('customer_name')}
                error={errors.customer_name}
                maxLength={VALIDATION_RULES.customer_name.maxLength}
                showCharacterCount={false}
                required={true}
                placeholder="Enter your full name"
              />

              <EnhancedInput
                id="customer_email"
                label="Email Address"
                value={formData.customer_email}
                onChange={(value) => updateField('customer_email', value)}
                onBlur={() => handleFieldBlur('customer_email')}
                error={errors.customer_email}
                maxLength={VALIDATION_RULES.customer_email.maxLength}
                showCharacterCount={false}
                required={true}
                type="email"
                placeholder="Enter your email"
              />
            </div>

            <EnhancedInput
              id="customer_phone"
              label="Phone Number"
              value={formData.customer_phone}
              onChange={(value) => updateField('customer_phone', value)}
              onBlur={() => handleFieldBlur('customer_phone')}
              error={errors.customer_phone}
              required={true}
              type="tel"
              placeholder="Enter your phone number"
            />
          </div>

          {/* Book Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-bookconnect-brown">Book Details</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <EnhancedInput
                id="book_title"
                label="Book Title"
                value={formData.book_title}
                onChange={(value) => updateField('book_title', value)}
                onBlur={() => handleFieldBlur('book_title')}
                error={errors.book_title}
                maxLength={VALIDATION_RULES.book_title.maxLength}
                showCharacterCount={true}
                required={true}
                placeholder="Enter the book title"
              />

              <EnhancedInput
                id="book_author"
                label="Author"
                value={formData.book_author}
                onChange={(value) => updateField('book_author', value)}
                onBlur={() => handleFieldBlur('book_author')}
                error={errors.book_author}
                maxLength={VALIDATION_RULES.book_author.maxLength}
                showCharacterCount={true}
                required={true}
                placeholder="Enter the author's name"
              />
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

            <EnhancedTextarea
              id="book_description"
              label="Description (Optional)"
              value={formData.book_description}
              onChange={(value) => updateField('book_description', value)}
              onBlur={() => handleFieldBlur('book_description')}
              error={errors.book_description}
              maxLength={VALIDATION_RULES.book_description.maxLength}
              showCharacterCount={true}
              placeholder="Any additional details about the book's condition, edition, etc."
              rows={3}
            />
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
