import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  Clock3,
  LogOut,
  MapPin,
  UserRound,
  Utensils,
  XCircle,
} from 'lucide-react';

import { Link, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';

import './Account.css';

function Account() {
  const navigate = useNavigate();

  // ============================================================
  // USER
  // ============================================================

  const [user] = useState(() => {
    try {
      const savedUser = localStorage.getItem('lumoraUser');

      return savedUser
        ? JSON.parse(savedUser)
        : {
            name: 'Lumora Guest',
            email: 'guest@example.com',
            loggedIn: false,
          };
    } catch (error) {
      console.error('Failed to read user:', error);

      return {
        name: 'Lumora Guest',
        email: 'guest@example.com',
        loggedIn: false,
      };
    }
  });

  // ============================================================
  // BOOKINGS
  // ============================================================

  const [bookings, setBookings] = useState([]);

  const [loadingBookings, setLoadingBookings] = useState(
    user.loggedIn
  );

  const [bookingError, setBookingError] = useState('');

  const [cancellingBooking, setCancellingBooking] =
    useState(false);

  // ============================================================
  // CANCEL MODAL
  // ============================================================

  const [showCancelModal, setShowCancelModal] =
    useState(false);

  // ============================================================
  // CANCEL SUCCESS MODAL
  // ============================================================

  const [cancelSuccess, setCancelSuccess] =
    useState(false);

  // ============================================================
  // FETCH BOOKINGS
  // ============================================================

  useEffect(() => {
    if (!user.loggedIn) {
      return;
    }

    let cancelled = false;

    const fetchBookings = async () => {
      try {
        const response = await fetch('/api/bookings', {
          method: 'GET',
          credentials: 'include',
        });

        const data = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(
            data.message ||
              'Unable to load your reservations.'
          );
        }

        if (cancelled) {
          return;
        }

        setBookings(
          Array.isArray(data.bookings)
            ? data.bookings
            : []
        );

        setBookingError('');
        setLoadingBookings(false);
      } catch (error) {
        console.error(
          'Account bookings error:',
          error
        );

        if (cancelled) {
          return;
        }

        setBookingError(
          error.message ||
            'Unable to load your reservations.'
        );

        setLoadingBookings(false);
      }
    };

    fetchBookings();

    return () => {
      cancelled = true;
    };
  }, [user.loggedIn]);

  // ============================================================
  // BOOKING DATE/TIME HELPER
  //
  // Handles PostgreSQL date values such as:
  // 2026-09-12
  // 2026-09-12T00:00:00.000Z
  //
  // Time values such as:
  // 19:00:00
  // ============================================================

  const getBookingDateTime = (booking) => {
    if (
      !booking?.booking_date ||
      !booking?.booking_time
    ) {
      return null;
    }

    try {
      const rawDate = String(
        booking.booking_date
      );

      const datePart = rawDate.slice(0, 10);

      const timePart = String(
        booking.booking_time
      ).slice(0, 8);

      if (!datePart || !timePart) {
        return null;
      }

      const dateTime = new Date(
        `${datePart}T${timePart}`
      );

      if (Number.isNaN(dateTime.getTime())) {
        return null;
      }

      return dateTime;
    } catch (error) {
      console.error(
        'Booking date/time parsing error:',
        error
      );

      return null;
    }
  };

  // ============================================================
  // CURRENT TIME
  // ============================================================

  const now = new Date();

  // ============================================================
  // UPCOMING CONFIRMED BOOKINGS
  //
  // Only future CONFIRMED bookings.
  // ============================================================

  const upcomingConfirmedBookings = bookings.filter(
    (item) => {
      const status = String(
        item.status || ''
      ).toUpperCase();

      if (status !== 'CONFIRMED') {
        return false;
      }

      const bookingDateTime =
        getBookingDateTime(item);

      if (!bookingDateTime) {
        return false;
      }

      return bookingDateTime > now;
    }
  );

  // ============================================================
  // SORT UPCOMING BOOKINGS
  //
  // Earliest upcoming reservation first.
  // ============================================================

  const sortedConfirmedBookings = [
    ...upcomingConfirmedBookings,
  ].sort((a, b) => {
    const dateA =
      getBookingDateTime(a)?.getTime() || 0;

    const dateB =
      getBookingDateTime(b)?.getTime() || 0;

    return dateA - dateB;
  });

  // ============================================================
  // NEXT UPCOMING BOOKING
  // ============================================================

  const upcomingBooking =
    sortedConfirmedBookings[0] || null;

  // ============================================================
  // UPCOMING BOOKING IDS
  //
  // Used to keep future confirmed bookings
  // out of the history section.
  // ============================================================

  const upcomingBookingIds = new Set(
    sortedConfirmedBookings.map(
      (item) => item.id
    )
  );

  // ============================================================
  // HISTORY
  //
  // Everything except future CONFIRMED bookings.
  //
  // This can include:
  // - COMPLETED
  // - CANCELLED
  // - past CONFIRMED
  // - other historical statuses
  // ============================================================

  const historyBookings = bookings.filter(
    (item) =>
      !upcomingBookingIds.has(item.id)
  );

  // ============================================================
  // COMPLETED BOOKINGS
  // ============================================================

  const completedBookings = bookings.filter(
    (item) =>
      String(
        item.status || ''
      ).toUpperCase() === 'COMPLETED'
  );

  // ============================================================
  // DINING EXPERIENCES
  //
  // Only actual dining experiences:
  // - COMPLETED bookings
  // - past CONFIRMED bookings
  //
  // Future CONFIRMED bookings are excluded.
  // CANCELLED / PENDING are excluded.
  // ============================================================

  const diningExperienceBookings =
    bookings.filter((item) => {
      const status = String(
        item.status || ''
      ).toUpperCase();

      // Completed bookings are actual
      // dining experiences.
      if (status === 'COMPLETED') {
        return true;
      }

      // Confirmed bookings count only after
      // their reservation date and time has passed.
      if (status === 'CONFIRMED') {
        const bookingDateTime =
          getBookingDateTime(item);

        if (!bookingDateTime) {
          return false;
        }

        return bookingDateTime <= now;
      }

      return false;
    });

  // ============================================================
  // RESTAURANTS VISITED
  //
  // Only COMPLETED bookings count.
  // Duplicate visits to the same restaurant
  // count as one restaurant.
  // ============================================================

  const visitedRestaurantCount =
    new Set(
      completedBookings
        .map(
          (item) =>
            item.restaurant_id
        )
        .filter(Boolean)
    ).size;

  // ============================================================
  // FORMAT DATE
  // ============================================================

  const formatBookingDate = (dateValue) => {
    if (!dateValue) {
      return 'Date unavailable';
    }

    try {
      const rawDate = String(dateValue);

      const datePart = rawDate.slice(0, 10);

      const date = new Date(
        `${datePart}T00:00:00`
      );

      if (Number.isNaN(date.getTime())) {
        return 'Date unavailable';
      }

      return date.toLocaleDateString(
        'en-IN',
        {
          weekday: 'short',
          day: 'numeric',
          month: 'short',
          year: 'numeric',
        }
      );
    } catch (error) {
      console.error(
        'Booking date formatting error:',
        error
      );

      return 'Date unavailable';
    }
  };

  // ============================================================
  // FORMAT TIME
  // ============================================================

  const formatBookingTime = (timeValue) => {
    if (!timeValue) {
      return 'Time unavailable';
    }

    const timeString =
      String(timeValue).slice(0, 8);

    const [hours, minutes] =
      timeString.split(':');

    const numericHours = Number(hours);
    const numericMinutes = Number(minutes);

    if (
      Number.isNaN(numericHours) ||
      Number.isNaN(numericMinutes)
    ) {
      return 'Time unavailable';
    }

    const date = new Date();

    date.setHours(
      numericHours,
      numericMinutes,
      0,
      0
    );

    return date.toLocaleTimeString(
      'en-IN',
      {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      }
    );
  };

  // ============================================================
  // SEATING NAME
  // ============================================================

  const getSeatingName = (booking) => {
    if (booking.private_room_id) {
      return (
        booking.private_room_name ||
        booking.room_name ||
        'Private Dining Room'
      );
    }

    if (booking.table_name) {
      return booking.table_name;
    }

    return 'Dining Table';
  };

  // ============================================================
  // FORMAT AMOUNT
  // ============================================================

  const formatAmount = (amount) => {
    const numericAmount = Number(
      amount || 0
    );

    return numericAmount.toLocaleString(
      'en-IN',
      {
        maximumFractionDigits: 0,
      }
    );
  };

  // ============================================================
  // BOOKING STATUS
  // ============================================================

  const getBookingStatus = (booking) => {
    return String(
      booking.status || 'UNKNOWN'
    ).toUpperCase();
  };

  // ============================================================
  // STATUS ICON
  // ============================================================

  const getStatusIcon = (status) => {
    if (status === 'CONFIRMED') {
      return (
        <CheckCircle2
          size={15}
          strokeWidth={1.4}
        />
      );
    }

    if (status === 'CANCELLED') {
      return (
        <XCircle
          size={15}
          strokeWidth={1.4}
        />
      );
    }

    if (status === 'COMPLETED') {
      return (
        <CheckCircle2
          size={15}
          strokeWidth={1.4}
        />
      );
    }

    return (
      <Clock3
        size={15}
        strokeWidth={1.4}
      />
    );
  };

  // ============================================================
  // CANCEL BOOKING
  // ============================================================

  const handleCancelBooking = () => {
    if (
      !upcomingBooking?.id ||
      cancellingBooking
    ) {
      return;
    }

    setShowCancelModal(true);
  };

  // ============================================================
  // CLOSE CANCEL MODAL
  // ============================================================

  const closeCancelModal = () => {
    if (cancellingBooking) {
      return;
    }

    setShowCancelModal(false);
  };

  // ============================================================
  // CONFIRM CANCEL BOOKING
  // ============================================================

  const confirmCancelBooking = async () => {
    if (
      !upcomingBooking?.id ||
      cancellingBooking
    ) {
      return;
    }

    setCancellingBooking(true);

    try {
      const response = await fetch(
        `/api/bookings/${upcomingBooking.id}/cancel`,
        {
          method: 'POST',
          credentials: 'include',
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message ||
            'Unable to cancel your reservation.'
        );
      }

      setBookings(
        (currentBookings) =>
          currentBookings.map(
            (booking) =>
              booking.id ===
              upcomingBooking.id
                ? {
                    ...booking,
                    status: 'CANCELLED',
                  }
                : booking
          )
      );

      // Close confirmation modal
      setShowCancelModal(false);

      // Show custom success modal
      setCancelSuccess(true);
    } catch (error) {
      console.error(
        'Cancel booking error:',
        error
      );

      window.alert(
        error.message ||
          'Unable to cancel your reservation.'
      );
    } finally {
      setCancellingBooking(false);
    }
  };

  // ============================================================
  // LOGOUT
  // ============================================================

  const handleLogout = async () => {
    try {
      await fetch(
        '/api/auth/logout',
        {
          method: 'POST',
          credentials: 'include',
        }
      );
    } catch (error) {
      console.error(
        'Logout error:',
        error
      );
    } finally {
      localStorage.removeItem(
        'lumoraUser'
      );

      localStorage.removeItem(
        'lumoraBooking'
      );

      localStorage.removeItem(
        'lumoraPayment'
      );

      navigate('/');
    }
  };

  // ============================================================
  // UI
  // ============================================================

  return (
    <main className="account-page">

      <div className="account-glow"></div>

      <div className="container account-container">

        {/* HEADER */}

        <header className="account-header">

          <Link
            to="/"
            className="account-logo"
          >

            <span className="account-logo-mark">
              L
            </span>

            <span>
              LUMORA
            </span>

          </Link>

          <Link
            to="/"
            className="account-back"
          >

            <ArrowLeft
              size={15}
              strokeWidth={1.4}
            />

            Back to Home

          </Link>

        </header>

        {/* PROFILE */}

        <section className="account-profile">

          <div className="account-avatar">

            <UserRound
              size={28}
              strokeWidth={1.2}
            />

          </div>

          <div className="account-welcome">

            <p className="account-eyebrow">
              YOUR LUMORA ACCOUNT
            </p>

            <h1>
              Welcome,
              <span>
                {user.name}.
              </span>
            </h1>

            <p>
              Manage your reservations and dining
              experiences from one place.
            </p>

          </div>

          <button
            type="button"
            className="account-logout"
            onClick={handleLogout}
          >

            <LogOut
              size={15}
              strokeWidth={1.4}
            />

            Sign Out

          </button>

        </section>

        {/* STATS */}

        <section className="account-stats">

          {/* UPCOMING */}

          <div className="account-stat">

            <span>
              {String(
                upcomingConfirmedBookings.length
              ).padStart(2, '0')}
            </span>

            <p>
              UPCOMING RESERVATION
            </p>

          </div>

          {/* DINING EXPERIENCES */}

          <div className="account-stat">

            <span>
              {String(
                diningExperienceBookings.length
              ).padStart(2, '0')}
            </span>

            <p>
              DINING EXPERIENCES
            </p>

          </div>

          {/* RESTAURANTS VISITED */}

          <div className="account-stat">

            <span>
              {String(
                visitedRestaurantCount
              ).padStart(2, '0')}
            </span>

            <p>
              RESTAURANTS VISITED
            </p>

          </div>

        </section>

        {/* MAIN GRID */}

        <section className="account-grid">

          {/* RESERVATIONS */}

          <div className="account-reservations">

            <div className="account-section-header">

              <div>

                <p>
                  RESERVATIONS
                </p>

                <h2>
                  Upcoming dining.
                </h2>

              </div>

              <Link to="/reserve">

                New reservation

                <ArrowRight
                  size={15}
                  strokeWidth={1.4}
                />

              </Link>

            </div>

            {/* LOADING */}

            {loadingBookings ? (

              <div className="account-empty">

                <CalendarDays
                  size={28}
                  strokeWidth={1.2}
                />

                <h3>
                  Loading your reservations
                </h3>

                <p>
                  We're retrieving your dining
                  experiences.
                </p>

              </div>

            ) : bookingError ? (

              <div className="account-empty">

                <CalendarDays
                  size={28}
                  strokeWidth={1.2}
                />

                <h3>
                  Unable to load reservations
                </h3>

                <p>
                  {bookingError}
                </p>

              </div>

            ) : upcomingBooking ? (

              <div className="account-booking-card">

                <div className="account-booking-top">

                  <div>

                    <span>
                      UPCOMING
                    </span>

                    <h3>
                      {
                        upcomingBooking.restaurant_name
                      }
                    </h3>

                    <div className="account-location">

                      <MapPin
                        size={14}
                        strokeWidth={1.3}
                      />

                      {
                        upcomingBooking.restaurant_city ||
                        'Chennai'
                      }

                    </div>

                  </div>

                  <div className="account-status">

                    <CheckCircle2
                      size={15}
                      strokeWidth={1.4}
                    />

                    Confirmed

                  </div>

                </div>

                <div className="account-booking-details">

                  {/* DATE */}

                  <div>

                    <CalendarDays
                      size={17}
                      strokeWidth={1.3}
                    />

                    <div>

                      <span>
                        DATE
                      </span>

                      <strong>
                        {formatBookingDate(
                          upcomingBooking.booking_date
                        )}
                      </strong>

                    </div>

                  </div>

                  {/* TIME */}

                  <div>

                    <Clock3
                      size={17}
                      strokeWidth={1.3}
                    />

                    <div>

                      <span>
                        TIME
                      </span>

                      <strong>
                        {formatBookingTime(
                          upcomingBooking.booking_time
                        )}
                      </strong>

                    </div>

                  </div>

                  {/* GUESTS */}

                  <div>

                    <UserRound
                      size={17}
                      strokeWidth={1.3}
                    />

                    <div>

                      <span>
                        GUESTS
                      </span>

                      <strong>

                        {upcomingBooking.guests}{' '}

                        {Number(
                          upcomingBooking.guests
                        ) === 1
                          ? 'Guest'
                          : 'Guests'}

                      </strong>

                    </div>

                  </div>

                  {/* SEATING */}

                  <div>

                    <Utensils
                      size={17}
                      strokeWidth={1.3}
                    />

                    <div>

                      <span>
                        SEATING
                      </span>

                      <strong>
                        {getSeatingName(
                          upcomingBooking
                        )}
                      </strong>

                    </div>

                  </div>

                </div>

                <div className="account-booking-bottom">

                  <span>
                    Reservation secured through Lumora
                  </span>

                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '18px',
                    }}
                  >

                    <button
                      type="button"
                      onClick={
                        handleCancelBooking
                      }
                      disabled={
                        cancellingBooking
                      }
                      style={{
                        background:
                          'transparent',
                        border: 'none',
                        padding: 0,
                        color:
                          cancellingBooking
                            ? '#444'
                            : '#777',
                        fontSize: '9px',
                        letterSpacing:
                          '0.12em',
                        textTransform:
                          'uppercase',
                        cursor:
                          cancellingBooking
                            ? 'not-allowed'
                            : 'pointer',
                      }}
                    >

                      {cancellingBooking
                        ? 'Cancelling...'
                        : 'Cancel Reservation'}

                    </button>

                    <strong>

                      ₹
                      {formatAmount(
                        upcomingBooking.total_amount
                      )}{' '}
                      PAID

                    </strong>

                  </div>

                </div>

              </div>

            ) : (

              <div className="account-empty">

                <CalendarDays
                  size={28}
                  strokeWidth={1.2}
                />

                <h3>
                  No upcoming reservations
                </h3>

                <p>
                  Your next memorable dining
                  experience starts here.
                </p>

                <Link to="/reserve">

                  Reserve a Table

                  <ArrowRight
                    size={15}
                    strokeWidth={1.4}
                  />

                </Link>

              </div>

            )}

          </div>

          {/* PROFILE SIDEBAR */}

          <aside className="account-sidebar">

            <div className="account-sidebar-card">

              <p className="account-sidebar-label">
                PROFILE
              </p>

              <div className="account-profile-row">

                <UserRound
                  size={17}
                  strokeWidth={1.3}
                />

                <div>

                  <span>
                    NAME
                  </span>

                  <strong>
                    {user.name}
                  </strong>

                </div>

              </div>

              <div className="account-profile-row">

                <UserRound
                  size={17}
                  strokeWidth={1.3}
                />

                <div>

                  <span>
                    EMAIL
                  </span>

                  <strong>
                    {user.email}
                  </strong>

                </div>

              </div>

            </div>

            <div className="account-sidebar-card account-help">

              <p className="account-sidebar-label">
                NEED HELP?
              </p>

              <h3>

                We're here

                <span>
                  for you.
                </span>

              </h3>

              <p>
                Questions about your reservation?
                Our team is happy to help.
              </p>

              <a href="mailto:hello@lumora.com">

                Contact Lumora

                <ArrowRight
                  size={15}
                  strokeWidth={1.4}
                />

              </a>

            </div>

          </aside>

        </section>

        {/* PAST EXPERIENCES */}

        <section className="account-history">

          <div className="account-section-header">

            <div>

              <p>
                YOUR JOURNEY
              </p>

              <h2>
                Dining history.
              </h2>

            </div>

          </div>

          <div className="account-history-grid">

            {loadingBookings ? (

              <div className="history-card">

                <span>
                  —
                </span>

                <h3>
                  Loading...
                </h3>

                <p>
                  Retrieving your dining history
                </p>

              </div>

            ) : historyBookings.length === 0 ? (

              <div className="history-card">

                <span>
                  01
                </span>

                <h3>
                  Your journey begins here
                </h3>

                <p>
                  Complete your first dining
                  experience with LUMORA.
                </p>

              </div>

            ) : (

              historyBookings
                .slice(0, 3)
                .map(
                  (item, index) => {

                    const status =
                      getBookingStatus(
                        item
                      );

                    return (
                      <div
                        className="history-card"
                        key={item.id}
                      >

                        {/* NUMBER */}

                        <span>
                          {String(
                            index + 1
                          ).padStart(
                            2,
                            '0'
                          )}
                        </span>

                        {/* RESTAURANT */}

                        <h3>
                          {item.restaurant_name ||
                            'LUMORA Restaurant'}
                        </h3>

                        {/* CUISINE / CITY */}

                        <p>
                          {item.restaurant_cuisine ||
                            'Fine Dining'}{' '}
                          ·{' '}
                          {item.restaurant_city ||
                            'Chennai'}
                        </p>

                        {/* DATE */}

                        <p
                          style={{
                            marginTop:
                              '12px',
                          }}
                        >

                          <CalendarDays
                            size={12}
                            strokeWidth={
                              1.3
                            }
                            style={{
                              verticalAlign:
                                'middle',
                              marginRight:
                                '5px',
                            }}
                          />

                          {formatBookingDate(
                            item.booking_date
                          )}

                        </p>

                        {/* TIME / GUESTS */}

                        <p
                          style={{
                            marginTop:
                              '6px',
                          }}
                        >

                          <Clock3
                            size={12}
                            strokeWidth={
                              1.3
                            }
                            style={{
                              verticalAlign:
                                'middle',
                              marginRight:
                                '5px',
                            }}
                          />

                          {formatBookingTime(
                            item.booking_time
                          )}

                          {' · '}

                          {item.guests}{' '}

                          {Number(
                            item.guests
                          ) === 1
                            ? 'Guest'
                            : 'Guests'}

                        </p>

                        {/* SEATING */}

                        <p
                          style={{
                            marginTop:
                              '6px',
                          }}
                        >

                          <Utensils
                            size={12}
                            strokeWidth={
                              1.3
                            }
                            style={{
                              verticalAlign:
                                'middle',
                              marginRight:
                                '5px',
                            }}
                          />

                          {getSeatingName(
                            item
                          )}

                        </p>

                        {/* STATUS */}

                        <div
                          style={{
                            display:
                              'flex',
                            alignItems:
                              'center',
                            justifyContent:
                              'space-between',
                            gap: '10px',
                            marginTop:
                              '18px',
                          }}
                        >

                          <span
                            style={{
                              display:
                                'flex',
                              alignItems:
                                'center',
                              gap: '5px',
                              color:
                                status ===
                                'CONFIRMED'
                                  ? '#c6a15b'
                                  : status ===
                                      'CANCELLED'
                                    ? '#777'
                                    : status ===
                                        'COMPLETED'
                                      ? '#c6a15b'
                                      : '#aaa',
                              fontSize:
                                '8px',
                              letterSpacing:
                                '0.1em',
                            }}
                          >

                            {getStatusIcon(
                              status
                            )}

                            {status}

                          </span>

                          <strong
                            style={{
                              color:
                                '#c6a15b',
                              fontSize:
                                '9px',
                              letterSpacing:
                                '0.08em',
                            }}
                          >

                            ₹
                            {formatAmount(
                              item.total_amount
                            )}

                          </strong>

                        </div>

                        {/* VIEW DETAILS */}

                        <button
                          type="button"
                          onClick={() =>
                            navigate(
                              `/booking-details/${item.id}`
                            )
                          }
                          style={{
                            marginTop:
                              '18px',
                            width: '100%',
                            background:
                              'transparent',
                            border:
                              '1px solid rgba(198, 161, 91, 0.25)',
                            padding:
                              '11px 14px',
                            color:
                              '#c6a15b',
                            fontSize:
                              '8px',
                            letterSpacing:
                              '0.14em',
                            textTransform:
                              'uppercase',
                            cursor:
                              'pointer',
                            transition:
                              'all 0.3s ease',
                          }}
                        >
                          View Details
                        </button>

                      </div>
                    );
                  }
                )

            )}

          </div>

        </section>

      </div>

      {/* ========================================================
          CANCEL CONFIRMATION MODAL
          ======================================================== */}

      {showCancelModal && (
        <div
          className="account-cancel-overlay"
          onClick={closeCancelModal}
        >

          <div
            className="account-cancel-modal"
            onClick={(event) =>
              event.stopPropagation()
            }
          >

            <button
              type="button"
              className="account-cancel-close"
              onClick={closeCancelModal}
              disabled={cancellingBooking}
              aria-label="Close"
            >
              ×
            </button>

            <div className="account-cancel-icon">

              <XCircle
                size={24}
                strokeWidth={1.3}
              />

            </div>

            <div className="account-cancel-content">

              <p>
                CANCEL RESERVATION
              </p>

              <h3>
                Cancel your reservation?
              </h3>

              <span>

                Are you sure you want to cancel
                your reservation at{' '}

                <strong>
                  {upcomingBooking?.restaurant_name ||
                    'this restaurant'}
                </strong>
                ?

              </span>

            </div>

            <div className="account-cancel-actions">

              <button
                type="button"
                className="account-cancel-secondary"
                onClick={closeCancelModal}
                disabled={cancellingBooking}
              >
                Keep Reservation
              </button>

              <button
                type="button"
                className="account-cancel-danger"
                onClick={confirmCancelBooking}
                disabled={cancellingBooking}
              >

                {cancellingBooking
                  ? 'Cancelling...'
                  : 'Cancel Reservation'}

              </button>

            </div>

          </div>

        </div>
      )}

      {/* ========================================================
          CANCELLATION SUCCESS MODAL
          ======================================================== */}

      {cancelSuccess && (
        <div
          className="lumora-success-overlay"
          onClick={() =>
            setCancelSuccess(false)
          }
        >

          <div
            className="lumora-success-modal"
            onClick={(event) =>
              event.stopPropagation()
            }
          >

            <button
              type="button"
              className="lumora-success-close"
              onClick={() =>
                setCancelSuccess(false)
              }
              aria-label="Close"
            >
              ×
            </button>

            <div className="lumora-success-icon">
              ✓
            </div>

            <div className="lumora-success-label">
              RESERVATION CANCELLED
            </div>

            <h2>
              Your reservation has been cancelled
            </h2>

            <p>
              Your reservation has been
              successfully cancelled.
            </p>

            <button
              type="button"
              className="lumora-success-button"
              onClick={() =>
                setCancelSuccess(false)
              }
            >
              DONE
            </button>

          </div>

        </div>
      )}

    </main>
  );
}

export default Account;