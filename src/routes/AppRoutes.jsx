import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider } from '../contexts/AuthContext.jsx';
import AppLayout from '../layouts/AppLayout.jsx';
import AttendancePage from '../pages/AttendancePage.jsx';
import DashboardPage from '../pages/DashboardPage.jsx';
import LoginPage from '../pages/LoginPage.jsx';
import MembersPage from '../pages/MembersPage.jsx';
import PaymentCancelPage from '../pages/PaymentCancelPage.jsx';
import PaymentSuccessPage from '../pages/PaymentSuccessPage.jsx';
import PaymentsPage from '../pages/PaymentsPage.jsx';
import PlansPage from '../pages/PlansPage.jsx';
import ProfilePage from '../pages/ProfilePage.jsx';
import TrainersPage from '../pages/TrainersPage.jsx';
import { ROLES } from '../utils/roles.js';
import ProtectedRoute from './ProtectedRoute.jsx';
import RoleGuard from './RoleGuard.jsx';

export default function AppRoutes() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route element={<ProtectedRoute />}>
            <Route element={<AppLayout />}>
              <Route index element={<Navigate to="/dashboard" replace />} />
              <Route path="dashboard" element={<DashboardPage />} />
              <Route
                path="profile"
                element={
                  <RoleGuard roles={[ROLES.MEMBER, ROLES.TRAINER]}>
                    <ProfilePage />
                  </RoleGuard>
                }
              />
              <Route
                path="members"
                element={
                  <RoleGuard roles={[ROLES.ADMIN, ROLES.TRAINER]}>
                    <MembersPage />
                  </RoleGuard>
                }
              />
              <Route
                path="trainers"
                element={
                  <RoleGuard roles={[ROLES.ADMIN]}>
                    <TrainersPage />
                  </RoleGuard>
                }
              />
              <Route
                path="plans"
                element={
                  <RoleGuard roles={[ROLES.ADMIN, ROLES.MEMBER]}>
                    <PlansPage />
                  </RoleGuard>
                }
              />
              <Route path="attendance" element={<AttendancePage />} />
              <Route
                path="payments"
                element={
                  <RoleGuard roles={[ROLES.ADMIN, ROLES.MEMBER]}>
                    <PaymentsPage />
                  </RoleGuard>
                }
              />
              <Route path="payment/success" element={<PaymentSuccessPage />} />
              <Route path="payment/cancel" element={<PaymentCancelPage />} />
            </Route>
          </Route>
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
