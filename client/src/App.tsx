"use client"

import React, { useRef } from "react"
// Navigation imports removed
import {
  BadgeCheck,
  Bell,
  BookOpen,
  Bot,
  ChevronRight,
  ChevronsUpDown,
  CreditCard,
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
  Settings2,
  Sparkles,
  SquareTerminal,
  Trash2,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Separator } from "@/components/ui/separator"
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
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarProvider,
  SidebarRail,
  SidebarTrigger,
} from "@/components/ui/sidebar"

// Define type interfaces
interface Team {
  name: string;
  logo: React.ComponentType<{ className?: string }>;
}

interface DataType {
  user: {
    name: string;
    email: string;
    avatar: string;
  };
  teams: Team[];
  navMain: {
    title: string;
    url: string;
    icon?: React.ComponentType<{ className?: string }>;
    isActive?: boolean;
    items?: {
      title: string;
      url: string;
    }[];
  }[];
  projects: {
    name: string;
    url: string;
    icon: React.ComponentType<{ className?: string }>;
  }[];
}

// Sample data
const data: DataType = {
  user: {
    name: "shadcn",
    email: "m@example.com",
    avatar: "/avatars/shadcn.jpg",
  },
  teams: [],
  navMain: [
    {
      title: "Command Center",
      url: "#",
      icon: SquareTerminal,
      isActive: true,
      items: [
        {
          title: "Performance",
          url: "#",
        },
        {
          title: "Quick Actions",
          url: "#",
        },
        {
          title: "Preferences",
          url: "#",
        },
      ],
    },
    {
      title: "Growth Tools",
      url: "#",
      icon: Bot,
      items: [
        {
          title: "Market Analysis",
          url: "#",
        },
        {
          title: "Competitor Tracking",
          url: "#",
        },
        {
          title: "Smart Targeting",
          url: "#",
        },
      ],
    },
    {
      title: "Resources",
      url: "#",
      icon: BookOpen,
      items: [
        {
          title: "Success Stories",
          url: "#",
        },
        {
          title: "Quick Start Guide",
          url: "#",
        },
        {
          title: "Strategy Playbooks",
          url: "#",
        },
        {
          title: "Updates",
          url: "#",
        },
      ],
    },
    {
      title: "Account",
      url: "#",
      icon: Settings2,
      items: [
        {
          title: "Business Profile",
          url: "#",
        },
        {
          title: "Workspace",
          url: "#",
        },
        {
          title: "Subscription",
          url: "#",
        },
        {
          title: "Usage & Analytics",
          url: "#",
        },
      ],
    },
  ],
  projects: [
    {
      name: "Brand Building",
      url: "#",
      icon: Frame,
    },
    {
      name: "Market Performance",
      url: "#",
      icon: PieChart,
    },
    {
      name: "Local Reach",
      url: "#",
      icon: Map,
    },
  ],
}

// Task list interface
interface TaskList {
  id: string;
  title: string;
  icon?: React.ComponentType<{ className?: string }>;
  url: string;
  children?: TaskList[]; // Added to support nested folders
  isFolder?: boolean;
}

// Define Page component props
interface PageProps {
  children?: React.ReactNode;
  companyName?: string;
  username?: string;
  email?: string;
}

