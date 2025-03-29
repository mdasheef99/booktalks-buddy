
import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const ReadingActivity: React.FC = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Reading Activity</CardTitle>
        <CardDescription>
          Track your reading progress and discussions
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="text-center py-8 text-muted-foreground">
          <p>No reading activity yet.</p>
          <p>Join discussions on book pages to see your activity here!</p>
        </div>
      </CardContent>
    </Card>
  );
};

export default ReadingActivity;
