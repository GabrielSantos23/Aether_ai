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
import { useAuthContext } from "@/app/hooks";
import { LoadingSpinner } from "@/components/ui/spinner";

export default function ChatSidebar(props: ComponentProps<typeof Sidebar>) {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuthContext();

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
    if (!isAuthenticated) {
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
                      <LoadingSpinner size={16} />
                    </div>
                  ) : threads.length > 0 ? (
                    threads.map((thread) => (
                      <SidebarMenuItem key={thread.id}>
                        <ChatItemContextMenu
                          chatId={thread.id}
                          chatTitle={thread.title}
                          isSignedIn={!!isAuthenticated}
                          onRename={handleRenameChat}
                          onDelete={handleDeleteChat}
                          onShare={handleShareChat}
                        >
                          <div
                            className={cn(
                              "cursor-pointer h-9 flex items-center px-2 py-1 rounded-[8px] overflow-hidden w-full hover:bg-secondary group relative",
                              id === thread.id && "bg-secondary"
                            )}
                            onClick={() => {
                              if (id === thread.id) {
                                return;
                              }
                              navigate(`/chat/${thread.id}`);
                            }}
                          >
                            {/* Purple indicator for active chat - similar to settings sidebar */}
                            {id === thread.id && (
                              <>
                                {/* Main gradient background with sharp edges */}
                                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-purple-500/8 dark:via-purple-300/8 to-transparent"></div>

                                {/* Top shadow lighting */}
                                <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-purple-500/30 dark:via-purple-300/30 to-transparent"></div>

                                {/* Bottom shadow lighting */}
                                <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-purple-500/30 dark:via-purple-300/30 to-transparent"></div>

                                {/* Inner glow */}
                                <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-4 bg-gradient-to-r from-transparent via-purple-500/5 dark:via-purple-300/5 to-transparent blur-sm"></div>
                              </>
                            )}

                            {/* Hover effect for non-active items */}
                            {id !== thread.id && (
                              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-purple-500/3 dark:via-purple-300/3 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-150"></div>
                            )}

                            <span className="flex items-center overflow-hidden max-w-[90%] relative z-10">
                              <span
                                className={cn(
                                  "block whitespace-nowrap overflow-hidden text-ellipsis",
                                  id === thread.id &&
                                    "text-purple-600 dark:text-purple-300"
                                )}
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
      <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 via-purple-500 to-purple-600 dark:from-purple-300 dark:via-purple-200 dark:to-purple-300 bg-clip-text text-transparent tracking-tight leading-none">
        {siteConfig.name || "Aether AI"}
      </h1>
      <div className="flex gap-2 w-full">
        <Link
          to="/chat"
          className={buttonVariants({
            variant: "default",
            className:
              "flex-1 bg-purple-600 hover:bg-purple-700 dark:bg-purple-700 dark:hover:bg-purple-600",
          })}
        >
          New Chat
        </Link>

        <Button
          variant="outline"
          size="icon"
          title="Delete all chats"
          onClick={onDeleteAll}
          className="hover:text-purple-600 dark:hover:text-purple-300"
        >
          <Trash2 size={16} />
        </Button>
      </div>
    </SidebarHeader>
  );
}

const Header = memo(PureHeader);

const PureFooter = () => {
  const { user } = useAuthContext();
  return (
    <SidebarFooter>
      {user ? (
        <Link
          to="/settings"
          className="flex items-center gap-2 w-full hover:bg-accent/50 transition-colors duration-200 rounded-md p-2 cursor-pointer group"
        >
          <Avatar className="w-8 h-8 ring-1 ring-purple-500/20 group-hover:ring-purple-500/40 transition-all">
            <AvatarImage src={user?.image || ""} alt={user?.name || ""} />
            <AvatarFallback className="bg-purple-500/10 text-purple-700 dark:text-purple-300">
              {user?.name?.charAt(0)}
            </AvatarFallback>
          </Avatar>
          <div className="text-sm flex-col flex text-muted-foreground">
            <span className="font-bold group-hover:text-purple-600 dark:group-hover:text-purple-300 transition-colors">
              {user?.name}
            </span>
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
              className:
                "w-full text-left hover:text-purple-600 hover:border-purple-500/30 dark:hover:text-purple-300",
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
