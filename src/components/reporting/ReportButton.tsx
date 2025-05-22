import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Flag, MoreHorizontal } from 'lucide-react';
import { ReportDialog } from './ReportDialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import type { ReportTargetType } from '@/types/reporting';

interface ReportButtonProps {
  targetType: ReportTargetType;
  targetId?: string;
  targetUserId?: string;
  targetTitle?: string;
  targetContent?: string;
  clubId?: string;
  variant?: 'button' | 'dropdown-item' | 'icon-only';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  onReportSubmitted?: () => void;
}

export const ReportButton: React.FC<ReportButtonProps> = ({
  targetType,
  targetId,
  targetUserId,
  targetTitle,
  targetContent,
  clubId,
  variant = 'button',
  size = 'sm',
  className = '',
  onReportSubmitted
}) => {
  const [showReportDialog, setShowReportDialog] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const handleReportClick = () => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "You must be logged in to report content.",
        variant: "destructive",
      });
      return;
    }

    // Prevent users from reporting their own content
    if (targetUserId && targetUserId === user.id) {
      toast({
        title: "Cannot report own content",
        description: "You cannot report your own content.",
        variant: "destructive",
      });
      return;
    }

    setShowReportDialog(true);
  };

  const handleReportSubmitted = () => {
    setShowReportDialog(false);
    onReportSubmitted?.();
  };

  // Render as dropdown menu item
  if (variant === 'dropdown-item') {
    return (
      <>
        <DropdownMenuItem onClick={handleReportClick} className="text-red-600">
          <Flag className="h-4 w-4 mr-2" />
          Report
        </DropdownMenuItem>
        
        <ReportDialog
          open={showReportDialog}
          onOpenChange={setShowReportDialog}
          targetType={targetType}
          targetId={targetId}
          targetUserId={targetUserId}
          targetTitle={targetTitle}
          targetContent={targetContent}
          clubId={clubId}
          onReportSubmitted={handleReportSubmitted}
        />
      </>
    );
  }

  // Render as icon-only button
  if (variant === 'icon-only') {
    return (
      <>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleReportClick}
          className={`text-gray-500 hover:text-red-600 hover:bg-red-50 ${className}`}
          title="Report this content"
        >
          <Flag className="h-4 w-4" />
        </Button>
        
        <ReportDialog
          open={showReportDialog}
          onOpenChange={setShowReportDialog}
          targetType={targetType}
          targetId={targetId}
          targetUserId={targetUserId}
          targetTitle={targetTitle}
          targetContent={targetContent}
          clubId={clubId}
          onReportSubmitted={handleReportSubmitted}
        />
      </>
    );
  }

  // Render as regular button (default)
  return (
    <>
      <Button
        variant="outline"
        size={size}
        onClick={handleReportClick}
        className={`text-red-600 border-red-200 hover:bg-red-50 hover:border-red-300 ${className}`}
      >
        <Flag className="h-4 w-4 mr-2" />
        Report
      </Button>
      
      <ReportDialog
        open={showReportDialog}
        onOpenChange={setShowReportDialog}
        targetType={targetType}
        targetId={targetId}
        targetUserId={targetUserId}
        targetTitle={targetTitle}
        targetContent={targetContent}
        clubId={clubId}
        onReportSubmitted={handleReportSubmitted}
      />
    </>
  );
};

// Convenience component for adding report functionality to existing dropdown menus
interface ReportDropdownProps {
  targetType: ReportTargetType;
  targetId?: string;
  targetUserId?: string;
  targetTitle?: string;
  targetContent?: string;
  clubId?: string;
  children: React.ReactNode;
  onReportSubmitted?: () => void;
}

export const ReportDropdown: React.FC<ReportDropdownProps> = ({
  targetType,
  targetId,
  targetUserId,
  targetTitle,
  targetContent,
  clubId,
  children,
  onReportSubmitted
}) => {
  const [showReportDialog, setShowReportDialog] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const handleReportClick = () => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "You must be logged in to report content.",
        variant: "destructive",
      });
      return;
    }

    if (targetUserId && targetUserId === user.id) {
      toast({
        title: "Cannot report own content",
        description: "You cannot report your own content.",
        variant: "destructive",
      });
      return;
    }

    setShowReportDialog(true);
  };

  const handleReportSubmitted = () => {
    setShowReportDialog(false);
    onReportSubmitted?.();
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {children}
          <DropdownMenuItem onClick={handleReportClick} className="text-red-600">
            <Flag className="h-4 w-4 mr-2" />
            Report
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      
      <ReportDialog
        open={showReportDialog}
        onOpenChange={setShowReportDialog}
        targetType={targetType}
        targetId={targetId}
        targetUserId={targetUserId}
        targetTitle={targetTitle}
        targetContent={targetContent}
        clubId={clubId}
        onReportSubmitted={handleReportSubmitted}
      />
    </>
  );
};
