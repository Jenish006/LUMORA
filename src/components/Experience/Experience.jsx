import { ArrowUpRight } from 'lucide-react';
import './Experience.css';

function Experience() {
  return (
    <section className="experience" id="experiences">
      <div className="experience-intro container">
        <div className="experience-heading">
          <p className="section-eyebrow">MORE THAN A MEAL</p>

          <h2>
            Create moments
            <span>worth remembering.</span>
          </h2>

          <p className="experience-description">
            From intimate private rooms to spectacular rooftop dining,
            discover experiences designed around the moments that matter.
          </p>
        </div>
      </div>

      <div className="experience-expand-wrap">
        <div className="experience-expand">

          <div className="experience-image">
            <img
              src="/images/experiences/private-dining.jpg"
              alt="Luxury private dining experience"
            />
          </div>

          <div className="experience-overlay"></div>

          <div className="experience-content">
            <div className="experience-number">
              01 — PRIVATE DINING
            </div>

            <div className="experience-content-bottom">
              <h3>
                Your table.
                <br />
                Your world.
              </h3>

              <a href="#reserve" className="experience-link">
                Explore experience
                <ArrowUpRight size={18} strokeWidth={1.4} />
              </a>
            </div>
          </div>

        </div>
      </div>

      <div className="experience-secondary container">

        <article className="experience-secondary-card">
          <div className="secondary-image">
            <img
              src="/images/experiences/rooftop-dining.jpg"
              alt="Luxury rooftop dining"
            />
          </div>

          <div className="secondary-content">
            <span>02 — ROOFTOP</span>

            <h3>
              Dine above
              <br />
              the city.
            </h3>

            <a href="#reserve">
              Explore
              <ArrowUpRight size={17} strokeWidth={1.4} />
            </a>
          </div>
        </article>

        <div className="experience-statement">
          <p className="section-eyebrow">THE LUMORA EXPERIENCE</p>

          <h3>
            Designed around
            <span>your moments.</span>
          </h3>

          <p>
            Every detail matters. From the atmosphere to the table,
            Lumora brings together dining experiences worth remembering.
          </p>
        </div>

      </div>
    </section>
  );
}

export default Experience;