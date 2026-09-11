import { ArrowUpRight, Sparkles } from 'lucide-react';
import './About.css';

function About() {
  return (
    <section className="about" id="about">
      <div className="container">

        <div className="about-top">
          <p className="section-eyebrow">ABOUT LUMORA</p>

          <div className="about-intro">
            <h2>
              Dining is more
              <span>than a reservation.</span>
            </h2>

            <p>
              Lumora brings exceptional restaurants, intimate private dining,
              and unforgettable culinary experiences together in one elegant
              destination.
            </p>
          </div>
        </div>

        <div className="about-grid">

          <div className="about-image-wrap">
            <img
              src="/images/experiences/private-dining.jpg"
              alt="Elegant Lumora dining experience"
            />

            <div className="about-image-overlay"></div>

            <div className="about-image-label">
              <Sparkles size={14} strokeWidth={1.3} />
              <span>CURATED EXPERIENCES</span>
            </div>

            <span className="about-image-number">01 / 03</span>
          </div>

          <div className="about-content">

            <div className="about-statement">
              <span className="about-line"></span>

              <p>
                We believe the best dining experiences begin long before
                the first course arrives.
              </p>
            </div>

            <div className="about-features">

              <div className="about-feature">
                <span>01</span>

                <div>
                  <h3>Thoughtfully Curated</h3>
                  <p>
                    Restaurants and experiences selected for atmosphere,
                    cuisine, service, and character.
                  </p>
                </div>
              </div>

              <div className="about-feature">
                <span>02</span>

                <div>
                  <h3>Effortlessly Reserved</h3>
                  <p>
                    Discover your table and make a reservation without
                    unnecessary complexity.
                  </p>
                </div>
              </div>

              <div className="about-feature">
                <span>03</span>

                <div>
                  <h3>Intelligently Personal</h3>
                  <p>
                    Our intelligent dining assistant helps you discover
                    experiences based on your occasion and preferences.
                  </p>
                </div>
              </div>

            </div>

            <a href="#ai-assistant" className="about-link">
              Discover Lumora
              <ArrowUpRight size={17} strokeWidth={1.4} />
            </a>

          </div>

        </div>

        <div className="about-bottom">

          <div>
            <span>01</span>
            <p>CURATED RESTAURANTS</p>
          </div>

          <div>
            <span>02</span>
            <p>PRIVATE EXPERIENCES</p>
          </div>

          <div>
            <span>03</span>
            <p>INTELLIGENT DISCOVERY</p>
          </div>

          <div>
            <span>04</span>
            <p>SEAMLESS RESERVATIONS</p>
          </div>

        </div>

      </div>
    </section>
  );
}

export default About;