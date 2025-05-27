import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft, AlertCircle } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { createBookClub } from '@/lib/api';
import { useHasEntitlement } from '@/lib/entitlements/hooks';
import UpgradeAccountModal from './UpgradeAccountModal';

const CreateBookClubForm: React.FC = () => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [privacy, setPrivacy] = useState('public');
  const [loading, setLoading] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [nameError, setNameError] = useState<string | null>(null);
  const [creationStep, setCreationStep] = useState<'idle' | 'creating' | 'adding-member' | 'complete'>('idle');
  const { user } = useAuth();
  const navigate = useNavigate();
  // Check for either limited or unlimited club creation entitlements
  const { result: canCreateLimitedClubs, loading: loadingLimitedEntitlement } = useHasEntitlement('CAN_CREATE_LIMITED_CLUBS');
  const { result: canCreateUnlimitedClubs, loading: loadingUnlimitedEntitlement } = useHasEntitlement('CAN_CREATE_UNLIMITED_CLUBS');

  // User can create clubs if they have either entitlement
  const canCreateClub = canCreateLimitedClubs || canCreateUnlimitedClubs;
  const loadingEntitlement = loadingLimitedEntitlement || loadingUnlimitedEntitlement;

  // Validate club name
  const validateClubName = (name: string): string | null => {
    if (!name.trim()) return 'Club name is required';
    if (name.length < 3) return 'Club name must be at least 3 characters';
    if (name.length > 50) return 'Club name must be less than 50 characters';
    if (!/^[a-zA-Z0-9\s\-_]+$/.test(name)) return 'Club name can only contain letters, numbers, spaces, hyphens, and underscores';
    return null;
  };

  // Get button text based on current creation step
  const getButtonTextForStep = (): string => {
    switch (creationStep) {
      case 'creating':
        return 'Creating club...';
      case 'adding-member':
        return 'Setting up membership...';
      case 'complete':
        return 'Success!';
      default:
        return 'Creating...';
    }
  };

  // Render progress indicator
  const renderProgressIndicator = () => {
    if (!loading) return null;

    const steps = [
      { key: 'creating', label: 'Creating club' },
      { key: 'adding-member', label: 'Setting up membership' },
      { key: 'complete', label: 'Complete' }
    ];

    const currentStepIndex = steps.findIndex(step => step.key === creationStep);

    return (
      <div className="mb-6 mt-2">
        <div className="flex items-center justify-between">
          {steps.map((step, index) => (
            <React.Fragment key={step.key}>
              <div className="flex flex-col items-center">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    index <= currentStepIndex
                      ? 'bg-bookconnect-terracotta text-white'
                      : 'bg-gray-200 text-gray-500'
                  }`}
                >
                  {index < currentStepIndex ? '✓' : index + 1}
                </div>
                <span className={`text-xs mt-1 ${
                  index <= currentStepIndex ? 'text-bookconnect-brown' : 'text-gray-500'
                }`}>
                  {step.label}
                </span>
              </div>
              {index < steps.length - 1 && (
                <div
                  className={`flex-1 h-1 mx-2 ${
                    index < currentStepIndex ? 'bg-bookconnect-terracotta' : 'bg-gray-200'
                  }`}
                />
              )}
            </React.Fragment>
          ))}
        </div>
      </div>
    );
  };

  // Check if user has permission to create a club when component mounts
  useEffect(() => {
    // Reset creation step
    setCreationStep('idle');

    if (!loadingEntitlement && !canCreateClub && user) {
      // If user is logged in but doesn't have the required entitlement, show the upgrade modal
      setShowUpgradeModal(true);
    }
  }, [canCreateClub, loadingEntitlement, user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate club name
    const error = validateClubName(name);
    if (error) {
      setNameError(error);
      toast.error(error);
      return;
    }

    if (!user?.id) {
      toast.error('You must be logged in to create a book club');
      return;
    }

    // Check if user has the required entitlement
    if (!canCreateClub) {
      setShowUpgradeModal(true);
      return;
    }

    setLoading(true);
    setCreationStep('creating');

    try {
      // Step 1: Create the book club
      const club = await createBookClub(user.id, {
        name: name.trim(),
        description: description.trim(),
        privacy
      });

      // Step 2: Creator is automatically added as admin in the backend
      setCreationStep('adding-member');

      // Short delay to show the step progress
      await new Promise(resolve => setTimeout(resolve, 500));

      // Step 3: Complete
      setCreationStep('complete');
      toast.success('Book club created successfully');

      // Navigate to the new club page
      navigate(`/book-club/${club.id}`);
    } catch (error) {
      console.error('Error creating book club:', error);
      setCreationStep('idle');

      // Enhanced error handling with specific messages
      if (error.code === '23505') {
        toast.error('A book club with this name already exists. Please choose a different name.');
      } else if (error.code === '23502') {
        toast.error('Missing required information. Please check all required fields.');
      } else if (error.code === '42501') {
        toast.error('You don\'t have permission to create a book club.');
      } else if (error.message && typeof error.message === 'string') {
        toast.error(`Error: ${error.message}`);
      } else {
        toast.error('Failed to create book club. Please try again later.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="flex justify-between items-center mb-4">
        <Button
          variant="ghost"
          onClick={() => navigate('/profile')}
          className=""
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Profile
        </Button>
      </div>
      <h1 className="text-2xl font-bold mb-6">Create New Book Club</h1>

      {loading && renderProgressIndicator()}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="name" className="block text-sm font-medium mb-1">
            Club Name
          </label>
          <div className="relative">
            <Input
              id="name"
              value={name}
              onChange={(e) => {
                const newName = e.target.value;
                setName(newName);
                setNameError(validateClubName(newName));
              }}
              placeholder="Enter a name for your book club"
              required
              className={nameError ? "border-red-500 pr-10" : ""}
              aria-invalid={nameError ? "true" : "false"}
              aria-describedby={nameError ? "name-error" : undefined}
            />
            {nameError && (
              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                <AlertCircle className="h-5 w-5 text-red-500" />
              </div>
            )}
          </div>
          {nameError && (
            <p id="name-error" className="mt-1 text-sm text-red-500">
              {nameError}
            </p>
          )}
        </div>

        <div>
          <label htmlFor="description" className="block text-sm font-medium mb-1">
            Description
          </label>
          <Textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe what your book club is about"
            rows={4}
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">
            Privacy Setting
          </label>
          <RadioGroup value={privacy} onValueChange={setPrivacy} className="flex space-x-4">
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="public" id="public" />
              <Label htmlFor="public">Public</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="private" id="private" />
              <Label htmlFor="private">Private</Label>
            </div>
          </RadioGroup>
          <p className="text-xs text-gray-500 mt-1">
            {privacy === 'public'
              ? 'Anyone can see and join this club'
              : 'Only invited members can join this club'}
          </p>
        </div>

        <div className="flex justify-end space-x-3 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate('/book-club')}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={loading || (!canCreateClub && !loadingEntitlement)}>
            {loading ? getButtonTextForStep() : 'Create Book Club'}
          </Button>
        </div>
      </form>

      {/* Upgrade Account Modal */}
      <UpgradeAccountModal
        isOpen={showUpgradeModal}
        setIsOpen={setShowUpgradeModal}
      />
    </div>
  );
};

export default CreateBookClubForm;
