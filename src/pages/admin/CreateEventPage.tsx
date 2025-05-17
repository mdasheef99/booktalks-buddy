import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import EventForm from '@/components/admin/events/EventForm';

/**
 * Create Event Page Component
 * Allows store owners/managers to create new events
 */
const CreateEventPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div>
      <Button
        variant="ghost"
        onClick={() => navigate('/admin/events')}
        className="mb-4 flex items-center gap-2"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Events
      </Button>

      <h1 className="text-3xl font-serif text-bookconnect-brown mb-8">Create New Event</h1>

      <EventForm />
    </div>
  );
};

export default CreateEventPage;
