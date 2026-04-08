import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FolderKanban } from "lucide-react";

const TAOProjects = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <FolderKanban className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-2xl font-bold">Projects</h1>
          <p className="text-muted-foreground">Manage TAO subnet projects and investments</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Projects Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Projects management coming soon...
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default TAOProjects;
