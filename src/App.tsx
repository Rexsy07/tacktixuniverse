import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
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
import AdminAdvertise from "./pages/AdminAdvertise";
import AdminSettings from "./pages/AdminSettings";
import Notifications from "./pages/Notifications";
import AdminTournamentCreate from "./pages/AdminTournamentCreate";
import AdminTournamentDetail from "./pages/AdminTournamentDetail";
import AdminTournamentManage from "./pages/AdminTournamentManage";
import TournamentDetail from "./pages/TournamentDetail";
import TournamentBracket from "./pages/TournamentBracket";
import AdminWithdrawalDetail from "./pages/AdminWithdrawalDetail";
import AdvertiseEarn from "./pages/AdvertiseEarn";
import TermsOfService from "./pages/TermsOfService";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import ResponsibleGaming from "./pages/ResponsibleGaming";
import KYCPolicy from "./pages/KYCPolicy";
import SupportFAQ from "./pages/SupportFAQ";
import SupportContact from "./pages/SupportContact";
import DisputeResolution from "./pages/DisputeResolution";
import CommunityGuidelines from "./pages/CommunityGuidelines";

const queryClient = new QueryClient();

import GlobalWinUI from "@/components/GlobalWinUI";
import ConnectionStatus from "@/components/ConnectionStatus";
import "@/utils/quickCleanup"; // Expose cleanup functions to console
import "@/utils/systemWideFix"; // Expose system-wide fix functions to console

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <AuthProvider>
        <BrowserRouter 
          basename={import.meta.env.PROD ? "/tacktixuniverse" : ""}
          future={{
            v7_startTransition: true,
            v7_relativeSplatPath: true
          }}
        >
          {/* Global win popup + notifier mounted once for the whole app (inside Router for Link context) */}
          <GlobalWinUI />
          <ConnectionStatus />
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
            <Route path="/support/faq" element={<SupportFAQ />} />
            <Route path="/support/contact" element={<SupportContact />} />
            <Route path="/support/disputes" element={<DisputeResolution />} />
            <Route path="/support/guidelines" element={<CommunityGuidelines />} />
            <Route path="/legal/terms" element={<TermsOfService />} />
            <Route path="/legal/privacy" element={<PrivacyPolicy />} />
            <Route path="/legal/responsible" element={<ResponsibleGaming />} />
            <Route path="/legal/kyc" element={<KYCPolicy />} />
            <Route path="/signup" element={<SignUp />} />
            <Route path="/login" element={<Login />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/reset-password-confirm" element={<ResetPasswordConfirm />} />

            {/* Advertise & Earn */}
            <Route path="/advertise" element={
              <ProtectedRoute>
                <AdvertiseEarn />
              </ProtectedRoute>
            } />
            
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
            <Route path="/admin/wallet/withdrawal/:txId" element={
              <ProtectedRoute requireAdmin>
                <AdminWithdrawalDetail />
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
            <Route path="/admin/advertise" element={
              <ProtectedRoute requireAdmin>
                <AdminAdvertise />
              </ProtectedRoute>
            } />
            <Route path="/admin/settings" element={
              <ProtectedRoute requireAdmin>
                <AdminSettings />
              </ProtectedRoute>
            } />
            
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;