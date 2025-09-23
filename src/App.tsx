import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, HashRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Games from "./pages/Games";
import GameDetail from "./pages/GameDetail";
import Tournaments from "./pages/Tournaments";
import Leaderboards from "./pages/Leaderboards";
import HowItWorksPage from "./pages/HowItWorks";
import Support from "./pages/Support";
import SignUp from "./pages/SignUp";
import Login from "./pages/Login";
import ResetPassword from "./pages/ResetPassword";
import ResetPasswordConfirm from "./pages/ResetPasswordConfirm";
import DashboardWallet from "./pages/DashboardWallet";
import DashboardMatches from "./pages/DashboardMatches";
import CreateChallenge from "./pages/CreateChallenge";
import DashboardProfile from "./pages/DashboardProfile";
import DashboardTournaments from "./pages/DashboardTournaments";
import MatchDetail from "./pages/MatchDetail";
import AdminDashboard from "./pages/AdminDashboard";
import AdminUsers from "./pages/AdminUsers";
import AdminWallet from "./pages/AdminWallet";
import AdminMatches from "./pages/AdminMatches";
import AdminTournaments from "./pages/AdminTournaments";
import AdminAnalytics from "./pages/AdminAnalytics";
import AdminNotifications from "./pages/AdminNotifications";
import AdminSettings from "./pages/AdminSettings";
import Notifications from "./pages/Notifications";
import AdminTournamentCreate from "./pages/AdminTournamentCreate";
import AdminTournamentDetail from "./pages/AdminTournamentDetail";
import AdminTournamentManage from "./pages/AdminTournamentManage";
import TournamentDetail from "./pages/TournamentDetail";
import TournamentBracket from "./pages/TournamentBracket";

const queryClient = new QueryClient();

const Router = import.meta.env.PROD ? HashRouter : BrowserRouter;

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <AuthProvider>
        <Router 
          basename={import.meta.env.PROD ? "/tacktixuniverse" : ""}
          future={{
            v7_startTransition: true,
            v7_relativeSplatPath: true
          }}
        >
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/games" element={<Games />} />
            <Route path="/games/:slug" element={<GameDetail />} />
            <Route path="/tournaments" element={<Tournaments />} />
            <Route path="/tournaments/:tournamentId" element={<TournamentDetail />} />
            <Route path="/tournaments/:tournamentId/bracket" element={
              <ProtectedRoute>
                <TournamentBracket />
              </ProtectedRoute>
            } />
            <Route path="/leaderboards" element={<Leaderboards />} />
            <Route path="/how-it-works" element={<HowItWorksPage />} />
            <Route path="/support" element={<Support />} />
            <Route path="/signup" element={<SignUp />} />
            <Route path="/login" element={<Login />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/reset-password-confirm" element={<ResetPasswordConfirm />} />
            
            {/* User Routes */}
            <Route path="/profile" element={
              <ProtectedRoute>
                <DashboardProfile />
              </ProtectedRoute>
            } />
            <Route path="/wallet" element={
              <ProtectedRoute>
                <DashboardWallet />
              </ProtectedRoute>
            } />
            <Route path="/matches" element={
              <ProtectedRoute>
                <DashboardMatches />
              </ProtectedRoute>
            } />
            <Route path="/my-tournaments" element={
              <ProtectedRoute>
                <DashboardTournaments />
              </ProtectedRoute>
            } />
            <Route path="/create-challenge" element={
              <ProtectedRoute>
                <CreateChallenge />
              </ProtectedRoute>
            } />
            <Route path="/matches/:matchId" element={
              <ProtectedRoute>
                <MatchDetail />
              </ProtectedRoute>
            } />
            <Route path="/notifications" element={
              <ProtectedRoute>
                <Notifications />
              </ProtectedRoute>
            } />
            
            {/* Admin Routes */}
            <Route path="/admin" element={
              <ProtectedRoute requireAdmin>
                <AdminDashboard />
              </ProtectedRoute>
            } />
            <Route path="/admin/users" element={
              <ProtectedRoute requireAdmin>
                <AdminUsers />
              </ProtectedRoute>
            } />
            <Route path="/admin/wallet" element={
              <ProtectedRoute requireAdmin>
                <AdminWallet />
              </ProtectedRoute>
            } />
            <Route path="/admin/matches" element={
              <ProtectedRoute requireAdmin>
                <AdminMatches />
              </ProtectedRoute>
            } />
            <Route path="/admin/tournaments" element={
              <ProtectedRoute requireAdmin>
                <AdminTournaments />
              </ProtectedRoute>
            } />
            <Route path="/admin/tournaments/create" element={
              <ProtectedRoute requireAdmin>
                <AdminTournamentCreate />
              </ProtectedRoute>
            } />
            <Route path="/admin/tournaments/:tournamentId" element={
              <ProtectedRoute requireAdmin>
                <AdminTournamentDetail />
              </ProtectedRoute>
            } />
            <Route path="/admin/tournaments/:tournamentId/manage" element={
              <ProtectedRoute requireAdmin>
                <AdminTournamentManage />
              </ProtectedRoute>
            } />
            <Route path="/admin/analytics" element={
              <ProtectedRoute requireAdmin>
                <AdminAnalytics />
              </ProtectedRoute>
            } />
            <Route path="/admin/notifications" element={
              <ProtectedRoute requireAdmin>
                <AdminNotifications />
              </ProtectedRoute>
            } />
            <Route path="/admin/settings" element={
              <ProtectedRoute requireAdmin>
                <AdminSettings />
              </ProtectedRoute>
            } />
            
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Router>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;