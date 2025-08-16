import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { OnboardingWrapper } from "./components/onboarding/OnboardingWrapper";
import { getConfig } from "./config/environment";
import Index from "./pages/Index";
import Dashboard from "./pages/Dashboard";
import ResumeBuilder from "./pages/ResumeBuilder";
import ResumeChoice from "./pages/ResumeChoice";
import { ResumeImportPage } from "./pages/ResumeImportPage";
import Jobs from "./pages/Jobs";
import Profile from "./pages/Profile";
import NotFound from "./pages/NotFound";
import SignIn from "./pages/SignIn";
import SignUp from "./pages/SignUp";
import CoverLetterTest from "./pages/CoverLetterTest";
import EmailOutreach from "./pages/EmailOutreach";
import EmailAPITest from "./pages/EmailAPITest";
import ResumeAPITest from "./pages/ResumeAPITest";
import DatabaseTest from "./pages/DatabaseTest";
import EmailConversationTest from "./pages/EmailConversationTest";
import JobApplicationsAdmin from "./pages/JobApplicationsAdmin";
import GoogleCallback from "./components/auth/GoogleCallback";
import Blogs from "./pages/Blogs";
import Community from "./pages/Community";
import Pricing from "./pages/Pricing";
import PremiumTest from "./pages/PremiumTest";
import CancellationRefund from "./pages/CancellationRefund";
import ShippingDelivery from "./pages/ShippingDelivery";
import ContactUs from "./pages/ContactUs";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import TermsConditions from "./pages/TermsConditions";

const queryClient = new QueryClient();

// Protected route component
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  
  // In development, bypass authentication
  if (getConfig().isDevelopment) {
    return <OnboardingWrapper>{children}</OnboardingWrapper>;
  }

  // In production, enforce authentication
  if (loading) {
    return <div className="flex h-screen items-center justify-center">Loading...</div>;
  }
  
  if (!user) {
    return <Navigate to="/signin" replace />;
  }
  
  return <OnboardingWrapper>{children}</OnboardingWrapper>;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/signin" element={<SignIn />} />
            <Route path="/signup" element={<SignUp />} />
            <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/jobs" element={<ProtectedRoute><Jobs /></ProtectedRoute>} />
            <Route path="/resume-builder" element={<ProtectedRoute><ResumeChoice /></ProtectedRoute>} />
            <Route path="/resume-builder-form" element={<ProtectedRoute><ResumeBuilder /></ProtectedRoute>} />
            <Route path="/resume-editor" element={<Navigate to="/resume-builder" replace />} />
            <Route path="/resume-import" element={<ProtectedRoute><ResumeImportPage /></ProtectedRoute>} />
            <Route path="/cover-letter-test" element={<ProtectedRoute><CoverLetterTest /></ProtectedRoute>} />
            <Route path="/email-outreach" element={<ProtectedRoute><EmailOutreach /></ProtectedRoute>} />
            <Route path="/email-api-test" element={<ProtectedRoute><EmailAPITest /></ProtectedRoute>} />
            <Route path="/resume-api-test" element={<ProtectedRoute><ResumeAPITest /></ProtectedRoute>} />
            <Route path="/email-conversation-test" element={<ProtectedRoute><EmailConversationTest /></ProtectedRoute>} />
            <Route path="/database-test" element={<DatabaseTest />} />
            <Route path="/admin/applications" element={<ProtectedRoute><JobApplicationsAdmin /></ProtectedRoute>} />
            <Route path="/auth/google/callback" element={<GoogleCallback />} />
            <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
            <Route path="/blogs" element={<Blogs />} />
            <Route path="/community" element={<Community />} />
            <Route path="/pricing" element={<Pricing />} />
            <Route path="/premium-test" element={<ProtectedRoute><PremiumTest /></ProtectedRoute>} />
            {/* KYC */}
            <Route path="/privacy" element={<PrivacyPolicy />} />
            <Route path="/terms" element={<TermsConditions />} />
            <Route path="/cancellation-refund" element={<CancellationRefund />} />
            <Route path="/shipping-delivery" element={<ShippingDelivery />} />
            <Route path="/contact" element={<ContactUs />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
