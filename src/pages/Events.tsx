
import { useQuery } from "@tanstack/react-query";
import { getEvents } from "@/services/eventService";
import Layout from "@/components/Layout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

const Events = () => {
  const { data: events, isLoading } = useQuery({
    queryKey: ['events'],
    queryFn: getEvents
  });

  const formatEventDate = (dateString: string) => {
    const date = new Date(dateString);
    return format(date, "MMMM d, yyyy 'at' h:mm a");
  };

  const isUpcoming = (dateString: string) => {
    const eventDate = new Date(dateString);
    const today = new Date();
    return eventDate >= today;
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-4xl font-serif font-bold mb-2">Book Events</h1>
          <p className="text-muted-foreground">
            Join our upcoming book events, readings, and discussions
          </p>
        </div>
        
        {isLoading ? (
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, index) => (
              <Card key={index} className="animate-pulse">
                <CardContent className="p-6">
                  <div className="h-4 bg-muted rounded w-1/4 mb-4"></div>
                  <div className="h-6 bg-muted rounded w-2/3 mb-2"></div>
                  <div className="h-4 bg-muted rounded w-full mb-1"></div>
                  <div className="h-4 bg-muted rounded w-3/4"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : events?.length ? (
          <div className="space-y-4">
            {events.map((event) => (
              <Card key={event.id} className="overflow-hidden">
                <CardContent className="p-6">
                  <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 mb-4">
                    <h2 className="text-2xl font-serif font-medium">{event.title}</h2>
                    
                    <div className="flex items-center gap-2">
                      <Badge variant={isUpcoming(event.date) ? "default" : "outline"}>
                        {isUpcoming(event.date) ? "Upcoming" : "Past Event"}
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        {formatEventDate(event.date)}
                      </span>
                    </div>
                  </div>
                  
                  <p className="text-muted-foreground">{event.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <h3 className="text-2xl font-serif mb-2">No events found</h3>
            <p className="text-muted-foreground">
              Check back later for upcoming book events
            </p>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Events;
