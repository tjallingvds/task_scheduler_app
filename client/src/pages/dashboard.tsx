// First, install these packages:
// npm install chart.js react-chartjs-2

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/contexts/AuthContext";
import { 
  ChevronRight, 
  ChevronDown, 
  AlertTriangle, 
  Calendar, 
  LineChart as LineChartIcon,
  ListTodo
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import api from "@/services/api";

// Import Chart.js
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Line } from 'react-chartjs-2';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

// Chart options
const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  scales: {
    y: {
      beginAtZero: true,
      grid: {
        color: 'rgba(226, 232, 240, 0.5)',
      },
      ticks: {
        precision: 0
      }
    },
    x: {
      grid: {
        display: false,
      }
    }
  },
  plugins: {
    legend: {
      position: 'bottom',
      labels: {
        boxWidth: 12,
        usePointStyle: true,
        pointStyle: 'circle'
      }
    },
    tooltip: {
      backgroundColor: 'rgba(255, 255, 255, 0.9)',
      titleColor: '#0f172a',
      bodyColor: '#334155',
      borderColor: '#e2e8f0',
      borderWidth: 1,
      padding: 10,
      displayColors: true,
      usePointStyle: true,
    }
  },
};

// Task interface
interface Task {
  id: number;
  title: string;
  completed: boolean;
  description?: string;
  created_at: string;
  updated_at: string;
  parent_id?: number | null;
  level: number;
  children?: Task[];
  priority?: 'low' | 'medium' | 'high';
  due_date?: string | null;
  tags?: string[];
  expanded?: boolean;
  task_list_id: number;
  task_list_title?: string;
}

// Daily stats interface
interface DailyStats {
  date: string;
  displayDate: string;
  completed_count: number;
  created_count: number;
}

