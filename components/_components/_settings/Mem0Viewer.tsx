import React, { useEffect, useState } from "react";
import { useAction } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Brain, Edit2, Trash2 } from "lucide-react";

interface MemoryEntry {
  memory_id: string;
  memory: string;
  metadata?: any;
  created_at?: string;
}

const Mem0Viewer: React.FC = () => {
  const listMemories = useAction(api.users.listMem0Memories);
  const updateMemory = useAction(api.users.updateMem0Memory);
  const deleteMemory = useAction(api.users.deleteMem0Memory);

  const [memories, setMemories] = useState<MemoryEntry[]>([]);
  const [page, setPage] = useState(1);
  const pageSize = 50;

  const [editTarget, setEditTarget] = useState<MemoryEntry | null>(null);
  const [editText, setEditText] = useState("");

  const load = async () => {
    try {
      const res: any = await listMemories({ page, pageSize });
      setMemories(res?.results ?? []);
    } catch (err: any) {
      toast.error(err.message ?? "Failed to load memories");
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  const onSave = async () => {
    if (!editTarget) return;
    try {
      await updateMemory({ memoryId: editTarget.memory_id, text: editText });
      toast.success("Memory updated");
      setEditTarget(null);
      load();
    } catch (err: any) {
      toast.error(err.message ?? "Update failed");
    }
  };

  const onDelete = async (memoryId: string) => {
    if (!confirm("Delete this memory?")) return;
    try {
      await deleteMemory({ memoryId });
      toast.success("Deleted");
      load();
    } catch (err: any) {
      toast.error(err.message ?? "Delete failed");
    }
  };

  return (
    <div className="space-y-4">
      {memories.length === 0 ? (
        <Card className="p-6 text-center bg-muted/20 backdrop-blur-sm">
          <Brain className="w-12 h-12 mx-auto text-purple-500/50 mb-3" />
          <p className="text-muted-foreground">No memories found.</p>
          <p className="text-sm text-muted-foreground/80 mt-1">
            Memories will be created automatically as you chat with the AI.
          </p>
        </Card>
      ) : (
        <div className="space-y-3">
          <ul className="space-y-3 max-h-[500px] overflow-auto pr-2 scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent">
            {memories.map((m) => (
              <li key={m.memory_id}>
                <Card className="p-3 bg-card/50 backdrop-blur-sm hover:bg-card/70 transition-colors">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm whitespace-pre-wrap break-words">
                        {m.memory || JSON.stringify(m)}
                      </p>
                      {m.created_at && (
                        <p className="text-xs text-muted-foreground mt-1">
                          {new Date(m.created_at).toLocaleString()}
                        </p>
                      )}
                    </div>
                    <div className="flex gap-2 flex-shrink-0">
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => {
                          setEditTarget(m);
                          setEditText(m.memory);
                        }}
                      >
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="text-destructive hover:text-destructive"
                        onClick={() => onDelete(m.memory_id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </Card>
              </li>
            ))}
          </ul>
          {memories.length === pageSize && (
            <Button
              variant="outline"
              className="w-full"
              onClick={() => setPage((p) => p + 1)}
            >
              Load more
            </Button>
          )}
        </div>
      )}

      <Dialog
        open={!!editTarget}
        onOpenChange={(o) => !o && setEditTarget(null)}
      >
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Memory</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <Input
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
              placeholder="Enter memory text..."
              className="min-h-[100px]"
            />
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setEditTarget(null)}>
                Cancel
              </Button>
              <Button onClick={onSave}>Save Changes</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Mem0Viewer;
