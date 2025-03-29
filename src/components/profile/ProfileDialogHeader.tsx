
import React from "react";
import { DialogHeader, DialogTitle } from "@/components/ui/dialog";

const ProfileDialogHeader: React.FC = () => {
  return (
    <DialogHeader className="relative">
      <div className="pt-2">
        <DialogTitle className="text-2xl text-center font-serif text-bookconnect-brown">
          Profile
        </DialogTitle>
        <div className="mx-auto w-3/4 h-px bg-bookconnect-brown/50 my-2" />
      </div>
    </DialogHeader>
  );
};

export default ProfileDialogHeader;
