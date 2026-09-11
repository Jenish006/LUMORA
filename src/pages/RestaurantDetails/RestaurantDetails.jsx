import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  Check,
  Clock3,
  Heart,
  MapPin,
  Star,
  Users,
  Utensils,
} from 'lucide-react';

import { Link, useParams } from 'react-router-dom';
import { useState } from 'react';

import './RestaurantDetails.css';

const restaurants = {
  aurelia: {
    name: 'The Aurelia',
    city: 'Chennai',
    cuisine: 'Modern European',
    rating: '4.9',
    reviews: '248',
    price: '₹₹₹₹',
    image: '/images/restaurants/restaurant-01.jpg',
    description:
      'A refined European dining experience where seasonal ingredients, elegant interiors, and thoughtful hospitality come together.',
    address: '28 Cathedral Road, Chennai',
    hours: '6:00 PM — 11:30 PM',
    dressCode: 'Smart Casual',
  },

  velora: {
    name: 'Velora',
    city: 'Chennai',
    cuisine: 'Contemporary Indian',
    rating: '4.8',
    reviews: '196',
    price: '₹₹',
    image: '/images/restaurants/restaurant-02.jpg',
    description:
      'Contemporary Indian cuisine inspired by regional flavours, presented through a modern and elegant dining experience.',
    address: '12 Nungambakkam High Road, Chennai',
    hours: '12:00 PM — 11:00 PM',
    dressCode: 'Smart Casual',
  },

  'maison-noir': {
    name: 'Maison Noir',
    city: 'Chennai',
    cuisine: 'Fine Dining',
    rating: '4.9',
    reviews: '321',
    price: '₹₹₹₹',
    image: '/images/restaurants/restaurant-03.jpg',
    description:
      'An intimate fine-dining destination designed around sophisticated flavours, exceptional service, and unforgettable evenings.',
    address: '7 Kasturi Rangan Road, Chennai',
    hours: '7:00 PM — 12:00 AM',
    dressCode: 'Elegant',
  },

  sora: {
    name: 'Sora',
    city: 'Chennai',
    cuisine: 'Japanese Omakase',
    rating: '4.8',
    reviews: '174',
    price: '₹₹₹₹',
    image: '/images/restaurants/restaurant-04.jpg',
    description:
      'An intimate Japanese experience celebrating precision, seasonal ingredients, and the art of omakase.',
    address: '18 Khader Nawaz Khan Road, Chennai',
    hours: '6:30 PM — 11:30 PM',
    dressCode: 'Smart Casual',
  },
};

