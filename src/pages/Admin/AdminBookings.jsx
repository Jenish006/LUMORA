import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import {
  Search,
  CalendarDays,
  RefreshCw,
  Eye,
  XCircle,
} from 'lucide-react';

const AdminBookings = () => {
  const navigate = useNavigate();

  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] =
    useState('ALL');

  const [cancellingBookingId, setCancellingBookingId] =
    useState(null);

  const [bookingToCancel, setBookingToCancel] =
    useState(null);

  // ============================================================
  // FETCH BOOKINGS
  // ============================================================

  const fetchBookings = async () => {
    try {
      setLoading(true);
      setError('');

      const response = await fetch(
        'http://localhost:5000/api/admin/bookings',
        {
          method: 'GET',
          credentials: 'include',
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message ||
            'Unable to load bookings'
        );
      }

      setBookings(data.bookings || []);
    } catch (error) {
      console.error(
        'Admin bookings error:',
        error
      );

      setError(
        error.message ||
          'Unable to load bookings'
      );
    } finally {
      setLoading(false);
    }
  };

  // ============================================================
  // INITIAL LOAD
  // ============================================================

  useEffect(() => {
    let cancelled = false;

    const loadBookings = async () => {
      try {
        const response = await fetch(
          'http://localhost:5000/api/admin/bookings',
          {
            method: 'GET',
            credentials: 'include',
          }
        );

        const data = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(
            data.message ||
              'Unable to load bookings'
          );
        }

        if (!cancelled) {
          setBookings(data.bookings || []);
          setError('');
          setLoading(false);
        }
      } catch (error) {
        console.error(
          'Admin bookings error:',
          error
        );

        if (!cancelled) {
          setError(
            error.message ||
              'Unable to load bookings'
          );
          setLoading(false);
        }
      }
    };

    loadBookings();

    return () => {
      cancelled = true;
    };
  }, []);

  // ============================================================
  // CANCEL BOOKING
  // ============================================================

  const handleCancelBooking = async (
    booking
  ) => {
    try {
      setCancellingBookingId(
        booking.id
      );

      const response = await fetch(
        `http://localhost:5000/api/admin/bookings/${booking.id}/cancel`,
        {
          method: 'PATCH',
          credentials: 'include',
          headers: {
            'Content-Type':
              'application/json',
          },
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message ||
            'Unable to cancel booking'
        );
      }

      setBookings(
        (currentBookings) =>
          currentBookings.map(
            (item) =>
              String(item.id) ===
              String(booking.id)
                ? {
                    ...item,
                    status:
                      data.booking?.status ||
                      'CANCELLED',
                  }
                : item
          )
      );
    } catch (error) {
      console.error(
        'Admin booking cancellation error:',
        error
      );

      alert(
        error.message ||
          'Unable to cancel booking.'
      );
    } finally {
      setCancellingBookingId(null);
    }
  };

  // ============================================================
  // FORMAT DATE
  // ============================================================

  const formatDate = (date) => {
    if (!date) {
      return '--';
    }

    const parsed = new Date(date);

    if (Number.isNaN(parsed.getTime())) {
      return '--';
    }

    return parsed.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  // ============================================================
  // FORMAT TIME
  // ============================================================

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

  // ============================================================
  // FORMAT CURRENCY
  // ============================================================

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(Number(amount || 0));
  };

  // ============================================================
  // FILTER BOOKINGS
  // ============================================================

  const filteredBookings = bookings.filter(
    (booking) => {
      const search = searchTerm
        .trim()
        .toLowerCase();

      const matchesSearch =
        !search ||
        String(booking.id || '')
          .toLowerCase()
          .includes(search) ||
        String(
          booking.user_name || ''
        )
          .toLowerCase()
          .includes(search) ||
        String(
          booking.user_email || ''
        )
          .toLowerCase()
          .includes(search) ||
        String(
          booking.restaurant_name || ''
        )
          .toLowerCase()
          .includes(search);

      const matchesStatus =
        statusFilter === 'ALL' ||
        String(booking.status || '')
          .toUpperCase() === statusFilter;

      return (
        matchesSearch &&
        matchesStatus
      );
    }
  );

  // ============================================================
  // LOADING
  // ============================================================

  if (loading) {
    return (
      <div className="admin-loading">
        <div className="admin-loader" />

        <p>
          Loading bookings...
        </p>
      </div>
    );
  }

  // ============================================================
  // ERROR
  // ============================================================

  if (error) {
    return (
      <div className="admin-error">
        <h3>
          Unable to load bookings
        </h3>

        <p>
          {error}
        </p>

        <button
          type="button"
          onClick={fetchBookings}
          className="admin-retry-button"
        >
          Try Again
        </button>
      </div>
    );
  }

  // ============================================================
  // PAGE
  // ============================================================

  return (
    <div className="admin-bookings-page">

      {/* PAGE HEADING */}

      <div className="admin-page-heading">

        <div>

          <span className="admin-eyebrow">
            MANAGEMENT
          </span>

          <h2>
            Bookings
          </h2>

          <p>
            View and monitor all LUMORA
            restaurant reservations.
          </p>

        </div>

        <button
          type="button"
          className="admin-refresh-button"
          onClick={fetchBookings}
        >
          <RefreshCw size={14} />
          Refresh
        </button>

      </div>

      {/* FILTER BAR */}

      <div className="admin-bookings-toolbar">

        <div className="admin-bookings-search">

          <Search size={17} />

          <input
            type="text"
            placeholder="Search booking, customer or restaurant..."
            value={searchTerm}
            onChange={(event) =>
              setSearchTerm(
                event.target.value
              )
            }
          />

        </div>

        <div className="admin-bookings-filters">

          {[
            'ALL',
            'CONFIRMED',
            'PENDING',
            'CANCELLED',
            'COMPLETED',
          ].map((status) => (

            <button
              key={status}
              type="button"
              className={
                statusFilter === status
                  ? 'admin-filter-active'
                  : ''
              }
              onClick={() =>
                setStatusFilter(status)
              }
            >
              {status}
            </button>

          ))}

        </div>

      </div>

      {/* RESULTS INFO */}

      <div className="admin-bookings-meta">

        <span>
          Showing{' '}

          <strong>
            {filteredBookings.length}
          </strong>{' '}

          of{' '}

          <strong>
            {bookings.length}
          </strong>{' '}

          bookings
        </span>

      </div>

      {/* BOOKINGS TABLE */}

      <div className="admin-table-card">

        <div className="admin-table-wrapper">

          <table className="admin-bookings-table">

            <thead>

              <tr>

                <th>
                  BOOKING
                </th>

                <th>
                  CUSTOMER
                </th>

                <th>
                  RESTAURANT
                </th>

                <th>
                  DATE & TIME
                </th>

                <th>
                  GUESTS
                </th>

                <th>
                  AMOUNT
                </th>

                <th>
                  STATUS
                </th>

                <th>
                  ACTION
                </th>

              </tr>

            </thead>

            <tbody>

              {filteredBookings.length > 0 ? (

                filteredBookings.map(
                  (booking) => (

                    <tr key={booking.id}>

                      {/* BOOKING */}

                      <td>

                        <div className="admin-table-booking-id">

                          <strong>
                            #{booking.id}
                          </strong>

                          <span>
                            {booking.table_id
                              ? `Table ${booking.table_id}`
                              : 'Reservation'}
                          </span>

                        </div>

                      </td>

                      {/* CUSTOMER */}

                      <td>

                        <div className="admin-table-customer">

                          <strong>
                            {booking.user_name ||
                              'Unknown'}
                          </strong>

                          <span>
                            {booking.user_email ||
                              '--'}
                          </span>

                        </div>

                      </td>

                      {/* RESTAURANT */}

                      <td>

                        <div className="admin-table-restaurant">

                          <strong>
                            {booking.restaurant_name ||
                              '--'}
                          </strong>

                          <span>
                            {booking.restaurant_city ||
                              '--'}
                          </span>

                        </div>

                      </td>

                      {/* DATE & TIME */}

                      <td>

                        <div className="admin-table-datetime">

                          <strong>
                            {formatDate(
                              booking.booking_date
                            )}
                          </strong>

                          <span>

                            <CalendarDays
                              size={12}
                            />

                            {formatTime(
                              booking.booking_time
                            )}

                          </span>

                        </div>

                      </td>

                      {/* GUESTS */}

                      <td>

                        <span className="admin-table-guests">
                          {booking.guests || 0}
                        </span>

                      </td>

                      {/* AMOUNT */}

                      <td>

                        <strong className="admin-table-amount">
                          {formatCurrency(
                            booking.total_amount
                          )}
                        </strong>

                      </td>

                      {/* STATUS */}

                      <td>

                        <span
                          className={`admin-status admin-status-${String(
                            booking.status || ''
                          ).toLowerCase()}`}
                        >
                          {booking.status ||
                            '--'}
                        </span>

                      </td>

                      {/* ACTION */}

                      <td>

                        <div className="admin-booking-actions">

                          {/* VIEW */}

                          <button
                            type="button"
                            className="admin-view-button"
                            title="View booking"
                            onClick={() =>
                              navigate(
                                `/admin/bookings/${booking.id}`
                              )
                            }
                          >
                            <Eye size={15} />
                          </button>

                          {/* CANCEL */}

                          {String(
                            booking.status || ''
                          ).toUpperCase() ===
                            'PENDING' && (

                            <button
                              type="button"
                              className="admin-booking-cancel-button"
                              title="Cancel booking"
                              onClick={() =>
                                setBookingToCancel(
                                  booking
                                )
                              }
                              disabled={
                                cancellingBookingId ===
                                booking.id
                              }
                            >

                              <XCircle
                                size={14}
                              />

                              {cancellingBookingId ===
                              booking.id
                                ? 'Cancelling...'
                                : 'Cancel'}

                            </button>

                          )}

                        </div>

                      </td>

                    </tr>

                  )
                )

              ) : (

                <tr>

                  <td
                    colSpan="8"
                    className="admin-table-empty"
                  >

                    <CalendarDays size={30} />

                    <strong>
                      No bookings found
                    </strong>

                    <span>
                      Try changing your search
                      or filter.
                    </span>

                  </td>

                </tr>

              )}

            </tbody>

          </table>

        </div>

      </div>

      {/* ========================================================
          CANCEL BOOKING CONFIRMATION MODAL
      ======================================================== */}

      {bookingToCancel && (

        <div
          className="admin-confirm-overlay"
          onClick={() => {

            if (
              cancellingBookingId === null
            ) {
              setBookingToCancel(null);
            }

          }}
        >

          <div
            className="admin-confirm-modal"
            onClick={(event) =>
              event.stopPropagation()
            }
          >

            <div className="admin-confirm-icon">
              <XCircle size={22} />
            </div>

            <div className="admin-confirm-content">

              <span className="admin-eyebrow">
                CONFIRM ACTION
              </span>

              <h3>
                Cancel Booking?
              </h3>

              <p>
                Are you sure you want to cancel
                booking #{bookingToCancel.id}?
                This action cannot be undone.
              </p>

            </div>

            <div className="admin-confirm-actions">

              <button
                type="button"
                className="admin-confirm-secondary"
                onClick={() =>
                  setBookingToCancel(null)
                }
                disabled={
                  cancellingBookingId !== null
                }
              >
                Keep Booking
              </button>

              <button
                type="button"
                className="admin-confirm-danger"
                onClick={async () => {

                  const booking =
                    bookingToCancel;

                  setBookingToCancel(null);

                  await handleCancelBooking(
                    booking
                  );

                }}
                disabled={
                  cancellingBookingId !== null
                }
              >

                <XCircle size={15} />

                Cancel Booking

              </button>

            </div>

          </div>

        </div>

      )}

    </div>
  );
};

export default AdminBookings;