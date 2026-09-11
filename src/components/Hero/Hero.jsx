import { ArrowDown, ArrowRight } from 'lucide-react';

import RippleDistortion from '../RippleDistortion/RippleDistortion';

import './Hero.css';

function Hero() {
  return (
    <section className="hero" id="home">

      <div className="hero-image">
        <RippleDistortion
          src="/images/hero/hero-restaurant.jpg"
          trigger="scroll"
          strength={0.45}
          horizontal={7}
          vertical={0.8}
          rings={6}
          brushSize={500}
          spread={7}
          fade={1.2}
          quality="high"
        />
      </div>

      <div className="hero-overlay"></div>

      <div className="hero-content container">

        <div className="hero-eyebrow">
          <span className="hero-line"></span>
          <span>DINING • EXPERIENCES • RESERVATIONS</span>
        </div>

        <h1 className="hero-title">
          Dine
          <span>Beyond</span>
          Ordinary.
        </h1>

        <p className="hero-description">
          Discover exceptional restaurants, private dining rooms,
          and unforgettable experiences — all in one place.
        </p>

        <div className="hero-buttons">

          <a
            href="#discover"
            className="hero-primary-button"
          >
            Discover Dining
            <ArrowRight
              size={16}
              strokeWidth={1.5}
            />
          </a>

          <a
            href="#experiences"
            className="hero-secondary-button"
          >
            Explore Experiences
          </a>

        </div>

      </div>

      <div className="hero-bottom container">

        <div className="hero-location">
          <span className="location-dot"></span>
          <span>EXCEPTIONAL DINING, ANYWHERE</span>
        </div>

        <div className="hero-scroll">
          <span>SCROLL TO EXPLORE</span>
          <ArrowDown
            size={15}
            strokeWidth={1.5}
          />
        </div>

      </div>

    </section>
  );
}

export default Hero;