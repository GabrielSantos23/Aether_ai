"use client";

import {
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarFooter,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Button, buttonVariants } from "@/components/ui/button";
import { useNavigate, useParams } from "react-router-dom";
import {
  X,
  Trash2,
  Loader2,
  LogIn,
  GitBranch,
  PencilIcon,
  Share2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ComponentProps, memo, useEffect, useState, useCallback } from "react";
import { siteConfig } from "@/app/config/site.config";
import { ChatItemContextMenu } from "./ChatItemContextMenu";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Link } from "react-router-dom";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Spinner } from "@/components/ui/spinner";

export default function ChatSidebar(props: ComponentProps<typeof Sidebar>) {
  const { id } = useParams();
  const navigate = useNavigate();
  const user = useQuery(api.myFunctions.getUser);

  const [threads, setThreads] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [chatToDelete, setChatToDelete] = useState<string | null>(null);
  const [renameDialogOpen, setRenameDialogOpen] = useState(false);
  const [chatToRename, setChatToRename] = useState<{
    id: string;
    title: string;
  } | null>(null);
  const [newTitle, setNewTitle] = useState("");
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [shareUrl, setShareUrl] = useState("");

  // Convex mutations
  const deleteChat = useMutation(api.chat.mutations.deleteChat);
  const renameChat = useMutation(api.chat.mutations.renameChat);
  const shareChat = useMutation(api.chat.mutations.shareChat);

  // Fetch chats from Convex
  const chats = useQuery(api.chat.queries.listChats, {});

  useEffect(() => {
    if (chats) {
      setThreads(
        chats.map((chat) => ({
          id: chat._id,
          title: chat.title,
          isShared: chat.isShared || false,
        }))
      );
      setIsLoading(false);
    }
  }, [chats]);

  const handleDeleteChat = async (chatId: string) => {
    setChatToDelete(chatId);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!chatToDelete) return;

    try {
      await deleteChat({ chatId: chatToDelete as Id<"chats"> });

      // If we're on this thread, navigate away
      if (id === chatToDelete) {
        navigate("/chat");
      }

      toast.success("Chat deleted successfully");
    } catch (error) {
      console.error("Error deleting chat:", error);
      toast.error("Failed to delete chat");
    } finally {
      setDeleteDialogOpen(false);
      setChatToDelete(null);
    }
  };

  const handleRenameChat = (chatId: string, currentTitle: string) => {
    setChatToRename({ id: chatId, title: currentTitle });
    setNewTitle(currentTitle);
    setRenameDialogOpen(true);
  };

  const handleConfirmRename = async () => {
    if (!chatToRename || !newTitle.trim()) return;

    try {
      await renameChat({
        chatId: chatToRename.id as Id<"chats">,
        title: newTitle.trim(),
      });
      toast.success("Chat renamed successfully");
    } catch (error) {
      console.error("Error renaming chat:", error);
      toast.error("Failed to rename chat");
    } finally {
      setRenameDialogOpen(false);
      setChatToRename(null);
      setNewTitle("");
    }
  };

  const handleShareChat = async (chatId: string) => {
    if (!user) {
      toast.error("Please sign in to share chats");
      return;
    }

    try {
      const shareId = await shareChat({ chatId: chatId as Id<"chats"> });
      const url = `${window.location.origin}/shared/${shareId}`;
      setShareUrl(url);
      setShareDialogOpen(true);
    } catch (error) {
      console.error("Error sharing chat:", error);
      toast.error("Failed to share chat");
    }
  };

  const handleCopyShareLink = () => {
    navigator.clipboard.writeText(shareUrl);
    toast.success("Share link copied to clipboard!");
  };

  const handleDeleteAllChats = async () => {
    try {
      // For each chat, delete it
      for (const thread of threads) {
        await deleteChat({ chatId: thread.id as Id<"chats"> });
      }
      navigate("/chat");
      toast.success("All chats deleted successfully");
    } catch (error) {
      console.error("Error deleting all threads:", error);
      toast.error("Failed to delete all chats");
    }
  };

  return (
    <>
      <Sidebar variant={"inset"} {...props}>
        <div className="flex flex-col h-full p-2">
          <Header
            isLoading={isLoading}
            onDeleteAll={() => setDeleteDialogOpen(true)}
          />
          <SidebarContent className="no-scrollbar">
            <SidebarGroup>
              <SidebarGroupContent>
                <SidebarMenu>
                  {isLoading ? (
                    <div className="flex justify-center items-center py-4">
                      <Spinner />
                    </div>
                  ) : threads.length > 0 ? (
                    threads.map((thread) => (
                      <SidebarMenuItem key={thread.id}>
                        <ChatItemContextMenu
                          chatId={thread.id}
                          chatTitle={thread.title}
                          isSignedIn={!!user}
                          onRename={handleRenameChat}
                          onDelete={handleDeleteChat}
                          onShare={handleShareChat}
                        >
                          <div
                            className={cn(
                              "cursor-pointer h-9 flex items-center px-2 py-1 rounded-[8px] overflow-hidden w-full hover:bg-secondary",
                              id === thread.id && "bg-secondary"
                            )}
                            onClick={() => {
                              if (id === thread.id) {
                                return;
                              }
                              navigate(`/chat/${thread.id}`);
                            }}
                          >
                            <span className="flex items-center overflow-hidden max-w-[90%]">
                              <span
                                className="block whitespace-nowrap overflow-hidden text-ellipsis"
                                style={{ maxWidth: "100%" }}
                                title={thread.title}
                              >
                                {thread.title}
                              </span>
                              {thread.isShared && (
                                <span className="ml-1 text-xs text-blue-500 dark:text-blue-400 inline-flex items-center">
                                  <Share2 className="w-4 h-4" />
                                </span>
                              )}
                            </span>
                          </div>
                        </ChatItemContextMenu>
                      </SidebarMenuItem>
                    ))
                  ) : (
                    <div className="text-center py-4 text-muted-foreground">
                      No chats yet
                    </div>
                  )}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>
          <Footer />
        </div>
      </Sidebar>

      {/* Delete Chat Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {chatToDelete ? "Delete Chat" : "Delete All Chats"}
            </DialogTitle>
            <DialogDescription>
              {chatToDelete
                ? "Are you sure you want to delete this chat? This action cannot be undone."
                : "Are you sure you want to delete all chats? This action cannot be undone."}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={
                chatToDelete ? handleConfirmDelete : handleDeleteAllChats
              }
            >
              {chatToDelete ? "Delete" : "Delete All"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Rename Chat Dialog */}
      <Dialog open={renameDialogOpen} onOpenChange={setRenameDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rename Chat</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Input
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="Enter new title"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleConfirmRename();
                }
              }}
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setRenameDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleConfirmRename}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Share Chat Dialog */}
      <Dialog open={shareDialogOpen} onOpenChange={setShareDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Share Chat</DialogTitle>
            <DialogDescription>
              Anyone with this link can view this conversation.
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-center space-x-2 py-4">
            <Input value={shareUrl} readOnly />
            <Button onClick={handleCopyShareLink} size="sm">
              Copy
            </Button>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShareDialogOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

interface HeaderProps {
  isLoading: boolean;
  onDeleteAll: () => void;
}

function PureHeader({ isLoading, onDeleteAll }: HeaderProps) {
  const navigate = useNavigate();

  return (
    <SidebarHeader className="flex justify-between items-center gap-2 relative">
      <h1 className="text-2xl font-bold">{siteConfig.name || "Aether AI"}</h1>
      <div className="flex gap-2 w-full">
        <Link
          to="/chat"
          className={buttonVariants({
            variant: "default",
            className: "flex-1",
          })}
        >
          New Chat
        </Link>

        <Button
          variant="outline"
          size="icon"
          title="Delete all chats"
          onClick={onDeleteAll}
        >
          <Trash2 size={16} />
        </Button>
      </div>
    </SidebarHeader>
  );
}

const Header = memo(PureHeader);

const PureFooter = () => {
  const user = useQuery(api.myFunctions.getUser);
  return (
    <SidebarFooter>
      {user ? (
        <Link
          to="/settings"
          className="flex items-center gap-2 w-full hover:bg-accent/50 transition-colors duration-200 rounded-md p-2 cursor-pointer"
        >
          <Avatar className="w-8 h-8">
            <AvatarImage src={user?.image || ""} alt={user?.name || ""} />
            <AvatarFallback>{user?.name?.charAt(0)}</AvatarFallback>
          </Avatar>
          <div className="text-sm flex-col flex text-muted-foreground">
            <span className="font-bold">{user?.name}</span>
            <span className="text-xs">{user?.email}</span>
          </div>
        </Link>
      ) : (
        <div className="flex gap-2 w-full justify-start">
          <Link
            to="/auth"
            className={buttonVariants({
              variant: "outline",
              size: "sm",
              className: "w-full text-left",
            })}
          >
            <LogIn size={16} className="mr-2" />
            Login
          </Link>
        </div>
      )}
    </SidebarFooter>
  );
};

const Footer = memo(PureFooter);
