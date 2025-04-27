import { sendChatMessage } from './messageOperations';
import { isNetworkError } from '@/lib/errorHandling';
import { toast } from 'sonner';

// Define the structure of a queued message
export interface QueuedMessage {
  id: string;
  message: string;
  bookId: string;
  username: string;
  title?: string;
  author?: string;
  userId?: string;
  replyToId?: string;
  coverUrl?: string;
  attempts: number;
  lastAttempt: Date;
  status: 'pending' | 'sending' | 'failed' | 'success';
}

// In-memory queue for pending messages
const messageQueue: QueuedMessage[] = [];

// Maximum number of retry attempts
const MAX_RETRY_ATTEMPTS = 5;

// Exponential backoff delays (in milliseconds)
const RETRY_DELAYS = [2000, 5000, 10000, 30000, 60000];

/**
 * Add a message to the retry queue
 */
export function queueMessage(
  message: string,
  bookId: string,
  username: string,
  title?: string,
  author?: string,
  userId?: string,
  replyToId?: string,
  coverUrl?: string
): QueuedMessage {
  const queuedMessage: QueuedMessage = {
    id: `queued-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
    message,
    bookId,
    username,
    title,
    author,
    userId,
    replyToId,
    coverUrl,
    attempts: 0,
    lastAttempt: new Date(),
    status: 'pending'
  };
  
  messageQueue.push(queuedMessage);
  console.log(`Message queued: ${queuedMessage.id}`);
  
  // Start processing the queue if it's not already running
  processQueue();
  
  return queuedMessage;
}

/**
 * Process the message queue, attempting to send pending messages
 */
let isProcessing = false;
async function processQueue() {
  if (isProcessing || messageQueue.length === 0) return;
  
  isProcessing = true;
  console.log(`Processing message queue (${messageQueue.length} messages)`);
  
  try {
    // Process each message in the queue
    for (let i = 0; i < messageQueue.length; i++) {
      const queuedMessage = messageQueue[i];
      
      // Skip messages that are not pending or have exceeded max attempts
      if (queuedMessage.status !== 'pending' || queuedMessage.attempts >= MAX_RETRY_ATTEMPTS) {
        continue;
      }
      
      // Check if it's time to retry this message
      const now = new Date();
      const timeSinceLastAttempt = now.getTime() - queuedMessage.lastAttempt.getTime();
      const delayIndex = Math.min(queuedMessage.attempts, RETRY_DELAYS.length - 1);
      const requiredDelay = RETRY_DELAYS[delayIndex];
      
      if (timeSinceLastAttempt < requiredDelay) {
        continue; // Not time to retry yet
      }
      
      // Update status and attempt count
      queuedMessage.status = 'sending';
      queuedMessage.attempts++;
      queuedMessage.lastAttempt = now;
      
      try {
        console.log(`Attempting to send queued message ${queuedMessage.id} (attempt ${queuedMessage.attempts}/${MAX_RETRY_ATTEMPTS})`);
        
        // Attempt to send the message
        const result = await sendChatMessage(
          queuedMessage.message,
          queuedMessage.bookId,
          queuedMessage.username,
          queuedMessage.title,
          queuedMessage.author,
          queuedMessage.userId,
          queuedMessage.replyToId,
          queuedMessage.coverUrl
        );
        
        if (result) {
          console.log(`Queued message ${queuedMessage.id} sent successfully`);
          queuedMessage.status = 'success';
          
          // If this wasn't the first attempt, show a success notification
          if (queuedMessage.attempts > 1) {
            toast.success('Message sent', {
              description: 'Your message has been delivered'
            });
          }
          
          // Remove from queue after successful send
          messageQueue.splice(i, 1);
          i--; // Adjust index after removal
        } else {
          console.error(`Failed to send queued message ${queuedMessage.id}`);
          queuedMessage.status = 'failed';
        }
      } catch (error) {
        console.error(`Error sending queued message ${queuedMessage.id}:`, error);
        
        // If it's a network error, mark as pending for retry
        if (isNetworkError(error)) {
          queuedMessage.status = 'pending';
          console.log(`Will retry message ${queuedMessage.id} later (network error)`);
        } else {
          // For other errors, mark as failed
          queuedMessage.status = 'failed';
          
          // If we've reached max attempts, show a failure notification
          if (queuedMessage.attempts >= MAX_RETRY_ATTEMPTS) {
            toast.error('Message could not be sent', {
              description: 'Please try again later'
            });
            
            // Remove from queue after max attempts
            messageQueue.splice(i, 1);
            i--; // Adjust index after removal
          }
        }
      }
    }
    
    // Clean up successful and max-attempt-failed messages
    for (let i = messageQueue.length - 1; i >= 0; i--) {
      const msg = messageQueue[i];
      if (msg.status === 'success' || 
          (msg.status === 'failed' && msg.attempts >= MAX_RETRY_ATTEMPTS)) {
        messageQueue.splice(i, 1);
      }
    }
  } finally {
    isProcessing = false;
    
    // If there are still pending messages, schedule another processing
    if (messageQueue.some(msg => msg.status === 'pending')) {
      setTimeout(processQueue, 5000);
    }
  }
}

/**
 * Get all queued messages
 */
export function getQueuedMessages(): QueuedMessage[] {
  return [...messageQueue];
}

/**
 * Get the number of pending messages
 */
export function getPendingMessageCount(): number {
  return messageQueue.filter(msg => msg.status === 'pending' || msg.status === 'sending').length;
}

/**
 * Force retry of all failed messages
 */
export function retryFailedMessages(): number {
  let count = 0;
  
  messageQueue.forEach(msg => {
    if (msg.status === 'failed' && msg.attempts < MAX_RETRY_ATTEMPTS) {
      msg.status = 'pending';
      count++;
    }
  });
  
  if (count > 0) {
    processQueue();
  }
  
  return count;
}

// Set up a periodic check for pending messages
setInterval(processQueue, 30000);

// Set up a listener for online status to retry messages when connection is restored
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    console.log('Connection restored, retrying pending messages');
    processQueue();
  });
}
