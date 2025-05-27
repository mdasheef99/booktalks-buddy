import { CarouselItem } from '@/lib/api/store/carousel';
import { BookFormData, BookFormErrors } from '../types/bookFormTypes';
import { FORM_FIELD_LIMITS, URL_REGEX, VALIDATION_MESSAGES } from './bookFormConstants';

/**
 * Validation utilities for book form
 * Extracted from BookEntryModal.tsx for reusability
 */

/**
 * Validate book title field
 */
export const validateBookTitle = (title: string): string | undefined => {
  if (!title.trim()) {
    return VALIDATION_MESSAGES.BOOK_TITLE_REQUIRED;
  }
  if (title.length > FORM_FIELD_LIMITS.BOOK_TITLE_MAX_LENGTH) {
    return VALIDATION_MESSAGES.BOOK_TITLE_TOO_LONG;
  }
  return undefined;
};

/**
 * Validate book author field
 */
export const validateBookAuthor = (author: string): string | undefined => {
  if (!author.trim()) {
    return VALIDATION_MESSAGES.BOOK_AUTHOR_REQUIRED;
  }
  if (author.length > FORM_FIELD_LIMITS.BOOK_AUTHOR_MAX_LENGTH) {
    return VALIDATION_MESSAGES.BOOK_AUTHOR_TOO_LONG;
  }
  return undefined;
};

/**
 * Validate book ISBN field
 */
export const validateBookISBN = (isbn: string): string | undefined => {
  if (isbn && isbn.length > FORM_FIELD_LIMITS.BOOK_ISBN_MAX_LENGTH) {
    return VALIDATION_MESSAGES.BOOK_ISBN_TOO_LONG;
  }
  return undefined;
};

/**
 * Validate custom description field
 */
export const validateCustomDescription = (description: string): string | undefined => {
  if (description && description.length > FORM_FIELD_LIMITS.CUSTOM_DESCRIPTION_MAX_LENGTH) {
    return VALIDATION_MESSAGES.CUSTOM_DESCRIPTION_TOO_LONG;
  }
  return undefined;
};

/**
 * Validate overlay text field
 */
export const validateOverlayText = (overlayText: string): string | undefined => {
  if (overlayText && overlayText.length > FORM_FIELD_LIMITS.OVERLAY_TEXT_MAX_LENGTH) {
    return VALIDATION_MESSAGES.OVERLAY_TEXT_TOO_LONG;
  }
  return undefined;
};

/**
 * Validate book image alt text field
 */
export const validateBookImageAlt = (altText: string): string | undefined => {
  if (altText && altText.length > FORM_FIELD_LIMITS.BOOK_IMAGE_ALT_MAX_LENGTH) {
    return VALIDATION_MESSAGES.BOOK_IMAGE_ALT_TOO_LONG;
  }
  return undefined;
};

/**
 * Validate click destination URL field
 */
export const validateClickDestinationUrl = (url: string): string | undefined => {
  if (url && !URL_REGEX.test(url)) {
    return VALIDATION_MESSAGES.INVALID_URL;
  }
  return undefined;
};

/**
 * Validate position field (only for new items)
 */
export const validatePosition = (position: string, editingItem?: CarouselItem | null): string | undefined => {
  if (!editingItem && position) {
    const pos = parseInt(position);
    if (isNaN(pos) || pos < FORM_FIELD_LIMITS.POSITION_MIN || pos > FORM_FIELD_LIMITS.POSITION_MAX) {
      return VALIDATION_MESSAGES.INVALID_POSITION;
    }
  }
  return undefined;
};

/**
 * Validate entire form and return errors object
 */
export const validateForm = (
  formData: BookFormData,
  editingItem?: CarouselItem | null
): BookFormErrors => {
  const errors: BookFormErrors = {};

  // Validate all fields
  const titleError = validateBookTitle(formData.book_title);
  if (titleError) errors.book_title = titleError;

  const authorError = validateBookAuthor(formData.book_author);
  if (authorError) errors.book_author = authorError;

  const isbnError = validateBookISBN(formData.book_isbn);
  if (isbnError) errors.book_isbn = isbnError;

  const descriptionError = validateCustomDescription(formData.custom_description);
  if (descriptionError) errors.custom_description = descriptionError;

  const overlayTextError = validateOverlayText(formData.overlay_text);
  if (overlayTextError) errors.overlay_text = overlayTextError;

  const altTextError = validateBookImageAlt(formData.book_image_alt);
  if (altTextError) errors.book_image_alt = altTextError;

  const urlError = validateClickDestinationUrl(formData.click_destination_url);
  if (urlError) errors.click_destination_url = urlError;

  const positionError = validatePosition(formData.position, editingItem);
  if (positionError) errors.position = positionError;

  return errors;
};

/**
 * Check if form has any validation errors
 */
export const hasValidationErrors = (errors: BookFormErrors): boolean => {
  return Object.keys(errors).length > 0;
};