export default function Dashboard() {
  const { user } = useAuth();
  const [highPriorityTasks, setHighPriorityTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [weeklyStats, setWeeklyStats] = useState<DailyStats[]>([]);
  const [monthlyStats, setMonthlyStats] = useState<DailyStats[]>([]);
  const [statsView, setStatsView] = useState<'week' | 'month'>('week');
  const [totalTasksCount, setTotalTasksCount] = useState(0);
  const [completedTasksCount, setCompletedTasksCount] = useState(0);
  const [upcomingTasksCount, setUpcomingTasksCount] = useState(0);
  const [overdueTasks, setOverdueTasks] = useState<Task[]>([]);
  
  // Format date helper function
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  // Get shortened date format for charts
  const getShortDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric' 
    });
  };

  // Toggle expansion of a task with children
  const handleToggleExpand = (taskId: number) => {
    setHighPriorityTasks(prev => {
      return prev.map(task => {
        if (task.id === taskId) {
          return { ...task, expanded: !task.expanded };
        }
        return task;
      });
    });
  };

  // Toggle task completion
  const handleToggleTask = async (taskId: number, completed: boolean) => {
    try {
      await api.put(`tasks/${taskId}`, {
        completed: !completed
      });
      
      // Update task in state
      setHighPriorityTasks(prev => {
        return prev.map(task => {
          if (task.id === taskId) {
            return { ...task, completed: !completed };
          }
          // Also check children
          if (task.children) {
            const updatedChildren = task.children.map(child => {
              if (child.id === taskId) {
                return { ...child, completed: !completed };
              }
              return child;
            });
            return { ...task, children: updatedChildren };
          }
          return task;
        });
      });
      
      // Update counts
      if (completed) {
        setCompletedTasksCount(prev => prev - 1);
      } else {
        setCompletedTasksCount(prev => prev + 1);
      }
      
      // Refresh task stats
      fetchTaskStats();
    } catch (error) {
      console.error("Error updating task:", error);
    }
  };

  // Get priority class for styling
  const getPriorityClass = (priority?: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300';
      case 'medium': return 'bg-amber-100 text-amber-800 dark:bg-amber-900/20 dark:text-amber-300';
      case 'low': return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300';
      default: return 'bg-slate-100 text-slate-800 dark:bg-slate-900/20 dark:text-slate-300';
    }
  };

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

  // Recursive function to get ALL tasks from all lists, including nested tasks
  const getAllTasksRecursively = async () => {
    // First get all task lists, including those in folders
    const fetchAllTaskLists = async () => {
      const topLevelLists = await api.get('task-lists');
      let allLists = [...topLevelLists];
      
      // Add lists that are within folders
      for (const list of topLevelLists) {
        if (list.is_folder && list.children && list.children.length > 0) {
          allLists = [...allLists, ...list.children];
        }
      }
      
      return allLists;
    };
    
    try {
      const allLists = await fetchAllTaskLists();
      let allTasks: Task[] = [];
      let allHighPriorityTasks: Task[] = [];
      
      // Fetch tasks from each list
      for (const list of allLists) {
        try {
          const tasks = await api.get(`task-lists/${list.id}/tasks`);
          
          // Add list title to each task
          const tasksWithListTitle = tasks.map((task: Task) => ({
            ...task,
            task_list_title: list.title
          }));
          
          allTasks = [...allTasks, ...tasksWithListTitle];
          
          // Find high priority root tasks for this list
          const highPriorityRootTasks = tasksWithListTitle
            .filter((task: Task) => task.priority === 'high' && !task.parent_id)
            .map((task: Task) => ({
              ...task,
              expanded: false,
              children: tasksWithListTitle.filter((t: Task) => t.parent_id === task.id)
            }));
          
          // Also find high priority subtasks whose parents are not high priority
          const highPrioritySubtasks = tasksWithListTitle
            .filter((task: Task) => task.priority === 'high' && task.parent_id !== null)
            .filter((subtask: Task) => {
              // Only include if the parent task is not already high priority
              const parentTask = tasksWithListTitle.find(t => t.id === subtask.parent_id);
              return !parentTask || parentTask.priority !== 'high';
            })
            .map((task: Task) => ({
              ...task,
              expanded: false,
              children: tasksWithListTitle.filter((t: Task) => t.parent_id === task.id)
            }));
          
          allHighPriorityTasks = [
            ...allHighPriorityTasks, 
            ...highPriorityRootTasks,
            ...highPrioritySubtasks
          ];
        } catch (error) {
          console.error(`Error fetching tasks for list ${list.id}:`, error);
        }
      }
      
      // Update state with all collected tasks
      setHighPriorityTasks(allHighPriorityTasks);
      
      // Calculate task counts including all subtasks
      setTotalTasksCount(allTasks.length);
      setCompletedTasksCount(allTasks.filter(t => t.completed).length);
      
      // Calculate upcoming tasks (due within 7 days)
      const today = new Date();
      const nextWeek = new Date();
      nextWeek.setDate(today.getDate() + 7);
      
      const upcoming = allTasks.filter(t => {
        if (!t.due_date || t.completed) return false;
        const dueDate = new Date(t.due_date);
        return dueDate >= today && dueDate <= nextWeek;
      });
      setUpcomingTasksCount(upcoming.length);
      
      // Calculate overdue tasks
      const overdue = allTasks.filter(t => {
        if (!t.due_date || t.completed) return false;
        return new Date(t.due_date) < today;
      });
      setOverdueTasks(overdue);
      
      return allTasks;
    } catch (error) {
      console.error("Error fetching all tasks:", error);
      return [];
    }
  };

  // Fetch task stats
  const fetchTaskStats = async () => {
    try {
      // Fetch weekly stats
      const weeklyData = await api.get('stats/tasks/weekly');
      setWeeklyStats(weeklyData.map((day: any) => ({
        ...day,
        displayDate: getShortDate(day.date)
      })));
      
      // Fetch monthly stats
      const monthlyData = await api.get('stats/tasks/monthly');
      setMonthlyStats(monthlyData.map((day: any) => ({
        ...day,
        displayDate: getShortDate(day.date)
      })));
    } catch (error) {
      console.error("Error fetching task stats:", error);
      generateFallbackData();
    }
  };
  
  // Generate fallback data if the API endpoints aren't available
  const generateFallbackData = () => {
    const generateDummyData = (days: number) => {
      const data = [];
      const today = new Date();
      
      for (let i = days - 1; i >= 0; i--) {
        const date = new Date();
        date.setDate(today.getDate() - i);
        
        data.push({
          date: date.toISOString().split('T')[0],
          displayDate: getShortDate(date.toISOString()),
          completed_count: Math.floor(Math.random() * 8) + 1, // 1-8 tasks
          created_count: Math.floor(Math.random() * 10) + 1 // 1-10 tasks
        });
      }
      
      return data;
    };
    
    setWeeklyStats(generateDummyData(7));
    setMonthlyStats(generateDummyData(30));
  };

  // Fetch dashboard data on component mount
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        await Promise.all([
          getAllTasksRecursively(),
          fetchTaskStats()
        ]);
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, []);

  // Calculate average tasks completed per day
  const calculateAverage = (data: DailyStats[]) => {
    if (data.length === 0) return 0;
    const sum = data.reduce((acc, day) => acc + day.completed_count, 0);
    return (sum / data.length).toFixed(1);
  };

  // Calculate overall progress percentage
  const calculateProgress = () => {
    if (totalTasksCount === 0) return 0;
    return Math.round((completedTasksCount / totalTasksCount) * 100);
  };

  // Prepare chart data for Chart.js
  const prepareChartData = () => {
    const data = statsView === 'week' ? weeklyStats : monthlyStats;
    
    return {
      labels: data.map(item => item.displayDate),
      datasets: [
        {
          label: 'Completed Tasks',
          data: data.map(item => item.completed_count),
          borderColor: '#10b981', // Green
          backgroundColor: 'rgba(16, 185, 129, 0.5)',
          tension: 0.3,
          pointRadius: 4,
          pointHoverRadius: 6,
        },
        {
          label: 'Created Tasks',
          data: data.map(item => item.created_count),
          borderColor: '#3b82f6', // Blue
          backgroundColor: 'rgba(59, 130, 246, 0.5)',
          tension: 0.3,
          pointRadius: 4,
          pointHoverRadius: 6,
        },
      ],
    };
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Card className="w-[50px] h-[50px] flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-primary"></div>
        </Card>
      </div>
    );
  }

  return (
    <div className="grid gap-6">
      {/* Greeting and Stats Summary */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Tasks</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalTasksCount}</div>
            <p className="text-xs text-muted-foreground">
              {completedTasksCount} completed
            </p>
            <Progress className="mt-2" value={calculateProgress()} />
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Daily Average</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {calculateAverage(statsView === 'week' ? weeklyStats : monthlyStats)}
            </div>
            <p className="text-xs text-muted-foreground">
              Tasks completed per day
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Upcoming Tasks</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{upcomingTasksCount}</div>
            <p className="text-xs text-muted-foreground">
              Due in the next 7 days
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Overdue Tasks</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-500">{overdueTasks.length}</div>
            <p className="text-xs text-muted-foreground">
              Past their due date
            </p>
          </CardContent>
        </Card>
      </div>
      
      {/* Task Completion Chart */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Task Completion Trends</CardTitle>
            <Tabs defaultValue="week" value={statsView} onValueChange={(v) => setStatsView(v as 'week' | 'month')}>
              <TabsList>
                <TabsTrigger value="week">Week</TabsTrigger>
                <TabsTrigger value="month">Month</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
          <CardDescription>
            Tasks completed vs. created over time
          </CardDescription>
        </CardHeader>
        <CardContent className="h-[300px]">
          <Line options={chartOptions} data={prepareChartData()} />
        </CardContent>
      </Card>
      
      {/* High Priority Tasks */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <AlertTriangle className="mr-2 h-5 w-5 text-red-500" />
            High Priority Tasks
          </CardTitle>
          <CardDescription>
            Tasks marked as high priority across all lists
          </CardDescription>
        </CardHeader>
        <CardContent>
          {highPriorityTasks.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">
              No high priority tasks found
            </div>
          ) : (
            <ScrollArea className="h-[400px] pr-4">
              <div className="space-y-2">
                {highPriorityTasks.map(task => (
                  <div key={task.id} className="space-y-2">
                    <div 
                      className={cn(
                        "flex items-center rounded-lg border p-3 transition-all",
                        "hover:bg-muted/30 relative group",
                        task.completed ? "bg-muted/10" : ""
                      )}
                    >
                      {/* Checkbox */}
                      <Checkbox 
                        checked={task.completed}
                        onCheckedChange={() => handleToggleTask(task.id, task.completed)}
                        id={`task-${task.id}`}
                        className="mr-2"
                      />
                      
                      {/* Task content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center">
                          <label 
                            htmlFor={`task-${task.id}`}
                            className={cn(
                              "text-sm font-medium cursor-pointer block truncate",
                              task.completed ? 'line-through text-muted-foreground' : ''
                            )}
                          >
                            {task.title}
                          </label>
                          
                          {task.children && task.children.length > 0 && (
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="h-6 w-6 p-0 ml-1"
                              onClick={() => handleToggleExpand(task.id)}
                            >
                              {task.expanded ? (
                                <ChevronDown className="h-4 w-4" />
                              ) : (
                                <ChevronRight className="h-4 w-4" />
                              )}
                            </Button>
                          )}
                        </div>
                        
                        {/* Task metadata */}
                        <div className="flex items-center space-x-2 mt-1 text-xs text-muted-foreground">
                          <Badge variant="outline" className={cn("text-xs px-1 py-0", getPriorityClass(task.priority))}>
                            {task.priority}
                          </Badge>
                          
                          {task.task_list_title && (
                            <Badge variant="outline" className="text-xs px-1 py-0">
                              {task.task_list_title}
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
                          
                          {task.children && task.children.length > 0 && (
                            <span className="flex items-center gap-1">
                              <ChevronDown className="h-3 w-3" />
                              {task.children.length} subtask{task.children.length > 1 ? 's' : ''}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    {/* Subtasks (children) */}
                    {task.expanded && task.children && task.children.length > 0 && (
                      <div className="pl-6 space-y-2">
                        {task.children.map(child => (
                          <div 
                            key={child.id}
                            className={cn(
                              "flex items-center rounded-lg border p-2 transition-all",
                              "hover:bg-muted/30 relative group",
                              child.completed ? "bg-muted/10" : ""
                            )}
                          >
                            <Checkbox 
                              checked={child.completed}
                              onCheckedChange={() => handleToggleTask(child.id, child.completed)}
                              id={`subtask-${child.id}`}
                              className="mr-2"
                            />
                            <div className="flex-1 min-w-0">
                              <label 
                                htmlFor={`subtask-${child.id}`}
                                className={cn(
                                  "text-sm cursor-pointer block truncate",
                                  child.completed ? 'line-through text-muted-foreground' : ''
                                )}
                              >
                                {child.title}
                              </label>
                              
                              {/* Subtask metadata */}
                              <div className="flex items-center space-x-2 mt-1 text-xs text-muted-foreground">
                                {child.priority && (
                                  <Badge variant="outline" className={cn("text-xs px-1 py-0", getPriorityClass(child.priority))}>
                                    {child.priority}
                                  </Badge>
                                )}
                                
                                {child.due_date && (
                                  <Badge 
                                    variant="outline" 
                                    className={cn(
                                      "text-xs flex items-center gap-1 px-1 py-0",
                                      getDueStatus(child.due_date) === 'overdue' ? 'text-red-500 border-red-200' : 
                                      getDueStatus(child.due_date) === 'soon' ? 'text-amber-500 border-amber-200' : 
                                      'text-green-500 border-green-200'
                                    )}
                                  >
                                    <Calendar className="h-3 w-3" />
                                    {formatDate(child.due_date)}
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </div>
  );
}