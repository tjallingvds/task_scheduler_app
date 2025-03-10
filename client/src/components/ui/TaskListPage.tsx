// src/components/TaskListPage.tsx
import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { fetchTaskListById, fetchTasks, createTask, updateTask, deleteTask } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Plus, CheckCircle, Circle, Trash2 } from 'lucide-react';

export default function TaskListPage() {
  const { id } = useParams();
  const [taskList, setTaskList] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  
  useEffect(() => {
    const getTaskListData = async () => {
      if (!id) return;
      
      try {
        setLoading(true);
        const listData = await fetchTaskListById(id);
        setTaskList(listData);
        
        if (!listData.is_folder) {
          const tasksData = await fetchTasks(id);
          setTasks(tasksData);
        }
      } catch (error) {
        console.error('Failed to fetch task data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    getTaskListData();
  }, [id]);
  
  const handleAddTask = async (e) => {
    e.preventDefault();
    
    if (!newTaskTitle.trim() || !id) return;
    
    try {
      const newTask = await createTask(id, { title: newTaskTitle });
      setTasks([...tasks, newTask]);
      setNewTaskTitle('');
    } catch (error) {
      console.error('Failed to add task:', error);
    }
  };
  
  const handleToggleComplete = async (taskId, currentStatus) => {
    try {
      await updateTask(taskId, { completed: !currentStatus });
      setTasks(tasks.map(task => 
        task.id === taskId ? {...task, completed: !currentStatus} : task
      ));
    } catch (error) {
      console.error('Failed to update task:', error);
    }
  };
  
  const handleDeleteTask = async (taskId) => {
    try {
      await deleteTask(taskId);
      setTasks(tasks.filter(task => task.id !== taskId));
    } catch (error) {
      console.error('Failed to delete task:', error);
    }
  };
  
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="spinner mb-4"></div>
          <p>Loading task list...</p>
        </div>
      </div>
    );
  }
  
  if (!taskList) {
    return (
      <div className="p-4">
        <h2 className="text-xl font-bold">Task list not found</h2>
        <p className="text-gray-500">The requested task list could not be found.</p>
      </div>
    );
  }
  
  if (taskList.is_folder) {
    return (
      <div className="p-4">
        <h2 className="text-xl font-bold mb-4">{taskList.title} (Folder)</h2>
        <p className="text-gray-500 mb-4">This is a folder containing {taskList.children?.length || 0} task lists.</p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {taskList.children?.map(child => (
            <Card key={child.id} className="p-4">
              <h3 className="font-medium">{child.title}</h3>
              <p className="text-sm text-gray-500">
                {child.is_folder ? 'Folder' : 'Task List'}
              </p>
              <Button variant="outline" className="mt-2" size="sm" asChild>
                <a href={`/tasks/${child.id}`}>Open</a>
              </Button>
            </Card>
          ))}
        </div>
      </div>
    );
  }
  
  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">{taskList.title}</h2>
      
      <form onSubmit={handleAddTask} className="flex gap-2 mb-6">
        <Input
          type="text"
          placeholder="Add a new task..."
          value={newTaskTitle}
          onChange={(e) => setNewTaskTitle(e.target.value)}
          className="flex-1"
        />
        <Button type="submit">
          <Plus className="h-4 w-4 mr-2" />
          Add
        </Button>
      </form>
      
      <div className="space-y-2">
        {tasks.length === 0 ? (
          <p className="text-gray-500 text-center py-4">No tasks yet. Create your first task above.</p>
        ) : (
          tasks.map(task => (
            <div key={task.id} className="flex items-center justify-between p-3 border rounded-md">
              <div className="flex items-center">
                <button 
                  onClick={() => handleToggleComplete(task.id, task.completed)}
                  className="mr-3 focus:outline-none"
                >
                  {task.completed ? (
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  ) : (
                    <Circle className="h-5 w-5 text-gray-300" />
                  )}
                </button>
                <span className={task.completed ? "line-through text-gray-500" : ""}>
                  {task.title}
                </span>
              </div>
              <button 
                onClick={() => handleDeleteTask(task.id)}
                className="text-gray-400 hover:text-red-500"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}