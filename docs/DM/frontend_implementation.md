# Direct Messaging System - Frontend Implementation

## Overview

This document details the frontend implementation for the BookConnect Direct Messaging system, featuring a WhatsApp-style navigation pattern optimized for mobile-first usage with seamless integration into the existing profile system.

## Navigation Architecture

### WhatsApp-Style Page Structure

```
/messages                    → ConversationListPage
/messages/new               → NewConversationPage
/messages/[conversationId]  → MessageThreadPage
```

**Design Rationale:**
- **Single-page flow**: No complex split-screen layouts
- **Mobile-optimized**: Works perfectly on all screen sizes
- **Familiar UX**: Users understand this navigation pattern
- **Simple state management**: No complex conversation selection logic

## Component Architecture

### File Structure

```
src/components/messaging/
├── pages/
│   ├── ConversationListPage.tsx    # Main inbox view
│   ├── MessageThreadPage.tsx       # Individual conversation
│   └── NewConversationPage.tsx     # Start new conversation
├── components/
│   ├── ConversationItem.tsx        # Conversation list item
│   ├── MessageItem.tsx             # Individual message bubble
│   ├── MessageInput.tsx            # Message composition
│   └── MessagingHeader.tsx         # Shared header component
├── hooks/
│   ├── useConversations.ts         # Conversation list management
│   ├── useMessages.ts              # Message thread management
│   ├── useMessaging.ts             # Core messaging operations
│   └── useRealtimeMessages.ts      # Real-time subscriptions
└── utils/
    ├── messageFormatting.ts        # Message display utilities
    └── conversationHelpers.ts      # Conversation management helpers
```

## Core Page Components

### ConversationListPage

**File**: `src/components/messaging/pages/ConversationListPage.tsx`

```typescript
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { MessageCircle, Plus } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { getUserConversations } from '@/lib/api/messaging';
import { ConversationItem } from '../components/ConversationItem';
import { MessagingHeader } from '../components/MessagingHeader';

export function ConversationListPage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const { data: conversationsData, isLoading, error } = useQuery({
    queryKey: ['conversations', user?.id],
    queryFn: () => getUserConversations(user!.id),
    enabled: !!user?.id,
    refetchInterval: 30000 // Refresh every 30 seconds
  });

  const handleNewMessage = () => {
    // Check permissions before navigating
    if (!user?.hasEntitlement?.('CAN_SEND_DIRECT_MESSAGES') &&
        !user?.hasEntitlement?.('CAN_INITIATE_DIRECT_MESSAGES')) {
      toast.error('Upgrade to Privileged+ to start conversations');
      return;
    }
    navigate('/messages/new');
  };

  if (error) {
    return (
      <div className="max-w-md mx-auto h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-500 mb-4">Failed to load conversations</p>
          <Button onClick={() => window.location.reload()}>Retry</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto h-screen flex flex-col bg-white">
      <MessagingHeader
        title="Messages"
        action={
          <Button
            onClick={handleNewMessage}
            size="sm"
            variant="secondary"
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            New
          </Button>
        }
      />

      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="p-4 space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="flex items-center space-x-4 p-4">
                  <div className="rounded-full bg-gray-200 h-12 w-12"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : conversationsData?.conversations.length === 0 ? (
          <div className="p-8 text-center">
            <MessageCircle className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <p className="text-gray-500 mb-4">No conversations yet</p>
            <Button onClick={handleNewMessage}>
              Start your first conversation
            </Button>
          </div>
        ) : (
          <div className="divide-y">
            {conversationsData?.conversations.map(conversation => (
              <ConversationItem
                key={conversation.id}
                conversation={conversation}
                onClick={() => navigate(`/messages/${conversation.id}`)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
```

### MessageThreadPage

**File**: `src/components/messaging/pages/MessageThreadPage.tsx`

