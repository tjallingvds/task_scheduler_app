import React, { createContext, useState, useContext, useEffect } from 'react';
import api from "@/services/api";
import { Folder, ListTodo } from "lucide-react";

// Interface for TaskList
interface TaskList {
  id: string;
  title: string;
  icon?: React.ComponentType<{ className?: string }>;
  url: string;
  children?: TaskList[];
  isFolder?: boolean;
}

// Context interface
interface TaskListContextType {
  taskLists: TaskList[];
  setTaskLists: React.Dispatch<React.SetStateAction<TaskList[]>>;
  refreshTaskLists: () => Promise<void>;
  isLoading: boolean;
}

// Create context with default values
const TaskListContext = createContext<TaskListContextType>({
  taskLists: [],
  setTaskLists: () => {},
  refreshTaskLists: async () => {},
  isLoading: false,
});

// Provider component
export const TaskListProvider: React.FC<{children: React.ReactNode}> = ({ children }) => {
  const [taskLists, setTaskLists] = useState<TaskList[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Function to fetch task lists from the backend
  const refreshTaskLists = async () => {
    setIsLoading(true);
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
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch task lists on component mount
  useEffect(() => {
    refreshTaskLists();
  }, []);

  return (
    <TaskListContext.Provider value={{ taskLists, setTaskLists, refreshTaskLists, isLoading }}>
      {children}
    </TaskListContext.Provider>
  );
};

// Custom hook to use the context
export const useTaskListContext = () => useContext(TaskListContext);