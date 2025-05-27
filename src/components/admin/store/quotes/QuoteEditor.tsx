import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { X, Plus } from 'lucide-react';
import { CustomQuote, QuoteFormData } from '@/lib/api/store/quotes';

interface QuoteEditorProps {
  quote?: CustomQuote;
  onSave: (data: QuoteFormData) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

const QUOTE_CATEGORIES = [
  { value: 'general', label: 'General' },
  { value: 'inspirational', label: 'Inspirational' },
  { value: 'literary', label: 'Literary' },
  { value: 'seasonal', label: 'Seasonal' },
  { value: 'store_specific', label: 'Store Specific' },
];

export const QuoteEditor: React.FC<QuoteEditorProps> = ({
  quote,
  onSave,
  onCancel,
  isLoading = false
}) => {
  const [formData, setFormData] = useState<QuoteFormData>({
    quote_text: '',
    quote_author: '',
    quote_source: '',
    quote_category: 'general',
    quote_tags: [],
    is_active: true,
    start_date: '',
    end_date: '',
  });

  const [newTag, setNewTag] = useState('');

  // Initialize form with quote data if editing
  useEffect(() => {
    if (quote) {
      setFormData({
        quote_text: quote.quote_text,
        quote_author: quote.quote_author || '',
        quote_source: quote.quote_source || '',
        quote_category: quote.quote_category,
        quote_tags: quote.quote_tags || [],
        is_active: quote.is_active,
        start_date: quote.start_date ? quote.start_date.split('T')[0] : '',
        end_date: quote.end_date ? quote.end_date.split('T')[0] : '',
      });
    }
  }, [quote]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Clean up form data
    const cleanData = {
      ...formData,
      quote_author: formData.quote_author?.trim() || undefined,
      quote_source: formData.quote_source?.trim() || undefined,
      start_date: formData.start_date || undefined,
      end_date: formData.end_date || undefined,
    };

    onSave(cleanData);
  };

  const addTag = () => {
    if (newTag.trim() && !formData.quote_tags?.includes(newTag.trim())) {
      setFormData(prev => ({
        ...prev,
        quote_tags: [...(prev.quote_tags || []), newTag.trim()]
      }));
      setNewTag('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      quote_tags: prev.quote_tags?.filter(tag => tag !== tagToRemove) || []
    }));
  };

  const characterCount = formData.quote_text.length;
  const isOverLimit = characterCount > 300;

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>{quote ? 'Edit Quote' : 'Create New Quote'}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Quote Text */}
          <div className="space-y-2">
            <Label htmlFor="quote_text">Quote Text *</Label>
            <Textarea
              id="quote_text"
              value={formData.quote_text}
              onChange={(e) => setFormData(prev => ({ ...prev, quote_text: e.target.value }))}
              placeholder="Enter the quote text..."
              className={`min-h-[100px] ${isOverLimit ? 'border-red-500' : ''}`}
              required
            />
            <div className={`text-sm ${isOverLimit ? 'text-red-500' : 'text-gray-500'}`}>
              {characterCount}/300 characters
            </div>
          </div>

          {/* Author and Source */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="quote_author">Author</Label>
              <Input
                id="quote_author"
                value={formData.quote_author}
                onChange={(e) => setFormData(prev => ({ ...prev, quote_author: e.target.value }))}
                placeholder="Quote author"
                maxLength={100}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="quote_source">Source</Label>
              <Input
                id="quote_source"
                value={formData.quote_source}
                onChange={(e) => setFormData(prev => ({ ...prev, quote_source: e.target.value }))}
                placeholder="Book, speech, etc."
                maxLength={200}
              />
            </div>
          </div>

          {/* Category */}
          <div className="space-y-2">
            <Label>Category</Label>
            <Select
              value={formData.quote_category}
              onValueChange={(value: any) => setFormData(prev => ({ ...prev, quote_category: value }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {QUOTE_CATEGORIES.map(category => (
                  <SelectItem key={category.value} value={category.value}>
                    {category.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Tags */}
          <div className="space-y-2">
            <Label>Tags</Label>
            <div className="flex gap-2 mb-2">
              <Input
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                placeholder="Add a tag..."
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
              />
              <Button type="button" onClick={addTag} size="sm">
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {formData.quote_tags?.map(tag => (
                <Badge key={tag} variant="secondary" className="flex items-center gap-1">
                  {tag}
                  <X 
                    className="h-3 w-3 cursor-pointer" 
                    onClick={() => removeTag(tag)}
                  />
                </Badge>
              ))}
            </div>
          </div>

          {/* Scheduling */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="start_date">Start Date (Optional)</Label>
              <Input
                id="start_date"
                type="date"
                value={formData.start_date}
                onChange={(e) => setFormData(prev => ({ ...prev, start_date: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="end_date">End Date (Optional)</Label>
              <Input
                id="end_date"
                type="date"
                value={formData.end_date}
                onChange={(e) => setFormData(prev => ({ ...prev, end_date: e.target.value }))}
              />
            </div>
          </div>

          {/* Active Status */}
          <div className="flex items-center space-x-2">
            <Switch
              id="is_active"
              checked={formData.is_active}
              onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_active: checked }))}
            />
            <Label htmlFor="is_active">Active</Label>
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={isLoading || !formData.quote_text.trim() || isOverLimit}
            >
              {isLoading ? 'Saving...' : (quote ? 'Update Quote' : 'Create Quote')}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};
