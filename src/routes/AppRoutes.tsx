
import React from "react";
import { Route, Routes } from "react-router-dom";

import MainLayout from "@/layouts/MainLayout";
import ProtectedRoute from "@/components/ProtectedRoute";

import Notes from "@/pages/Notes";
import Categories from "@/pages/Categories";
import Tags from "@/pages/Tags";
import Auth from "@/pages/Auth";
import Profile from "@/pages/Profile";
import NotFound from "@/pages/NotFound";
import Settings from "@/pages/Settings";
import Editor from "@/pages/Editor";
import Index from "@/pages/Index";
import TokensDashboard from "@/pages/tokens";
import TokenDetail from "@/pages/tokens/[id]";
import CryptoDashboard from "@/pages/crypto/Dashboard";
import MarketsPage from "@/pages/markets";
import SecuritiesPage from "@/pages/securities";
import ReceiptGenerator from "@/pages/ReceiptGenerator";
import KanbanPage from "@/pages/kanban";
import MFAVerify from "@/pages/auth/MFAVerify";

// TAO-specific routes
import TAOLayout from "@/pages/tao/layout";
import TAODashboard from "@/pages/tao/index";
import TAOPerformance from "@/pages/tao/performance";
import TAOManagement from "@/pages/tao/management";
import TAOValidatorManagement from "@/pages/tao/validators";
import TAOValidatorRelationshipManagement from "@/pages/tao/validator-relationship-management";
import InvestorOpportunitiesPage from "@/pages/tao/investor-opportunities";
import FollowUpSequencesPage from "@/pages/tao/follow-up-sequences";
import TAOProjects from "@/pages/tao/projects";
import FinancialPage from "@/pages/financial";
import CalendarPage from "@/pages/Calendar";
import ExpensesIndex from "@/pages/expenses/index";
import ExpensesNew from "@/pages/expenses/new";
import ExpensesEdit from "@/pages/expenses/edit";

import ExpenseDetail from "@/pages/expenses/[id]";
import LegalPage from "@/pages/legal";
import LegalCasesPage from "@/pages/legal/cases";
import LegalContactsPage from "@/pages/legal/contacts";
import LegalBillableItemsPage from "@/pages/legal/billable-items";
import CompaniesPage from "@/pages/companies";
import CompanyDetailPage from "@/pages/companies/[id]";
import ProjectsPage from "@/pages/Projects";
import RealEstatePage from "@/pages/real-estate";
import OperationsPage from "@/pages/operations";

// Procurement routes
import ProcurementDashboard from "@/pages/procurement/index";
import ProcurementSuppliers from "@/pages/procurement/suppliers";
import ProcurementProjects from "@/pages/procurement/projects/index";
import ProcurementProjectDetail from "@/pages/procurement/projects/[id]";

const AppRoutes = () => {

  return (
    <>
      <Routes>
        {/* Public routes - no layout, no auth required */}
        <Route path="/auth" element={<Auth />} />
        <Route path="/auth/mfa-verify" element={<MFAVerify />} />

        {/* Protected routes - auth required, with MainLayout (sidebar) */}
        <Route path="/" element={
          <ProtectedRoute>
            <MainLayout />
          </ProtectedRoute>
        }>
          <Route index element={<Index />} />
          <Route path="notes" element={<Notes />} />
          <Route path="categories" element={<Categories />} />
          <Route path="tags" element={<Tags />} />
          <Route path="profile" element={<Profile />} />
          <Route path="settings" element={<Settings />} />
          <Route path="editor/new" element={<Editor />} />
          <Route path="editor/:id" element={<Editor />} />
          <Route path="tokens" element={<TokensDashboard />} />
          <Route path="tokens/:id" element={<TokenDetail />} />
          <Route path="crypto/dashboard" element={<CryptoDashboard />} />
          <Route path="markets" element={<MarketsPage />} />
          <Route path="securities" element={<SecuritiesPage />} />
          <Route path="receipt-generator" element={<ReceiptGenerator />} />
          <Route path="kanban" element={<KanbanPage />} />
          <Route path="kanban/:boardId" element={<KanbanPage />} />
          <Route path="financeiro" element={<FinancialPage />} />
          <Route path="calendar" element={<CalendarPage />} />
          <Route path="expenses" element={<ExpensesIndex />} />
          <Route path="expenses/new" element={<ExpensesNew />} />
          <Route path="expenses/:id/edit" element={<ExpensesEdit />} />
          <Route path="expenses/:id" element={<ExpenseDetail />} />
          <Route path="legal" element={<LegalPage />} />
          <Route path="legal/cases" element={<LegalCasesPage />} />
          <Route path="legal/contacts" element={<LegalContactsPage />} />
          <Route path="legal/billable-items" element={<LegalBillableItemsPage />} />
          <Route path="projects" element={<ProjectsPage />} />
          <Route path="real-estate" element={<RealEstatePage />} />
          <Route path="operations" element={<OperationsPage />} />
          <Route path="companies" element={<CompaniesPage />} />
          <Route path="companies/:id" element={<CompanyDetailPage />} />

          {/* Procurement Routes */}
          <Route path="procurement" element={<ProcurementDashboard />} />
          <Route path="procurement/suppliers" element={<ProcurementSuppliers />} />
          <Route path="procurement/projects" element={<ProcurementProjects />} />
          <Route path="procurement/projects/:id" element={<ProcurementProjectDetail />} />

          {/* TAO Routes - now protected by parent ProtectedRoute */}
          <Route path="tao" element={<TAOLayout />}>
            <Route index element={<TAODashboard />} />
            <Route path="performance" element={<TAOPerformance />} />
            <Route path="management" element={<TAOManagement />} />
            <Route path="validators" element={<TAOValidatorManagement />} />
            <Route
              path="validator-relationship-management"
              element={<TAOValidatorRelationshipManagement />}
            />
            <Route
              path="investor-opportunities"
              element={<InvestorOpportunitiesPage />}
            />
            <Route
              path="follow-up-sequences"
              element={<FollowUpSequencesPage />}
            />
            <Route path="projects" element={<TAOProjects />} />
          </Route>

          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </>
  );
};

export default AppRoutes;
