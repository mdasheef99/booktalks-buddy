
import React from "react";

interface ExploreContainerProps {
  children: React.ReactNode;
}

const ExploreContainer: React.FC<ExploreContainerProps> = ({ children }) => {
  return (
    <div 
      className="relative py-12 px-6 md:px-8 lg:px-12 max-w-7xl mx-auto"
      style={{
        backgroundImage: "url('https://images.unsplash.com/photo-1524578271613-d550eacf6090?q=80&w=1470&auto=format&fit=crop')",
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundAttachment: "fixed",
        backgroundBlendMode: "overlay",
        backgroundColor: "rgba(248, 243, 230, 0.92)",
      }}
    >
      {children}
    </div>
  );
};

export default ExploreContainer;
