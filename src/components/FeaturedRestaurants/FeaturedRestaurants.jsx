import { ArrowUpRight, MapPin, Star } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';

import './FeaturedRestaurants.css';

const restaurants = [
  {
    name: 'The Aurelia',
    slug: 'aurelia',
    city: 'Chennai',
    cuisine: 'Modern European',
    rating: '4.9',
    price: '₹₹₹₹',
    image: '/images/restaurants/restaurant-01.jpg',
    number: '01',
  },
  {
    name: 'Velora',
    slug: 'velora',
    city: 'Chennai',
    cuisine: 'Contemporary Indian',
    rating: '4.8',
    price: '₹₹₹',
    image: '/images/restaurants/restaurant-02.jpg',
    number: '02',
  },
  {
    name: 'Maison Noir',
    slug: 'maison-noir',
    city: 'Chennai',
    cuisine: 'Fine Dining',
    rating: '4.9',
    price: '₹₹₹₹',
    image: '/images/restaurants/restaurant-03.jpg',
    number: '03',
  },
  {
    name: 'Sora',
    slug: 'sora',
    city: 'Chennai',
    cuisine: 'Japanese Omakase',
    rating: '4.8',
    price: '₹₹₹₹',
    image: '/images/restaurants/restaurant-04.jpg',
    number: '04',
  },
];

function FeaturedRestaurants() {
  const [activeIndex, setActiveIndex] = useState(0);

  return (
    <section className="featured-restaurants" id="discover">
      <div className="container">

        {/* HEADER */}
        <div className="featured-header">
          <div>
            <p className="section-eyebrow">
              CURATED FOR YOU
            </p>

            <h2 className="section-title">
              Exceptional
              <span>Dining.</span>
            </h2>
          </div>

          <span className="view-all-link">
            View all restaurants
            <ArrowUpRight
              size={17}
              strokeWidth={1.4}
            />
          </span>
        </div>

        {/* RESTAURANT ACCORDION */}
        <div className="restaurant-accordion">

          {restaurants.map((restaurant, index) => {
            const isActive = activeIndex === index;

            return (
              <article
                key={restaurant.slug}
                className={`restaurant-card ${
                  isActive ? 'active' : ''
                }`}
                onMouseEnter={() =>
                  setActiveIndex(index)
                }
                onFocus={() =>
                  setActiveIndex(index)
                }
                tabIndex={0}
              >

                {/* IMAGE */}
                <div className="restaurant-image">
                  <img
                    src={restaurant.image}
                    alt={restaurant.name}
                  />
                </div>

                {/* OVERLAY */}
                <div className="restaurant-overlay"></div>

                {/* NUMBER */}
                <div className="restaurant-number">
                  {restaurant.number}
                </div>

                {/* COLLAPSED */}
                {!isActive && (
                  <div className="restaurant-collapsed">
                    <span>
                      {restaurant.number}
                    </span>

                    <h3>
                      {restaurant.name}
                    </h3>
                  </div>
                )}

                {/* ACTIVE */}
                {isActive && (
                  <div className="restaurant-content">

                    <div className="restaurant-top-info">

                      <span className="restaurant-category">
                        {restaurant.cuisine}
                      </span>

                      <div className="restaurant-rating">
                        <Star
                          size={12}
                          fill="currentColor"
                          strokeWidth={1}
                        />

                        {restaurant.rating}
                      </div>

                    </div>

                    <div className="restaurant-bottom-info">

                      <div>
                        <h3>
                          {restaurant.name}
                        </h3>

                        <div className="restaurant-location">

                          <MapPin
                            size={13}
                            strokeWidth={1.5}
                          />

                          <span>
                            {restaurant.city}
                          </span>

                          <span className="location-divider">
                            /
                          </span>

                          <span>
                            {restaurant.price}
                          </span>

                        </div>
                      </div>

                      {/* IMPORTANT:
                          This now opens Restaurant Details */}
                      <Link
                        to={`/restaurant/${restaurant.slug}`}
                        className="restaurant-explore"
                        onClick={(event) =>
                          event.stopPropagation()
                        }
                      >
                        Explore

                        <ArrowUpRight
                          size={17}
                          strokeWidth={1.4}
                        />
                      </Link>

                    </div>

                  </div>
                )}

              </article>
            );
          })}

        </div>

        {/* BOTTOM */}
        <div className="restaurants-bottom">

          <p>
            Four carefully selected dining experiences.
          </p>

          <span>
            MORE RESTAURANTS COMING SOON
          </span>

        </div>

      </div>
    </section>
  );
}

export default FeaturedRestaurants;