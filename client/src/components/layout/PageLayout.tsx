import { Outlet } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import React, { useEffect, useRef, useState } from "react";
import {
  BadgeCheck,
  Bell,
  BookOpen,
  Bot,
  ChevronRight,
  ChevronsUpDown,
  CreditCard,
  Edit2,
  Folder,
  Forward,
  Frame,
  GalleryVerticalEnd,
  ListTodo,
  LogOut,
  Map,
  MoreHorizontal,
  PieChart,
  Plus,
  Save,
  Settings2,
  Sparkles,
  SquareTerminal,
  Trash2,
  X,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarRail,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import api from "@/services/api";

// Task list interface
interface TaskList {
  id: string;
  title: string;
  icon?: React.ComponentType<{ className?: string }>;
  url: string;
  children?: TaskList[]; // Added to support nested folders
  isFolder?: boolean;
}

// Main Page Layout
export default function PageLayout() {
  const { logout, user } = useAuth();
  const navigate = useNavigate();
  const [activeTeam, setActiveTeam] = useState("SimpleTask");
  const [taskLists, setTaskLists] = useState<TaskList[]>([]);
  const [currentList, setCurrentList] = useState<string | null>(null);
  const [draggedItem, setDraggedItem] = useState<string | null>(null);
  const [dropTarget, setDropTarget] = useState<string | null>(null);
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  const [editingListId, setEditingListId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  
  // Function to fetch task lists from the backend
  useEffect(() => {
    const fetchTaskLists = async () => {
      try {
        const fetchedLists = await api.get('task-lists');
        
        // Convert the backend format to our frontend TaskList format
        const convertedLists = fetchedLists.map((list: any) => ({
          id: list.id.toString(),
          title: list.title,
          icon: list.is_folder ? Folder : ListTodo,
          url: `/tasks/${list.id}`,
          isFolder: list.is_folder,
          children: list.is_folder ? list.children.map((child: any) => ({
            id: child.id.toString(),
            title: child.title,
            icon: child.is_folder ? Folder : ListTodo,
            url: `/tasks/${child.id}`,
            isFolder: child.is_folder
          })) : []
        }));
        
        setTaskLists(convertedLists);
      } catch (error) {
        console.error("Error fetching task lists:", error);
      }
    };
    
    fetchTaskLists();
  }, []);

  // Focus input when editing starts
  useEffect(() => {
    if (editingListId && inputRef.current) {
      inputRef.current.focus();
    }
  }, [editingListId]);
  
  // Function to handle creating a new task list
  // Function to handle creating a new task list
const handleCreateTaskList = async (title: string, isFolder: boolean = false) => {
  try {
    // Add console logging to debug
    console.log("Creating task list:", { title, isFolder });
    
    const response = await api.post('task-lists', {
      title,
      is_folder: isFolder
    });
    
    console.log("Task list creation response:", response);
    
    // Make sure we have a valid ID
    if (!response || !response.id) {
      throw new Error("Invalid response from server when creating task list");
    }
    
    const newList = {
      id: response.id.toString(),
      title: response.title,
      icon: response.is_folder ? Folder : ListTodo,
      url: `/tasks/${response.id}`,
      isFolder: response.is_folder,
      children: []
    };
    
    setTaskLists(prevLists => [...prevLists, newList]);
    return newList;
  } catch (error) {
    console.error("Error creating task list:", error);
    throw error;
  }
};

  // Function to start renaming a task list
  const startRenaming = (list: TaskList, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingListId(list.id);
    setEditingTitle(list.title);
  };

  // Function to save the renamed task list
  const saveRenamedTaskList = async (e?: React.FormEvent) => {
    if (e) {
      e.preventDefault();
    }

    if (!editingListId || !editingTitle.trim()) {
      setEditingListId(null);
      return;
    }

    try {
      await api.put(`task-lists/${editingListId}`, {
        title: editingTitle
      });

      // Update in the frontend
      setTaskLists(prev => {
        return prev.map(list => {
          if (list.id === editingListId) {
            return {
              ...list,
              title: editingTitle
            };
          }

          // Check if it's a nested item in a folder
          if (list.isFolder && list.children) {
            return {
              ...list,
              children: list.children.map(child => 
                child.id === editingListId ? { ...child, title: editingTitle } : child
              )
            };
          }

          return list;
        });
      });
    } catch (error) {
      console.error("Error renaming task list:", error);
    } finally {
      setEditingListId(null);
    }
  };

  // Handle escape key to cancel editing
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setEditingListId(null);
    }
  };
  
  // Function to toggle folder expansion
  const toggleFolderExpansion = (folderId: string, e: React.MouseEvent) => {
    e.preventDefault(); // Prevent navigation
    setExpandedFolders(prev => {
      const newSet = new Set(prev);
      if (newSet.has(folderId)) {
        newSet.delete(folderId);
      } else {
        newSet.add(folderId);
      }
      return newSet;
    });
  };
  
  // Function to handle drag start
  const handleDragStart = (id: string) => {
    setDraggedItem(id);
  };
  
  // Function to handle drag over
  const handleDragOver = (id: string) => {
    if (id !== draggedItem) {
      setDropTarget(id);
    }
  };
  
  // Function to handle drop - creating a folder
  const handleDrop = async (targetId: string) => {
    if (!draggedItem || draggedItem === targetId) {
      setDraggedItem(null);
      setDropTarget(null);
      return;
    }
    
    // Find the dragged item and target item
    const draggedItemData = taskLists.find(item => item.id === draggedItem);
    const targetItemData = taskLists.find(item => item.id === targetId);
    
    if (!draggedItemData || !targetItemData) {
      setDraggedItem(null);
      setDropTarget(null);
      return;
    }
    
    try {
      // If target is already a folder, add to children
      if (targetItemData.isFolder) {
        // Update in the backend
        await api.put(`task-lists/${draggedItem}`, {
          parent_id: parseInt(targetId)
        });
        
        // Update in the frontend
        const updatedLists = taskLists.map(item => {
          if (item.id === targetId) {
            return {
              ...item,
              children: [...(item.children || []), draggedItemData]
            };
          }
          return item;
        }).filter(item => item.id !== draggedItem);
        
        setTaskLists(updatedLists);
        // Auto-expand the folder after dropping an item into it
        setExpandedFolders(prev => new Set(prev).add(targetId));
      } else {
        // Create a new folder with both items
        const folderName = "Task Folder";
        const newFolder = await handleCreateTaskList(folderName, true);
        
        // Update both items to be children of the new folder
        await api.put(`task-lists/${draggedItem}`, {
          parent_id: parseInt(newFolder.id)
        });
        
        await api.put(`task-lists/${targetId}`, {
          parent_id: parseInt(newFolder.id)
        });
        
        // Update frontend state
        const updatedFolder = {
          ...newFolder,
          children: [targetItemData, draggedItemData]
        };
        
        // Remove the two individual items and add the folder
        const updatedLists = taskLists
          .filter(item => item.id !== draggedItem && item.id !== targetId)
          .concat(updatedFolder);
        
        setTaskLists(updatedLists);
        setCurrentList(newFolder.id);
        // Auto-expand the newly created folder
        setExpandedFolders(prev => new Set(prev).add(newFolder.id));
      }
    } catch (error) {
      console.error("Error updating task lists:", error);
    } finally {
      setDraggedItem(null);
      setDropTarget(null);
    }
  };
  
  // Function to handle drag end
  const handleDragEnd = () => {
    setDraggedItem(null);
    setDropTarget(null);
  };
  
  // Function to handle deleting a task list
  const handleDeleteTaskList = async (id: string) => {
    try {
      await api.delete(`task-lists/${id}`);
      setTaskLists(taskLists.filter(t => t.id !== id));
      if (currentList === id) setCurrentList(null);
    } catch (error) {
      console.error("Error deleting task list:", error);
    }
  };
  
  // Render a list item with optional editing state
  const renderListItem = (list: TaskList, isChild = false) => {
    return (
      <SidebarMenuItem key={list.id}>
        {editingListId === list.id ? (
          <form onSubmit={saveRenamedTaskList} className="flex w-full">
            <Input
              ref={inputRef}
              value={editingTitle}
              onChange={(e) => setEditingTitle(e.target.value)}
              onBlur={saveRenamedTaskList}
              onKeyDown={handleKeyDown}
              className="h-8 w-full"
            />
            <Button 
              type="submit" 
              size="sm" 
              variant="ghost" 
              className="px-2 h-8"
            >
              <Save className="h-4 w-4" />
            </Button>
            <Button 
              type="button" 
              size="sm" 
              variant="ghost" 
              className="px-2 h-8"
              onClick={() => setEditingListId(null)}
            >
              <X className="h-4 w-4" />
            </Button>
          </form>
        ) : (
          <>
            <SidebarMenuButton 
              className={`${currentList === list.id ? "bg-primary/10" : ""} ${
                dropTarget === list.id ? "border-2 border-dashed border-primary" : ""
              }`}
              onClick={(e) => {
                if (list.isFolder) {
                  toggleFolderExpansion(list.id, e);
                } else {
                  navigate(`/tasks/${list.id}`);
                  e.preventDefault();
                }
              }}
              asChild
              draggable={!isChild}
              onDragStart={() => !isChild && handleDragStart(list.id)}
              onDragOver={(e) => {
                e.preventDefault();
                !isChild && handleDragOver(list.id);
              }}
              onDragEnd={!isChild ? handleDragEnd : undefined}
              onDrop={(e) => {
                e.preventDefault();
                !isChild && handleDrop(list.id);
              }}
            >
              <a href={list.url}>
                {list.icon && <list.icon className="size-4" />}
                <span>{list.title}</span>
                {list.isFolder && list.children && list.children.length > 0 && (
                  <>
                    <span className="ml-auto text-xs text-muted-foreground">
                      {list.children.length}
                    </span>
                    <ChevronRight className={`ml-1 h-4 w-4 transition-transform ${
                      expandedFolders.has(list.id) ? 'rotate-90' : ''
                    }`} />
                  </>
                )}
              </a>
            </SidebarMenuButton>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuAction showOnHover>
                  <MoreHorizontal />
                  <span className="sr-only">More</span>
                </SidebarMenuAction>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="w-48 rounded-lg"
                side="bottom"
                align="end"
              >
                <DropdownMenuItem onClick={() => navigate(`/tasks/${list.id}`)}>
                  <Folder className="text-muted-foreground" />
                  <span>View Tasks</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={(e) => startRenaming(list, e)}>
                  <Edit2 className="text-muted-foreground" />
                  <span>Rename</span>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Forward className="text-muted-foreground" />
                  <span>Share List</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => handleDeleteTaskList(list.id)}>
                  <Trash2 className="text-muted-foreground" />
                  <span>Delete List</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </>
        )}
      </SidebarMenuItem>
    );
  };
  
  return (
    <SidebarProvider>
      <Sidebar collapsible="icon">
        <SidebarHeader>
          <SidebarMenu>
            <SidebarMenuItem>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <SidebarMenuButton
                    size="lg"
                    className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                  >
                    <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                      <GalleryVerticalEnd className="size-4" />
                    </div>
                    <div className="grid flex-1 text-left text-sm leading-tight">
                      <span className="truncate font-semibold">
                        {activeTeam}
                      </span>
                      <span className="truncate text-xs">
                        Startup
                      </span>
                    </div>
                    <ChevronsUpDown className="ml-auto" />
                  </SidebarMenuButton>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
                  align="start"
                  side="bottom"
                  sideOffset={4}
                >
                  <DropdownMenuLabel className="text-xs text-muted-foreground">
                    Teams
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="gap-2 p-2">
                    <div className="flex size-6 items-center justify-center rounded-md border bg-background">
                      <Plus className="size-4" />
                    </div>
                    <div className="font-medium text-muted-foreground">
                      Add team
                    </div>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>Task Lists</SidebarGroupLabel>
            <SidebarMenu>
              {taskLists.map((list) => (
                <React.Fragment key={list.id}>
                  {renderListItem(list)}
                  
                  {/* Render children if this is an expanded folder */}
                  {list.isFolder && expandedFolders.has(list.id) && list.children && list.children.length > 0 && (
                    <div className="ml-6 border-l border-border/50 pl-2">
                      {list.children.map(child => renderListItem(child, true))}
                    </div>
                  )}
                </React.Fragment>
              ))}
              <SidebarMenuItem>
                <SidebarMenuButton
                  onClick={async () => {
                    try {
                      const newId = (Math.max(0, ...taskLists.map(t => parseInt(t.id) || 0)) + 1).toString();
                      const title = `New Task List ${newId}`;
                      
                      const newTaskList = await handleCreateTaskList(title);
                      setCurrentList(newTaskList.id);
                      
                      // Start renaming immediately
                      setEditingListId(newTaskList.id);
                      setEditingTitle(title);
                    } catch (error) {
                      console.error("Error adding task list:", error);
                    }
                  }}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  <span>Add Task List</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroup>
        </SidebarContent>
        <SidebarFooter>
          <SidebarMenu>
            <SidebarMenuItem>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <SidebarMenuButton
                    size="lg"
                    className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                  >
                    <Avatar className="h-8 w-8 rounded-lg">
                      <AvatarImage
                        src="/avatars/shadcn.jpg"
                        alt={user?.name || "User"}
                      />
                      <AvatarFallback className="rounded-lg">
                        {(user?.name || "User").substring(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="grid flex-1 text-left text-sm leading-tight">
                      <span className="truncate font-semibold">
                        {user?.name || "User"}
                      </span>
                      <span className="truncate text-xs">
                        {user?.email || "user@example.com"}
                      </span>
                    </div>
                    <ChevronsUpDown className="ml-auto size-4" />
                  </SidebarMenuButton>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
                  side="bottom"
                  align="end"
                  sideOffset={4}
                >
                  <DropdownMenuLabel className="p-0 font-normal">
                    <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                      <Avatar className="h-8 w-8 rounded-lg">
                        <AvatarImage
                          src="/avatars/shadcn.jpg"
                          alt={user?.name || "User"}
                        />
                        <AvatarFallback className="rounded-lg">
                          {(user?.name || "User").substring(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="grid flex-1 text-left text-sm leading-tight">
                        <span className="truncate font-semibold">
                          {user?.name || "User"}
                        </span>
                        <span className="truncate text-xs">
                          {user?.email || "user@example.com"}
                        </span>
                      </div>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuGroup>
                    <DropdownMenuItem>
                      <Sparkles />
                      Upgrade to Pro
                    </DropdownMenuItem>
                  </DropdownMenuGroup>
                  <DropdownMenuSeparator />
                  <DropdownMenuGroup>
                    <DropdownMenuItem>
                      <BadgeCheck />
                      Account
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <CreditCard />
                      Billing
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <Bell />
                      Notifications
                    </DropdownMenuItem>
                  </DropdownMenuGroup>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => logout()}>
                    <LogOut />
                    <span>Log out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
        <SidebarRail />
      </Sidebar>
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
          <div className="flex items-center gap-2 px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-2 h-4" />
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem className="hidden md:block">
                  <BreadcrumbLink href="/">
                    {activeTeam}
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator className="hidden md:block" />
                <BreadcrumbItem>
                  <BreadcrumbPage>Dashboard</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </header>
        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
          <Outlet />
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}