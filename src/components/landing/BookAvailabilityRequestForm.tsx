import React, { useState, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { EnhancedInput, EnhancedTextarea } from '@/components/ui/enhanced-input';
import { Search, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import {
  BookAvailabilityRequestFormData,
  BookAvailabilityRequestFormErrors,
  validateBookAvailabilityRequestForm,
  DEFAULT_FORM_DATA,
  VALIDATION_RULES
} from '@/types/bookAvailabilityRequests';
import {
  debounce,
  getCharacterCount,
  SubmissionThrottle,
  validateNameField,
  validateEmail,
  validatePhoneNumber,
  validateBookTitle,
  validateOptionalText
} from '@/lib/utils/formValidation';
import { BookAvailabilityRequestService } from '@/lib/services/bookAvailabilityRequestService';

interface BookAvailabilityRequestFormProps {
  storeId: string;
  onSuccess?: () => void;
}

export const BookAvailabilityRequestForm: React.FC<BookAvailabilityRequestFormProps> = ({
  storeId,
  onSuccess
}) => {
  const [formData, setFormData] = useState<BookAvailabilityRequestFormData>(DEFAULT_FORM_DATA);
  const [errors, setErrors] = useState<BookAvailabilityRequestFormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [fieldTouched, setFieldTouched] = useState<Record<string, boolean>>({});
  const [submissionThrottle] = useState(() => new SubmissionThrottle(5));

  // Enhanced field validation
  const validateSingleField = (field: keyof BookAvailabilityRequestFormData, value: string): string | undefined => {
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
      case 'description':
        if (value) {
          const descValidation = validateOptionalText(value, VALIDATION_RULES.description.maxLength, 'Description');
          return descValidation.isValid ? undefined : descValidation.error;
        }
        return undefined;
      default:
        return undefined;
    }
  };

  // Debounced validation for real-time feedback
  const debouncedValidateField = useCallback(
    debounce((field: keyof BookAvailabilityRequestFormData, value: string) => {
      if (fieldTouched[field]) {
        const fieldError = validateSingleField(field, value);
        setErrors(prev => ({ ...prev, [field]: fieldError }));
      }
    }, 300),
    [fieldTouched]
  );

  const handleInputChange = (field: keyof BookAvailabilityRequestFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));

    // Clear error for this field when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }

    // Trigger debounced validation
    debouncedValidateField(field, value);
  };

  const handleFieldBlur = (field: keyof BookAvailabilityRequestFormData) => {
    setFieldTouched(prev => ({ ...prev, [field]: true }));

    // Validate immediately on blur
    const fieldError = validateSingleField(field, formData[field] || '');
    setErrors(prev => ({ ...prev, [field]: fieldError }));
  };

  const validateForm = (): boolean => {
    const validationErrors = validateBookAvailabilityRequestForm(formData);
    setErrors(validationErrors);
    return Object.keys(validationErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Check rate limiting
    if (!submissionThrottle.canSubmit()) {
      const remainingSeconds = submissionThrottle.getRemainingCooldown();
      toast.error(`Please wait ${remainingSeconds} seconds before submitting again`);
      return;
    }

    if (!validateForm()) {
      toast.error('Please fix the errors in the form');
      return;
    }

    setIsSubmitting(true);
    submissionThrottle.recordSubmission();
    
    try {
      const result = await BookAvailabilityRequestService.submitRequest({
        formData,
        storeId,
      });

      setSubmitSuccess(true);
      toast.success('Book availability request submitted successfully!');
      
      // Reset form
      setFormData(DEFAULT_FORM_DATA);
      setErrors({});
      
      // Call success callback
      if (onSuccess) {
        setTimeout(onSuccess, 2000);
      }
    } catch (error) {
      console.error('Error submitting book availability request:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to submit request');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitSuccess) {
    return (
      <Card className="max-w-2xl mx-auto">
        <CardContent className="p-8 text-center">
          <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
          <h3 className="text-2xl font-semibold text-bookconnect-brown mb-4">
            Request Submitted Successfully!
          </h3>
          <p className="text-bookconnect-brown/70 mb-6">
            Thank you for your book availability request. The store owner will review your request and contact you directly via phone or email with information about the book you're looking for.
          </p>
          <div className="bg-bookconnect-sage/10 p-4 rounded-lg">
            <p className="text-sm text-bookconnect-brown/80">
              <strong>What happens next:</strong><br />
              • Store owner reviews your request<br />
              • They'll contact you directly if they have the book or can source it<br />
              • You'll receive information about availability and pricing
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl font-serif text-bookconnect-brown flex items-center">
          <Search className="h-6 w-6 mr-2" />
          Book Availability Request
        </CardTitle>
        <p className="text-bookconnect-brown/70">
          Looking for a specific book? Fill out this form and the store owner will contact you directly if they have it or can source it for you.
        </p>
      </CardHeader>
      
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Customer Information Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-bookconnect-brown border-b border-bookconnect-sage/20 pb-2">
              Your Contact Information
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <EnhancedInput
                id="customer_name"
                label="Full Name"
                value={formData.customer_name}
                onChange={(value) => handleInputChange('customer_name', value)}
                onBlur={() => handleFieldBlur('customer_name')}
                error={errors.customer_name}
                maxLength={VALIDATION_RULES.customer_name.maxLength}
                showCharacterCount={true}
                required={true}
                placeholder="Enter your full name"
              />

              <EnhancedInput
                id="customer_phone"
                label="Phone Number"
                value={formData.customer_phone}
                onChange={(value) => handleInputChange('customer_phone', value)}
                onBlur={() => handleFieldBlur('customer_phone')}
                error={errors.customer_phone}
                required={true}
                type="tel"
              />
            </div>

            <EnhancedInput
              id="customer_email"
              label="Email Address"
              value={formData.customer_email}
              onChange={(value) => handleInputChange('customer_email', value)}
              onBlur={() => handleFieldBlur('customer_email')}
              error={errors.customer_email}
              maxLength={VALIDATION_RULES.customer_email.maxLength}
              showCharacterCount={true}
              required={true}
              type="email"
              placeholder="Enter your email address"
            />
          </div>

          {/* Book Information Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-bookconnect-brown border-b border-bookconnect-sage/20 pb-2">
              Book Information
            </h3>
            
            <EnhancedInput
              id="book_title"
              label="Book Title"
              value={formData.book_title}
              onChange={(value) => handleInputChange('book_title', value)}
              onBlur={() => handleFieldBlur('book_title')}
              error={errors.book_title}
              maxLength={VALIDATION_RULES.book_title.maxLength}
              showCharacterCount={true}
              required={true}
              placeholder="Enter the book title"
            />

            <EnhancedInput
              id="book_author"
              label="Author Name"
              value={formData.book_author}
              onChange={(value) => handleInputChange('book_author', value)}
              onBlur={() => handleFieldBlur('book_author')}
              error={errors.book_author}
              maxLength={VALIDATION_RULES.book_author.maxLength}
              showCharacterCount={true}
              required={true}
              placeholder="Enter the author's name"
            />

            <EnhancedTextarea
              id="description"
              label="Additional Details (Optional)"
              value={formData.description || ''}
              onChange={(value) => handleInputChange('description', value)}
              onBlur={() => handleFieldBlur('description')}
              error={errors.description}
              maxLength={VALIDATION_RULES.description.maxLength}
              showCharacterCount={true}
              placeholder="Include details like specific edition, publisher, publication year, or any other relevant information"
              rows={3}
            />
          </div>

          {/* Submit Button */}
          <div className="pt-4">
            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-bookconnect-terracotta hover:bg-bookconnect-terracotta/90 text-white py-3 text-lg font-semibold"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                  Submitting Request...
                </>
              ) : (
                <>
                  <Search className="h-5 w-5 mr-2" />
                  Submit Book Request
                </>
              )}
            </Button>
          </div>

          {/* Information Alert */}
          <Alert className="bg-bookconnect-sage/10 border-bookconnect-sage/20">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-bookconnect-brown/80">
              <strong>How it works:</strong> After submitting your request, the store owner will review it and contact you directly via phone or email if they have the book or can source it for you. This is a free inquiry service.
            </AlertDescription>
          </Alert>
        </form>
      </CardContent>
    </Card>
  );
};

export default BookAvailabilityRequestForm;
