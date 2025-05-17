import { EventsHeaderProps } from "./types";

/**
 * Header component for the events section
 */
const EventsHeader = ({ title, description }: EventsHeaderProps) => {
  return (
    <>
      <div className="flex items-center justify-center gap-2 mb-6">
        <div className="h-0.5 w-10 bg-bookconnect-terracotta"></div>
        <h2 className="text-3xl md:text-4xl font-serif font-bold text-bookconnect-brown text-center">
          {title}
        </h2>
        <div className="h-0.5 w-10 bg-bookconnect-terracotta"></div>
      </div>

      <p className="text-center text-bookconnect-brown/80 mb-12 max-w-2xl mx-auto">
        {description}
      </p>
    </>
  );
};

export default EventsHeader;
