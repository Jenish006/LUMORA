import { useEffect, useState } from 'react';
import {
  useNavigate,
  useParams,
} from 'react-router-dom';

import {
  ArrowLeft,
  CalendarDays,
  Clock3,
  Users,
  Utensils,
  CreditCard,
  User,
  Mail,
  MapPin,
  Hash,
} from 'lucide-react';

const AdminBookingDetails = () => {
  const navigate = useNavigate();
  const { bookingId } = useParams();

  const [booking, setBooking] = useState(null);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;

    const loadBookingDetails = async () => {
      try {
        const response = await fetch(
          `http://localhost:5000/api/admin/bookings/${bookingId}`,
          {
            method: 'GET',
            credentials: 'include',
          }
        );

        const data = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(
            data.message ||
              'Unable to load booking details'
          );
        }

        if (!cancelled) {
          setBooking(data.booking);
          setPayments(data.payments || []);
          setError('');
          setLoading(false);
        }
      } catch (error) {
        console.error(
          'Admin booking details error:',
          error
        );

        if (!cancelled) {
          setError(
            error.message ||
              'Unable to load booking details'
          );
          setLoading(false);
        }
      }
    };

    loadBookingDetails();

    return () => {
      cancelled = true;
    };
  }, [bookingId]);

  const formatDate = (date) => {
    if (!date) {
      return '--';
    }

    const parsed = new Date(date);

    if (Number.isNaN(parsed.getTime())) {
      return '--';
    }

    return parsed.toLocaleDateString('en-IN', {
      weekday: 'short',
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const formatTime = (time) => {
    if (!time) {
      return '--';
    }

    const parts = String(time)
      .slice(0, 5)
      .split(':');

    const hours = Number(parts[0]);
    const minutes = Number(parts[1]);

    if (
      Number.isNaN(hours) ||
      Number.isNaN(minutes)
    ) {
      return String(time);
    }

    const date = new Date();

    date.setHours(hours);
    date.setMinutes(minutes);
    date.setSeconds(0);
    date.setMilliseconds(0);

    return date.toLocaleTimeString('en-IN', {
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(Number(amount || 0));
  };

  const getStatusClass = (status) => {
    return `admin-status admin-status-${String(
      status || ''
    ).toLowerCase()}`;
  };

  if (loading) {
    return (
      <div className="admin-loading">
        <div className="admin-loader" />

        <p>
          Loading booking details...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="admin-error">
        <h3>
          Unable to load booking
        </h3>

        <p>
          {error}
        </p>

        <button
          type="button"
          className="admin-retry-button"
          onClick={() =>
            navigate('/admin/bookings')
          }
        >
          Back to Bookings
        </button>
      </div>
    );
  }

  return (
    <div className="admin-booking-details-page">

      {/* HEADER */}

      <div className="admin-details-top">
        <button
          type="button"
          className="admin-back-button"
          onClick={() =>
            navigate('/admin/bookings')
          }
        >
          <ArrowLeft size={16} />
          Back to Bookings
        </button>

        <span className={getStatusClass(booking.status)}>
          {booking.status || '--'}
        </span>
      </div>

      <div className="admin-page-heading">
        <div>
          <span className="admin-eyebrow">
            BOOKING DETAILS
          </span>

          <h2>
            Booking #{booking.id}
          </h2>

          <p>
            Complete reservation information
            and payment history.
          </p>
        </div>
      </div>

      {/* SUMMARY CARDS */}

      <div className="admin-details-summary">

        <div className="admin-details-summary-card">
          <div className="admin-details-summary-icon">
            <CalendarDays size={19} />
          </div>

          <div>
            <span>
              DATE
            </span>

            <strong>
              {formatDate(
                booking.booking_date
              )}
            </strong>
          </div>
        </div>

        <div className="admin-details-summary-card">
          <div className="admin-details-summary-icon">
            <Clock3 size={19} />
          </div>

          <div>
            <span>
              TIME
            </span>

            <strong>
              {formatTime(
                booking.booking_time
              )}
            </strong>
          </div>
        </div>

        <div className="admin-details-summary-card">
          <div className="admin-details-summary-icon">
            <Users size={19} />
          </div>

          <div>
            <span>
              GUESTS
            </span>

            <strong>
              {booking.guests || 0}
            </strong>
          </div>
        </div>

        <div className="admin-details-summary-card admin-details-summary-dark">
          <div className="admin-details-summary-icon">
            <CreditCard size={19} />
          </div>

          <div>
            <span>
              TOTAL
            </span>

            <strong>
              {formatCurrency(
                booking.total_amount
              )}
            </strong>
          </div>
        </div>

      </div>

      {/* MAIN GRID */}

      <div className="admin-details-grid">

        {/* CUSTOMER */}

        <div className="admin-details-card">

          <div className="admin-details-card-header">
            <div>
              <span className="admin-eyebrow">
                CUSTOMER
              </span>

              <h3>
                Customer Information
              </h3>
            </div>

            <User size={19} />
          </div>

          <div className="admin-details-info-list">

            <div className="admin-details-info-item">
              <User size={16} />

              <div>
                <span>
                  NAME
                </span>

                <strong>
                  {booking.user_name ||
                    '--'}
                </strong>
              </div>
            </div>

            <div className="admin-details-info-item">
              <Mail size={16} />

              <div>
                <span>
                  EMAIL
                </span>

                <strong>
                  {booking.user_email ||
                    '--'}
                </strong>
              </div>
            </div>

          </div>

        </div>

        {/* RESTAURANT */}

        <div className="admin-details-card">

          <div className="admin-details-card-header">
            <div>
              <span className="admin-eyebrow">
                RESTAURANT
              </span>

              <h3>
                Dining Information
              </h3>
            </div>

            <Utensils size={19} />
          </div>

          <div className="admin-details-info-list">

            <div className="admin-details-info-item">
              <Utensils size={16} />

              <div>
                <span>
                  RESTAURANT
                </span>

                <strong>
                  {booking.restaurant_name ||
                    '--'}
                </strong>
              </div>
            </div>

            <div className="admin-details-info-item">
              <MapPin size={16} />

              <div>
                <span>
                  CITY
                </span>

                <strong>
                  {booking.restaurant_city ||
                    '--'}
                </strong>
              </div>
            </div>

            <div className="admin-details-info-item">
              <Hash size={16} />

              <div>
                <span>
                  TABLE
                </span>

                <strong>
                  {booking.table_id
                    ? `Table ${booking.table_id}`
                    : 'Reservation'}
                </strong>
              </div>
            </div>

          </div>

        </div>

        {/* BOOKING INFORMATION */}

        <div className="admin-details-card">

          <div className="admin-details-card-header">
            <div>
              <span className="admin-eyebrow">
                RESERVATION
              </span>

              <h3>
                Booking Information
              </h3>
            </div>

            <CalendarDays size={19} />
          </div>

          <div className="admin-details-info-list">

            <div className="admin-details-info-item">
              <Hash size={16} />

              <div>
                <span>
                  BOOKING ID
                </span>

                <strong>
                  #{booking.id}
                </strong>
              </div>
            </div>

            <div className="admin-details-info-item">
              <CalendarDays size={16} />

              <div>
                <span>
                  DATE
                </span>

                <strong>
                  {formatDate(
                    booking.booking_date
                  )}
                </strong>
              </div>
            </div>

            <div className="admin-details-info-item">
              <Clock3 size={16} />

              <div>
                <span>
                  TIME
                </span>

                <strong>
                  {formatTime(
                    booking.booking_time
                  )}
                </strong>
              </div>
            </div>

            <div className="admin-details-info-item">
              <Users size={16} />

              <div>
                <span>
                  GUESTS
                </span>

                <strong>
                  {booking.guests || 0}
                </strong>
              </div>
            </div>

          </div>

        </div>

        {/* PAYMENT */}

        <div className="admin-details-card">

          <div className="admin-details-card-header">
            <div>
              <span className="admin-eyebrow">
                PAYMENTS
              </span>

              <h3>
                Payment History
              </h3>
            </div>

            <CreditCard size={19} />
          </div>

          {payments.length > 0 ? (
            <div className="admin-payment-list">

              {payments.map((payment) => (
                <div
                  className="admin-payment-item"
                  key={payment.id}
                >
                  <div>
                    <strong>
                      {payment.provider ||
                        '--'}
                    </strong>

                    <span>
                      {payment.provider_payment_id ||
                        payment.provider_order_id ||
                        'No provider ID'}
                    </span>
                  </div>

                  <div className="admin-payment-right">
                    <strong>
                      {formatCurrency(
                        payment.amount
                      )}
                    </strong>

                    <span
                      className={getStatusClass(
                        payment.status
                      )}
                    >
                      {payment.status ||
                        '--'}
                    </span>
                  </div>
                </div>
              ))}

            </div>
          ) : (
            <div className="admin-details-no-payment">
              <CreditCard size={26} />

              <p>
                No payment records found.
              </p>
            </div>
          )}

        </div>

      </div>

    </div>
  );
};

export default AdminBookingDetails;