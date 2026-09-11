import { API_BASE_URL } from '../../api';
import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  ChevronDown,
  Clock3,
  Users,
} from 'lucide-react';

import { Link, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';

import './Reservation.css';

const times = [
  '6:00 PM',
  '6:30 PM',
  '7:00 PM',
  '7:30 PM',
  '8:00 PM',
  '8:30 PM',
  '9:00 PM',
];

// ============================================================
// Convert UI time to PostgreSQL time format
// Example: 7:00 PM -> 19:00
// ============================================================

const convertTimeTo24Hour = (value) => {
  const [timePart, modifier] = value.split(' ');
  let [hours, minutes] = timePart.split(':');

  hours = Number(hours);

  if (modifier === 'PM' && hours !== 12) {
    hours += 12;
  }

  if (modifier === 'AM' && hours === 12) {
    hours = 0;
  }

  return `${String(hours).padStart(2, '0')}:${minutes}`;
};

function Reservation() {
  const navigate = useNavigate();

  const [restaurants, setRestaurants] = useState([]);
  const [restaurantsLoading, setRestaurantsLoading] =
    useState(true);

  // ============================================================
  // Read previously selected restaurant
  // ============================================================

  const selectedRestaurant = (() => {
    const saved =
      localStorage.getItem('selectedRestaurant');

    try {
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  })();

  const selectedRestaurantName =
    selectedRestaurant?.name || '';

  const [restaurant, setRestaurant] = useState(
    selectedRestaurantName
  );

  const [date, setDate] = useState('');
  const [guests, setGuests] = useState(2);
  const [time, setTime] = useState('');
  const [tableType, setTableType] =
    useState('Indoor Table');

  const [showRestaurants, setShowRestaurants] =
    useState(false);

  const [showGuests, setShowGuests] =
    useState(false);

  const [showTimes, setShowTimes] =
    useState(false);

  const [isCheckingAvailability, setIsCheckingAvailability] =
    useState(false);

  // ============================================================
  // LUMORA MESSAGE POPUP
  // ============================================================

  const [showMessagePopup, setShowMessagePopup] =
    useState(false);

  const [popupTitle, setPopupTitle] =
    useState('');

  const [popupMessage, setPopupMessage] =
    useState('');

  const [popupType, setPopupType] =
    useState('error');

  const showPopup = (
    title,
    message,
    type = 'error'
  ) => {
    setPopupTitle(title);
    setPopupMessage(message);
    setPopupType(type);
    setShowMessagePopup(true);
  };

  const closePopup = () => {
    setShowMessagePopup(false);
  };

  // ============================================================
  // Fetch restaurants
  // ============================================================

  useEffect(() => {
    const fetchRestaurants = async () => {
      try {
        const response = await fetch(
          `${API_BASE_URL}/api/restaurants`
        );

        const data = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(
            'Failed to fetch restaurants'
          );
        }

        const restaurantList =
          Array.isArray(data.restaurants)
            ? data.restaurants
            : [];

        setRestaurants(restaurantList);

        // --------------------------------------------------------
        // If no restaurant was previously selected,
        // select the first available restaurant.
        // --------------------------------------------------------

        if (
          !selectedRestaurantName &&
          restaurantList.length > 0
        ) {
          setRestaurant(
            restaurantList[0].name
          );
        }

      } catch (error) {
        console.error(
          'Restaurant fetch error:',
          error
        );
      } finally {
        setRestaurantsLoading(false);
      }
    };

    fetchRestaurants();
  }, [selectedRestaurantName]);

  // ============================================================
  // Submit reservation
  // ============================================================

  const handleSubmit = async (event) => {
    event.preventDefault();

    // ==========================================================
    // Basic validation
    // ==========================================================

    if (!date) {
      showPopup(
        'DATE REQUIRED',
        'Please select a date before continuing.'
      );
      return;
    }

    if (!time) {
      showPopup(
        'TIME REQUIRED',
        'Please select a time before continuing.'
      );
      return;
    }

    if (!restaurant) {
      showPopup(
        'RESTAURANT REQUIRED',
        'Please select a restaurant before continuing.'
      );
      return;
    }

    // ==========================================================
    // Find selected restaurant
    //
    // FIRST:
    // Match by ID from localStorage.
    //
    // FALLBACK:
    // Match by normalized restaurant name.
    //
    // This prevents errors caused by:
    // - uppercase/lowercase differences
    // - extra spaces
    // - stale restaurant selection
    // ==========================================================

    const selectedRestaurantData =
      restaurants.find(
        (item) =>
          selectedRestaurant?.id &&
          Number(item.id) ===
            Number(selectedRestaurant.id)
      ) ||
      restaurants.find(
        (item) =>
          String(item.name || '')
            .trim()
            .toLowerCase() ===
          String(restaurant || '')
            .trim()
            .toLowerCase()
      );

    // ==========================================================
    // Restaurant not found
    // ==========================================================

    if (!selectedRestaurantData) {
      console.error(
        'Selected restaurant not found:',
        {
          selectedRestaurant,
          restaurant,
          restaurants,
        }
      );

      showPopup(
        'RESTAURANT UNAVAILABLE',
        'The selected restaurant could not be found. Please choose another restaurant.'
      );

      return;
    }

    // ==========================================================
    // Convert selected time
    // ==========================================================

    const bookingTime =
      convertTimeTo24Hour(time);

    // ==========================================================
    // Check availability
    // ==========================================================

    setIsCheckingAvailability(true);

    try {
      const availabilityResponse =
        await fetch(
          `${API_BASE_URL}/api/restaurants/${selectedRestaurantData.id}/availability?date=${date}&time=${bookingTime}&guests=${guests}`
        );

      const availabilityData =
        await availabilityResponse.json();

      if (
        !availabilityResponse.ok ||
        !availabilityData.success
      ) {
        throw new Error(
          availabilityData.message ||
            'Failed to check availability'
        );
      }

      // ========================================================
      // Select resource based on seating preference
      // ========================================================

      let selectedTable = null;
      let selectedPrivateRoom = null;

      if (tableType === 'Indoor Table') {
        selectedTable =
          availabilityData.tables?.[0] ||
          null;
      }

      if (tableType === 'Private Dining') {
        selectedPrivateRoom =
          availabilityData.private_rooms?.[0] ||
          null;
      }

      // ========================================================
      // No availability
      // ========================================================

      if (
        !selectedTable &&
        !selectedPrivateRoom
      ) {
        showPopup(
          'NO AVAILABILITY',
          `No ${tableType.toLowerCase()} is available for ${time} on ${date}. Please choose another time or seating preference.`
        );

        return;
      }

      // ========================================================
      // Create booking in backend
      // ========================================================

      const bookingResponse =
        await fetch(
          `${API_BASE_URL}/api/bookings`,
          {
            method: 'POST',
            credentials: 'include',

            headers: {
              'Content-Type': 'application/json',
            },

            body: JSON.stringify({
              restaurant_id:
                selectedRestaurantData.id,

              booking_date:
                date,

              booking_time:
                bookingTime,

              guests,

              table_id:
                selectedTable?.id ||
                null,

              private_room_id:
                selectedPrivateRoom?.id ||
                null,
            }),
          }
        );

      const bookingData =
        await bookingResponse.json();

      // ========================================================
      // Authentication error
      // ========================================================

      if (
        bookingResponse.status === 401
      ) {
        showPopup(
          'LOGIN REQUIRED',
          'Please login to make a reservation.',
          'info'
        );

        navigate('/login');

        return;
      }

      // ========================================================
      // Booking error
      // ========================================================

      if (
        !bookingResponse.ok ||
        !bookingData.success
      ) {
        throw new Error(
          bookingData.message ||
            'Failed to create booking'
        );
      }

      // ========================================================
      // Backend creates the real total_amount.
      // Never hardcode booking price on frontend.
      // ========================================================

      const backendTotalAmount =
        Number(
          bookingData.booking.total_amount
        );

      if (
        !Number.isFinite(
          backendTotalAmount
        ) ||
        backendTotalAmount <= 0
      ) {
        console.error(
          'Invalid backend booking amount:',
          bookingData.booking.total_amount
        );

        throw new Error(
          'Booking amount was not received from the server.'
        );
      }

      // ========================================================
      // Save backend booking information
      // ========================================================

      const booking = {
        id:
          bookingData.booking.id,

        bookingId:
          bookingData.booking.id,

        restaurant:
          selectedRestaurantData.name ||
          restaurant,

        restaurantId:
          selectedRestaurantData.id,

        date,

        guests,

        time,

        bookingTime,

        tableType,

        tableId:
          bookingData.booking.table_id ||
          selectedTable?.id ||
          null,

        privateRoomId:
          bookingData.booking.private_room_id ||
          selectedPrivateRoom?.id ||
          null,

        tableName:
          selectedTable?.table_name ||
          null,

        privateRoomName:
          selectedPrivateRoom?.room_name ||
          null,

        privateRoomPrice:
          selectedPrivateRoom?.price ||
          null,

        // ======================================================
        // Backend-generated amount
        // ======================================================

        totalAmount:
          backendTotalAmount,

        total_amount:
          backendTotalAmount,

        status:
          bookingData.booking.status,

        bookingStatus:
          bookingData.booking.status,

        expiresAt:
          bookingData.booking.expires_at,

        expires_at:
          bookingData.booking.expires_at,
      };

      // ========================================================
      // Save booking
      // ========================================================

      localStorage.setItem(
        'lumoraBooking',
        JSON.stringify(booking)
      );

      // ========================================================
      // Continue to booking summary
      // ========================================================

      navigate('/booking-summary');

    } catch (error) {
      console.error(
        'Reservation error:',
        error
      );

      showPopup(
        'RESERVATION ERROR',
        error.message ||
          'Unable to create reservation. Please try again.'
      );

    } finally {
      setIsCheckingAvailability(false);
    }
  };

  return (
    <main className="reservation-page">

      <div className="reservation-background" />

      <div className="container reservation">

        {/* TOP */}

        <div className="reservation-top">

          <Link
            to="/"
            className="reservation-back"
          >
            <ArrowLeft
              size={15}
              strokeWidth={1.4}
            />

            <span>
              Back to Lumora
            </span>
          </Link>

          <span className="reservation-brand">
            LUMORA
          </span>

        </div>

        {/* HEADER */}

        <div className="reservation-header">

          <div className="reservation-header-title">

            <p className="section-eyebrow">
              MAKE IT YOURS
            </p>

            <h1>
              Reserve
              <span>your table.</span>
            </h1>

          </div>

          <p className="reservation-header-text">
            Choose your restaurant, preferred time
            and seating. We'll take care of the rest.
          </p>

        </div>

        {/* CARD */}

        <div className="reservation-card">

          <div className="reservation-card-top">

            <span>
              01 — YOUR RESERVATION
            </span>

            <span>
              LUMORA DINING
            </span>

          </div>

          <form onSubmit={handleSubmit}>

            {/* RESTAURANT */}

            <div className="reservation-field">

              <label>
                RESTAURANT
              </label>

              <button
                type="button"
                className="reservation-select"
                onClick={() => {
                  setShowRestaurants(
                    !showRestaurants
                  );

                  setShowGuests(false);
                  setShowTimes(false);
                }}
              >

                <span>
                  {restaurantsLoading
                    ? 'Loading restaurants...'
                    : restaurant ||
                      'Select a restaurant'}
                </span>

                <ChevronDown
                  size={17}
                  strokeWidth={1.4}
                />

              </button>

              {showRestaurants && (
                <div className="reservation-dropdown">

                  {restaurantsLoading ? (
                    <button
                      type="button"
                      disabled
                    >
                      Loading restaurants...
                    </button>
                  ) : restaurants.length === 0 ? (
                    <button
                      type="button"
                      disabled
                    >
                      No restaurants available
                    </button>
                  ) : (
                    restaurants.map((item) => (
                      <button
                        type="button"
                        key={item.id}
                        className={
                          String(restaurant)
                            .trim()
                            .toLowerCase() ===
                          String(item.name)
                            .trim()
                            .toLowerCase()
                            ? 'selected'
                            : ''
                        }
                        onClick={() => {
                          setRestaurant(
                            item.name
                          );

                          // Save selected restaurant
                          // so its ID is available
                          // on the next submit.

                          localStorage.setItem(
                            'selectedRestaurant',
                            JSON.stringify({
                              id: item.id,
                              name: item.name,
                            })
                          );

                          setShowRestaurants(
                            false
                          );
                        }}
                      >
                        {item.name}
                      </button>
                    ))
                  )}

                </div>
              )}

            </div>

            {/* DATE + GUESTS */}

            <div className="reservation-row">

              {/* DATE */}

              <div className="reservation-field">

                <label>
                  DATE
                </label>

                <div className="reservation-input-wrap">

                  <CalendarDays
                    size={17}
                    strokeWidth={1.3}
                  />

                  <input
                    type="date"
                    value={date}
                    min={
                      new Date()
                        .toISOString()
                        .split('T')[0]
                    }
                    onChange={(event) =>
                      setDate(
                        event.target.value
                      )
                    }
                  />

                </div>

              </div>

              {/* GUESTS */}

              <div className="reservation-field">

                <label>
                  GUESTS
                </label>

                <button
                  type="button"
                  className="reservation-select"
                  onClick={() => {
                    setShowGuests(
                      !showGuests
                    );

                    setShowRestaurants(false);
                    setShowTimes(false);
                  }}
                >

                  <span>
                    {guests}{' '}
                    {guests === 1
                      ? 'Guest'
                      : 'Guests'}
                  </span>

                  <Users
                    size={16}
                    strokeWidth={1.3}
                  />

                </button>

                {showGuests && (
                  <div className="reservation-dropdown guest-dropdown">

                    {[1, 2, 3, 4, 5, 6, 7, 8].map(
                      (number) => (
                        <button
                          type="button"
                          key={number}
                          className={
                            guests === number
                              ? 'selected'
                              : ''
                          }
                          onClick={() => {
                            setGuests(number);

                            setShowGuests(
                              false
                            );
                          }}
                        >
                          {number}{' '}
                          {number === 1
                            ? 'Guest'
                            : 'Guests'}
                        </button>
                      )
                    )}

                  </div>
                )}

              </div>

            </div>

            {/* TIME */}

            <div className="reservation-field">

              <label>
                TIME
              </label>

              <button
                type="button"
                className="reservation-select"
                onClick={() => {
                  setShowTimes(
                    !showTimes
                  );

                  setShowRestaurants(false);
                  setShowGuests(false);
                }}
              >

                <span>
                  {time || 'Select a time'}
                </span>

                <Clock3
                  size={17}
                  strokeWidth={1.3}
                />

              </button>

              {showTimes && (
                <div className="reservation-dropdown time-dropdown">

                  {times.map((item) => (
                    <button
                      type="button"
                      key={item}
                      className={
                        time === item
                          ? 'selected'
                          : ''
                      }
                      onClick={() => {
                        setTime(item);
                        setShowTimes(false);
                      }}
                    >
                      {item}
                    </button>
                  ))}

                </div>
              )}

            </div>

            {/* SEATING */}

            <div className="reservation-field">

              <label>
                SEATING PREFERENCE
              </label>

              <div className="table-options">

                <button
                  type="button"
                  className={
                    tableType === 'Indoor Table'
                      ? 'active'
                      : ''
                  }
                  onClick={() =>
                    setTableType(
                      'Indoor Table'
                    )
                  }
                >

                  <span>
                    Indoor Table
                  </span>

                  <small>
                    Classic dining
                  </small>

                </button>

                <button
                  type="button"
                  className={
                    tableType === 'Private Dining'
                      ? 'active'
                      : ''
                  }
                  onClick={() =>
                    setTableType(
                      'Private Dining'
                    )
                  }
                >

                  <span>
                    Private Dining
                  </span>

                  <small>
                    Intimate experience
                  </small>

                </button>

              </div>

            </div>

            {/* SUMMARY */}

            <div className="reservation-summary">

              <div className="summary-details">

                <span>
                  YOUR SELECTION
                </span>

                <p>
                  {restaurant} · {guests}{' '}
                  {guests === 1
                    ? 'guest'
                    : 'guests'}

                  {date &&
                    ` · ${date}`}

                  {time &&
                    ` · ${time}`}
                </p>

              </div>

              <button
                type="submit"
                className="reservation-submit"
                disabled={
                  isCheckingAvailability
                }
              >

                <span>
                  {isCheckingAvailability
                    ? 'Checking...'
                    : 'Continue'}
                </span>

                <ArrowRight
                  size={16}
                  strokeWidth={1.4}
                />

              </button>

            </div>

          </form>

        </div>

        {/* FOOTER NOTE */}

        <p className="reservation-note">
          Your dining experience,
          thoughtfully arranged.
        </p>

      </div>

      {/* ========================================================
          LUMORA MESSAGE POPUP
          ======================================================== */}

      {showMessagePopup && (
        <div
          className="lumora-message-overlay"
          onClick={closePopup}
        >

          <div
            className="lumora-message-popup"
            onClick={(event) =>
              event.stopPropagation()
            }
          >

            <button
              type="button"
              className="lumora-message-close"
              onClick={closePopup}
              aria-label="Close"
            >
              ×
            </button>

            <div
              className={`lumora-message-icon ${popupType}`}
            >
              {popupType === 'info'
                ? 'i'
                : '!'}
            </div>

            <div className="lumora-message-label">
              LUMORA
            </div>

            <h2>
              {popupTitle}
            </h2>

            <p>
              {popupMessage}
            </p>

            <button
              type="button"
              className="lumora-message-button"
              onClick={closePopup}
            >
              OKAY
            </button>

          </div>

        </div>
      )}

    </main>
  );
}

export default Reservation;