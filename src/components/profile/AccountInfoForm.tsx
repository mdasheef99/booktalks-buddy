
import React from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface AccountInfoFormProps {
  email: string;
  username: string;
  setUsername: (username: string) => void;
  isUpdating: boolean;
  onSubmit: (e: React.FormEvent) => Promise<void>;
}

const AccountInfoForm: React.FC<AccountInfoFormProps> = ({
  email,
  username,
  setUsername,
  isUpdating,
  onSubmit
}) => {
  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="space-y-2">
        <label htmlFor="email" className="text-sm font-medium">Email</label>
        <Input
          id="email"
          type="email"
          value={email}
          disabled
          className="bg-muted/50"
        />
        <p className="text-xs text-muted-foreground">
          Email cannot be changed
        </p>
      </div>
      
      <div className="space-y-2">
        <label htmlFor="username" className="text-sm font-medium">Username</label>
        <Input
          id="username"
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />
      </div>

      <Button 
        type="submit" 
        disabled={isUpdating}
        className="bg-bookconnect-sage hover:bg-bookconnect-sage/90"
      >
        {isUpdating ? "Updating..." : "Update Profile"}
      </Button>
    </form>
  );
};

export default AccountInfoForm;
