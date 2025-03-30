
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Form, 
  FormControl, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Calendar, Clock, MapPin, Users, Image, ArrowLeft, Plus, BarChart, Calendar as CalendarIcon, Users as UsersIcon, Book, MessageSquare } from "lucide-react";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { supabase } from "@/lib/supabase";
import { useNavigate as useRouter } from "react-router-dom";

// Define the form schema using Zod
const eventFormSchema = z.object({
  title: z.string().min(3, { message: "Event title must be at least 3 characters" }),
  date: z.string().min(1, { message: "Date is required" }),
  time: z.string().min(1, { message: "Time is required" }),
  location: z.string().min(3, { message: "Location must be at least 3 characters" }),
  guests: z.string().min(1, { message: "Guests information is required" }),
  description: z.string().min(10, { message: "Description must be at least 10 characters" }),
  imageUrl: z.string().url({ message: "Please enter a valid image URL" }).or(z.string().length(0))
});

type EventFormValues = z.infer<typeof eventFormSchema>;

const AdminDashboard = () => {
  const navigate = useNavigate();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [showEventForm, setShowEventForm] = useState(false);
  
  // Set up form with default values
  const form = useForm<EventFormValues>({
    resolver: zodResolver(eventFormSchema),
    defaultValues: {
      title: "",
      date: "",
      time: "",
      location: "",
      guests: "",
      description: "",
      imageUrl: ""
    }
  });

  const onSubmit = async (values: EventFormValues) => {
    setIsLoading(true);
    
    try {
      // Format the date and time to store in the database
      const formattedDate = `${values.date} ${values.time}`;
      
      // Insert the event into the database
      const { data, error } = await supabase
        .from('events')
        .insert([
          { 
            title: values.title,
            date: formattedDate,
            description: values.description + `\n\nLocation: ${values.location}\nGuests: ${values.guests}`,
          }
        ]);
      
      if (error) {
        throw error;
      }
      
      toast.success("Event created successfully!");
      form.reset();
      setShowEventForm(false);
      
      // Redirect to events page after successful creation
      setTimeout(() => {
        router('/events');
      }, 1500);
    } catch (error: any) {
      console.error("Error creating event:", error);
      toast.error(error.message || "Failed to create event");
    } finally {
      setIsLoading(false);
    }
  };

  const toggleEventForm = () => {
    setShowEventForm(!showEventForm);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-bookconnect-brown text-white p-4 shadow-md">
        <div className="container mx-auto flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => navigate('/')}
              className="text-white hover:bg-bookconnect-brown/80"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-2xl font-serif font-bold">Admin Dashboard</h1>
          </div>
          <div className="flex items-center gap-2">
            {!showEventForm && (
              <Button
                onClick={toggleEventForm}
                className="bg-bookconnect-terracotta hover:bg-bookconnect-terracotta/90"
              >
                <Plus className="mr-1 h-4 w-4" />
                Create Event
              </Button>
            )}
            <p className="text-sm opacity-80 hidden md:block">Manage Your BookConnect Events</p>
          </div>
        </div>
      </header>
      
      <main className="container mx-auto py-8 px-4">
        {showEventForm ? (
          <section className="mb-8">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-serif font-bold">Create New Event</h2>
              <Button 
                variant="ghost" 
                onClick={toggleEventForm}
                className="text-muted-foreground flex items-center gap-1"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Dashboard
              </Button>
            </div>
            
            <Card>
              <CardHeader>
                <CardTitle>Event Details</CardTitle>
              </CardHeader>
              <CardContent>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Event Title */}
                      <FormField
                        control={form.control}
                        name="title"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Event Title</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <Calendar className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                <Input 
                                  placeholder="Book Club Launch Party" 
                                  className="pl-10" 
                                  {...field} 
                                />
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      {/* Date */}
                      <FormField
                        control={form.control}
                        name="date"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Date</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <Calendar className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                <Input 
                                  type="date" 
                                  className="pl-10" 
                                  {...field} 
                                />
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="time"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Time</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <Clock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                <Input 
                                  type="time" 
                                  className="pl-10" 
                                  {...field} 
                                />
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="location"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Location</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                <Input 
                                  placeholder="City Library, Main Room" 
                                  className="pl-10" 
                                  {...field} 
                                />
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="guests"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Guests</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <Users className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                <Input 
                                  placeholder="Local authors, Book Club members" 
                                  className="pl-10" 
                                  {...field} 
                                />
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="imageUrl"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Background Image URL (Optional)</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <Image className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                <Input 
                                  placeholder="https://example.com/image.jpg" 
                                  className="pl-10" 
                                  {...field} 
                                />
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <FormField
                      control={form.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Event Description</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Provide details about the event..." 
                              className="min-h-[120px]" 
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <div className="flex gap-3">
                      <Button 
                        type="submit" 
                        className="flex-1 bg-bookconnect-terracotta hover:bg-bookconnect-terracotta/90"
                        disabled={isLoading}
                      >
                        {isLoading ? "Creating..." : "Create Event"}
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={toggleEventForm}
                        className="flex-1"
                      >
                        Cancel
                      </Button>
                    </div>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </section>
        ) : (
          <section>
            {/* Enhanced Dashboard Content with Book Club Statistics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg font-medium">Total Events</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="text-3xl font-bold">12</div>
                    <BarChart className="h-8 w-8 text-bookconnect-terracotta opacity-80" />
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg font-medium">Upcoming Events</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="text-3xl font-bold">5</div>
                    <CalendarIcon className="h-8 w-8 text-bookconnect-terracotta opacity-80" />
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg font-medium">Total Participants</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="text-3xl font-bold">124</div>
                    <UsersIcon className="h-8 w-8 text-bookconnect-terracotta opacity-80" />
                  </div>
                </CardContent>
              </Card>
            </div>
            
            {/* Book Club & Chat Statistics */}
            <h2 className="text-2xl font-serif font-bold mb-4">Community Analytics</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Popular Book Discussions</CardTitle>
                  <CardDescription>Most active discussion topics</CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3">
                    <li className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <Book className="h-5 w-5 text-bookconnect-terracotta" />
                        <div>
                          <p className="font-medium">The Great Gatsby</p>
                          <p className="text-xs text-muted-foreground">Classic Literature</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 text-sm font-medium">
                        <Users className="h-4 w-4" />
                        <span>47 readers</span>
                      </div>
                    </li>
                    <li className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <Book className="h-5 w-5 text-bookconnect-terracotta" />
                        <div>
                          <p className="font-medium">To Kill a Mockingbird</p>
                          <p className="text-xs text-muted-foreground">Fiction</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 text-sm font-medium">
                        <Users className="h-4 w-4" />
                        <span>38 readers</span>
                      </div>
                    </li>
                    <li className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <Book className="h-5 w-5 text-bookconnect-terracotta" />
                        <div>
                          <p className="font-medium">1984</p>
                          <p className="text-xs text-muted-foreground">Dystopian</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 text-sm font-medium">
                        <Users className="h-4 w-4" />
                        <span>29 readers</span>
                      </div>
                    </li>
                  </ul>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Active Book Clubs</CardTitle>
                  <CardDescription>Member engagement by group</CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3">
                    <li className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <MessageSquare className="h-5 w-5 text-bookconnect-terracotta" />
                        <div>
                          <p className="font-medium">Mystery Readers Club</p>
                          <p className="text-xs text-muted-foreground">Weekly meetings</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 text-sm font-medium">
                        <Users className="h-4 w-4" />
                        <span>32 members</span>
                      </div>
                    </li>
                    <li className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <MessageSquare className="h-5 w-5 text-bookconnect-terracotta" />
                        <div>
                          <p className="font-medium">Fantasy Book Club</p>
                          <p className="text-xs text-muted-foreground">Bi-weekly meetings</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 text-sm font-medium">
                        <Users className="h-4 w-4" />
                        <span>28 members</span>
                      </div>
                    </li>
                    <li className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <MessageSquare className="h-5 w-5 text-bookconnect-terracotta" />
                        <div>
                          <p className="font-medium">Non-Fiction Explorers</p>
                          <p className="text-xs text-muted-foreground">Monthly meetings</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 text-sm font-medium">
                        <Users className="h-4 w-4" />
                        <span>19 members</span>
                      </div>
                    </li>
                  </ul>
                </CardContent>
              </Card>
            </div>
            
            {/* Create Event Button for Dashboard View */}
            <div className="text-center p-8 bg-bookconnect-cream rounded-lg">
              <h2 className="text-2xl font-serif font-bold mb-4">Event Management</h2>
              <p className="text-muted-foreground mb-6">
                Use the "Create Event" button to add new events to your BookConnect calendar.
              </p>
              <Button
                onClick={toggleEventForm}
                className="bg-bookconnect-terracotta hover:bg-bookconnect-terracotta/90"
              >
                <Plus className="mr-1 h-4 w-4" />
                Create Event
              </Button>
            </div>
          </section>
        )}
      </main>
    </div>
  );
};

export default AdminDashboard;
