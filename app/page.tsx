import Hero from '@/components/homepage/Hero'
import LogoStrip from '@/components/homepage/LogoStrip'
import CreatorsRotating from '@/components/homepage/CreatorsRotating'
import CTABox from '@/components/homepage/CTABox'
import FounderNote from '@/components/homepage/FounderNote'
import Footer from '@/components/homepage/Footer'
import Header from "@/components/layout/Header";

export default function Home() {
  return (
      <>
          <Header />
        <Hero />
        <LogoStrip />
        <CreatorsRotating direction="right" />
        <CTABox />
        <FounderNote />
        <Footer />
      </>
  )
}