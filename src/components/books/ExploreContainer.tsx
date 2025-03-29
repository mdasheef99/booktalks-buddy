
import React from "react";

interface ExploreContainerProps {
  children: React.ReactNode;
}

const ExploreContainer: React.FC<ExploreContainerProps> = ({ children }) => {
  return (
    <div 
      className="relative py-12 px-6 md:px-8 lg:px-12 max-w-7xl mx-auto"
      style={{
        backgroundImage: "linear-gradient(109.6deg, rgba(223,234,247,0.9) 11.2%, rgba(244,248,252,0.9) 91.1%), url('https://images.unsplash.com/photo-1524578271613-d550eacf6090?q=80&w=1470&auto=format&fit=crop')",
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundAttachment: "fixed",
        backgroundBlendMode: "overlay",
      }}
    >
      <div className="absolute inset-0 bg-bookconnect-cream/70 backdrop-blur-sm z-0"></div>
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
};

export default ExploreContainer;
