import { Header } from "@/components/Header";
import HeroSection from "@/components/HeroSection";
import LiveMatchFeed from "@/components/LiveMatchFeed";
import GamesGrid from "@/components/GamesGrid";
import HowItWorks from "@/components/HowItWorks";
import TournamentsSection from "@/components/TournamentsSection";
import LeaderboardsSection from "@/components/LeaderboardsSection";
import TrustSection from "@/components/TrustSection";
import CommunitySection from "@/components/CommunitySection";
import FinalCTA from "@/components/FinalCTA";
import Footer from "@/components/Footer";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main>
        <HeroSection />
        <LiveMatchFeed />
        <GamesGrid />
        <HowItWorks />
        <TournamentsSection />
        <LeaderboardsSection />
        <TrustSection />
        <CommunitySection />
        <FinalCTA />
      </main>
      
      <Footer />
    </div>
  );
};

export default Index;
