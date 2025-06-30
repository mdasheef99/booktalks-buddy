import React from "react";
import { cn } from "@/lib/utils";
import { NavigationItemProps } from "./types";

/**
 * Individual navigation item component
 * Handles both desktop and mobile navigation styling
 */
const NavigationItem: React.FC<NavigationItemProps> = ({
  label,
  onClick,
  icon,
  isActive = false,
  className
}) => {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center gap-2 px-3 py-2 rounded-md font-medium text-base transition-colors duration-200",
        "text-bookconnect-brown/80 hover:text-bookconnect-terracotta",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-bookconnect-terracotta focus-visible:ring-offset-2",
        isActive && "text-bookconnect-terracotta bg-bookconnect-terracotta/10",
        className
      )}
      aria-label={`Navigate to ${label}`}
    >
      {icon && <span className="w-5 h-5">{icon}</span>}
      <span>{label}</span>
    </button>
  );
};

export default NavigationItem;
