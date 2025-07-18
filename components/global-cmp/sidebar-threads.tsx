"use client";
import React, { useState } from "react";
import {
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenuItem,
  SidebarMenu,
} from "@/components/ui/sidebar";
import { LuPin, LuPinOff, LuDownload } from "react-icons/lu";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { IoMdClose } from "react-icons/io";
import dynamic from "next/dynamic";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Edit } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Spinner } from "../ui/spinner";

const BranchOffIcon = dynamic(() => import("@/public/icons/branch-off"), {
  ssr: false,
});

interface Chat {
  _id: Id<"chats">;
  title: string;
  isPinned?: boolean;
  userId: Id<"users">;
  createdAt: number;
  updatedAt: number;
  parentChatId?: Id<"chats">;
  isBranch?: boolean;
}

const SidebarThreads = () => {
  const router = useRouter();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [renameDialogOpen, setRenameDialogOpen] = useState(false);
  const [selectedChat, setSelectedChat] = useState<Chat | null>(null);
  const [newTitle, setNewTitle] = useState("");

  // Fetch chats using Convex query
  const chats = useQuery(api.chat.queries.getUserChats);

  // Pin/Unpin chat mutation
  const pinChat = useMutation(api.chat.mutations.pinChat);

  // Delete chat mutation
  const deleteChat = useMutation(api.chat.mutations.deleteChat);

  // Rename chat mutation
  const renameChat = useMutation(api.chat.mutations.renameChat);

  const handlePinChat = async (chatId: Id<"chats">) => {
    try {
      await pinChat({ chatId });
      toast.success("Chat updated successfully");
    } catch (error) {
      console.error("Error updating chat:", error);
      toast.error("Failed to update chat");
    }
  };

  const handleDeleteChat = async (chatId: Id<"chats">) => {
    try {
      await deleteChat({ chatId });
      toast.success("Chat deleted successfully");
      setDeleteDialogOpen(false);
      setSelectedChat(null);
      router.push("/chat");
    } catch (error) {
      console.error("Error deleting chat:", error);
      toast.error("Failed to delete chat");
    }
  };

  const handleRenameChat = async () => {
    if (!selectedChat || !newTitle.trim()) return;
    try {
      await renameChat({ chatId: selectedChat._id, title: newTitle.trim() });
      toast.success("Chat renamed successfully");
      setRenameDialogOpen(false);
      setSelectedChat(null);
      setNewTitle("");
    } catch (error) {
      console.error("Error renaming chat:", error);
      toast.error("Failed to rename chat");
    }
  };

  const handleExportChat = (chat: Chat) => {
    const data = {
      title: chat.title,
      chatId: chat._id,
      createdAt: chat.createdAt,
      isPinned: chat.isPinned,
    };
    const dataStr = JSON.stringify(data, null, 2);
    const dataBlob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `chat-${chat.title.replace(/[^a-z0-9]/gi, "_").toLowerCase()}.json`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success("Chat exported successfully");
  };

  const openDeleteDialog = (chat: Chat) => {
    setSelectedChat(chat);
    setDeleteDialogOpen(true);
  };

  const openRenameDialog = (chat: Chat) => {
    setSelectedChat(chat);
    setNewTitle(chat.title);
    setRenameDialogOpen(true);
  };

  if (!chats) {
    return (
      <SidebarContent>
        <div className="flex items-center justify-center p-4">
          <Spinner size="sm" />
        </div>
      </SidebarContent>
    );
  }

  // Helper function to get date boundaries
  const getDateBoundaries = () => {
    const now = new Date();

    // Today (start of today)
    const todayStart = new Date(now);
    todayStart.setHours(0, 0, 0, 0);

    // Yesterday (start of yesterday)
    const yesterdayStart = new Date(todayStart);
    yesterdayStart.setDate(todayStart.getDate() - 1);

    // Last 7 days (start of 7 days ago)
    const last7DaysStart = new Date(todayStart);
    last7DaysStart.setDate(todayStart.getDate() - 7);

    // Last month (start of 30 days ago)
    const lastMonthStart = new Date(todayStart);
    lastMonthStart.setDate(todayStart.getDate() - 30);

    return {
      todayStart: todayStart.getTime(),
      yesterdayStart: yesterdayStart.getTime(),
      last7DaysStart: last7DaysStart.getTime(),
      lastMonthStart: lastMonthStart.getTime(),
    };
  };

  // Group chats by pinned status and date
  const pinnedChats = chats.filter((chat) => chat.isPinned);
  const unpinnedChats = chats.filter((chat) => !chat.isPinned);

  const { todayStart, yesterdayStart, last7DaysStart, lastMonthStart } =
    getDateBoundaries();

  // Filter chats by date ranges
  const todayChats = unpinnedChats.filter(
    (chat) => chat.updatedAt >= todayStart
  );

  const yesterdayChats = unpinnedChats.filter(
    (chat) => chat.updatedAt >= yesterdayStart && chat.updatedAt < todayStart
  );

  const last7DaysChats = unpinnedChats.filter(
    (chat) =>
      chat.updatedAt >= last7DaysStart && chat.updatedAt < yesterdayStart
  );

  const lastMonthChats = unpinnedChats.filter(
    (chat) =>
      chat.updatedAt >= lastMonthStart && chat.updatedAt < last7DaysStart
  );

  const olderChats = unpinnedChats.filter(
    (chat) => chat.updatedAt < lastMonthStart
  );

  // Render chat item component
  const ChatItem = ({
    chat,
    showBranchIcon = false,
  }: {
    chat: Chat;
    showBranchIcon?: boolean;
  }) => {
    const isPending = false; // You can add loading states if needed

    return (
      <ContextMenu>
        <ContextMenuTrigger asChild>
          <SidebarMenuItem className="hover:bg-sidebar-accent overflow-hidden flex items-center relative px-0 group/link-item rounded-lg">
            <Link
              className={`p-2 text-nowrap text-sm overflow-hidden w-[95%] truncate px-3 ${showBranchIcon ? "truncate flex items-center gap-2" : "block"}`}
              href={`/chat/${chat._id}`}
            >
              {showBranchIcon && <BranchOffIcon />}
              <p
                className={`${showBranchIcon ? "flex-1 truncate" : ""} text-sm`}
              >
                {chat.title}
              </p>
            </Link>
            <div className="flex bg-sidebar-accent rounded-lg duration-300 ease-out *:size-7 backdrop-blur-sm transition-all items-center gap-1 absolute group-hover/link-item:right-1 -right-[100px]">
              <Button
                variant="ghost"
                size="icon"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handlePinChat(chat._id);
                }}
                disabled={isPending}
              >
                {isPending ? (
                  <div className="w-3 h-3 animate-spin rounded-full border-2 border-gray-300 border-t-gray-900" />
                ) : chat.isPinned ? (
                  <LuPinOff />
                ) : (
                  <LuPin />
                )}
              </Button>
              <Button
                variant="ghost"
                className="hover:!bg-destructive/50 hover:!text-destructive-foreground"
                size="icon"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  openDeleteDialog(chat);
                }}
                disabled={isPending}
              >
                {isPending ? (
                  <div className="w-3 h-3 animate-spin rounded-full border-2 border-gray-300 border-t-gray-900" />
                ) : (
                  <IoMdClose />
                )}
              </Button>
            </div>
          </SidebarMenuItem>
        </ContextMenuTrigger>
        <ContextMenuContent className="w-36">
          <ContextMenuItem
            onClick={() => handlePinChat(chat._id)}
            disabled={isPending}
          >
            {chat.isPinned ? (
              <LuPinOff className="mr-2 h-4 w-4" />
            ) : (
              <LuPin className="mr-2 h-4 w-4" />
            )}
            {chat.isPinned ? "Unpin" : "Pin"}
          </ContextMenuItem>
          <ContextMenuItem onClick={() => openRenameDialog(chat)}>
            <Edit className="mr-2 h-4 w-4" />
            Rename
          </ContextMenuItem>
          <ContextMenuItem onClick={() => openDeleteDialog(chat)} className="">
            <IoMdClose className="mr-2 h-4 w-4" />
            Delete
          </ContextMenuItem>
          <ContextMenuItem onClick={() => handleExportChat(chat)}>
            <LuDownload className="mr-2 h-4 w-4" />
            Export
            <span className="ml-auto text-xs bg-primary/10 px-1.5 py-0.5 rounded">
              BETA
            </span>
          </ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>
    );
  };

  return (
    <>
      <SidebarContent>
        {/* Pinned Chats */}
        {pinnedChats.length > 0 && (
          <SidebarGroup>
            <SidebarGroupLabel className="gap-1">
              <LuPin className="!w-3 !h-3" /> Pinned
            </SidebarGroupLabel>
            <SidebarMenu>
              {pinnedChats.map((chat) => (
                <ChatItem
                  key={chat._id}
                  chat={chat}
                  showBranchIcon={chat.isBranch}
                />
              ))}
            </SidebarMenu>
          </SidebarGroup>
        )}

        {/* Today's Chats */}
        {todayChats.length > 0 && (
          <SidebarGroup>
            <SidebarGroupLabel>Today</SidebarGroupLabel>
            <SidebarMenu>
              {todayChats.map((chat) => (
                <ChatItem
                  key={chat._id}
                  chat={chat}
                  showBranchIcon={chat.isBranch}
                />
              ))}
            </SidebarMenu>
          </SidebarGroup>
        )}

        {/* Yesterday's Chats */}
        {yesterdayChats.length > 0 && (
          <SidebarGroup>
            <SidebarGroupLabel>Yesterday</SidebarGroupLabel>
            <SidebarMenu>
              {yesterdayChats.map((chat) => (
                <ChatItem
                  key={chat._id}
                  chat={chat}
                  showBranchIcon={chat.isBranch}
                />
              ))}
            </SidebarMenu>
          </SidebarGroup>
        )}

        {/* Last 7 Days Chats */}
        {last7DaysChats.length > 0 && (
          <SidebarGroup>
            <SidebarGroupLabel>Last 7 days</SidebarGroupLabel>
            <SidebarMenu>
              {last7DaysChats.map((chat) => (
                <ChatItem
                  key={chat._id}
                  chat={chat}
                  showBranchIcon={chat.isBranch}
                />
              ))}
            </SidebarMenu>
          </SidebarGroup>
        )}

        {/* Last Month Chats */}
        {lastMonthChats.length > 0 && (
          <SidebarGroup>
            <SidebarGroupLabel>Last month</SidebarGroupLabel>
            <SidebarMenu>
              {lastMonthChats.map((chat) => (
                <ChatItem
                  key={chat._id}
                  chat={chat}
                  showBranchIcon={chat.isBranch}
                />
              ))}
            </SidebarMenu>
          </SidebarGroup>
        )}

        {/* Older Chats */}
        {olderChats.length > 0 && (
          <SidebarGroup>
            <SidebarGroupLabel>Older</SidebarGroupLabel>
            <SidebarMenu>
              {olderChats.map((chat) => (
                <ChatItem
                  key={chat._id}
                  chat={chat}
                  showBranchIcon={chat.isBranch}
                />
              ))}
            </SidebarMenu>
          </SidebarGroup>
        )}

        {/* Empty state */}
        {chats.length === 0 && (
          <div className="p-4 text-center text-muted-foreground">
            No chats found
          </div>
        )}
      </SidebarContent>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Chat</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{selectedChat?.title}"? This
              action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => {
                setDeleteDialogOpen(false);
                setSelectedChat(null);
              }}
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => selectedChat && handleDeleteChat(selectedChat._id)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Rename Dialog */}
      <Dialog open={renameDialogOpen} onOpenChange={setRenameDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Rename Chat</DialogTitle>
            <DialogDescription>
              Enter a new name for your chat. This will help you identify it
              later.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="items-center space-y-2">
              <Label htmlFor="chat-title" className="text-right">
                Title
              </Label>
              <Input
                id="chat-title"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                className="col-span-3"
                placeholder="Enter chat title..."
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleRenameChat();
                  }
                }}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => {
                setRenameDialogOpen(false);
                setSelectedChat(null);
                setNewTitle("");
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleRenameChat} disabled={!newTitle.trim()}>
              Rename
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default SidebarThreads;
