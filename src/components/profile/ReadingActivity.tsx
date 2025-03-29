
import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Edit, Check } from "lucide-react";
import { Button } from "@/components/ui/button";

const ReadingActivity: React.FC = () => {
  const [isEditing, setIsEditing] = useState(false);
  const [showSaved, setShowSaved] = useState(false);

  const handleSave = () => {
    setIsEditing(false);
    setShowSaved(true);
    setTimeout(() => setShowSaved(false), 3000);
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Previous Chats</CardTitle>
          <CardDescription>
            Your chat history and discussions
          </CardDescription>
        </div>
        {!isEditing ? (
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => setIsEditing(true)}
            className="text-bookconnect-brown/70 hover:text-bookconnect-brown"
          >
            <Edit className="h-4 w-4" />
          </Button>
        ) : (
          <Button 
            variant="ghost" 
            size="icon"
            onClick={handleSave}
            className="text-green-600 hover:text-green-700"
          >
            <Check className="h-4 w-4" />
          </Button>
        )}
      </CardHeader>
      <CardContent>
        {showSaved && (
          <div className="text-center text-sm text-green-600 bg-green-50 rounded-md p-1 mb-4 flex items-center justify-center">
            <Check className="h-4 w-4 mr-1" /> Changes saved successfully
          </div>
        )}
        <div className="text-center py-8 text-muted-foreground">
          <p>No previous chats yet.</p>
          <p>Join discussions on book pages to see your chat history here!</p>
        </div>
      </CardContent>
    </Card>
  );
};

export default ReadingActivity;
