import Navbar from '../../components/Navbar/Navbar';
import Hero from '../../components/Hero/Hero';
import FeaturedRestaurants from '../../components/FeaturedRestaurants/FeaturedRestaurants';
import Experience from '../../components/Experience/Experience';
import AIAssistant from '../../components/AIAssistant/AIAssistant';
import Footer from '../../components/Footer/Footer';
import About from '../../components/About/About';
import Reservation from '../Reservation/Reservation';
import './Home.css';

function Home() {
  return (
    <>
      <Navbar />

      <main>
        <Hero />
        <FeaturedRestaurants />
        <Experience />
        <About />
        <Reservation />
        <AIAssistant />
      </main>

      <Footer />
    </>
  );
}

export default Home;