// Main Page component with sidebar
function Page({ 
  children, 
  companyName = "Acme Inc", 
  username = "User", 
  email = "user@example.com" 
}: PageProps) {
  const [, setActiveTeam] = React.useState(companyName)
  const [taskLists, setTaskLists] = React.useState<TaskList[]>([])
  const [currentList, setCurrentList] = React.useState<string | null>(null);
  const [draggedItem, setDraggedItem] = React.useState<string | null>(null);
  const [dropTarget, setDropTarget] = React.useState<string | null>(null);
  
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
  const handleDrop = (targetId: string) => {
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
    
    // If target is already a folder, add to children
    if (targetItemData.isFolder) {
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
    } else {
      // Create a new folder with both items
      const newFolderId = `folder-${Date.now()}`;
      const newFolder: TaskList = {
        id: newFolderId,
        title: "Task Folder",
        icon: Folder,
        url: `/tasks/folder-${newFolderId}`,
        isFolder: true,
        children: [targetItemData, draggedItemData]
      };
      
      // Remove the two individual items and add the folder
      const updatedLists = taskLists
        .filter(item => item.id !== draggedItem && item.id !== targetId)
        .concat(newFolder);
      
      setTaskLists(updatedLists);
      setCurrentList(newFolderId);
    }
    
    setDraggedItem(null);
    setDropTarget(null);
  };
  
  // Function to handle drag end
  const handleDragEnd = () => {
    setDraggedItem(null);
    setDropTarget(null);
  };
  // Navigation code removed
  
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
                        {companyName}
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
                  {data.teams.map((team, index) => (
                    <DropdownMenuItem
                      key={team.name}
                      onClick={() => setActiveTeam(team.name)}
                      className="gap-2 p-2"
                    >
                      <div className="flex size-6 items-center justify-center rounded-sm border">
                        <team.logo className="size-4 shrink-0" />
                      </div>
                      {team.name}
                      <DropdownMenuShortcut>⌘{index + 1}</DropdownMenuShortcut>
                    </DropdownMenuItem>
                  ))}
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
                <SidebarMenuItem key={list.id}>
                  <SidebarMenuButton 
                    className={`${currentList === list.id ? "bg-primary/10" : ""} ${
                      dropTarget === list.id ? "border-2 border-dashed border-primary" : ""
                    }`}
                    onClick={() => setCurrentList(list.id)}
                    asChild
                    draggable
                    onDragStart={() => handleDragStart(list.id)}
                    onDragOver={(e) => {
                      e.preventDefault();
                      handleDragOver(list.id);
                    }}
                    onDragEnd={handleDragEnd}
                    onDrop={(e) => {
                      e.preventDefault();
                      handleDrop(list.id);
                    }}
                  >
                    <a href={list.url}>
                      {list.icon && <list.icon />}
                      <span>{list.title}</span>
                      {list.isFolder && list.children && list.children.length > 0 && (
                        <span className="ml-auto text-xs text-muted-foreground">
                          {list.children.length}
                        </span>
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
                      <DropdownMenuItem>
                        <Folder className="text-muted-foreground" />
                        <span>View Tasks</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Forward className="text-muted-foreground" />
                        <span>Share List</span>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => {
                        setTaskLists(taskLists.filter(t => t.id !== list.id));
                        if (currentList === list.id) setCurrentList(null);
                      }}>
                        <Trash2 className="text-muted-foreground" />
                        <span>Delete List</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </SidebarMenuItem>
              ))}
              <SidebarMenuItem>
                <SidebarMenuButton
                  onClick={() => {
                    const newId = (Math.max(0, ...taskLists.map(t => parseInt(t.id) || 0)) + 1).toString();
                    
                    const newTaskList = { 
                      id: newId, 
                      title: `New Task List ${newId}`, 
                      icon: ListTodo, // Using the ListTodo icon for all task lists
                      url: `/tasks/list-${newId}`,
                      isFolder: false,
                      children: []
                    };
                    
                    setTaskLists([...taskLists, newTaskList]);
                    setCurrentList(newId);
                  }}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  <span>Add Task List</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroup>
          {/* Quick Access section removed as requested */}
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
                        src={data.user.avatar}
                        alt={username}
                      />
                      <AvatarFallback className="rounded-lg">
                        {username.substring(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="grid flex-1 text-left text-sm leading-tight">
                      <span className="truncate font-semibold">
                        {username}
                      </span>
                      <span className="truncate text-xs">
                        {email}
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
                          src={data.user.avatar}
                          alt={username}
                        />
                        <AvatarFallback className="rounded-lg">
                          {username.substring(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="grid flex-1 text-left text-sm leading-tight">
                        <span className="truncate font-semibold">
                          {username}
                        </span>
                        <span className="truncate text-xs">
                          {email}
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
                  <DropdownMenuItem asChild>
                    <a href="/">
                      <LogOut />
                      <span>Log out</span>
                    </a>
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
                  <BreadcrumbLink href="#">
                    {companyName}
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
          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}

// Main App component that uses the Page component
function App() {
  return (
    <Page
      companyName="Your Company"
      username="John Doe"
      email="john@example.com"
    >
      <div className="grid gap-4">
        <div className="rounded-lg border p-4">
          <h2 className="text-xl font-bold mb-4">Task Management</h2>
          <p className="text-muted-foreground mb-6">
            Create task lists from the sidebar. Drag and drop lists onto each other to create folders.
          </p>
          
          <div className="space-y-2 mb-6">
            <h3 className="text-lg font-medium mb-3">Instructions:</h3>
            <ul className="list-disc pl-6 space-y-2">
              <li>Click "Add Task List" to create a new list</li>
              <li>Drag one task list onto another to create a folder</li>
              <li>Folders will display the number of contained items</li>
              <li>Click on a task list to view its contents</li>
            </ul>
          </div>
          
          <Button variant="outline">
            <Plus className="h-4 w-4 mr-2" />
            Create New Task
          </Button>
        </div>
      </div>
    </Page>
  )
}

export default App