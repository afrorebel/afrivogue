import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import CodeInjectionRenderer from "@/components/CodeInjectionRenderer";
import { CartProvider } from "@/hooks/useCart";
import Index from "./pages/Index";
import TrendDetail from "./pages/TrendDetail";
import StoryMode from "./pages/StoryMode";
import Trivia from "./pages/Trivia";
import PremiumEditorial from "./pages/PremiumEditorial";
import CulturalForecast from "./pages/CulturalForecast";
import AdminLogin from "./pages/AdminLogin";
import AdminDashboard from "./pages/AdminDashboard";
import Contact from "./pages/Contact";
import Editorials from "./pages/Editorials";
import About from "./pages/About";
import AuthPage from "./pages/AuthPage";
import Dashboard from "./pages/Dashboard";
import PublicProfile from "./pages/PublicProfile";
import MembershipPage from "./pages/MembershipPage";
import GlobalMoodboard from "./pages/GlobalMoodboard";
import SubmitArticle from "./pages/SubmitArticle";
import Contributors from "./pages/Contributors";
import AuthorProfile from "./pages/AuthorProfile";
import Shop from "./pages/Shop";
import ProductDetail from "./pages/ProductDetail";
import Trends from "./pages/Trends";
import Unsubscribe from "./pages/Unsubscribe";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <CartProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <CodeInjectionRenderer />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/trends" element={<Trends />} />
            <Route path="/trend/:id" element={<TrendDetail />} />
            <Route path="/story/:id" element={<StoryMode />} />
            <Route path="/trivia" element={<Trivia />} />
            <Route path="/editorial/:id" element={<PremiumEditorial />} />
            <Route path="/editorials" element={<Editorials />} />
            <Route path="/forecast" element={<CulturalForecast />} />
            <Route path="/auth" element={<AuthPage />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/profile/:userId" element={<PublicProfile />} />
            <Route path="/membership" element={<MembershipPage />} />
            <Route path="/moodboard" element={<GlobalMoodboard />} />
            <Route path="/submit" element={<SubmitArticle />} />
            <Route path="/contributors" element={<Contributors />} />
            <Route path="/author/:authorId" element={<AuthorProfile />} />
            <Route path="/shop" element={<Shop />} />
            <Route path="/shop/:id" element={<ProductDetail />} />
            <Route path="/admin/login" element={<AdminLogin />} />
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/about" element={<About />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
      </CartProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
