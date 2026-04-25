import Hero from '@/components/homepage/Hero'
import LogoStrip from '@/components/homepage/LogoStrip'
import CreatorsRotating from '@/components/homepage/CreatorsRotating'
import CTABox from '@/components/homepage/CTABox'
import FounderNote from '@/components/homepage/FounderNote'
import Footer from '@/components/homepage/Footer'

export default function Home() {
  return (
      <>
        <Hero />
        <LogoStrip />
        <CreatorsRotating direction="right" />
        <CTABox />
        <FounderNote />
        <Footer />
      </>
  )
}