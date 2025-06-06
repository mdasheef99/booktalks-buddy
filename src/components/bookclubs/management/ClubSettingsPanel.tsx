import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { toast } from 'sonner';
import { Settings, Save, Loader2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useAuth } from '@/contexts/AuthContext';
import { getClubDetails, updateBookClub } from '@/lib/api/bookclubs';
import JoinQuestionsManager from '@/components/bookclubs/questions/JoinQuestionsManager';
import ClubPhotoUpload from '../photos/ClubPhotoUpload';
import type { ClubPhotoData } from '@/lib/services/clubPhotoService';

// Define the form schema
const formSchema = z.object({
  name: z.string().min(3, 'Club name must be at least 3 characters').max(100, 'Club name must be less than 100 characters'),
  description: z.string().max(500, 'Description must be less than 500 characters').optional(),
  privacy: z.enum(['public', 'private']),
  access_tier_required: z.enum(['free', 'all_premium', 'privileged_plus']),
});

type FormValues = z.infer<typeof formSchema>;

interface ClubSettingsPanelProps {
  clubId: string;
}

/**
 * Club Settings Panel Component
 *
 * This component allows club leads to edit the basic settings of their book club.
 */
const ClubSettingsPanel: React.FC<ClubSettingsPanelProps> = ({ clubId }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [clubData, setClubData] = useState<any>(null);
  const [questionsEnabled, setQuestionsEnabled] = useState(false);
  const [currentPhoto, setCurrentPhoto] = useState<string | null>(null);

  // Initialize the form
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      description: '',
      privacy: 'public',
      access_tier_required: 'free',
    },
  });

  // Load club details
  useEffect(() => {
    async function loadClubDetails() {
      if (!clubId || !user?.id) return;

      try {
        setLoading(true);
        const clubDetails = await getClubDetails(clubId);
        setClubData(clubDetails);
        setQuestionsEnabled(clubDetails.join_questions_enabled || false);
        setCurrentPhoto(clubDetails.cover_photo_url || null);

        // Set form values
        form.reset({
          name: clubDetails.name,
          description: clubDetails.description || '',
          privacy: clubDetails.privacy || 'public',
          access_tier_required: clubDetails.access_tier_required || 'free',
        });
      } catch (error) {
        console.error('Error loading club details:', error);
        toast.error('Failed to load club details');
      } finally {
        setLoading(false);
      }
    }

    loadClubDetails();
  }, [clubId, user?.id, form]);

  // Handle questions toggle
  const handleToggleQuestions = (enabled: boolean) => {
    setQuestionsEnabled(enabled);
  };

  // Handle questions change
  const handleQuestionsChange = () => {
    // Refresh club data if needed
    console.log('Questions changed for club:', clubId);
  };

  // Handle form submission
  const onSubmit = async (values: FormValues) => {
    if (!clubId || !user?.id) return;

    try {
      setSubmitting(true);

      await updateBookClub(user.id, clubId, {
        name: values.name,
        description: values.description,
        privacy: values.privacy,
        access_tier_required: values.access_tier_required,
      });

      toast.success('Club settings updated successfully');
    } catch (error) {
      console.error('Error updating club settings:', error);
      toast.error('Failed to update club settings');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Club Settings
          </CardTitle>
          <CardDescription>
            Manage your book club's basic information and settings.
          </CardDescription>
        </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Club Name</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormDescription>
                    The name of your book club.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder="Describe your book club..."
                      className="resize-none h-24"
                    />
                  </FormControl>
                  <FormDescription>
                    A brief description of your book club.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Club Photo Management */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Club Photo</h3>
              <ClubPhotoUpload
                clubId={clubId}
                mode="management"
                currentPhotoUrl={currentPhoto}
                onUploadComplete={(result: ClubPhotoData) => {
                  setCurrentPhoto(result.coverPhotoUrl);
                  toast.success('Club photo updated successfully');
                }}
                onUploadError={(error: string) => {
                  toast.error(`Photo upload failed: ${error}`);
                }}
                disabled={submitting}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="privacy"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Privacy</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select privacy setting" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="public">Public (Anyone can join)</SelectItem>
                        <SelectItem value="private">Private (Approval required)</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Control who can join your club.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="access_tier_required"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Required Membership Tier</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select required tier" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="free">Free (All members)</SelectItem>
                        <SelectItem value="all_premium">Premium (Privileged & Privileged+)</SelectItem>
                        <SelectItem value="privileged_plus">Exclusive (Privileged+ only)</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Set the minimum membership tier required to join.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <Button type="submit" disabled={submitting} className="w-full sm:w-auto">
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Save Settings
                </>
              )}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>

    {/* Join Request Questions Management - Only for Private Clubs */}
    {clubData && clubData.privacy === 'private' && (
      <JoinQuestionsManager
        clubId={clubId}
        questionsEnabled={questionsEnabled}
        onToggleQuestions={handleToggleQuestions}
        onQuestionsChange={handleQuestionsChange}
      />
    )}
    </div>
  );
};

export default ClubSettingsPanel;
