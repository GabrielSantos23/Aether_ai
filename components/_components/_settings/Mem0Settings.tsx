import React, { useState } from "react";
import { useQuery, useMutation, useAction } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Cpu, Trash2, AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
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
import { Separator } from "@/components/ui/separator";
import { Card } from "@/components/ui/card";
import Mem0Viewer from "./Mem0Viewer";

const Mem0Settings: React.FC = () => {
  const settings = useQuery(api.users.getMySettings);
  const updateSettings = useMutation(api.users.updateUserSettings);
  const clearMem0 = useAction(api.users.clearMem0);
  const [loadingClear, setLoadingClear] = useState(false);

  const enabled = settings?.mem0Enabled ?? true;

  const toggle = async (checked: boolean) => {
    try {
      await updateSettings({ mem0Enabled: checked });
      toast.success(checked ? "Mem0 Memory enabled" : "Mem0 Memory disabled");
    } catch (err: any) {
      toast.error(err.message ?? "Failed to update settings");
    }
  };

  const handleClear = async () => {
    setLoadingClear(true);
    try {
      await clearMem0({});
      toast.success("All Mem0 memories deleted");
    } catch (err: any) {
      toast.error(err.message ?? "Failed to clear memories");
    } finally {
      setLoadingClear(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div className="flex items-center gap-3">
        <Cpu className="w-8 h-8 text-purple-500" />
        <div>
          <h2 className="text-2xl font-semibold">Mem0 Memory</h2>
          <p className="text-sm text-muted-foreground">
            Manage your AI's persistent memory and knowledge base
          </p>
        </div>
      </div>

      <Separator />

      {/* Main Settings Card */}
      <Card className="p-6 bg-card/50 backdrop-blur-sm">
        <div className="space-y-6">
          {/* Enable/Disable Switch */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <label className="text-sm font-medium">Enable Mem0 Memory</label>
              <p className="text-sm text-muted-foreground">
                Allow the AI to maintain persistent memory across conversations
              </p>
            </div>
            <Switch
              checked={enabled}
              onCheckedChange={toggle}
              className="data-[state=checked]:bg-purple-500"
            />
          </div>

          {/* Information Alert */}
          <Alert className="bg-purple-500/5 border-purple-500/20">
            <AlertCircle className="h-4 w-4 text-purple-500" />
            <AlertTitle className="text-purple-500">How it works</AlertTitle>
            <AlertDescription className="text-purple-500/90">
              Mem0 allows the AI to remember important information about you and
              your preferences across conversations. This helps provide more
              personalized and contextual responses.
            </AlertDescription>
          </Alert>

          {/* Clear Memories Dialog */}
          <div className="pt-2">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="destructive"
                  className="w-full sm:w-auto"
                  disabled={loadingClear || !enabled}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  {loadingClear ? "Clearing…" : "Clear all memories"}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone. All stored memories will be
                    permanently deleted.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleClear}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    Delete All
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </Card>

      {/* Memory Viewer Section */}
      <div className="pt-4">
        <h3 className="text-lg font-semibold mb-4">Stored Memories</h3>
        <Mem0Viewer />
      </div>
    </div>
  );
};

export default Mem0Settings;
