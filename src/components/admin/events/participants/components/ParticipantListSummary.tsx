import React from 'react';
import { ParticipantListSummaryProps } from '../types';

/**
 * Summary component for the participant list
 */
const ParticipantListSummary: React.FC<ParticipantListSummaryProps> = ({
  counts,
  event
}) => {
  return (
    <div className="w-full flex flex-col sm:flex-row justify-between gap-4">
      <div className="flex flex-wrap gap-4">
        <div className="bg-gray-50 p-3 rounded-md">
          <div className="text-sm text-gray-500">Total Participants</div>
          <div className="text-2xl font-semibold">{counts.total}</div>
        </div>
        <div className="bg-green-50 p-3 rounded-md">
          <div className="text-sm text-green-700">Going</div>
          <div className="text-2xl font-semibold text-green-800">{counts.going}</div>
        </div>
        <div className="bg-yellow-50 p-3 rounded-md">
          <div className="text-sm text-yellow-700">Maybe</div>
          <div className="text-2xl font-semibold text-yellow-800">{counts.maybe}</div>
        </div>
        <div className="bg-red-50 p-3 rounded-md">
          <div className="text-sm text-red-700">Not Going</div>
          <div className="text-2xl font-semibold text-red-800">{counts.not_going}</div>
        </div>
      </div>
      
      {event && event.max_participants > 0 && (
        <div className="bg-blue-50 p-3 rounded-md">
          <div className="text-sm text-blue-700">Capacity</div>
          <div className="text-2xl font-semibold text-blue-800">
            {counts.going}/{event.max_participants}
            <span className="text-sm ml-1 font-normal">
              ({Math.round((counts.going / event.max_participants) * 100)}%)
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default ParticipantListSummary;
