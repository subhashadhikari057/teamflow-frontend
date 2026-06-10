import LandingNav from '@/components/landing/LandingNav';
import Hero from '@/components/landing/Hero';
import Features from '@/components/landing/Features';
import SocialProof from '@/components/landing/SocialProof';
import Pricing from '@/components/landing/Pricing';
import FAQ from '@/components/landing/FAQ';
import Footer from '@/components/landing/Footer';

export default function LandingPage() {
  return (
    <div className="min-h-full overflow-y-auto bg-bg">
      <LandingNav />
      <Hero />
      <Features />
      <SocialProof />
      <Pricing />
      <FAQ />
      <Footer />
    </div>
  );
}
