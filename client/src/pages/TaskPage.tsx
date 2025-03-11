import React, { useEffect, useState, useRef } from "react";
import { useParams } from "react-router-dom";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue 
  } from "@/components/ui/select";
import { 
  PlusCircle, 
  Trash2, 
  AlignLeft, 
  Clock, 
  MoreHorizontal, 
  ChevronRight, 
  GripVertical, 
  ChevronDown, 
  Calendar,
  Tag,
  Edit3,
  X
} from "lucide-react";
import api from "@/services/api";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

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

// Task interface with support for subtasks and indentation
interface Task {
  id: number;
  title: string;
  completed: boolean;
  description?: string;
  created_at: string;
  updated_at: string;
  parent_id?: number | null;
  level: number; // Indentation level (0-10)
  children?: Task[]; // Subtasks
  priority?: 'low' | 'medium' | 'high';
  due_date?: string | null;
  tags?: string[];
  expanded?: boolean; // UI state for collapsed/expanded subtasks
}

// Task list interface
interface TaskList {
  id: number;
  title: string;
  is_folder: boolean;
  description?: string;
  created_at?: string;
}

const TaskPage = () => {
  const { listId } = useParams();
  const [allTasks, setAllTasks] = useState<Task[]>([]);
  const [flattenedTasks, setFlattenedTasks] = useState<Task[]>([]);
  const [taskList, setTaskList] = useState<TaskList | null>(null);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [draggedTask, setDraggedTask] = useState<number | null>(null);
  const [dropTarget, setDropTarget] = useState<number | null>(null);
  const [dropPosition, setDropPosition] = useState<'above' | 'below' | 'child' | null>(null);
  const [progress, setProgress] = useState(0);
  const [filter, setFilter] = useState<'all' | 'completed' | 'active'>('all');
  const [editingTaskId, setEditingTaskId] = useState<number | null>(null);
  const [editingTitle, setEditingTitle] = useState("");
  const editInputRef = useRef<HTMLInputElement>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState<{id: number, hasChildren: boolean} | null>(null);
  const [newTaskPriority, setNewTaskPriority] = useState<'low' | 'medium' | 'high'>('medium');
  
  // New state variables for tags and due date functionality
  const [showDueDateDialog, setShowDueDateDialog] = useState(false);
  const [showTagsDialog, setShowTagsDialog] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState<number | null>(null);
  const [selectedDueDate, setSelectedDueDate] = useState<string>("");
  const [newTag, setNewTag] = useState<string>("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [availableTags, setAvailableTags] = useState<string[]>([
    "Important", "Personal", "Work", "Home", "Shopping", "Urgent", "Low Priority"
  ]);
  
  // Format date helper function (since date-fns may not be installed)
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  // Format date for input field
  const formatDateForInput = (dateString?: string | null): string => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toISOString().split('T')[0]; // Returns YYYY-MM-DD format
  };

  // Flatten the task hierarchy into a display-ready array
  const flattenTasksWithLevels = (tasks: Task[]): Task[] => {
    const result: Task[] = [];
    
    const processTasks = (taskList: Task[], level: number, parentId: number | null = null) => {
      taskList.forEach(task => {
        // Add the task with its level and parent information
        const processedTask = {
          ...task,
          level,
          parent_id: parentId
        };
        result.push(processedTask);
        
        // Process children recursively if this task is expanded
        if (task.children && task.children.length > 0 && task.expanded) {
          processTasks(task.children, level + 1, task.id);
        }
      });
    };
    
    processTasks(tasks, 0);
    return result;
  };
  
  // Convert flat array to hierarchical structure
  const buildTaskHierarchy = (tasks: Task[]): Task[] => {
    const taskMap = new Map<number, Task>();
    const rootTasks: Task[] = [];
    
    // First pass: create a map of all tasks
    tasks.forEach(task => {
      taskMap.set(task.id, { ...task, children: [], expanded: true });
    });
    
    // Second pass: establish parent-child relationships
    tasks.forEach(task => {
      if (task.parent_id && taskMap.has(task.parent_id)) {
        // Add task to its parent's children array
        const parent = taskMap.get(task.parent_id)!;
        if (!parent.children) parent.children = [];
        parent.children.push(taskMap.get(task.id)!);
      } else {
        // No parent, this is a root task
        rootTasks.push(taskMap.get(task.id)!);
      }
    });
    
    return rootTasks;
  };
  
  // Calculate progress
  useEffect(() => {
    if (flattenedTasks.length === 0) {
      setProgress(0);
      return;
    }
    
    const completedTasks = flattenedTasks.filter(task => task.completed).length;
    const totalTasks = flattenedTasks.length;
    
    setProgress(Math.round((completedTasks / totalTasks) * 100));
  }, [flattenedTasks]);
  
  // Fetch task list details and tasks
  useEffect(() => {
    const fetchTaskList = async () => {
      setIsLoading(true);
      try {
        const list = await api.get(`task-lists/${listId}`);
        setTaskList(list);
        
        const fetchedTasks = await api.get(`task-lists/${listId}/tasks`);
        
        // Convert to our format with default values
        const tasksWithDefaults = fetchedTasks.map((task: any) => ({
          ...task,
          level: task.level || 0,
          expanded: true,
          priority: task.priority || 'medium',
          tags: task.tags || [],
          children: [],
        }));
        
        // Build hierarchical structure
        const hierarchicalTasks = buildTaskHierarchy(tasksWithDefaults);
        setAllTasks(hierarchicalTasks);
        
        // Flatten for display
        setFlattenedTasks(flattenTasksWithLevels(hierarchicalTasks));
      } catch (error) {
        console.error("Error fetching tasks:", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    if (listId) {
      fetchTaskList();
    }
  }, [listId]);
  
  // Update flattened tasks whenever allTasks changes
  useEffect(() => {
    setFlattenedTasks(flattenTasksWithLevels(allTasks));
  }, [allTasks]);
  
  // Focus input when editing starts
  useEffect(() => {
    if (editingTaskId && editInputRef.current) {
      editInputRef.current.focus();
    }
  }, [editingTaskId]);
  
  // Handle drag start with a better drag image
  const handleDragStart = (taskId: number, e: React.DragEvent) => {
    setDraggedTask(taskId);
    
    // Make the dragged item look nice
    const taskItem = flattenedTasks.find(t => t.id === taskId);
    if (taskItem) {
      // Set the drag ghost image (optional - for better visual feedback)
      const ghostElement = document.createElement('div');
      ghostElement.style.width = '300px';
      ghostElement.style.padding = '8px';
      ghostElement.style.background = 'rgba(255, 255, 255, 0.8)';
      ghostElement.style.border = '1px solid #ccc';
      ghostElement.style.borderRadius = '4px';
      ghostElement.style.boxShadow = '0 2px 10px rgba(0, 0, 0, 0.1)';
      ghostElement.textContent = taskItem.title;
      document.body.appendChild(ghostElement);
      
      e.dataTransfer.setDragImage(ghostElement, 10, 10);
      
      // Clean up after setting the drag image
      setTimeout(() => {
        document.body.removeChild(ghostElement);
      }, 0);
    }
    
    // Store the data for the drag operation
    e.dataTransfer.setData('text/plain', taskId.toString());
    e.dataTransfer.effectAllowed = 'move';
  };
  
  // Handle drag over with improved detection for subtask creation
  const handleDragOver = (e: React.DragEvent, taskId: number) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (taskId === draggedTask) return;
    
    // Change cursor to indicate we can drop here
    e.dataTransfer.dropEffect = 'move';
    
    setDropTarget(taskId);
    
    // Determine drop position based on mouse position
    const rect = e.currentTarget.getBoundingClientRect();
    const mouseY = e.clientY;
    const mouseX = e.clientX;
    
    // Calculate horizontal and vertical position within the task item
    const horizontalMidpoint = rect.left + rect.width / 2;
    const verticalThreshold = rect.top + rect.height / 3;
    
    // If mouse is in right half of the task, make it a subtask
    if (mouseX > horizontalMidpoint) {
      setDropPosition('child');
    } 
    // If in the left half and above the threshold, place it above
    else if (mouseY < verticalThreshold) {
      setDropPosition('above');
    } 
    // Otherwise, place it below
    else {
      setDropPosition('below');
    }
  };
  
  // Handle drag leave more reliably
  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    
    // Only clear if we're leaving the element completely, not entering a child
    const relatedTarget = e.relatedTarget as Element;
    if (!e.currentTarget.contains(relatedTarget)) {
      setDropPosition(null);
      setDropTarget(null);
    }
  };
  
  // Improved drop handler with better task repositioning logic
  const handleDrop = async (e: React.DragEvent, targetId: number) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!draggedTask || draggedTask === targetId || !dropPosition) {
      setDraggedTask(null);
      setDropTarget(null);
      setDropPosition(null);
      return;
    }
    
    const draggedTaskInfo = flattenedTasks.find(t => t.id === draggedTask);
    const targetTaskInfo = flattenedTasks.find(t => t.id === targetId);
    
    if (!draggedTaskInfo || !targetTaskInfo) {
      setDraggedTask(null);
      setDropTarget(null);
      setDropPosition(null);
      return;
    }
    
    try {
      console.log(`Dropping task ${draggedTask} ${dropPosition} task ${targetId}`);
      
      let newParentId: number | null = null;
      let newLevel = 0;
      
      // Set the new parent and level based on drop position
      if (dropPosition === 'child') {
        // Make it a child of the target
        newParentId = targetId;
        newLevel = targetTaskInfo.level + 1;
      } else if (dropPosition === 'above' || dropPosition === 'below') {
        // Make it a sibling (same parent and level as target)
        newParentId = targetTaskInfo.parent_id;
        newLevel = targetTaskInfo.level;
      }
      
      // Ensure we don't exceed maximum level
      if (newLevel > 10) newLevel = 10;
      
      console.log(`Setting parent_id to ${newParentId}, level to ${newLevel}`);
      
      // Update the task in the backend
      await api.put(`tasks/${draggedTask}`, {
        parent_id: newParentId,
        level: newLevel
      });
      
      // Update UI immediately to give feedback
      // This is an optimistic update - we'll reload from server afterward
      setAllTasks(prev => {
        // Create a deep copy to avoid mutation
        const newAllTasks = JSON.parse(JSON.stringify(prev));
        
        // Function to recursively find and remove a task
        const findAndRemoveTask = (tasks: Task[]): { updatedTasks: Task[], removedTask?: Task } => {
          let removedTask: Task | undefined;
          
          const updatedTasks = tasks.filter(task => {
            if (task.id === draggedTask) {
              removedTask = { ...task };
              return false;
            }
            
            if (task.children && task.children.length > 0) {
              const { updatedTasks: newChildren, removedTask: foundTask } = findAndRemoveTask(task.children);
              if (foundTask) {
                removedTask = foundTask;
                task.children = newChildren;
              }
            }
            
            return true;
          });
          
          return { updatedTasks, removedTask };
        };
        
        // Find and remove the dragged task from its current position
        const { updatedTasks, removedTask } = findAndRemoveTask(newAllTasks);
        
        if (!removedTask) return prev; // Task not found
        
        // Update the removed task with new parent and level
        removedTask.parent_id = newParentId;
        removedTask.level = newLevel;
        removedTask.children = removedTask.children || [];
        
        // Function to place the task in its new position
        const placeTask = (tasks: Task[]): Task[] => {
          if (dropPosition === 'child' && targetId !== null) {
            // Find target and add as child
            return tasks.map(task => {
              if (task.id === targetId) {
                return {
                  ...task,
                  expanded: true, // Auto-expand when adding children
                  children: [...(task.children || []), removedTask!]
                };
              }
              
              if (task.children && task.children.length > 0) {
                task.children = placeTask(task.children);
              }
              
              return task;
            });
          } else {
            // Add as a root task if we can't find the parent
            if (newParentId === null) {
              return [...tasks, removedTask!];
            }
            
            // Add as a child of another task
            return tasks.map(task => {
              if (task.id === newParentId) {
                return {
                  ...task,
                  expanded: true,
                  children: [...(task.children || []), removedTask!]
                };
              }
              
              if (task.children && task.children.length > 0) {
                task.children = placeTask(task.children);
              }
              
              return task;
            });
          }
        };
        
        return placeTask(updatedTasks);
      });
      
      // Fetch updated tasks from server to ensure consistency
      const fetchedTasks = await api.get(`task-lists/${listId}/tasks`);
      
      // Convert to our format with default values
      const tasksWithDefaults = fetchedTasks.map((task: any) => ({
        ...task,
        level: task.level || 0,
        expanded: true,
        priority: task.priority || 'medium',
        children: [],
      }));
      
      // Build hierarchical structure
      const hierarchicalTasks = buildTaskHierarchy(tasksWithDefaults);
      setAllTasks(hierarchicalTasks);
    } catch (error) {
      console.error("Error updating task hierarchy:", error);
    } finally {
      setDraggedTask(null);
      setDropTarget(null);
      setDropPosition(null);
    }
  };
  
  // Add a new task
  const handleAddTask = async (e: React.FormEvent, parentId?: number) => {
    e.preventDefault();
    if (!newTaskTitle.trim() || !listId) return;
    
    try {
      // Add console logging to debug
      console.log("Adding task:", { 
        title: newTaskTitle, 
        completed: false, 
        parent_id: parentId || null,
        level: parentId ? 1 : 0,
        priority: newTaskPriority
      });
      
      const newTask = await api.post(`task-lists/${listId}/tasks`, {
        title: newTaskTitle,
        completed: false,
        parent_id: parentId || null,
        level: parentId ? 1 : 0,
        priority: newTaskPriority
      });
      
      console.log("Task creation response:", newTask);
      
      // Check for valid response
      if (!newTask || !newTask.id) {
        throw new Error("Invalid response from server when creating task");
      }
      
      // Create a properly formatted task object
      const taskWithDefaults = {
        ...newTask,
        expanded: true,
        children: [],
        level: newTask.level || (parentId ? 1 : 0),
        priority: newTask.priority || newTaskPriority
      };
      
      if (parentId) {
        // Add as a child to the specified parent
        setAllTasks(prev => {
          // Create a deep copy to avoid mutation issues
          const newAllTasks = JSON.parse(JSON.stringify(prev));
          
          // Find and update the parent task recursively
          const updateTaskWithChild = (tasks: Task[]): Task[] => {
            return tasks.map(task => {
              if (task.id === parentId) {
                return {
                  ...task,
                  expanded: true, // Auto-expand parent
                  children: [...(task.children || []), taskWithDefaults]
                };
              }
              if (task.children && task.children.length > 0) {
                return {
                  ...task,
                  children: updateTaskWithChild(task.children)
                };
              }
              return task;
            });
          };
          
          return updateTaskWithChild(newAllTasks);
        });
      } else {
        // Add as a root task
        setAllTasks(prev => [...prev, taskWithDefaults]);
      }
      
      // Reset the input field and priority
      setNewTaskTitle("");
      setNewTaskPriority("medium"); // Reset priority to default
    } catch (error) {
      console.error("Error adding task:", error);
    }
  };
  
  // Toggle task completion
  const handleToggleTask = async (taskId: number, completed: boolean) => {
    try {
      await api.put(`tasks/${taskId}`, {
        completed: !completed
      });
      
      // Update task in state
      setAllTasks(prev => {
        // Update task recursively
        const updateTask = (tasks: Task[]): Task[] => {
          return tasks.map(task => {
            if (task.id === taskId) {
              return { ...task, completed: !completed };
            }
            if (task.children && task.children.length > 0) {
              return {
                ...task,
                children: updateTask(task.children)
              };
            }
            return task;
          });
        };
        
        return updateTask(prev);
      });
    } catch (error) {
      console.error("Error updating task:", error);
    }
  };
  
  // Updated handle delete function
  const handleDeleteTask = (taskId: number) => {
    // Find the task to see if it has children
    const taskToDelete = flattenedTasks.find(t => t.id === taskId);
    if (!taskToDelete) return;
    
    // Check if it has children
    const hasChildren = allTasks.some(task => {
      const checkForChildren = (t: Task): boolean => {
        if (t.id === taskId && t.children && t.children.length > 0) {
          return true;
        }
        if (t.children && t.children.length > 0) {
          return t.children.some(checkForChildren);
        }
        return false;
      };
      
      return checkForChildren(task);
    });
    
    if (hasChildren) {
      // Show confirmation dialog if it has children
      setTaskToDelete({ id: taskId, hasChildren });
      setShowDeleteConfirm(true);
    } else {
      // Directly delete if no children
      deleteTask(taskId);
    }
  };
  
  // Function to actually delete a task
  const deleteTask = async (taskId: number) => {
    try {
      await api.delete(`tasks/${taskId}`);
      
      // Remove from state
      setAllTasks(prev => {
        // Remove task recursively
        const removeTask = (tasks: Task[]): Task[] => {
          return tasks.filter(task => {
            if (task.id === taskId) return false;
            if (task.children && task.children.length > 0) {
              task.children = removeTask(task.children);
            }
            return true;
          });
        };
        
        return removeTask(prev);
      });
    } catch (error) {
      console.error("Error deleting task:", error);
    }
  };
  
  // Toggle expansion of a task with children
  const handleToggleExpand = (taskId: number) => {
    setAllTasks(prev => {
      // Toggle expansion recursively
      const toggleExpansion = (tasks: Task[]): Task[] => {
        return tasks.map(task => {
          if (task.id === taskId) {
            return { ...task, expanded: !task.expanded };
          }
          if (task.children && task.children.length > 0) {
            return {
              ...task,
              children: toggleExpansion(task.children)
            };
          }
          return task;
        });
      };
      
      return toggleExpansion(prev);
    });
  };
  
  // Start editing a task
  const handleStartEditing = (taskId: number, currentTitle: string) => {
    setEditingTaskId(taskId);
    setEditingTitle(currentTitle);
  };
  
  // Save edited task
  const handleSaveEdit = async (taskId: number) => {
    if (!editingTitle.trim()) {
      setEditingTaskId(null);
      return;
    }
    
    try {
      await api.put(`tasks/${taskId}`, {
        title: editingTitle
      });
      
      // Update task in state
      setAllTasks(prev => {
        // Update task recursively
        const updateTask = (tasks: Task[]): Task[] => {
          return tasks.map(task => {
            if (task.id === taskId) {
              return { ...task, title: editingTitle };
            }
            if (task.children && task.children.length > 0) {
              return {
                ...task,
                children: updateTask(task.children)
              };
            }
            return task;
          });
        };
        
        return updateTask(prev);
      });
    } catch (error) {
      console.error("Error updating task:", error);
    } finally {
      setEditingTaskId(null);
    }
  };
  
  // Function for handling deletion with/without subtasks
  const handleDeleteWithSubtasks = async () => {
    if (!taskToDelete) return;
    
    try {
      await api.delete(`tasks/${taskToDelete.id}`);
      
      // Remove task and all its children from state
      setAllTasks(prev => {
        const removeTask = (tasks: Task[]): Task[] => {
          return tasks.filter(task => {
            if (task.id === taskToDelete.id) return false;
            if (task.children && task.children.length > 0) {
              task.children = removeTask(task.children);
            }
            return true;
          });
        };
        
        return removeTask(prev);
      });
    } catch (error) {
      console.error("Error deleting task:", error);
    } finally {
      setTaskToDelete(null);
      setShowDeleteConfirm(false);
    }
  };

  const handleDeleteWithoutSubtasks = async () => {
    if (!taskToDelete) return;
    
    try {
      // Custom API call to delete task but keep children
      await api.post(`tasks/${taskToDelete.id}/delete-keep-children`, {});
      
      // Update state - find children and move them up a level
      setAllTasks(prev => {
        // Find the task and its children
        let foundChildren: Task[] = [];
        let parentId: number | null = null;
        
        const findTaskAndGetChildren = (tasks: Task[]): Task[] => {
          return tasks.filter(task => {
            if (task.id === taskToDelete.id) {
              foundChildren = task.children || [];
              parentId = task.parent_id;
              return false;
            }
            if (task.children && task.children.length > 0) {
              task.children = findTaskAndGetChildren(task.children);
            }
            return true;
          });
        };
        
        let updatedTasks = findTaskAndGetChildren(prev);
        
        // Promote children to the parent's level
        if (foundChildren.length > 0) {
          // Update the children's parent and level
          const updatedChildren = foundChildren.map(child => ({
            ...child,
            parent_id: parentId,
            level: parentId ? 1 : 0 // If no parent, make it root level
          }));
          
          // Add the children back to the tree at the appropriate level
          if (parentId) {
            // Find the parent and add the children to it
            const addChildrenToParent = (tasks: Task[]): Task[] => {
              return tasks.map(task => {
                if (task.id === parentId) {
                  return {
                    ...task,
                    children: [...(task.children || []), ...updatedChildren]
                  };
                }
                if (task.children && task.children.length > 0) {
                  task.children = addChildrenToParent(task.children);
                }
                return task;
              });
            };
            
            updatedTasks = addChildrenToParent(updatedTasks);
          } else {
            // Add to root level
            updatedTasks = [...updatedTasks, ...updatedChildren];
          }
        }
        
        return updatedTasks;
      });
    } catch (error) {
      console.error("Error deleting task:", error);
    } finally {
      setTaskToDelete(null);
      setShowDeleteConfirm(false);
    }
  };
  
  // NEW FUNCTIONS FOR DUE DATE AND TAGS
  
  // Open the due date dialog for a specific task
  const handleOpenDueDateDialog = (taskId: number) => {
    const task = flattenedTasks.find(t => t.id === taskId);
    if (task) {
      setSelectedTaskId(taskId);
      setSelectedDueDate(formatDateForInput(task.due_date));
      setShowDueDateDialog(true);
    }
  };
  
  // Save the due date for a task
  const handleSaveDueDate = async () => {
    if (!selectedTaskId) return;
    
    try {
      await api.put(`tasks/${selectedTaskId}`, {
        due_date: selectedDueDate || null
      });
      
      // Update task in state
      setAllTasks(prev => {
        // Update task recursively
        const updateTask = (tasks: Task[]): Task[] => {
          return tasks.map(task => {
            if (task.id === selectedTaskId) {
              return { ...task, due_date: selectedDueDate || null };
            }
            if (task.children && task.children.length > 0) {
              return {
                ...task,
                children: updateTask(task.children)
              };
            }
            return task;
          });
        };
        
        return updateTask(prev);
      });
    } catch (error) {
      console.error("Error updating task due date:", error);
    } finally {
      setShowDueDateDialog(false);
      setSelectedTaskId(null);
    }
  };
  
  // Open the tags dialog for a specific task
  const handleOpenTagsDialog = (taskId: number) => {
    const task = flattenedTasks.find(t => t.id === taskId);
    if (task) {
      setSelectedTaskId(taskId);
      setSelectedTags(task.tags || []);
      setShowTagsDialog(true);
    }
  };
  
  // Add a new tag to the selected task
  const handleAddTag = () => {
    if (!newTag.trim()) return;
    
    // Check if the tag is already in the list
    if (!selectedTags.includes(newTag) && !availableTags.includes(newTag)) {
      // Add to available tags if it's a new tag
      setAvailableTags(prev => [...prev, newTag]);
    }
    
    // Add to selected tags if not already there
    if (!selectedTags.includes(newTag)) {
      setSelectedTags(prev => [...prev, newTag]);
    }
    
    setNewTag("");
  };
  
  // Toggle a tag selection
  const handleToggleTag = (tag: string) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(prev => prev.filter(t => t !== tag));
    } else {
      setSelectedTags(prev => [...prev, tag]);
    }
  };
  
  // Remove a tag from the selected task
  const handleRemoveTag = (tag: string) => {
    setSelectedTags(prev => prev.filter(t => t !== tag));
  };
  
  // Save the tags for a task
  const handleSaveTags = async () => {
    if (!selectedTaskId) return;
    
    try {
      await api.put(`tasks/${selectedTaskId}`, {
        tags: selectedTags
      });
      
      // Update task in state
      setAllTasks(prev => {
        // Update task recursively
        const updateTask = (tasks: Task[]): Task[] => {
          return tasks.map(task => {
            if (task.id === selectedTaskId) {
              return { ...task, tags: selectedTags };
            }
            if (task.children && task.children.length > 0) {
              return {
                ...task,
                children: updateTask(task.children)
              };
            }
            return task;
          });
        };
        
        return updateTask(prev);
      });
    } catch (error) {
      console.error("Error updating task tags:", error);
    } finally {
      setShowTagsDialog(false);
      setSelectedTaskId(null);
    }
  };
  
  // Get drop highlight class - now with right side highlight for subtasks
  const getDropHighlightClass = (taskId: number) => {
    if (dropTarget !== taskId || draggedTask === taskId) return '';
    
    switch (dropPosition) {
      case 'above':
        return 'border-t-2 border-t-primary';
      case 'below':
        return 'border-b-2 border-b-primary';
      case 'child':
        return 'border-r-4 border-r-primary'; // Highlight right border for subtasks
      default:
        return '';
    }
  };
  
  // Filtered tasks based on current filter
  const filteredTasks = flattenedTasks.filter(task => {
    if (filter === 'all') return true;
    if (filter === 'completed') return task.completed;
    if (filter === 'active') return !task.completed;
    return true;
  });
  
  // Calculate due dates
  const getDueStatus = (dueDate?: string | null) => {
    if (!dueDate) return null;
    
    const today = new Date();
    const due = new Date(dueDate);
    
    if (due < today) return 'overdue';
    
    const diffTime = Math.abs(due.getTime() - today.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays <= 2) return 'soon';
    return 'upcoming';
  };
  
  // Get priority class
  const getPriorityClass = (priority?: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300';
      case 'medium': return 'bg-amber-100 text-amber-800 dark:bg-amber-900/20 dark:text-amber-300';
      case 'low': return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300';
      default: return 'bg-slate-100 text-slate-800 dark:bg-slate-900/20 dark:text-slate-300';
    }
  };
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Card className="w-[50px] h-[50px] flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-primary"></div>
        </Card>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      <Card className="overflow-hidden">
        <CardHeader className="pb-3 flex flex-row items-center space-x-4">
          <div className="flex-1">
            <CardTitle className="text-2xl font-bold">
              {taskList?.title || "Task List"}
            </CardTitle>
            <CardDescription className="text-sm text-muted-foreground">
              {taskList?.description || 
                `Created on ${taskList?.created_at ? 
                  formatDate(taskList.created_at) : 
                  formatDate(new Date().toISOString())}`
              }
            </CardDescription>
          </div>
          <div>
            <Badge variant="outline" className="mr-2 px-3 py-1 rounded-full">
              {`${flattenedTasks.filter(t => t.completed).length}/${flattenedTasks.length}`} tasks
            </Badge>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <MoreHorizontal className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Filter Tasks</DropdownMenuLabel>
                <DropdownMenuItem onClick={() => setFilter('all')} className={filter === 'all' ? 'bg-accent' : ''}>
                  All Tasks
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setFilter('active')} className={filter === 'active' ? 'bg-accent' : ''}>
                  Active Tasks
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setFilter('completed')} className={filter === 'completed' ? 'bg-accent' : ''}>
                  Completed Tasks
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="px-6 pt-2 pb-3">
            <Progress value={progress} className="h-2 w-full" />
            <span className="mt-1 text-xs text-muted-foreground block text-right">
              {progress}% complete
            </span>
          </div>
          <Separator />
          <div className="p-6">

            <form onSubmit={(e) => handleAddTask(e)} className="flex space-x-2 mb-6">
                <Input
                    placeholder="Add a new task..."
                    value={newTaskTitle}
                    onChange={(e) => setNewTaskTitle(e.target.value)}
                    className="flex-1"
                />
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="w-[120px]">
                        {newTaskPriority.charAt(0).toUpperCase() + newTaskPriority.slice(1)}
                        <ChevronDown className="ml-2 h-4 w-4" />
                    </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                    <DropdownMenuLabel>Priority</DropdownMenuLabel>
                    <DropdownMenuItem 
                        onClick={() => setNewTaskPriority('low')}
                        className={newTaskPriority === 'low' ? 'bg-accent' : ''}
                    >
                        <Badge className={getPriorityClass('low') + " mr-2"}>Low</Badge>
                        Low Priority
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                        onClick={() => setNewTaskPriority('medium')}
                        className={newTaskPriority === 'medium' ? 'bg-accent' : ''}
                    >
                        <Badge className={getPriorityClass('medium') + " mr-2"}>Medium</Badge>
                        Medium Priority
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                        onClick={() => setNewTaskPriority('high')}
                        className={newTaskPriority === 'high' ? 'bg-accent' : ''}
                    >
                        <Badge className={getPriorityClass('high') + " mr-2"}>High</Badge>
                        High Priority
                    </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
                <Button type="submit">
                    <PlusCircle className="h-4 w-4 mr-2" />
                    Add Task
                </Button>
            </form>
            <ScrollArea className="h-[500px] pr-4">
              <div className="space-y-2">
                {filteredTasks.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">No tasks found. Add one above!</p>
                  </div>
                ) : (
                  filteredTasks.map(task => (
                    <div 
                      key={task.id}
                      className={cn(
                        "flex items-center rounded-lg border p-3 transition-all",
                        "hover:bg-muted/30 relative group",
                        draggedTask === task.id ? "opacity-50 border-dashed" : "",
                        getDropHighlightClass(task.id),
                        task.completed ? "bg-muted/10" : ""
                      )}
                      style={{ marginLeft: `${task.level * 24}px`, width: `calc(100% - ${task.level * 24}px)` }}
                      draggable
                      onDragStart={(e) => handleDragStart(task.id, e)}
                      onDragOver={(e) => handleDragOver(e, task.id)}
                      onDragLeave={handleDragLeave}
                      onDragEnd={() => {
                        setDraggedTask(null);
                        setDropTarget(null);
                        setDropPosition(null);
                      }}
                      onDrop={(e) => handleDrop(e, task.id)}
                    >
                      {/* Right side highlight for subtask indication */}
                      {dropTarget === task.id && dropPosition === 'child' && (
                        <div className="absolute right-0 top-0 bottom-0 w-1.5 bg-primary rounded-r-lg opacity-70"></div>
                      )}
                      
                      {/* Drag handle */}
                      <div 
                        className="flex items-center justify-center cursor-grab opacity-0 group-hover:opacity-100 mr-2"
                        onMouseDown={(e) => e.stopPropagation()}  // Prevent checkbox toggle on drag
                      >
                        <GripVertical className="h-4 w-4 text-muted-foreground" />
                      </div>
                      
                      {/* Checkbox */}
                      <Checkbox 
                        checked={task.completed}
                        onCheckedChange={() => handleToggleTask(task.id, task.completed)}
                        id={`task-${task.id}`}
                        className="mr-2"
                      />
                      
                      {/* Task content */}
                      <div className="flex-1 min-w-0">
                        {editingTaskId === task.id ? (
                          <form 
                            onSubmit={(e) => {
                              e.preventDefault();
                              handleSaveEdit(task.id);
                            }}
                            className="flex w-full space-x-1"
                          >
                            <Input
                              ref={editInputRef}
                              value={editingTitle}
                              onChange={(e) => setEditingTitle(e.target.value)}
                              className="h-7 flex-1"
                              onBlur={() => handleSaveEdit(task.id)}
                            />
                            <Button type="submit" size="sm" className="h-7 px-2">
                              Save
                            </Button>
                          </form>
                        ) : (
                          <label 
                            htmlFor={`task-${task.id}`}
                            className={cn(
                              "text-sm cursor-pointer block truncate",
                              task.completed ? 'line-through text-muted-foreground' : ''
                            )}
                          >
                            {task.title}
                          </label>
                        )}
                        
                        {/* Task details/metadata */}
                        <div className="flex items-center flex-wrap gap-2 mt-1 text-xs text-muted-foreground">
                          {task.priority && (
                            <Badge variant="outline" className={cn("text-xs px-1 py-0", getPriorityClass(task.priority))}>
                              {task.priority}
                            </Badge>
                          )}
                          
                          {task.due_date && (
                            <Badge 
                              variant="outline" 
                              className={cn(
                                "text-xs flex items-center gap-1 px-1 py-0",
                                getDueStatus(task.due_date) === 'overdue' ? 'text-red-500 border-red-200' : 
                                getDueStatus(task.due_date) === 'soon' ? 'text-amber-500 border-amber-200' : 
                                'text-green-500 border-green-200'
                              )}
                            >
                              <Calendar className="h-3 w-3" />
                              {formatDate(task.due_date)}
                            </Badge>
                          )}
                          
                          {/* Display tags */}
                          {task.tags && task.tags.length > 0 && task.tags.map((tag, index) => (
                            <Badge 
                              key={`${task.id}-tag-${index}`}
                              variant="secondary" 
                              className="text-xs px-1 py-0 bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300"
                            >
                              <Tag className="h-3 w-3 mr-1" />
                              {tag}
                            </Badge>
                          ))}
                          
                          {task.description && (
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger>
                                  <AlignLeft className="h-3 w-3" />
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p className="max-w-xs">{task.description}</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          )}
                          
                          {task.children && task.children.length > 0 && (
                            <span className="flex items-center gap-1">
                              <ChevronDown className="h-3 w-3" />
                              {task.children.length} subtask{task.children.length > 1 ? 's' : ''}
                            </span>
                          )}
                        </div>
                      </div>
                      
                      {/* Task actions */}
                      <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8"
                          onClick={() => handleStartEditing(task.id, task.title)}
                        >
                          <Edit3 className="h-4 w-4 text-muted-foreground" />
                        </Button>
                        
                        {/* Expand/collapse button for tasks with children - now on the right */}
                        {(task.children && task.children.length > 0) && (
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8"
                            onClick={() => handleToggleExpand(task.id)}
                          >
                            <ChevronRight className={`h-4 w-4 transition-transform ${task.expanded ? 'rotate-90' : ''}`} />
                          </Button>
                        )}
                        
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem 
                              onClick={(e) => {
                                e.preventDefault();
                                setNewTaskTitle("");
                                setNewTaskPriority("medium");
                                handleAddTask(e, task.id);
                              }}
                            >
                              <PlusCircle className="h-4 w-4 mr-2" />
                              Add Subtask
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => handleOpenDueDateDialog(task.id)}>
                              <Calendar className="h-4 w-4 mr-2" />
                              Set Due Date
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleOpenTagsDialog(task.id)}>
                              <Tag className="h-4 w-4 mr-2" />
                              Add Tags
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem 
                              onClick={() => handleDeleteTask(task.id)}
                              className="text-red-500 focus:text-red-500"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete Task
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between border-t p-4">
          <Button variant="outline" onClick={() => setFilter('all')}>
            <span className="mr-1">All</span>
            <Badge className="ml-1">{flattenedTasks.length}</Badge>
          </Button>
          <Button variant="outline" onClick={() => setFilter('active')}>
            <span className="mr-1">Active</span>
            <Badge className="ml-1">{flattenedTasks.filter(t => !t.completed).length}</Badge>
          </Button>
          <Button variant="outline" onClick={() => setFilter('completed')}>
            <span className="mr-1">Completed</span>
            <Badge className="ml-1">{flattenedTasks.filter(t => t.completed).length}</Badge>
          </Button>
        </CardFooter>
      </Card>
      
      {/* Task information card */}
      <Card>
        <CardHeader>
          <CardTitle>Task Information</CardTitle>
          <CardDescription>Overview of this task list</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
            <div className="space-y-2">
              <h3 className="text-sm font-medium">Created</h3>
              <p className="text-sm text-muted-foreground">
                {taskList?.created_at ? 
                  formatDate(taskList.created_at) : 
                  formatDate(new Date().toISOString())}
              </p>
            </div>
            <div className="space-y-2">
              <h3 className="text-sm font-medium">Progress</h3>
              <div className="flex items-center">
                <Progress value={progress} className="h-2 w-full max-w-24" />
                <span className="ml-2 text-sm text-muted-foreground">{progress}%</span>
              </div>
            </div>
            <div className="space-y-2">
              <h3 className="text-sm font-medium">Tasks</h3>
              <p className="text-sm text-muted-foreground">
                {flattenedTasks.filter(t => t.completed).length} of {flattenedTasks.length} completed
              </p>
            </div>
            <div className="space-y-2">
              <h3 className="text-sm font-medium">Subtasks</h3>
              <p className="text-sm text-muted-foreground">
                {flattenedTasks.filter(t => t.parent_id !== null).length} nested tasks
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Instructions card */}
      <Card>
        <CardHeader>
          <CardTitle>Task Management Instructions</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="list-disc pl-6 space-y-2 text-sm text-muted-foreground">
            <li>Drag and drop tasks to reorder them</li>
            <li>Drag a task to the right half of another task to make it a subtask</li>
            <li>Click the arrow icon to expand or collapse subtasks</li>
            <li>Click the "Add Subtask" option in the dropdown menu to add nested tasks</li>
            <li>Tasks can be nested up to 10 levels deep for complex hierarchies</li>
            <li>Use the filters at the bottom to view different task groups</li>
            <li>Set due dates and add tags to better organize your tasks</li>
          </ul>
        </CardContent>
      </Card>
      
      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Task</AlertDialogTitle>
            <AlertDialogDescription>
              This task has subtasks. Do you want to delete all subtasks as well?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteWithoutSubtasks}
              className="bg-orange-600 hover:bg-orange-700"
            >
              Keep Subtasks
            </AlertDialogAction>
            <AlertDialogAction 
              onClick={handleDeleteWithSubtasks}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete All
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      {/* Due Date Dialog */}
      <Dialog open={showDueDateDialog} onOpenChange={setShowDueDateDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Set Due Date</DialogTitle>
            <DialogDescription>
              Choose a due date for this task.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <label htmlFor="due-date" className="text-right">
                Due Date
              </label>
              <div className="col-span-3">
                <Input
                  id="due-date"
                  type="date"
                  value={selectedDueDate}
                  onChange={(e) => setSelectedDueDate(e.target.value)}
                  className="w-full"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setSelectedDueDate("");
                handleSaveDueDate();
              }}
            >
              Clear Date
            </Button>
            <Button onClick={handleSaveDueDate}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Tags Dialog */}
      <Dialog open={showTagsDialog} onOpenChange={setShowTagsDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Manage Tags</DialogTitle>
            <DialogDescription>
              Add or remove tags for this task.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            {/* Current tags */}
            <div className="space-y-2">
              <label className="text-sm font-medium">
                Current Tags
              </label>
              <div className="flex flex-wrap gap-2">
                {selectedTags.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No tags added yet</p>
                ) : (
                  selectedTags.map((tag, index) => (
                    <Badge 
                      key={`selected-tag-${index}`}
                      variant="secondary"
                      className="flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300"
                    >
                      {tag}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-4 w-4 ml-1 p-0"
                        onClick={() => handleRemoveTag(tag)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </Badge>
                  ))
                )}
              </div>
            </div>
            
            {/* Add new tag */}
            <div className="space-y-2">
              <label className="text-sm font-medium">
                Add New Tag
              </label>
              <div className="flex space-x-2">
                <Input
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  placeholder="Enter tag name"
                  className="flex-1"
                />
                <Button onClick={handleAddTag}>
                  Add
                </Button>
              </div>
            </div>
            
            {/* Suggested tags */}
            <div className="space-y-2">
              <label className="text-sm font-medium">
                Suggested Tags
              </label>
              <div className="flex flex-wrap gap-2">
                {availableTags
                  .filter(tag => !selectedTags.includes(tag))
                  .map((tag, index) => (
                    <Badge
                      key={`suggested-tag-${index}`}
                      variant="outline"
                      className="cursor-pointer hover:bg-accent"
                      onClick={() => handleToggleTag(tag)}
                    >
                      {tag}
                    </Badge>
                  ))
                }
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowTagsDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveTags}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TaskPage;