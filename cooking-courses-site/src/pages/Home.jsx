import Hero from '../components/Hero'
import ProblemBlock from '../components/ProblemBlock'
import CoursesGrid from '../components/CoursesGrid'
import Benefits from '../components/Benefits'
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
      <Benefits />
      <Chefs />
      <Pricing />
      <FAQ />
      <CTA />
    </div>
  )
}

export default Home



