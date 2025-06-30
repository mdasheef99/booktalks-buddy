import React from "react";
import { Link } from "react-router-dom";

/**
 * Logo component for the landing page header
 * Maintains consistency with existing BookConnect branding
 */
const LandingLogo: React.FC = () => {
  return (
    <Link to="/" className="flex items-center gap-2 group">
      <span className="font-serif text-2xl font-bold text-bookconnect-brown transition-colors duration-200 group-hover:text-bookconnect-terracotta">
        BookConnect
      </span>
    </Link>
  );
};

export default LandingLogo;
