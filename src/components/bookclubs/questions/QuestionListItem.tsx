/**
 * Individual question list item component
 * Handles display, editing, and actions for a single question
 */

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Edit2, 
  Trash2, 
  Star, 
  Save,
  X
} from 'lucide-react';
import { toast } from 'sonner';
import type { QuestionListItemProps, UpdateQuestionRequest } from './types';

export default function QuestionListItem({
  question,
  index,
  isEditing,
  canMoveUp,
  canMoveDown,
  loading,
  onEdit,
  onSave,
  onCancel,
  onDelete,
  onMoveUp,
  onMoveDown
}: QuestionListItemProps) {
  const [editText, setEditText] = useState(question.question_text);
  const [editRequired, setEditRequired] = useState(question.is_required);

  const handleSave = () => {
    if (!editText.trim()) {
      toast.error('Question text is required');
      return;
    }

    const updates: UpdateQuestionRequest = {
      question_text: editText.trim(),
      is_required: editRequired
    };

    onSave(updates);
  };

  const handleCancel = () => {
    // Reset form to original values
    setEditText(question.question_text);
    setEditRequired(question.is_required);
    onCancel();
  };

  // Editing mode rendering
  if (isEditing) {
    return (
      <Card className="border-bookconnect-terracotta">
        <CardContent className="p-4 space-y-3">
          <Textarea
            value={editText}
            onChange={(e) => setEditText(e.target.value)}
            placeholder="Enter question text..."
            maxLength={200}
            className="min-h-[80px]"
          />
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Switch
                checked={editRequired}
                onCheckedChange={setEditRequired}
              />
              <span className="text-sm">Required question</span>
            </div>
            <div className="text-xs text-gray-500">
              {editText.length}/200 characters
            </div>
          </div>
          <div className="flex space-x-2">
            <Button
              onClick={handleSave}
              disabled={loading}
              size="sm"
              className="bg-bookconnect-brown hover:bg-bookconnect-brown/90"
            >
              <Save className="h-4 w-4 mr-1" />
              Save
            </Button>
            <Button
              onClick={handleCancel}
              disabled={loading}
              variant="outline"
              size="sm"
            >
              <X className="h-4 w-4 mr-1" />
              Cancel
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Display mode rendering
  return (
    <Card className="border-gray-200">
      <CardContent className="p-4">
        <div className="flex items-start space-x-3">
          {/* Reorder buttons */}
          <div className="flex flex-col space-y-1">
            <Button
              onClick={onMoveUp}
              disabled={!canMoveUp || loading}
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0"
              title="Move up"
            >
              ↑
            </Button>
            <Button
              onClick={onMoveDown}
              disabled={!canMoveDown || loading}
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0"
              title="Move down"
            >
              ↓
            </Button>
          </div>
          
          {/* Question content */}
          <div className="flex-1 space-y-2">
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-2">
                <span className="text-sm font-medium text-gray-500">
                  Question {index + 1}
                </span>
                {question.is_required && (
                  <Badge variant="secondary" className="text-xs">
                    <Star className="h-3 w-3 mr-1" />
                    Required
                  </Badge>
                )}
              </div>
              
              {/* Action buttons */}
              <div className="flex space-x-1">
                <Button
                  onClick={onEdit}
                  disabled={loading}
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0"
                  title="Edit question"
                >
                  <Edit2 className="h-4 w-4" />
                </Button>
                <Button
                  onClick={onDelete}
                  disabled={loading}
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                  title="Delete question"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
            
            {/* Question text */}
            <p className="text-sm text-gray-700">{question.question_text}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
