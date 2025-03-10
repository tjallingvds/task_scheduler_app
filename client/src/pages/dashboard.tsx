import React from "react";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";

export default function Dashboard() {
  const { user } = useAuth();
  
  return (
    <div className="grid gap-4">
      <Card>
        <CardHeader>
          <CardTitle>Welcome to SimpleTask</CardTitle>
          <CardDescription>
            Your personal task management system
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground mb-6">
            Create task lists from the sidebar and organize your tasks efficiently. Drag and drop lists onto each other to create folders.
          </p>
          
          <div className="space-y-2 mb-6">
            <h3 className="text-lg font-medium mb-3">Instructions:</h3>
            <ul className="list-disc pl-6 space-y-2">
              <li>Click "Add Task List" in the sidebar to create a new list</li>
              <li>Drag one task list onto another to create a folder</li>
              <li>Click on a folder to expand/collapse it</li>
              <li>Use the dropdown menu to rename or delete lists</li>
              <li>Click on a task list to view and manage its tasks</li>
            </ul>
          </div>
          
          <Button variant="default">
            <Plus className="h-4 w-4 mr-2" />
            Start Organizing
          </Button>
        </CardContent>
      </Card>
      
      {user && (
        <Card>
          <CardHeader>
            <CardTitle>Account Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h3 className="font-medium">User Details</h3>
                <p className="text-sm text-muted-foreground">Name: {user.name}</p>
                <p className="text-sm text-muted-foreground">Email: {user.email}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}