import Navbar from '@/components/landing/Navbar'
import Hero from '@/components/landing/Hero'
import HowItWorks from '@/components/landing/HowItWorks'
import CategoriesSection from '@/components/landing/CategoriesSection'
import ExperiencePreview from '@/components/landing/ExperiencePreview'
import FeaturesSection from '@/components/landing/FeaturesSection'
import WhyChooseUs from '@/components/landing/WhyChooseUs'
import CTASection from '@/components/landing/CTASection'
import Footer from '@/components/landing/Footer'
import { useSeo } from '@/hooks/useSeo'
import { BRAND } from '@/constants/brand'

export default function LandingPage() {
  useSeo({
    title: `${BRAND.app} — Make Someone's Day Special ✨`,
    description:
      'Create a beautiful personalized greeting they will never forget. Cinematic digital surprises with hearts, particles, generative music and a unique shareable link — free forever, by NxK Developer.',
    canonicalPath: '/',
  })

  return (
    <div className="relative min-h-dvh">
      <div className="noise-overlay" aria-hidden="true" />
      <Navbar />
      <main>
        <Hero />
        <HowItWorks />
        <ExperiencePreview />
        <CategoriesSection />
        <FeaturesSection />
        <WhyChooseUs />
        <CTASection />
      </main>
      <Footer />
    </div>
  )
}