```typescript
import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import {
  getConversationMessages,
  sendMessage,
  markConversationAsRead
} from '@/lib/api/messaging';
import { MessageItem } from '../components/MessageItem';
import { MessageInput } from '../components/MessageInput';
import { MessagingHeader } from '../components/MessagingHeader';
import { useRealtimeMessages } from '../hooks/useRealtimeMessages';
import { toast } from 'sonner';

export function MessageThreadPage() {
  const { conversationId } = useParams<{ conversationId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  // Fetch messages
  const {
    data: messagesData,
    isLoading,
    error
  } = useQuery({
    queryKey: ['messages', conversationId],
    queryFn: () => getConversationMessages(conversationId!, user!.id),
    enabled: !!conversationId && !!user?.id
  });

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: (content: string) => sendMessage(user!.id, conversationId!, content),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages', conversationId] });
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    },
    onError: (error: Error) => {
      toast.error(error.message);
    }
  });

  // Real-time message subscription
  useRealtimeMessages(conversationId!, (newMessage) => {
    queryClient.setQueryData(['messages', conversationId], (oldData: any) => {
      if (!oldData) return oldData;
      return {
        ...oldData,
        messages: [...oldData.messages, newMessage]
      };
    });
  });

  // Mark as read when messages load
  useEffect(() => {
    if (messagesData?.messages.length && conversationId && user?.id) {
      markConversationAsRead(conversationId, user.id);
    }
  }, [messagesData, conversationId, user?.id]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messagesData?.messages]);

  const handleSendMessage = (content: string) => {
    sendMessageMutation.mutate(content);
  };

  if (error) {
    return (
      <div className="max-w-md mx-auto h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-500 mb-4">Failed to load conversation</p>
          <Button onClick={() => navigate('/messages')}>Back to Messages</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto h-screen flex flex-col bg-white">
      <MessagingHeader
        title="Conversation"
        backButton={
          <Button
            onClick={() => navigate('/messages')}
            variant="ghost"
            size="sm"
            className="mr-3"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
        }
      />

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {isLoading ? (
          <div className="space-y-4">
            {[...Array(10)].map((_, i) => (
              <div key={i} className={`animate-pulse flex ${i % 2 === 0 ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-xs p-3 rounded-lg ${i % 2 === 0 ? 'bg-gray-200' : 'bg-gray-300'}`}>
                  <div className="h-4 bg-gray-400 rounded w-24 mb-2"></div>
                  <div className="h-3 bg-gray-400 rounded w-16"></div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          messagesData?.messages.map(message => (
            <MessageItem
              key={message.id}
              message={message}
              isOwn={message.sender_id === user?.id}
            />
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <MessageInput
        onSendMessage={handleSendMessage}
        disabled={sendMessageMutation.isPending}
        placeholder="Type a message..."
      />
    </div>
  );
}
```

### NewConversationPage

**File**: `src/components/messaging/pages/NewConversationPage.tsx`

```typescript
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Search, MessageCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { startConversation } from '@/lib/api/messaging';
import { MessagingHeader } from '../components/MessagingHeader';
import { toast } from 'sonner';

export function NewConversationPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [username, setUsername] = useState('');

  const startConversationMutation = useMutation({
    mutationFn: (recipientUsername: string) =>
      startConversation(user!.id, recipientUsername),
    onSuccess: (data) => {
      if (data.is_existing) {
        toast.success('Opened existing conversation');
      } else {
        toast.success('Started new conversation');
      }
      navigate(`/messages/${data.conversation_id}`);
    },
    onError: (error: Error) => {
      toast.error(error.message);
    }
  });

  const handleStartConversation = () => {
    if (!username.trim()) {
      toast.error('Please enter a username');
      return;
    }
    startConversationMutation.mutate(username.trim());
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleStartConversation();
    }
  };

  return (
    <div className="max-w-md mx-auto h-screen flex flex-col bg-white">
      <MessagingHeader
        title="New Message"
        backButton={
          <Button
            onClick={() => navigate('/messages')}
            variant="ghost"
            size="sm"
            className="mr-3"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
        }
      />

      <div className="p-4 space-y-6">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Username
            </label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Enter username..."
                  className="pl-10"
                  disabled={startConversationMutation.isPending}
                />
              </div>
              <Button
                onClick={handleStartConversation}
                disabled={!username.trim() || startConversationMutation.isPending}
                className="flex items-center gap-2"
              >
                <MessageCircle className="h-4 w-4" />
                Start
              </Button>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="text-sm text-blue-800">
              <p className="font-medium mb-1">How to start a conversation:</p>
              <ul className="space-y-1 text-blue-700">
                <li>• Enter the exact username of the person you want to message</li>
                <li>• You can only message people in your book clubs</li>
                <li>• If a conversation already exists, you'll be taken to it</li>
              </ul>
            </div>
          </div>

          {!user?.hasEntitlement?.('CAN_SEND_DIRECT_MESSAGES') &&
           !user?.hasEntitlement?.('CAN_INITIATE_DIRECT_MESSAGES') && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <div className="text-sm text-amber-800">
                <p className="font-medium mb-1">Upgrade Required</p>
                <p className="text-amber-700">
                  Only Privileged and Privileged+ members can start new conversations.
                  You can still reply to messages sent to you.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
```

## Supporting Components

### ConversationItem

**File**: `src/components/messaging/components/ConversationItem.tsx`

```typescript
import React from 'react';
import { DMConversation } from '@/lib/api/messaging/types';
import { formatDistanceToNow } from 'date-fns';

interface ConversationItemProps {
  conversation: DMConversation;
  onClick: () => void;
}

export function ConversationItem({ conversation, onClick }: ConversationItemProps) {
  const otherParticipant = conversation.other_participant;
  const lastMessage = conversation.last_message;

  return (
    <div
      onClick={onClick}
      className="p-4 hover:bg-gray-50 cursor-pointer transition-colors active:bg-gray-100"
    >
      <div className="flex items-center justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <h3 className="font-medium text-gray-900 truncate">
              {otherParticipant?.displayname || otherParticipant?.username || 'Unknown User'}
            </h3>
            {lastMessage && (
              <span className="text-xs text-gray-500 ml-2 flex-shrink-0">
                {formatDistanceToNow(new Date(lastMessage.sent_at), { addSuffix: true })}
              </span>
            )}
          </div>
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500 truncate flex-1">
              {lastMessage?.content || 'No messages yet'}
            </p>
            {conversation.unread_count > 0 && (
              <div className="ml-2 bg-bookconnect-terracotta text-white text-xs rounded-full h-5 w-5 flex items-center justify-center flex-shrink-0">
                {conversation.unread_count > 99 ? '99+' : conversation.unread_count}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
```

### MessageItem

**File**: `src/components/messaging/components/MessageItem.tsx`

```typescript
import React from 'react';
import { DMMessage } from '@/lib/api/messaging/types';
import { formatDistanceToNow } from 'date-fns';

interface MessageItemProps {
  message: DMMessage;
  isOwn: boolean;
}

export function MessageItem({ message, isOwn }: MessageItemProps) {
  return (
    <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
          isOwn
            ? 'bg-bookconnect-sage text-white'
            : 'bg-gray-200 text-gray-900'
        }`}
      >
        {!isOwn && (
          <div className="text-xs font-medium mb-1 opacity-75">
            {message.sender.displayname || message.sender.username}
          </div>
        )}
        <div className="text-sm whitespace-pre-wrap break-words">
          {message.content}
        </div>
        <div className={`text-xs mt-1 ${isOwn ? 'text-white/70' : 'text-gray-500'}`}>
          {formatDistanceToNow(new Date(message.sent_at), { addSuffix: true })}
        </div>
      </div>
    </div>
  );
}
```

### MessageInput

**File**: `src/components/messaging/components/MessageInput.tsx`

```typescript
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Send } from 'lucide-react';

