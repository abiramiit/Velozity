import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Layout from './components/Layout';
import AdminDashboard from './pages/AdminDashboard';
import ProjectManagerDashboard from './pages/ProjectManagerDashboard';
import ProjectManagerTeam from './pages/ProjectManagerTeam';
import DeveloperDashboard from './pages/DeveloperDashboard';
import ProjectDetail from './pages/ProjectDetail';
import TaskDetail from './pages/TaskDetail';
import AdminProjects from './pages/AdminProjects';
import AdminTasks from './pages/AdminTasks';
import AdminClients from './pages/AdminClients';
import AdminUsers from './pages/AdminUsers';
import AdminActivity from './pages/AdminActivity';
import AdminNotifications from './pages/AdminNotifications';
import { Outlet } from 'react-router-dom';

const ProtectedRoute = ({ children, allowedRoles }: { children: React.ReactNode, allowedRoles: string[] }) => {
  const { user, loading } = useAuth();
  if (loading) return <div>Loading...</div>;
  if (!user) return <Navigate to="/login" />;
  if (!allowedRoles.includes(user.role)) return <Navigate to="/" />;

  return <Layout>{children}</Layout>;
};

function App() {
  const { user } = useAuth();
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />

        <Route path="/" element={
          user?.role === 'ADMIN' ? <Navigate to="/admin" /> :
            user?.role === 'PROJECT_MANAGER' ? <Navigate to="/pm" /> :
              user?.role === 'DEVELOPER' ? <Navigate to="/dev" /> :
                <Navigate to="/login" />
        } />

        <Route path="/admin" element={
          <ProtectedRoute allowedRoles={['ADMIN']}>
            <Outlet />
          </ProtectedRoute>
        }>
          <Route index element={<AdminDashboard />} />
          <Route path="projects" element={<AdminProjects />} />
          <Route path="tasks" element={<AdminTasks />} />
          <Route path="clients" element={<AdminClients />} />
          <Route path="users" element={<AdminUsers />} />
          <Route path="activity" element={<AdminActivity />} />
          <Route path="notifications" element={<AdminNotifications />} />
        </Route>
        <Route path="/pm" element={
          <ProtectedRoute allowedRoles={['PROJECT_MANAGER']}>
            <Outlet />
          </ProtectedRoute>
        }>
          <Route index element={<ProjectManagerDashboard />} />
          <Route path="projects" element={<AdminProjects />} />
          <Route path="team" element={<ProjectManagerTeam />} />
          <Route path="tasks" element={<AdminTasks />} />
          <Route path="activity" element={<AdminActivity />} />
          <Route path="notifications" element={<AdminNotifications />} />
        </Route>
        <Route path="/dev" element={
          <ProtectedRoute allowedRoles={['DEVELOPER']}>
            <Outlet />
          </ProtectedRoute>
        }>
          <Route index element={<DeveloperDashboard />} />
          <Route path="activity" element={<AdminActivity />} />
          <Route path="notifications" element={<AdminNotifications />} />
        </Route>

        <Route path="/project/:id" element={
          <ProtectedRoute allowedRoles={['ADMIN', 'PROJECT_MANAGER']}>
            <ProjectDetail />
          </ProtectedRoute>
        } />

        <Route path="/task/:id" element={
          <ProtectedRoute allowedRoles={['ADMIN', 'PROJECT_MANAGER', 'DEVELOPER']}>
            <TaskDetail />
          </ProtectedRoute>
        } />

        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
}

export default App;