function RestaurantDetails() {
  const { restaurantId } = useParams();

  const restaurant =
    restaurants[restaurantId] || restaurants.aurelia;

  const [liked, setLiked] = useState(false);
  const [guests, setGuests] = useState(2);

  const handleReserve = () => {
    localStorage.setItem(
      'selectedRestaurant',
      JSON.stringify({
        name: restaurant.name,
        city: restaurant.city,
        cuisine: restaurant.cuisine,
      })
    );
  };

  return (
    <main className="restaurant-details">

      {/* HERO */}

      <section className="restaurant-detail-hero">

        <img
          src={restaurant.image}
          alt={restaurant.name}
          className="restaurant-detail-image"
        />

        <div className="restaurant-detail-overlay"></div>

        <div className="restaurant-detail-top container">

          <Link
            to="/"
            className="restaurant-back"
          >
            <ArrowLeft
              size={15}
              strokeWidth={1.4}
            />
            Back to Discover
          </Link>

          <button
            type="button"
            className={`restaurant-like ${
              liked ? 'liked' : ''
            }`}
            onClick={() => setLiked(!liked)}
            aria-label="Save restaurant"
          >
            <Heart
              size={18}
              strokeWidth={1.3}
              fill={liked ? 'currentColor' : 'none'}
            />
          </button>

        </div>

        <div className="restaurant-detail-hero-content container">

          <div className="restaurant-detail-meta">
            <span>{restaurant.cuisine}</span>
            <span>•</span>
            <span>{restaurant.city}</span>
          </div>

          <h1>{restaurant.name}</h1>

          <div className="restaurant-rating">

            <Star
              size={15}
              fill="currentColor"
              strokeWidth={1.2}
            />

            <strong>{restaurant.rating}</strong>

            <span>
              {restaurant.reviews} reviews
            </span>

          </div>

        </div>

      </section>

      {/* CONTENT */}

      <section className="restaurant-detail-content">

        <div className="container restaurant-detail-grid">

          {/* LEFT */}

          <div className="restaurant-main-content">

            <div className="restaurant-intro">

              <p className="restaurant-eyebrow">
                THE EXPERIENCE
              </p>

              <h2>
                An evening worth
                <span>remembering.</span>
              </h2>

              <p className="restaurant-description">
                {restaurant.description}
              </p>

            </div>

            {/* FEATURES */}

            <div className="restaurant-features">

              <div>
                <Utensils
                  size={18}
                  strokeWidth={1.3}
                />

                <span>CUISINE</span>

                <strong>
                  {restaurant.cuisine}
                </strong>
              </div>

              <div>
                <Clock3
                  size={18}
                  strokeWidth={1.3}
                />

                <span>OPENING HOURS</span>

                <strong>
                  {restaurant.hours}
                </strong>
              </div>

              <div>
                <MapPin
                  size={18}
                  strokeWidth={1.3}
                />

                <span>LOCATION</span>

                <strong>
                  {restaurant.address}
                </strong>
              </div>

              <div>
                <Users
                  size={18}
                  strokeWidth={1.3}
                />

                <span>SEATING</span>

                <strong>
                  Tables & Private Dining
                </strong>
              </div>

            </div>

            {/* MENU */}

            <div className="restaurant-menu">

              <div className="restaurant-section-heading">

                <div>
                  <p>OUR MENU</p>
                  <h3>Signature selections.</h3>
                </div>

                <span>{restaurant.price}</span>

              </div>

              <div className="menu-list">

                <div className="menu-item">
                  <div>
                    <h4>Seasonal Tasting</h4>
                    <p>
                      Chef's selection inspired by
                      the season.
                    </p>
                  </div>

                  <strong>₹1,850</strong>
                </div>

                <div className="menu-item">
                  <div>
                    <h4>Chef's Signature</h4>
                    <p>
                      A refined selection of
                      house specialties.
                    </p>
                  </div>

                  <strong>₹2,200</strong>
                </div>

                <div className="menu-item">
                  <div>
                    <h4>Private Dining Course</h4>
                    <p>
                      An intimate multi-course
                      culinary experience.
                    </p>
                  </div>

                  <strong>₹3,500</strong>
                </div>

              </div>

            </div>

          </div>

          {/* BOOKING CARD */}

          <aside className="restaurant-booking">

            <div className="booking-card">

              <p className="booking-eyebrow">
                RESERVE YOUR TABLE
              </p>

              <h3>
                Make it
                <span>yours.</span>
              </h3>

              <div className="booking-field">

                <label>GUESTS</label>

                <div className="guest-selector">

                  <button
                    type="button"
                    onClick={() =>
                      setGuests(
                        Math.max(1, guests - 1)
                      )
                    }
                  >
                    −
                  </button>

                  <span>
                    {guests}{' '}
                    {guests === 1
                      ? 'Guest'
                      : 'Guests'}
                  </span>

                  <button
                    type="button"
                    onClick={() =>
                      setGuests(
                        Math.min(8, guests + 1)
                      )
                    }
                  >
                    +
                  </button>

                </div>

              </div>

              <div className="booking-field">

                <label>DATE</label>

                <div className="booking-static-field">

                  <CalendarDays
                    size={16}
                    strokeWidth={1.3}
                  />

                  <span>
                    Select on reservation
                  </span>

                </div>

              </div>

              <div className="booking-availability">

                <Check
                  size={15}
                  strokeWidth={1.5}
                />

                <span>
                  Instant reservation confirmation
                </span>

              </div>

              <Link
                to="/reserve"
                className="booking-submit"
                onClick={handleReserve}
              >
                Reserve a Table
                <ArrowRight
                  size={16}
                  strokeWidth={1.4}
                />
              </Link>

              <p className="booking-note">
                No payment required to reserve.
              </p>

            </div>

          </aside>

        </div>

      </section>

    </main>
  );
}

export default RestaurantDetails;