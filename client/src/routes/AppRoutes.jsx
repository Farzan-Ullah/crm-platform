import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthLayout } from '../layouts/AuthLayout.jsx';
import { AppLayout } from '../layouts/AppLayout.jsx';
import { ProtectedRoute } from './ProtectedRoute.jsx';
import { RoleRoute } from './RoleRoute.jsx';
import { LoginPage } from '../pages/auth/LoginPage.jsx';
import { DashboardPage } from '../pages/dashboard/DashboardPage.jsx';
import { LeadsListPage } from '../pages/leads/LeadsListPage.jsx';
import { LeadDetailsPage } from '../pages/leads/LeadDetailsPage.jsx';
import { ContactsListPage } from '../pages/contacts/ContactsListPage.jsx';
import { ContactDetailsPage } from '../pages/contacts/ContactDetailsPage.jsx';
import { CompaniesListPage } from '../pages/companies/CompaniesListPage.jsx';
import { CompanyDetailsPage } from '../pages/companies/CompanyDetailsPage.jsx';
import { DealsPage } from '../pages/deals/DealsPage.jsx';
import { DealDetailsPage } from '../pages/deals/DealDetailsPage.jsx';
import { ActivitiesPage } from '../pages/activities/ActivitiesPage.jsx';
import { EmailsPage } from '../pages/emails/EmailsPage.jsx';
import { QuotesPage } from '../pages/quotes/QuotesPage.jsx';
import { ReportsPage } from '../pages/reports/ReportsPage.jsx';
import { UserManagementPage } from '../pages/settings/UserManagementPage.jsx';
import { SettingsPage } from '../pages/settings/SettingsPage.jsx';
import { AuditLogsPage } from '../pages/audit/AuditLogsPage.jsx';
import { UpcomingPhaseView } from '../pages/common/UpcomingPhaseView.jsx';
import { ROLES } from '../constants/roles.js';

export const AppRoutes = () => {
  return (
    <Routes>
      {/* Public Authentication Routes */}
      <Route element={<AuthLayout />}>
        <Route path="/login" element={<LoginPage />} />
      </Route>

      {/* Protected CRM App Routes */}
      <Route
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/dashboard" element={<DashboardPage />} />

        {/* Phase 2: Leads Management & Details */}
        <Route path="/leads" element={<LeadsListPage />} />
        <Route path="/leads/:id" element={<LeadDetailsPage />} />

        {/* Phase 3: Contacts & Companies */}
        <Route path="/contacts" element={<ContactsListPage />} />
        <Route path="/contacts/:id" element={<ContactDetailsPage />} />
        <Route path="/companies" element={<CompaniesListPage />} />
        <Route path="/companies/:id" element={<CompanyDetailsPage />} />

        {/* Phase 4: Deals & Kanban */}
        <Route path="/deals" element={<DealsPage />} />
        <Route path="/deals/:id" element={<DealDetailsPage />} />

        {/* Phase 5: Activities & Reminders */}
        <Route path="/activities" element={<ActivitiesPage />} />

        {/* Phase 6: Emails & Campaigns */}
        <Route path="/emails" element={<EmailsPage />} />

        {/* Phase 7: Quotes & PDFs */}
        <Route path="/quotes" element={<QuotesPage />} />

        {/* Phase 8: Reports & Analytics */}
        <Route
          path="/reports"
          element={
            <RoleRoute roles={[ROLES.ADMIN, ROLES.SALES_MANAGER, ROLES.SALES_EXECUTIVE]}>
              <ReportsPage />
            </RoleRoute>
          }
        />

        {/* User & Team Management */}
        <Route
          path="/settings/users"
          element={
            <RoleRoute roles={[ROLES.ADMIN, ROLES.SALES_MANAGER]}>
              <UserManagementPage />
            </RoleRoute>
          }
        />

        {/* Phase 9: Audit Logs & Compliance */}
        <Route
          path="/audit-logs"
          element={
            <RoleRoute roles={[ROLES.ADMIN]}>
              <AuditLogsPage />
            </RoleRoute>
          }
        />

        {/* Phase 9: Organization Settings */}
        <Route
          path="/settings"
          element={
            <RoleRoute roles={[ROLES.ADMIN]}>
              <SettingsPage />
            </RoleRoute>
          }
        />
      </Route>

      {/* Catch-all redirect to dashboard */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
};
