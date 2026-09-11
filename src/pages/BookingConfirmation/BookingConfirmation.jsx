import {
  Check,
  CalendarDays,
  Clock3,
  Users,
  ArrowLeft,
  Home,
  Sparkles,
} from 'lucide-react';

import { Link } from 'react-router-dom';
import { useState } from 'react';

import './BookingConfirmation.css';

function BookingConfirmation() {
  // ==========================================================
  // GET CONFIRMED BOOKING
  // ==========================================================

  const [booking] = useState(() => {
    try {
      const storedBooking =
        localStorage.getItem('lumoraBooking');

      if (!storedBooking) {
        return {
          restaurant: 'The Aurelia',
          date: '',
          guests: 2,
          time: '7:30 PM',
          tableType: 'Indoor Table',
        };
      }

      return JSON.parse(storedBooking);
    } catch (error) {
      console.error(
        'Failed to read booking:',
        error
      );

      return {
        restaurant: 'The Aurelia',
        date: '',
        guests: 2,
        time: '7:30 PM',
        tableType: 'Indoor Table',
      };
    }
  });

  // ==========================================================
  // GET PAYMENT
  // ==========================================================

  const [payment] = useState(() => {
    try {
      const storedPayment =
        localStorage.getItem('lumoraPayment');

      if (!storedPayment) {
        return null;
      }

      return JSON.parse(storedPayment);
    } catch (error) {
      console.error(
        'Failed to read payment:',
        error
      );

      return null;
    }
  });

  // ==========================================================
  // ACTUAL BOOKING ID
  //
  // Uses the real PostgreSQL booking ID.
  // No random booking ID.
  // ==========================================================

  const actualBookingId =
    booking?.bookingId ||
    booking?.id ||
    payment?.bookingId ||
    null;

  const displayBookingId =
    actualBookingId
      ? `LM-${actualBookingId}`
      : 'LM-PENDING';

  // ==========================================================
  // ACTUAL PAYMENT AMOUNT
  //
  // Backend/payment data is the source of truth.
  // ==========================================================

  const paymentAmount = Number(
    payment?.amount ??
      booking?.totalAmount ??
      booking?.total_amount ??
      booking?.amount ??
      0
  );

  const formattedAmount =
    Number.isFinite(paymentAmount) &&
    paymentAmount > 0
      ? `₹${paymentAmount.toLocaleString('en-IN')}`
      : '₹0';

  // ==========================================================
  // RAZORPAY PAYMENT ID
  // ==========================================================

  const razorpayPaymentId =
    payment?.razorpayPaymentId ||
    null;

  // ==========================================================
  // DATE FORMAT
  // ==========================================================

  const formattedDate = booking?.date
    ? new Date(
        `${booking.date}T00:00:00`
      ).toLocaleDateString(
        'en-IN',
        {
          weekday: 'long',
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        }
      )
    : 'Date selected during reservation';

  // ==========================================================
  // UI
  // ==========================================================

  return (
    <main className="confirmation-page">

      <div className="confirmation-background"></div>

      <div className="container confirmation-container">

        {/* TOP NAV */}

        <div className="confirmation-top">

          <Link
            to="/"
            className="confirmation-logo"
          >
            <span className="confirmation-logo-mark">
              L
            </span>

            <span>LUMORA</span>
          </Link>

          <span className="confirmation-secure">

            <Sparkles
              size={14}
              strokeWidth={1.3}
            />

            RESERVATION CONFIRMED

          </span>

        </div>

        {/* SUCCESS */}

        <section className="confirmation-hero">

          <div className="confirmation-check">

            <Check
              size={34}
              strokeWidth={1.3}
            />

          </div>

          <p className="confirmation-eyebrow">
            YOUR TABLE IS RESERVED
          </p>

          <h1>
            Your table is
            <span>waiting.</span>
          </h1>

          <p className="confirmation-description">
            Your reservation has been successfully confirmed.
            We look forward to welcoming you for an exceptional
            dining experience.
          </p>

        </section>

        {/* BOOKING CARD */}

        <section className="confirmation-card">

          <div className="confirmation-card-header">

            <div>

              <span className="confirmation-label">
                RESERVATION DETAILS
              </span>

              <h2>
                {booking.restaurant}
              </h2>

            </div>

            <div className="confirmation-booking-id">

              <span>
                BOOKING ID
              </span>

              <strong>
                {displayBookingId}
              </strong>

            </div>

          </div>

          <div className="confirmation-divider"></div>

          {/* BOOKING DETAILS */}

          <div className="confirmation-details">

            {/* DATE */}

            <div className="confirmation-detail">

              <div className="confirmation-detail-icon">

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

            {/* TIME */}

            <div className="confirmation-detail">

              <div className="confirmation-detail-icon">

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

            {/* GUESTS */}

            <div className="confirmation-detail">

              <div className="confirmation-detail-icon">

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

            {/* SEATING */}

            <div className="confirmation-detail">

              <div className="confirmation-detail-icon">

                <Sparkles
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

          <div className="confirmation-divider"></div>

          {/* PAYMENT */}

          <div className="confirmation-payment">

            <div>

              <span>
                PAYMENT
              </span>

              <p>
                Reservation payment successfully received
              </p>

              {razorpayPaymentId && (
                <small>
                  Payment ID: {razorpayPaymentId}
                </small>
              )}

            </div>

            <strong>
              {formattedAmount}
            </strong>

          </div>

        </section>

        {/* ACTIONS */}

        <div className="confirmation-actions">

          <Link
            to="/"
            className="confirmation-primary"
          >

            <Home
              size={16}
              strokeWidth={1.4}
            />

            Back to Home

          </Link>

          <Link
            to="/reserve"
            className="confirmation-secondary"
          >

            <ArrowLeft
              size={16}
              strokeWidth={1.4}
            />

            Make Another Reservation

          </Link>

        </div>

        {/* FOOTER MESSAGE */}

        <div className="confirmation-note">

          <span></span>

          <p>
            Please arrive 10 minutes before your reservation time.
          </p>

          <span></span>

        </div>

      </div>

    </main>
  );
}

export default BookingConfirmation;