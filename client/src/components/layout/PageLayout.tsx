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
  Home,
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
  User,
  X,
} from "lucide-react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
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
  parentId?: string; // Added to track parent folders
}

// Main Page Layout
export default function PageLayout() {
  const { logout, user } = useAuth();
  const navigate = useNavigate();
  const { listId } = useParams();
  const location = useLocation();
  const [activeTeam, setActiveTeam] = useState("SimpleTask");
  const [taskLists, setTaskLists] = useState<TaskList[]>([]);
  const [currentList, setCurrentList] = useState<string | null>(null);
  const [currentListTitle, setCurrentListTitle] = useState<string | null>(null);
  const [draggedItem, setDraggedItem] = useState<string | null>(null);
  const [dropTarget, setDropTarget] = useState<string | null>(null);
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  const [editingListId, setEditingListId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDraggingTask, setIsDraggingTask] = useState(false);
  
  // Listen for task drag operations to provide visual feedback
  useEffect(() => {
    const handleDragStart = (e: DragEvent) => {
      if (e.dataTransfer?.types.includes('application/json')) {
        try {
          // Try to check the data type without actually reading it (which isn't allowed in dragStart)
          setIsDraggingTask(true);
        } catch (error) {
          // Not our task data
        }
      }
    };
    
    const handleDragEnd = () => {
      setIsDraggingTask(false);
    };
    
    document.addEventListener('dragstart', handleDragStart);
    document.addEventListener('dragend', handleDragEnd);
    document.addEventListener('drop', handleDragEnd);
    
    return () => {
      document.removeEventListener('dragstart', handleDragStart);
      document.removeEventListener('dragend', handleDragEnd);
      document.removeEventListener('drop', handleDragEnd);
    };
  }, []);
  
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
          parentId: list.parent_id ? list.parent_id.toString() : undefined,
          children: list.is_folder ? list.children.map((child: any) => ({
            id: child.id.toString(),
            title: child.title,
            icon: child.is_folder ? Folder : ListTodo,
            url: `/tasks/${child.id}`,
            isFolder: child.is_folder,
            parentId: list.id.toString()
          })) : []
        }));
        
        setTaskLists(convertedLists);
      } catch (error) {
        console.error("Error fetching task lists:", error);
      }
    };
    
    fetchTaskLists();
  }, []);

  // Update current list and title based on URL parameters
  useEffect(() => {
    if (listId) {
      setCurrentList(listId);
      
      // Find the title for this list id
      const findListTitle = (lists: TaskList[]): string | null => {
        for (const list of lists) {
          if (list.id === listId) {
            return list.title;
          }
          if (list.children && list.children.length) {
            const childTitle = findListTitle(list.children);
            if (childTitle) return childTitle;
          }
        }
        return null;
      };
      
      const title = findListTitle(taskLists);
      setCurrentListTitle(title);
    } else {
      // If not on a task list page
      setCurrentListTitle(null);
    }
  }, [listId, taskLists]);

  // Focus input when editing starts
  useEffect(() => {
    if (editingListId && inputRef.current) {
      inputRef.current.focus();
    }
  }, [editingListId]);
  
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
      
      // Update current list title if we're renaming the current list
      if (editingListId === currentList) {
        setCurrentListTitle(editingTitle);
      }
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
  
  // Handle tasks being dropped on task lists
  const handleTaskDrop = async (e: React.DragEvent, targetTaskListId: string) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Check if this is a task being dropped
    try {
      const taskData = JSON.parse(e.dataTransfer.getData('application/json'));
      
      if (taskData.type === 'TASK') {
        // Get task details
        const { taskId, taskListId } = taskData;
        
        // Skip if dropping on the same list
        if (taskListId === targetTaskListId) {
          return;
        }
        
        console.log(`Moving task ${taskId} from list ${taskListId} to list ${targetTaskListId}`);
        
        // Call API to move the task to the new list
        await api.put(`tasks/${taskId}`, {
          task_list_id: parseInt(targetTaskListId)
        });
        
        // If we're currently viewing the target list, refresh it to show the new task
        if (listId === targetTaskListId) {
          // You would implement a refresh mechanism here
          // For example, dispatch an event or call a refreshTasks function
        }
        
        setIsDraggingTask(false);
        return;
      }
    } catch (error) {
      // Not JSON or not our task data, handle as a regular list drop
    }
    
    // If we get here, it's a regular task list drag and drop operation
    handleDrop(targetTaskListId);
  };
  
  // Function to handle drop - creating a folder or moving into/out of a folder
  const handleDrop = async (targetId: string) => {
    if (!draggedItem || draggedItem === targetId) {
      setDraggedItem(null);
      setDropTarget(null);
      return;
    }
    
    // Find the dragged item and target item (could be in nested children)
    const findItem = (lists: TaskList[], id: string): [TaskList | null, TaskList | null] => {
      for (const list of lists) {
        if (list.id === id) {
          return [list, null]; // Found the item, no parent
        }
        if (list.isFolder && list.children) {
          for (const child of list.children) {
            if (child.id === id) {
              return [child, list]; // Found the item in children, return with parent
            }
          }
        }
      }
      return [null, null]; // Not found
    };
    
    const [draggedItemData, draggedItemParent] = findItem(taskLists, draggedItem);
    const [targetItemData, targetItemParent] = findItem(taskLists, targetId);
    
    if (!draggedItemData || !targetItemData) {
      setDraggedItem(null);
      setDropTarget(null);
      return;
    }
    
    try {
      // If target is a folder, add dragged item to its children
      if (targetItemData.isFolder) {
        // Update in the backend
        await api.put(`task-lists/${draggedItem}`, {
          parent_id: parseInt(targetId)
        });
        
        // First, remove the dragged item from its current location
        let updatedLists = [...taskLists];
        
        if (draggedItemParent) {
          // If the item is in a folder, remove it from the folder's children
          updatedLists = updatedLists.map(list => {
            if (list.id === draggedItemParent.id) {
              return {
                ...list,
                children: list.children?.filter(child => child.id !== draggedItem) || []
              };
            }
            return list;
          });
        } else {
          // If the item is in the root, remove it from there
          updatedLists = updatedLists.filter(item => item.id !== draggedItem);
        }
        
        // Then add it to the target folder
        updatedLists = updatedLists.map(list => {
          if (list.id === targetId) {
            return {
              ...list,
              children: [...(list.children || []), { 
                ...draggedItemData, 
                parentId: targetId 
              }]
            };
          }
          return list;
        });
        
        setTaskLists(updatedLists);
        // Auto-expand the folder after dropping an item into it
        setExpandedFolders(prev => new Set(prev).add(targetId));
      } 
      // If the target is not a folder, and dragged item is from a folder, move to root
      else if (draggedItemParent) {
        // Update in the backend - remove parent
        await api.put(`task-lists/${draggedItem}`, {
          parent_id: null
        });
        
        // Remove from parent's children
        let updatedLists = taskLists.map(list => {
          if (list.id === draggedItemParent.id) {
            return {
              ...list,
              children: list.children?.filter(child => child.id !== draggedItem) || []
            };
          }
          return list;
        });
        
        // Add to root
        updatedLists = [...updatedLists, {
          ...draggedItemData,
          parentId: undefined
        }];
        
        setTaskLists(updatedLists);
      }
      // If both items are at root, create a new folder with both items
      else {
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
          children: [
            { ...targetItemData, parentId: newFolder.id },
            { ...draggedItemData, parentId: newFolder.id }
          ]
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
      
      // Remove from UI
      setTaskLists(prev => {
        // First check if it's in the root
        if (prev.some(item => item.id === id)) {
          return prev.filter(item => item.id !== id);
        }
        
        // If not in root, find and remove from parent folder
        return prev.map(item => {
          if (item.isFolder && item.children?.some(child => child.id === id)) {
            return {
              ...item,
              children: item.children.filter(child => child.id !== id)
            };
          }
          return item;
        });
      });
      
      if (currentList === id) {
        setCurrentList(null);
        setCurrentListTitle(null);
      }
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
              className={`${currentList === list.id ? "bg-primary/10" : ""} 
                ${dropTarget === list.id ? "border-2 border-dashed border-primary" : ""}
                ${isDraggingTask && !list.isFolder ? "bg-green-100 dark:bg-green-900/20" : ""}`}
              onClick={(e) => {
                if (list.isFolder) {
                  toggleFolderExpansion(list.id, e);
                } else {
                  navigate(`/tasks/${list.id}`);
                  e.preventDefault();
                }
              }}
              asChild
              draggable={true} // Allow dragging for all items
              onDragStart={() => handleDragStart(list.id)}
              onDragOver={(e) => {
                e.preventDefault();
                
                // Check if this is a task being dragged
                let isTaskDrag = isDraggingTask;
                
                // If it's a task being dragged, only highlight non-folder task lists
                if (isTaskDrag) {
                  if (!list.isFolder) {
                    handleDragOver(list.id);
                  }
                } else {
                  // If it's a list being dragged, use the regular handler
                  handleDragOver(list.id);
                }
              }}
              onDragEnd={handleDragEnd}
              onDrop={(e) => {
                e.preventDefault();
                handleTaskDrop(e, list.id);
              }}
            >
              <a href={list.url}>
                {list.icon && <list.icon className={`size-4 ${isDraggingTask && !list.isFolder ? 'text-green-600 dark:text-green-400' : ''}`} />}
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
              {/* FIRST CHANGE: Removed dropdown menu, hardcoded SimpleTask */}
              <SidebarMenuButton size="lg">
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                  <GalleryVerticalEnd className="size-4" />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">
                    SimpleTask
                  </span>
                  <span className="truncate text-xs">
                    Simply add tasks
                  </span>
                </div>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarHeader>
        <SidebarContent>
          {/* Dashboard Button */}
          <SidebarGroup>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  onClick={() => navigate('/')}
                  className={`${location.pathname === '/' ? "bg-primary/10" : ""}`}
                >
                  <Home className="size-4" />
                  <span>Dashboard</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroup>
          
          {/* Task Lists */}
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
                {/* SECOND CHANGE: Simplified dropdown menu to only Profile and Logout */}
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
                  <DropdownMenuItem onClick={() => navigate('/profile')}>
                    <User />
                    <span>Profile</span>
                  </DropdownMenuItem>
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
                  <BreadcrumbPage>
                    {/* Show proper page name based on current location */}
                    {location.pathname === "/profile" 
                      ? "Profile" 
                      : (currentListTitle || (location.pathname === "/" ? "Dashboard" : "Task List"))}
                  </BreadcrumbPage>
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