interface MessageInputProps {
  onSendMessage: (content: string) => void;
  disabled?: boolean;
  placeholder?: string;
}

export function MessageInput({
  onSendMessage,
  disabled = false,
  placeholder = "Type a message..."
}: MessageInputProps) {
  const [message, setMessage] = useState('');

  const handleSend = () => {
    if (!message.trim() || disabled) return;
    onSendMessage(message.trim());
    setMessage('');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="p-4 border-t bg-white">
      <div className="flex gap-2 items-end">
        <Textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder={placeholder}
          className="flex-1 min-h-[40px] max-h-[120px] resize-none"
          maxLength={1000}
          disabled={disabled}
          rows={1}
        />
        <Button
          onClick={handleSend}
          disabled={!message.trim() || disabled}
          size="sm"
          className="flex-shrink-0"
        >
          <Send className="h-4 w-4" />
        </Button>
      </div>
      <div className="text-xs text-gray-500 mt-1 text-right">
        {message.length}/1000
      </div>
    </div>
  );
}
```

### MessagingHeader

**File**: `src/components/messaging/components/MessagingHeader.tsx`

```typescript
import React from 'react';

interface MessagingHeaderProps {
  title: string;
  backButton?: React.ReactNode;
  action?: React.ReactNode;
}

export function MessagingHeader({ title, backButton, action }: MessagingHeaderProps) {
  return (
    <header className="p-4 border-b bg-bookconnect-sage text-white">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          {backButton}
          <h1 className="text-xl font-bold">{title}</h1>
        </div>
        {action}
      </div>
    </header>
  );
}
```

## Custom Hooks

### useMessaging Hook

**File**: `src/components/messaging/hooks/useMessaging.ts`

```typescript
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { startConversation } from '@/lib/api/messaging';
import { toast } from 'sonner';

