import React from "react";
import { Link } from "react-router-dom";

const BookConnectHeader: React.FC = () => {

  return (
    <div className="bg-bookconnect-cream border-b border-bookconnect-brown/20 shadow-sm">
      <div className="container mx-auto py-3 px-4 flex justify-between items-center">
        <Link to="/" className="flex items-center gap-2">
          <span className="font-serif text-2xl font-bold text-bookconnect-brown">BookConnect</span>
        </Link>

        {/* No profile icon - users should use the sidebar navigation to access their profile */}
      </div>
    </div>
  );
};

export default BookConnectHeader;
