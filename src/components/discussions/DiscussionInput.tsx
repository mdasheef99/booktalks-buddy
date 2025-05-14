import React, { useRef, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageSquare, Send, Smile } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { Database } from '@/integrations/supabase/types';
import { supabase } from '@/lib/supabase';
import { createTopic, createPost } from '@/lib/api';
import { REACTION_TYPES } from '@/lib/api/bookclubs/reactions';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from '@/lib/utils';

type DiscussionTopic = Database['public']['Tables']['discussion_topics']['Row'];
type DiscussionPost = Database['public']['Tables']['discussion_posts']['Row'];

interface DiscussionInputProps {
  clubId: string;
  topicId?: string;
  parentPostId?: string;
  onSuccess?: () => void;
  mode?: 'topic' | 'reply';
}

export const DiscussionInput: React.FC<DiscussionInputProps> = ({
  clubId,
  topicId,
  parentPostId,
  onSuccess,
  mode = 'reply'
}) => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [emojiPickerOpen, setEmojiPickerOpen] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea based on content
  const adjustTextareaHeight = () => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    // Reset height to auto to get the correct scrollHeight
    textarea.style.height = 'auto';

    // Set the height to scrollHeight
    const newHeight = Math.max(
      mode === 'topic' ? 100 : 40, // Min height
      Math.min(
        textarea.scrollHeight,
        mode === 'topic' ? 200 : 80 // Max height
      )
    );

    textarea.style.height = `${newHeight}px`;
  };

  // Adjust height when content changes
  useEffect(() => {
    adjustTextareaHeight();
  }, [content, mode]);

  // Function to insert emoji at cursor position
  const insertEmoji = (emoji: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;

    // Get text before and after cursor
    const textBefore = content.substring(0, start);
    const textAfter = content.substring(end);

    // Insert emoji at cursor position
    const newContent = textBefore + emoji + textAfter;
    setContent(newContent);

    // Close emoji picker
    setEmojiPickerOpen(false);

    // Focus back on textarea and set cursor position after the inserted emoji
    setTimeout(() => {
      textarea.focus();
      const newCursorPos = start + emoji.length;
      textarea.setSelectionRange(newCursorPos, newCursorPos);
    }, 0);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user?.id) {
      toast.error('Please log in to participate in discussions');
      return;
    }

    if (mode === 'topic' && !title.trim()) {
      toast.error('Please enter a topic title');
      return;
    }

    if (!content.trim()) {
      toast.error('Please enter some content');
      return;
    }

    setSubmitting(true);

    try {
      if (mode === 'topic') {
        // Create new topic
        const topicData = await createTopic(user.id, clubId, title.trim());

        // Create initial post in topic
        await createPost(user.id, topicData.id, content.trim());

        toast.success('Discussion topic created');
        navigate(`/book-club/${clubId}/discussions/${topicData.id}`);
      } else {
        // Create reply post
        await createPost(user.id, topicId!, content.trim(), parentPostId);

        toast.success('Reply posted');
        setContent('');
        onSuccess?.();
      }
    } catch (error) {
      console.error('Error posting discussion:', error);
      toast.error('Failed to post discussion');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {mode === 'topic' ? (
        <Card className="p-4 shadow-md border border-gray-100 rounded-lg">
          <div className="space-y-4">
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1.5">
                Topic Title
              </label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter topic title"
                className="w-full border-gray-200 focus:border-bookconnect-sage focus:ring-1 focus:ring-bookconnect-sage/30 transition-all"
              />
            </div>

            <div>
              <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-1.5">
                Initial Post
              </label>
              <div className="relative">
                <Textarea
                  ref={textareaRef}
                  id="content"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Start the discussion..."
                  rows={4}
                  className="w-full resize-none text-sm py-2 px-3 border-gray-200 focus:border-bookconnect-sage focus:ring-1 focus:ring-bookconnect-sage/30 transition-all"
                  style={{ overflow: content.length > 100 ? 'auto' : 'hidden' }}
                />
                <div className="absolute bottom-2 left-2">
                  <Popover open={emojiPickerOpen} onOpenChange={setEmojiPickerOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="text-gray-400 hover:text-bookconnect-sage hover:bg-gray-100 rounded-full h-7 w-7 p-0 flex items-center justify-center"
                        title="Insert emoji"
                      >
                        <Smile className="h-4 w-4" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-2" align="start" side="top">
                      <div className="flex flex-col gap-2">
                        <div className="text-xs text-gray-500 px-1">
                          Click to insert emoji
                        </div>
                        <div className="flex flex-wrap gap-1.5 max-w-[280px]">
                          {Object.values(REACTION_TYPES).map(emoji => (
                            <button
                              key={emoji}
                              type="button"
                              onClick={() => insertEmoji(emoji)}
                              className="text-xl hover:bg-gray-100 p-1.5 rounded transition-colors"
                              title={`Insert ${emoji}`}
                            >
                              {emoji}
                            </button>
                          ))}
                        </div>
                      </div>
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-1">
              <Button
                type="submit"
                disabled={submitting}
                className="flex items-center gap-2 bg-bookconnect-sage hover:bg-bookconnect-sage/90 text-white transition-all"
              >
                {submitting ? (
                  'Posting...'
                ) : (
                  <>
                    <MessageSquare className="h-4 w-4" />
                    Create Topic
                  </>
                )}
              </Button>
            </div>
          </div>
        </Card>
      ) : (
        <Card className={`p-0 overflow-hidden ${isFocused ? 'shadow-md ring-1 ring-bookconnect-sage/30' : 'shadow-sm'} border border-gray-200 rounded-lg transition-all duration-200`}>
          <div className="space-y-0">
            <Textarea
              ref={textareaRef}
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Write your reply..."
              rows={1}
              className="w-full resize-none text-sm py-2.5 px-3 border-0 focus:ring-1 focus:ring-bookconnect-sage/40 transition-all placeholder:text-gray-400"
              style={{ overflow: content.length > 50 ? 'auto' : 'hidden' }}
              onFocus={() => {
                setIsFocused(true);
                adjustTextareaHeight();
              }}
              onBlur={() => setIsFocused(false)}
            />

            <div className={`flex justify-between items-center ${isFocused ? 'bg-gray-50' : 'bg-gray-50/80'} py-2 px-3 border-t border-gray-200 transition-colors`}>
              {/* Emoji Picker */}
              <Popover open={emojiPickerOpen} onOpenChange={setEmojiPickerOpen}>
                <PopoverTrigger asChild>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="text-gray-500 hover:text-bookconnect-sage hover:bg-gray-100 rounded-full h-7 w-7 p-0 flex items-center justify-center"
                    title="Insert emoji"
                  >
                    <Smile className="h-4 w-4" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-2" align="start" side="top">
                  <div className="flex flex-col gap-2">
                    <div className="text-xs text-gray-500 px-1">
                      Click to insert emoji
                    </div>
                    <div className="flex flex-wrap gap-1.5 max-w-[280px]">
                      {Object.values(REACTION_TYPES).map(emoji => (
                        <button
                          key={emoji}
                          type="button"
                          onClick={() => insertEmoji(emoji)}
                          className="text-xl hover:bg-gray-100 p-1.5 rounded transition-colors"
                          title={`Insert ${emoji}`}
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  </div>
                </PopoverContent>
              </Popover>

              {/* Submit Button */}
              <Button
                type="submit"
                disabled={submitting || !content.trim()}
                variant="ghost"
                size="sm"
                className={`flex items-center gap-1.5 rounded-full h-7 px-3 ${
                  content.trim()
                    ? 'text-bookconnect-sage font-medium hover:text-white hover:bg-bookconnect-sage border border-bookconnect-sage/30'
                    : 'text-gray-500 border border-gray-300'
                } transition-all duration-200`}
              >
                {submitting ? (
                  <span className="text-xs">Posting...</span>
                ) : (
                  <>
                    <Send className="h-3 w-3" />
                    <span className="text-xs font-medium">Reply</span>
                  </>
                )}
              </Button>
            </div>
          </div>
        </Card>
      )}
    </form>
  );
};

export default DiscussionInput;