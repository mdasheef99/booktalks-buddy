import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { UserRound } from "lucide-react";
import UserName from '@/components/common/UserName';

interface UserInfoTooltipProps {
  username: string;
  userId?: string; // Optional for backward compatibility with anonymous chat
  open: boolean;
  onClose: () => void;
}

const UserInfoTooltip: React.FC<UserInfoTooltipProps> = ({
  username,
  userId,
  open,
  onClose,
}) => {
  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="max-w-sm bg-bookconnect-cream border-bookconnect-brown/20">
        <DialogHeader>
          <DialogTitle className="font-serif text-xl text-bookconnect-brown flex items-center gap-2">
            <UserRound className="h-5 w-5" />
            {userId ? (
              <UserName
                userId={userId}
                displayFormat="full"
                showTierBadge={true}
                className="font-serif text-xl"
              />
            ) : (
              <span>{username}</span>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="py-2 text-sm text-bookconnect-brown/80 font-serif">
          <p className="italic">
            {userId
              ? "User profile information available."
              : "This is an anonymous chat user. No additional profile information is available."
            }
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default UserInfoTooltip;
