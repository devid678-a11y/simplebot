import Hero from '../components/Hero'
import ProblemBlock from '../components/ProblemBlock'
import CoursesGrid from '../components/CoursesGrid'
import Process from '../components/Process'
import Benefits from '../components/Benefits'
import Testimonials from '../components/Testimonials'
import Chefs from '../components/Chefs'
import Pricing from '../components/Pricing'
import FAQ from '../components/FAQ'
import CTA from '../components/CTA'
import './Home.css'

const Home = () => {
  return (
    <div className="home">
      <Hero />
      <ProblemBlock />
      <CoursesGrid />
      <Process />
      <Benefits />
      <Testimonials />
      <Chefs />
      <Pricing />
      <FAQ />
      <CTA />
    </div>
  )
}

export default Home



