import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  Check,
  Clock3,
  Edit3,
  LockKeyhole,
  MapPin,
  Sparkles,
  Users,
  Utensils,
} from 'lucide-react';

import { Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';

import './BookingSummary.css';

function BookingSummary() {
  const navigate = useNavigate();

  const [booking] = useState(() => {
    const savedBooking = localStorage.getItem('lumoraBooking');

    return savedBooking
      ? JSON.parse(savedBooking)
      : {
          restaurant: 'The Aurelia',
          date: '',
          guests: 2,
          time: '7:30 PM',
          tableType: 'Indoor Table',
        };
  });

  const [isContinuing, setIsContinuing] = useState(false);

  // ============================================================
  // BOOKING AMOUNT
  //
  // Use the amount already stored from the backend/Reservation.
  // No hardcoded ₹2,500 fallback.
  // ============================================================

  const reservationAmount = Number(
    booking?.totalAmount ??
      booking?.total_amount ??
      booking?.amount ??
      0
  );

  const formattedAmount = Number.isFinite(reservationAmount)
    ? reservationAmount.toLocaleString('en-IN')
    : '0';

  const formattedDate = booking.date
    ? new Date(`${booking.date}T00:00:00`).toLocaleDateString(
        'en-IN',
        {
          weekday: 'long',
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        }
      )
    : 'Date not selected';

  // ============================================================
  // Continue to Payment
  //
  // IMPORTANT:
  // Reservation.jsx already creates the PENDING booking.
  // Therefore this page MUST NOT create another booking.
  // ============================================================

  const handleContinue = () => {
    // ----------------------------------------------------------
    // Check logged-in user
    // ----------------------------------------------------------

    const savedUser = localStorage.getItem('lumoraUser');

    if (!savedUser) {
      alert(
        'Please sign in before continuing with your reservation.'
      );

      navigate('/login');
      return;
    }

    let user;

    try {
      user = JSON.parse(savedUser);
    } catch {
      alert(
        'Your account session is invalid. Please sign in again.'
      );

      localStorage.removeItem('lumoraUser');
      navigate('/login');
      return;
    }

    if (!user?.id) {
      alert(
        'Your account session is invalid. Please sign in again.'
      );

      localStorage.removeItem('lumoraUser');
      navigate('/login');
      return;
    }

    // ----------------------------------------------------------
    // Check existing backend booking
    // ----------------------------------------------------------

    if (!booking?.id) {
      alert(
        'Booking information is missing. Please create your reservation again.'
      );

      navigate('/reserve');
      return;
    }

    // ----------------------------------------------------------
    // Check required booking information
    // ----------------------------------------------------------

    if (!booking.restaurantId) {
      alert(
        'Restaurant information is missing. Please edit your reservation.'
      );
      return;
    }

    if (!booking.date) {
      alert('Booking date is missing.');
      return;
    }

    if (!booking.bookingTime) {
      alert('Booking time is missing.');
      return;
    }

    if (!booking.guests) {
      alert('Guest count is missing.');
      return;
    }

    // ----------------------------------------------------------
    // Check selected resource
    // ----------------------------------------------------------

    if (
      booking.tableType === 'Indoor Table' &&
      !booking.tableId
    ) {
      alert(
        'No table has been selected. Please edit your reservation.'
      );
      return;
    }

    if (
      booking.tableType === 'Private Dining' &&
      !booking.privateRoomId
    ) {
      alert(
        'No private dining room has been selected. Please edit your reservation.'
      );
      return;
    }

    // ----------------------------------------------------------
    // IMPORTANT:
    // Reservation.jsx already created the booking.
    //
    // Just make sure bookingId exists for Payment.jsx.
    //
    // IMPORTANT:
    // Do NOT use a hardcoded ₹2,500 fallback.
    // ----------------------------------------------------------

    const updatedBooking = {
      ...booking,

      bookingId:
        booking.bookingId ||
        booking.id,

      bookingStatus:
        booking.bookingStatus ||
        booking.status ||
        'PENDING',

      totalAmount:
        booking.totalAmount ??
        booking.total_amount ??
        booking.amount ??
        0,
    };

    localStorage.setItem(
      'lumoraBooking',
      JSON.stringify(updatedBooking)
    );

    // ----------------------------------------------------------
    // Continue to payment
    // ----------------------------------------------------------

    setIsContinuing(true);

    navigate('/payment');
  };

  return (
    <main className="booking-summary-page">

      <div className="booking-summary-glow"></div>

      <div className="container booking-summary-container">

        {/* TOP */}

        <header className="booking-summary-top">

          <Link
            to="/reserve"
            className="booking-summary-back"
          >
            <ArrowLeft
              size={15}
              strokeWidth={1.4}
            />

            Edit Reservation
          </Link>

          <Link
            to="/"
            className="booking-summary-logo"
          >
            <span className="booking-summary-logo-mark">
              L
            </span>

            <span>LUMORA</span>
          </Link>

          <div className="booking-summary-secure">
            <LockKeyhole
              size={13}
              strokeWidth={1.4}
            />

            SECURE CHECKOUT
          </div>

        </header>

        {/* HEADER */}

        <section className="booking-summary-heading">

          <p className="booking-summary-eyebrow">
            02 — REVIEW YOUR RESERVATION
          </p>

          <h1>
            Your evening,
            <span>beautifully planned.</span>
          </h1>

          <p>
            Review your reservation details before
            continuing to secure your experience.
          </p>

        </section>

        {/* MAIN GRID */}

        <section className="booking-summary-grid">

          {/* LEFT */}

          <div className="booking-summary-main">

            {/* RESTAURANT */}

            <div className="summary-restaurant-card">

              <div className="summary-restaurant-image">

                <div className="summary-image-overlay"></div>

                <div className="summary-restaurant-image-content">

                  <span>
                    YOUR DESTINATION
                  </span>

                  <h2>
                    {booking.restaurant}
                  </h2>

                  <div>
                    <MapPin
                      size={13}
                      strokeWidth={1.4}
                    />

                    Chennai
                  </div>

                </div>

              </div>

              <div className="summary-restaurant-info">

                <div>

                  <span>
                    CUISINE
                  </span>

                  <strong>
                    {booking.restaurant === 'Velora'
                      ? 'Contemporary Indian'
                      : booking.restaurant === 'Sora'
                      ? 'Japanese Omakase'
                      : booking.restaurant === 'Maison Noir'
                      ? 'Fine Dining'
                      : 'Modern European'}
                  </strong>

                </div>

                <div>

                  <span>
                    DINING STYLE
                  </span>

                  <strong>
                    {booking.tableType}
                  </strong>

                </div>

              </div>

            </div>

            {/* DETAILS */}

            <div className="summary-details-card">

              <div className="summary-card-heading">

                <div>

                  <span>
                    RESERVATION DETAILS
                  </span>

                  <h3>
                    Your selected experience.
                  </h3>

                </div>

                <Edit3
                  size={17}
                  strokeWidth={1.3}
                />

              </div>

              <div className="summary-details-grid">

                <div className="summary-detail">

                  <div className="summary-detail-icon">

                    <CalendarDays
                      size={18}
                      strokeWidth={1.3}
                    />

                  </div>

                  <div>

                    <span>
                      DATE
                    </span>

                    <strong>
                      {formattedDate}
                    </strong>

                  </div>

                </div>

                <div className="summary-detail">

                  <div className="summary-detail-icon">

                    <Clock3
                      size={18}
                      strokeWidth={1.3}
                    />

                  </div>

                  <div>

                    <span>
                      TIME
                    </span>

                    <strong>
                      {booking.time}
                    </strong>

                  </div>

                </div>

                <div className="summary-detail">

                  <div className="summary-detail-icon">

                    <Users
                      size={18}
                      strokeWidth={1.3}
                    />

                  </div>

                  <div>

                    <span>
                      GUESTS
                    </span>

                    <strong>
                      {booking.guests}{' '}
                      {booking.guests === 1
                        ? 'Guest'
                        : 'Guests'}
                    </strong>

                  </div>

                </div>

                <div className="summary-detail">

                  <div className="summary-detail-icon">

                    <Utensils
                      size={18}
                      strokeWidth={1.3}
                    />

                  </div>

                  <div>

                    <span>
                      SEATING
                    </span>

                    <strong>
                      {booking.tableType}
                    </strong>

                  </div>

                </div>

              </div>

            </div>

            {/* EXPERIENCE NOTE */}

            <div className="summary-experience">

              <div className="summary-experience-icon">

                <Sparkles
                  size={17}
                  strokeWidth={1.3}
                />

              </div>

              <div>

                <span>
                  LUMORA EXPERIENCE
                </span>

                <p>
                  Your table will be prepared before
                  your arrival. Please arrive around
                  10 minutes before your reservation.
                </p>

              </div>

            </div>

          </div>

          {/* RIGHT */}

          <aside className="summary-sidebar">

            <div className="summary-payment-card">

              <p className="summary-payment-eyebrow">
                RESERVATION PAYMENT
              </p>

              <h3>
                Secure your
                <span>evening.</span>
              </h3>

              <div className="summary-price">

                <span>
                  RESERVATION FEE
                </span>

                <strong>
                  ₹{formattedAmount}
                </strong>

              </div>

              <div className="summary-price-note">
                One-time reservation payment
              </div>

              <div className="summary-divider"></div>

              <div className="summary-total">

                <span>
                  TOTAL
                </span>

                <strong>
                  ₹{formattedAmount}
                </strong>

              </div>

              <button
                type="button"
                className="summary-continue"
                onClick={handleContinue}
                disabled={isContinuing}
              >

                {isContinuing
                  ? 'Opening Payment...'
                  : 'Continue to Payment'}

                <ArrowRight
                  size={16}
                  strokeWidth={1.4}
                />

              </button>

              <div className="summary-secure-note">

                <Check
                  size={14}
                  strokeWidth={1.5}
                />

                <span>
                  Secure and encrypted payment
                </span>

              </div>

            </div>

            <div className="summary-help-card">

              <span>
                NEED TO CHANGE SOMETHING?
              </span>

              <Link to="/reserve">

                Edit your reservation

                <ArrowRight
                  size={14}
                  strokeWidth={1.4}
                />

              </Link>

            </div>

          </aside>

        </section>

        {/* BOTTOM */}

        <div className="booking-summary-bottom">

          <div>

            <span></span>

            <p>
              Your reservation details are securely
              saved with Lumora.
            </p>

          </div>

          <span>
            © 2026 LUMORA
          </span>

        </div>

      </div>

    </main>
  );
}

export default BookingSummary;