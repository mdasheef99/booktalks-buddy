import { ConnectionState } from '@/lib/realtime/types';
import { Participant, ParticipantCounts, RsvpStatus } from '@/components/admin/events/participants/types';

/**
 * Options for the useParticipantsRealtime hook
 */
export interface UseParticipantsRealtimeOptions {
  eventId?: string;
  userId?: string;
  onDataChange?: (participants: Participant[]) => void;
  onCountsChange?: (counts: ParticipantCounts) => void;
  initialParticipants?: Participant[];
  initialCounts?: ParticipantCounts;
  showToasts?: boolean;
}

/**
 * Return type for the useParticipantsRealtime hook
 */
export interface UseParticipantsRealtimeResult {
  participants: Participant[];
  counts: ParticipantCounts;
  connectionState: ConnectionState;
  isConnected: boolean;
  isConnecting: boolean;
  isDisconnected: boolean;
  optimisticUpdateStatus: (userId: string, newStatus: RsvpStatus) => void;
  optimisticAddParticipant: (newParticipant: Participant) => void;
  optimisticRemoveParticipant: (userId: string) => void;
}

/**
 * Options for the useParticipantsData hook
 */
export interface UseParticipantsDataOptions {
  eventId?: string;
  showToasts?: boolean;
  initialParticipants?: Participant[];
  initialCounts?: ParticipantCounts;
  onDataChange?: (participants: Participant[]) => void;
  onCountsChange?: (counts: ParticipantCounts) => void;
}

/**
 * Return type for the useParticipantsData hook
 */
export interface UseParticipantsDataResult {
  participants: Participant[];
  setParticipants: React.Dispatch<React.SetStateAction<Participant[]>>;
  counts: ParticipantCounts;
  setCounts: React.Dispatch<React.SetStateAction<ParticipantCounts>>;
  fetchInitialData: () => Promise<void>;
}

/**
 * Options for the useParticipantsSubscription hook
 */
export interface UseParticipantsSubscriptionOptions {
  eventId?: string;
  userId?: string;
  showToasts?: boolean;
  handleParticipantChange: (payload: any) => void;
  fetchInitialData: () => Promise<void>;
}

/**
 * Return type for the useParticipantsSubscription hook
 */
export interface UseParticipantsSubscriptionResult {
  connectionState: ConnectionState;
  isConnected: boolean;
  isConnecting: boolean;
  isDisconnected: boolean;
}

/**
 * Options for the useParticipantsOptimisticUpdates hook
 */
export interface UseParticipantsOptimisticUpdatesOptions {
  setParticipants: React.Dispatch<React.SetStateAction<Participant[]>>;
  setCounts: React.Dispatch<React.SetStateAction<ParticipantCounts>>;
  onCountsChange?: (counts: ParticipantCounts) => void;
}

/**
 * Return type for the useParticipantsOptimisticUpdates hook
 */
export interface UseParticipantsOptimisticUpdatesResult {
  optimisticUpdateStatus: (userId: string, newStatus: RsvpStatus) => void;
  optimisticAddParticipant: (newParticipant: Participant) => void;
  optimisticRemoveParticipant: (userId: string) => void;
  calculateCounts: (participantsList: Participant[]) => ParticipantCounts;
}
