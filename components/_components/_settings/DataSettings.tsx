import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Download, Trash2, UploadCloud } from "lucide-react";
import { Conversation, db } from "@/lib/dexie";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { toast } from "sonner";
import { Spinner } from "@/components/ui/spinner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Card } from "@/components/ui/card";

interface DataSettingsProps {
  unmigratedLocalChats: Conversation[];
}

export function DataSettings({ unmigratedLocalChats }: DataSettingsProps) {
  const [isExporting, setIsExporting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleExport = async () => {
    setIsExporting(true);
    try {
      // Export logic here
      toast.success("Data exported successfully");
    } catch (err: any) {
      toast.error(err.message ?? "Failed to export data");
    } finally {
      setIsExporting(false);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      // Delete logic here
      toast.success("Data deleted successfully");
    } catch (err: any) {
      toast.error(err.message ?? "Failed to delete data");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Export Data Section */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Export Data</h2>
        <Card className="p-6 bg-card/50 backdrop-blur-sm">
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Download all your conversations and data in a portable format
            </p>
            <Button
              onClick={handleExport}
              disabled={isExporting}
              className="w-full sm:w-auto"
            >
              <Download className="w-4 h-4 mr-2" />
              {isExporting ? (
                <>
                  <Spinner className="mr-2" />
                  Exporting...
                </>
              ) : (
                "Export All Conversations"
              )}
            </Button>
          </div>
        </Card>
      </div>

      {/* Danger Zone Section */}
      <div>
        <h2 className="text-xl font-semibold mb-4 text-destructive">
          Danger Zone
        </h2>
        <Card className="p-6 border-destructive/50 bg-destructive/5">
          <div className="space-y-4">
            <div>
              <h3 className="font-medium mb-2">Delete All Data</h3>
              <p className="text-sm text-muted-foreground">
                Permanently remove all your conversations and data. This action
                cannot be undone.
              </p>
            </div>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" className="w-full sm:w-auto">
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete All Data
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete
                    all your conversations and personal data from our servers.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDelete}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    {isDeleting ? (
                      <>
                        <Spinner className="mr-2" />
                        Deleting...
                      </>
                    ) : (
                      "I understand, delete all my data"
                    )}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </Card>
      </div>
    </div>
  );
}
