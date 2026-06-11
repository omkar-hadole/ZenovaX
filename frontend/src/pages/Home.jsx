import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/home/Navbar';
import HeroSection from '../components/home/HeroSection';
import FeaturesSection from '../components/home/FeaturesSection';
import TrackingSection from '../components/home/TrackingSection';
import TestimonialsSection from '../components/home/TestimonialsSection';
import FAQSection from '../components/home/FAQSection';
import CTASection from '../components/home/CTASection';
import Footer from '../components/home/Footer';

export default function Home() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isLoggedIn = !!user;
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 30);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const getDashboardPath = () => {
    if (!user) return '/auth';
    if (!user.isProfileComplete) return '/complete-profile';
    if (user.role === 'ADMIN') return '/admin/dashboard';
    if (user.role === 'MENTOR' || user.role === 'BOTH') return '/mentor-dashboard';
    return '/dashboard';
  };

  const handlePrimaryCTA = () => {
    navigate(isLoggedIn ? getDashboardPath() : '/auth');
  };

  return (
    <div className="min-h-screen text-slate-900 bg-transparent">
      <Navbar scrolled={scrolled} isLoggedIn={isLoggedIn} handlePrimaryCTA={handlePrimaryCTA} />

      <main className="">
        <HeroSection handlePrimaryCTA={handlePrimaryCTA} />
        <FeaturesSection />
        <TrackingSection />
        <TestimonialsSection />
        <FAQSection />
        <CTASection handlePrimaryCTA={handlePrimaryCTA} />
      </main>

      <Footer />
    </div>
  );
}
