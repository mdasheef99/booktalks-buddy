/**
 * Add question form component
 * Handles creation of new questions with validation
 */

import React from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent } from '@/components/ui/card';
import { Plus, X } from 'lucide-react';
import type { AddQuestionFormProps } from './types';

export default function AddQuestionForm({ 
  question, 
  loading, 
  onChange, 
  onSave, 
  onCancel 
}: AddQuestionFormProps) {
  
  const handleTextChange = (text: string) => {
    onChange({
      ...question,
      question_text: text
    });
  };

  const handleRequiredChange = (required: boolean) => {
    onChange({
      ...question,
      is_required: required
    });
  };

  const isValid = question.question_text.trim().length > 0;
  const characterCount = question.question_text.length;
  const isNearLimit = characterCount > 160;
  const isOverLimit = characterCount > 200;

  return (
    <Card className="border-bookconnect-terracotta">
      <CardContent className="p-4 space-y-3">
        <Textarea
          value={question.question_text}
          onChange={(e) => handleTextChange(e.target.value)}
          placeholder="Enter question text..."
          maxLength={200}
          className="min-h-[80px]"
        />
        
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Switch
              checked={question.is_required}
              onCheckedChange={handleRequiredChange}
            />
            <span className="text-sm">Required question</span>
          </div>
          <div className={`text-xs ${
            isOverLimit ? 'text-red-500' : 
            isNearLimit ? 'text-amber-500' : 
            'text-gray-500'
          }`}>
            {characterCount}/200 characters
          </div>
        </div>

        {/* Help text */}
        <div className="text-xs text-gray-600">
          <p>
            {question.is_required 
              ? 'Users must answer this question to join the club.'
              : 'This question is optional for users.'
            }
          </p>
        </div>
        
        <div className="flex space-x-2">
          <Button
            onClick={onSave}
            disabled={loading || !isValid || isOverLimit}
            className="bg-bookconnect-brown hover:bg-bookconnect-brown/90"
          >
            <Plus className="h-4 w-4 mr-1" />
            Add Question
          </Button>
          <Button
            onClick={onCancel}
            disabled={loading}
            variant="outline"
          >
            <X className="h-4 w-4 mr-1" />
            Cancel
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
