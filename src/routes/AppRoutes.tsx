
import React from "react";
import { Route, Routes } from "react-router-dom";

import MainLayout from "@/layouts/MainLayout";
import AuthLayout from "@/layouts/AuthLayout";
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

const AppRoutes = () => {

  return (
    <Routes>
      {/* Auth route - outside MainLayout (no sidebar) */}
      <Route path="/auth" element={
        <AuthLayout>
          <Auth />
        </AuthLayout>
      } />

      {/* Protected routes with MainLayout */}
      <Route path="/" element={<MainLayout />}>
        <Route index element={
          <ProtectedRoute>
            <Index />
          </ProtectedRoute>
        } />
          <Route
            path="notes"
            element={
              <ProtectedRoute>
                <Notes />
              </ProtectedRoute>
            }
          />
          <Route
            path="categories"
            element={
              <ProtectedRoute>
                <Categories />
              </ProtectedRoute>
            }
          />
          <Route
            path="tags"
            element={
              <ProtectedRoute>
                <Tags />
              </ProtectedRoute>
            }
          />
          <Route
            path="profile"
            element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            }
          />
          <Route
            path="settings"
            element={
              <ProtectedRoute>
                <Settings />
              </ProtectedRoute>
            }
          />
          <Route
            path="editor/new"
            element={
              <ProtectedRoute>
                <Editor />
              </ProtectedRoute>
            }
          />
          <Route
            path="editor/:id"
            element={
              <ProtectedRoute>
                <Editor />
              </ProtectedRoute>
            }
          />
          <Route
            path="tokens"
            element={
              <ProtectedRoute>
                <TokensDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="tokens/:id"
            element={
              <ProtectedRoute>
                <TokenDetail />
              </ProtectedRoute>
            }
          />
          <Route
            path="crypto/dashboard"
            element={
              <ProtectedRoute>
                <CryptoDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="markets"
            element={
              <ProtectedRoute>
                <MarketsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="securities"
            element={
              <ProtectedRoute>
                <SecuritiesPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="receipt-generator"
            element={
              <ProtectedRoute>
                <ReceiptGenerator />
              </ProtectedRoute>
            }
          />
          <Route
            path="kanban"
            element={
              <ProtectedRoute>
                <KanbanPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="kanban/:boardId"
            element={
              <ProtectedRoute>
                <KanbanPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="financeiro"
            element={
              <ProtectedRoute>
                <FinancialPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="calendar"
            element={
              <ProtectedRoute>
                <CalendarPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="expenses"
            element={
              <ProtectedRoute>
                <ExpensesIndex />
              </ProtectedRoute>
            }
          />
          <Route
            path="expenses/new"
            element={
              <ProtectedRoute>
                <ExpensesNew />
              </ProtectedRoute>
            }
          />
          <Route
            path="expenses/:id/edit"
            element={
              <ProtectedRoute>
                <ExpensesEdit />
              </ProtectedRoute>
            }
          />
          <Route
            path="expenses/:id"
            element={
              <ProtectedRoute>
                <ExpenseDetail />
              </ProtectedRoute>
            }
          />
          <Route
            path="legal"
            element={
              <ProtectedRoute>
                <LegalPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="legal/cases"
            element={
              <ProtectedRoute>
                <LegalCasesPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="legal/contacts"
            element={
              <ProtectedRoute>
                <LegalContactsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="legal/billable-items"
            element={
              <ProtectedRoute>
                <LegalBillableItemsPage />
              </ProtectedRoute>
            }
          />
          
          {/* Projects Route */}
          <Route
            path="projects"
            element={
              <ProtectedRoute>
                <ProjectsPage />
              </ProtectedRoute>
            }
          />
          
          {/* Real Estate Routes */}
          <Route
            path="real-estate"
            element={
              <ProtectedRoute>
                <RealEstatePage />
              </ProtectedRoute>
            }
          />
          
          {/* Companies Routes */}
          <Route
            path="companies"
            element={
              <ProtectedRoute>
                <CompaniesPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="companies/:id"
            element={
              <ProtectedRoute>
                <CompanyDetailPage />
              </ProtectedRoute>
            }
          />
          
          {/* TAO Routes */}
          <Route path="tao" element={<TAOLayout />}>
            <Route index element={<TAODashboard />} />
            <Route path="performance" element={<TAOPerformance />} />
            <Route path="management" element={<TAOManagement />} />
            <Route path="validators" element={<TAOValidatorManagement />} /> {/* Add route for validators page */}
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
  );
};

export default AppRoutes;
