import { Navigate, Route, Routes } from 'react-router-dom';
import { AppShell } from '@/components/AppShell';
import { useAuth } from '@/features/auth/AuthContext';
import { LoginPage } from '@/pages/LoginPage';
import { DashboardPage } from '@/pages/DashboardPage';
import { ScreeningPage } from '@/pages/ScreeningPage';
import { ConsultationsPage } from '@/pages/ConsultationsPage';
import { CoachingPage } from '@/pages/CoachingPage';
import { JournalPage } from '@/pages/JournalPage';

export default function App() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <p className="p-8 text-sm text-slate">Loading…</p>;
  }

  if (!user) {
    return (
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/screening" element={<ScreeningPage />} />
        <Route path="/consultations" element={<ConsultationsPage />} />
        <Route path="/coaching" element={<CoachingPage />} />
        <Route path="/journal" element={<JournalPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}
