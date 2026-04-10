import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/Layout/Layout';
import Dashboard from './components/Dashboard/Dashboard';
import TradeJournal from './components/TradeJournal/TradeJournal';
import StrategyFeed from './components/StrategyFeed/StrategyFeed';
import RiskCalculator from './components/RiskCalculator/RiskCalculator';
import Analytics from './components/Analytics/Analytics';
import Login from './components/Login';

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="flex items-center justify-center h-screen text-gray-400">로딩 중...</div>;
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            path="/*"
            element={
              <ProtectedRoute>
                <Layout>
                  <Routes>
                    <Route path="/" element={<Dashboard />} />
                    <Route path="/trades" element={<TradeJournal />} />
                    <Route path="/strategy" element={<StrategyFeed />} />
                    <Route path="/calculator" element={<RiskCalculator />} />
                    <Route path="/analytics" element={<Analytics />} />
                  </Routes>
                </Layout>
              </ProtectedRoute>
            }
          />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
