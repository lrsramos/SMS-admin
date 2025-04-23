import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, AuthContext } from './components/AuthProvider';
import Sidebar from './components/Sidebar';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Appointments from './pages/Appointments';
import Cleaners from './pages/Cleaners';
import Clients from './pages/Clients';
import History from './pages/History';
import LiveLocation from './pages/LiveLocation';

const queryClient = new QueryClient();

const ProtectedLayout = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated } = React.useContext(AuthContext);

  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar />
      <main className="flex-1 overflow-y-auto p-8">
        {children}
      </main>
    </div>
  );
};

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <AuthProvider>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route
              path="/"
              element={
                <ProtectedLayout>
                  <Dashboard />
                </ProtectedLayout>
              }
            />
            <Route
              path="/appointments"
              element={
                <ProtectedLayout>
                  <Appointments />
                </ProtectedLayout>
              }
            />
            <Route
              path="/cleaners"
              element={
                <ProtectedLayout>
                  <Cleaners />
                </ProtectedLayout>
              }
            />
            <Route
              path="/clients"
              element={
                <ProtectedLayout>
                  <Clients />
                </ProtectedLayout>
              }
            />
            <Route
              path="/history"
              element={
                <ProtectedLayout>
                  <History />
                </ProtectedLayout>
              }
            />
            <Route
              path="/live"
              element={
                <ProtectedLayout>
                  <LiveLocation />
                </ProtectedLayout>
              }
            />
          </Routes>
        </AuthProvider>
      </Router>
    </QueryClientProvider>
  );
}