export function useMessaging() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const startConversationMutation = useMutation({
    mutationFn: (recipientUsername: string) =>
      startConversation(user!.id, recipientUsername),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      if (data.is_existing) {
        toast.success('Opened existing conversation');
      } else {
        toast.success('Started new conversation');
      }
      navigate(`/messages/${data.conversation_id}`);
    },
    onError: (error: Error) => {
      toast.error(error.message);
    }
  });

  const handleStartConversation = (username: string) => {
    if (!user) {
      toast.error('Please log in to send messages');
      return;
    }

    // Check if user has permission to initiate conversations
    if (!user.hasEntitlement?.('CAN_SEND_DIRECT_MESSAGES') &&
        !user.hasEntitlement?.('CAN_INITIATE_DIRECT_MESSAGES')) {
      toast.error('Upgrade to Privileged+ to start conversations');
      return;
    }

    startConversationMutation.mutate(username);
  };

  return {
    handleStartConversation,
    isStarting: startConversationMutation.isPending
  };
}
```

### useRealtimeMessages Hook

**File**: `src/components/messaging/hooks/useRealtimeMessages.ts`

```typescript
import { useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { DMMessage } from '@/lib/api/messaging/types';

export function useRealtimeMessages(
  conversationId: string,
  onMessage: (message: DMMessage) => void
) {
  useEffect(() => {
    if (!conversationId) return;

    const subscription = supabase
      .channel(`conversation:${conversationId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'direct_messages',
        filter: `conversation_id=eq.${conversationId}`
      }, (payload) => {
        // Transform payload to DMMessage format
        const message = payload.new as DMMessage;
        onMessage(message);
      })
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'direct_messages',
        filter: `conversation_id=eq.${conversationId}`
      }, (payload) => {
        // Handle message updates (e.g., soft deletes)
        const message = payload.new as DMMessage;
        onMessage(message);
      })
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log('Subscribed to conversation:', conversationId);
        } else if (status === 'CHANNEL_ERROR') {
          console.error('Real-time subscription error for conversation:', conversationId);
        }
      });

    return () => {
      supabase.removeChannel(subscription);
    };
  }, [conversationId, onMessage]);
}
```

## Route Configuration

### App.tsx Integration

**File**: `src/App.tsx` (modifications)

```typescript
// Add these imports
import { ConversationListPage } from '@/components/messaging/pages/ConversationListPage';
import { MessageThreadPage } from '@/components/messaging/pages/MessageThreadPage';
import { NewConversationPage } from '@/components/messaging/pages/NewConversationPage';

// Add these routes under the Layout component
<Route element={<Layout />}>
  {/* Existing routes... */}

  {/* Direct Messaging Routes */}
  <Route path="/messages" element={<ConversationListPage />} />
  <Route path="/messages/new" element={<NewConversationPage />} />
  <Route path="/messages/:conversationId" element={<MessageThreadPage />} />
</Route>
```

## Integration with Existing Profile System

### Profile Header Integration

**File**: `src/components/profile/ProfileHeader.tsx` (modification)

```typescript
// Add messaging button to profile header
import { MessageCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

// Inside ProfileHeader component
const navigate = useNavigate();

// Add to profile actions
<Button
  onClick={() => navigate('/messages')}
  variant="outline"
  className="flex items-center gap-2"
>
  <MessageCircle className="h-4 w-4" />
  Messages
</Button>
```

### User Profile Integration

**File**: `src/pages/BookClubProfilePage.tsx` (modification)

```typescript
// Add message user button to other users' profiles
import { useMessaging } from '@/components/messaging/hooks/useMessaging';

// Inside BookClubProfilePage component
const { handleStartConversation, isStarting } = useMessaging();

// Add to profile actions section
{!isCurrentUser && (
  <Button
    onClick={() => handleStartConversation(profile.username)}
    disabled={isStarting}
    className="flex items-center gap-2"
  >
    <MessageCircle className="h-4 w-4" />
    {isStarting ? 'Starting...' : 'Message'}
  </Button>
)}
```

## Related Documents

- **[Architecture Overview](./architecture_overview.md)**: System design context for frontend implementation
- **[Database Design](./database_design.md)**: Data model consumed by frontend components
- **[API Specification](./api_specification.md)**: Backend functions used by frontend
- **[Deployment Guide](./deployment_guide.md)**: Frontend build and deployment configuration

## Implementation Notes

1. **Mobile-First Design**: All components optimized for mobile with progressive enhancement
2. **Real-Time Updates**: Efficient Supabase Realtime integration for live messaging
3. **Error Handling**: Comprehensive error states and user feedback
4. **Performance**: Optimized queries, pagination, and component rendering
5. **Accessibility**: WCAG 2.1 AA compliance with proper ARIA labels and keyboard navigation
