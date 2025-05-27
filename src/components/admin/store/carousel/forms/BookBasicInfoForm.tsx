import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { BookBasicInfoFormProps } from '../types/bookFormTypes';

/**
 * Form component for basic book information
 * Handles position, title, author, and ISBN fields
 */
export const BookBasicInfoForm: React.FC<BookBasicInfoFormProps> = ({
  formData,
  errors,
  editingItem,
  onUpdate
}) => {
  return (
    <>
      {/* Position (only for new items) */}
      {!editingItem && (
        <div className="space-y-2">
          <Label htmlFor="position">Position (1-6)</Label>
          <Input
            id="position"
            type="number"
            min="1"
            max="6"
            value={formData.position}
            onChange={(e) => onUpdate({ position: e.target.value })}
            placeholder="Leave empty for next available position"
          />
          {errors.position && (
            <p className="text-sm text-red-600">{errors.position}</p>
          )}
        </div>
      )}

      {/* Book Title */}
      <div className="space-y-2">
        <Label htmlFor="book_title">Book Title *</Label>
        <Input
          id="book_title"
          value={formData.book_title}
          onChange={(e) => onUpdate({ book_title: e.target.value })}
          placeholder="Enter book title"
          maxLength={200}
        />
        {errors.book_title && (
          <p className="text-sm text-red-600">{errors.book_title}</p>
        )}
      </div>

      {/* Book Author */}
      <div className="space-y-2">
        <Label htmlFor="book_author">Book Author *</Label>
        <Input
          id="book_author"
          value={formData.book_author}
          onChange={(e) => onUpdate({ book_author: e.target.value })}
          placeholder="Enter author name"
          maxLength={100}
        />
        {errors.book_author && (
          <p className="text-sm text-red-600">{errors.book_author}</p>
        )}
      </div>

      {/* Book ISBN */}
      <div className="space-y-2">
        <Label htmlFor="book_isbn">ISBN (optional)</Label>
        <Input
          id="book_isbn"
          value={formData.book_isbn}
          onChange={(e) => onUpdate({ book_isbn: e.target.value })}
          placeholder="Enter ISBN"
          maxLength={20}
        />
        {errors.book_isbn && (
          <p className="text-sm text-red-600">{errors.book_isbn}</p>
        )}
      </div>
    </>
  );
};
