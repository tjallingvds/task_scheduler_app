import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import LoginPage from "@/pages/login";
import RegisterPage from "@/pages/register";
import Dashboard from "@/pages/Dashboard";
import TaskPage from "@/pages/TaskPage";
import PageLayout from "@/components/layout/PageLayout";
import ProtectedRoute from "@/components/ui/ProtectedRoute";

function App() {
  return (
    <AuthProvider>
      <Routes>
        {/* Public routes */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        
        {/* Protected routes with layout */}
        <Route
          element={
            <ProtectedRoute>
              <PageLayout />
            </ProtectedRoute>
          }
        >
          {/* Dashboard/Home page */}
          <Route path="/" element={<Dashboard />} />
          
          {/* Task list page */}
          <Route path="/tasks/:listId" element={<TaskPage />} />
        </Route>
        
        {/* Fallback route - redirect to home */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthProvider>
  );
}

export default App;