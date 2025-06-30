import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Search, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { 
  BookAvailabilityRequestFormData, 
  BookAvailabilityRequestFormErrors, 
  validateBookAvailabilityRequestForm,
  DEFAULT_FORM_DATA
} from '@/types/bookAvailabilityRequests';

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

  const handleInputChange = (field: keyof BookAvailabilityRequestFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear error for this field when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const validateForm = (): boolean => {
    const validationErrors = validateBookAvailabilityRequestForm(formData);
    setErrors(validationErrors);
    return Object.keys(validationErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast.error('Please fix the errors in the form');
      return;
    }

    setIsSubmitting(true);
    
    try {
      const response = await fetch('/api/book-availability-requests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          store_id: storeId,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to submit request');
      }

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
              <div>
                <Label htmlFor="customer_name" className="text-bookconnect-brown font-medium">
                  Full Name *
                </Label>
                <Input
                  id="customer_name"
                  type="text"
                  value={formData.customer_name}
                  onChange={(e) => handleInputChange('customer_name', e.target.value)}
                  className={errors.customer_name ? 'border-red-500' : ''}
                  placeholder="Enter your full name"
                />
                {errors.customer_name && (
                  <p className="text-red-500 text-sm mt-1 flex items-center">
                    <AlertCircle className="h-4 w-4 mr-1" />
                    {errors.customer_name}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="customer_phone" className="text-bookconnect-brown font-medium">
                  Phone Number *
                </Label>
                <Input
                  id="customer_phone"
                  type="tel"
                  value={formData.customer_phone}
                  onChange={(e) => handleInputChange('customer_phone', e.target.value)}
                  className={errors.customer_phone ? 'border-red-500' : ''}
                  placeholder="Enter your phone number"
                />
                {errors.customer_phone && (
                  <p className="text-red-500 text-sm mt-1 flex items-center">
                    <AlertCircle className="h-4 w-4 mr-1" />
                    {errors.customer_phone}
                  </p>
                )}
              </div>
            </div>

            <div>
              <Label htmlFor="customer_email" className="text-bookconnect-brown font-medium">
                Email Address *
              </Label>
              <Input
                id="customer_email"
                type="email"
                value={formData.customer_email}
                onChange={(e) => handleInputChange('customer_email', e.target.value)}
                className={errors.customer_email ? 'border-red-500' : ''}
                placeholder="Enter your email address"
              />
              {errors.customer_email && (
                <p className="text-red-500 text-sm mt-1 flex items-center">
                  <AlertCircle className="h-4 w-4 mr-1" />
                  {errors.customer_email}
                </p>
              )}
            </div>
          </div>

          {/* Book Information Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-bookconnect-brown border-b border-bookconnect-sage/20 pb-2">
              Book Information
            </h3>
            
            <div>
              <Label htmlFor="book_title" className="text-bookconnect-brown font-medium">
                Book Title *
              </Label>
              <Input
                id="book_title"
                type="text"
                value={formData.book_title}
                onChange={(e) => handleInputChange('book_title', e.target.value)}
                className={errors.book_title ? 'border-red-500' : ''}
                placeholder="Enter the book title"
              />
              {errors.book_title && (
                <p className="text-red-500 text-sm mt-1 flex items-center">
                  <AlertCircle className="h-4 w-4 mr-1" />
                  {errors.book_title}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="book_author" className="text-bookconnect-brown font-medium">
                Author Name *
              </Label>
              <Input
                id="book_author"
                type="text"
                value={formData.book_author}
                onChange={(e) => handleInputChange('book_author', e.target.value)}
                className={errors.book_author ? 'border-red-500' : ''}
                placeholder="Enter the author's name"
              />
              {errors.book_author && (
                <p className="text-red-500 text-sm mt-1 flex items-center">
                  <AlertCircle className="h-4 w-4 mr-1" />
                  {errors.book_author}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="description" className="text-bookconnect-brown font-medium">
                Additional Details (Optional)
              </Label>
              <Textarea
                id="description"
                value={formData.description || ''}
                onChange={(e) => handleInputChange('description', e.target.value)}
                className={errors.description ? 'border-red-500' : ''}
                placeholder="Any additional details about the book you're looking for (edition, publisher, year, etc.)"
                rows={3}
              />
              <p className="text-sm text-bookconnect-brown/60 mt-1">
                Include details like specific edition, publisher, publication year, or any other relevant information
              </p>
              {errors.description && (
                <p className="text-red-500 text-sm mt-1 flex items-center">
                  <AlertCircle className="h-4 w-4 mr-1" />
                  {errors.description}
                </p>
              )}
            </div>
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
