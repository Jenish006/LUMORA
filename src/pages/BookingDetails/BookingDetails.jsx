import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  Clock3,
  MapPin,
  UserRound,
  Utensils,
  XCircle,
} from 'lucide-react';

import {
  Link,
  useNavigate,
  useParams,
} from 'react-router-dom';

import {
  useEffect,
  useState,
} from 'react';

function BookingDetails() {
  const { bookingId } = useParams();
  const navigate = useNavigate();

  const [booking, setBooking] = useState(null);
  const [payment, setPayment] = useState(null);

  const [loading, setLoading] = useState(true);
  const [paymentLoading, setPaymentLoading] =
    useState(true);

  const [error, setError] = useState('');

  // ============================================================
  // REFUND INFORMATION
  // ============================================================

  const [refundInfo, setRefundInfo] = useState(null);

  useEffect(() => {
    let cancelled = false;

    const fetchBookingAndPayment = async () => {
      if (!bookingId) {
        if (!cancelled) {
          setError('Invalid booking ID.');
          setLoading(false);
          setPaymentLoading(false);
        }

        return;
      }

      try {
        // ============================================================
        // FETCH BOOKING
        // ============================================================

        const bookingResponse = await fetch(
          `/api/bookings/${bookingId}`,
          {
            method: 'GET',
            credentials: 'include',
          }
        );

        const bookingData =
          await bookingResponse.json();

        if (
          !bookingResponse.ok ||
          !bookingData.success
        ) {
          throw new Error(
            bookingData.message ||
              'Unable to load booking details.'
          );
        }

        if (cancelled) {
          return;
        }

        setBooking(bookingData.booking);
        setLoading(false);

        // ============================================================
        // FETCH PAYMENT
        // ============================================================

        try {
          const paymentResponse =
            await fetch(
              `/api/payments/booking/${bookingId}`,
              {
                method: 'GET',
                credentials: 'include',
              }
            );

          const paymentData =
            await paymentResponse.json();

          if (
            !paymentResponse.ok ||
            !paymentData.success
          ) {
            throw new Error(
              paymentData.message ||
                'Unable to load payment details.'
            );
          }

          if (!cancelled) {
            setPayment(
              paymentData.payment || null
            );
          }
        } catch (paymentError) {
          console.error(
            'Payment details error:',
            paymentError
          );

          if (!cancelled) {
            setPayment(null);
          }
        } finally {
          if (!cancelled) {
            setPaymentLoading(false);
          }
        }
      } catch (error) {
        if (cancelled) {
          return;
        }

        console.error(
          'Booking details error:',
          error
        );

        setError(
          error.message ||
            'Unable to load booking details.'
        );

        setLoading(false);
        setPaymentLoading(false);
      }
    };

    fetchBookingAndPayment();

    return () => {
      cancelled = true;
    };
  }, [bookingId]);

  // ============================================================
  // FORMAT DATE
  // ============================================================

  const formatDate = (dateValue) => {
    if (!dateValue) {
      return 'Date unavailable';
    }

    const date = new Date(dateValue);

    if (Number.isNaN(date.getTime())) {
      return 'Date unavailable';
    }

    return date.toLocaleDateString('en-IN', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  // ============================================================
  // FORMAT TIME
  // ============================================================

  const formatTime = (timeValue) => {
    if (!timeValue) {
      return 'Time unavailable';
    }

    const [hours, minutes] =
      String(timeValue).split(':');

    const date = new Date();

    date.setHours(
      Number(hours),
      Number(minutes),
      0,
      0
    );

    return date.toLocaleTimeString('en-IN', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  // ============================================================
  // FORMAT AMOUNT
  // ============================================================

  const formatAmount = (amount) => {
    return Number(amount || 0).toLocaleString(
      'en-IN',
      {
        maximumFractionDigits: 0,
      }
    );
  };

  // ============================================================
  // FORMAT PAYMENT DATE
  // ============================================================

  const formatPaymentDate = (dateValue) => {
    if (!dateValue) {
      return 'Date unavailable';
    }

    const date = new Date(dateValue);

    if (Number.isNaN(date.getTime())) {
      return 'Date unavailable';
    }

    return date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  // ============================================================
  // SEATING NAME
  // ============================================================

  const getSeatingName = (item) => {
    if (item.private_room_id) {
      return (
        item.private_room_name ||
        item.room_name ||
        'Private Dining Room'
      );
    }

    if (item.table_name) {
      return item.table_name;
    }

    return 'Dining Table';
  };

  // ============================================================
  // STATUS ICON
  // ============================================================

  const getStatusIcon = (status) => {
    if (status === 'CONFIRMED') {
      return (
        <CheckCircle2
          size={18}
          strokeWidth={1.4}
        />
      );
    }

    if (status === 'CANCELLED') {
      return (
        <XCircle
          size={18}
          strokeWidth={1.4}
        />
      );
    }

    return (
      <Clock3
        size={18}
        strokeWidth={1.4}
      />
    );
  };

  // ============================================================
  // STATUS LABEL
  // ============================================================

  const getStatusLabel = (status) => {
    return String(
      status || 'UNKNOWN'
    ).toUpperCase();
  };

  // ============================================================
  // LOADING
  // ============================================================

  if (loading) {
    return (
      <main
        style={{
          minHeight: '100vh',
          background: '#0b0b0b',
          color: '#cfc8bc',
          display: 'grid',
          placeItems: 'center',
          padding: '40px 20px',
        }}
      >
        <div
          style={{
            textAlign: 'center',
          }}
        >
          <CalendarDays
            size={30}
            strokeWidth={1.2}
          />

          <h2
            style={{
              marginTop: '18px',
              color: '#f5f0e8',
              fontFamily:
                "'Playfair Display', serif",
              fontWeight: 400,
            }}
          >
            Loading reservation
          </h2>

          <p
            style={{
              marginTop: '8px',
              color: '#666',
              fontSize: '12px',
            }}
          >
            Retrieving your booking details.
          </p>
        </div>
      </main>
    );
  }

  // ============================================================
  // ERROR
  // ============================================================

  if (error || !booking) {
    return (
      <main
        style={{
          minHeight: '100vh',
          background: '#0b0b0b',
          color: '#cfc8bc',
          display: 'grid',
          placeItems: 'center',
          padding: '40px 20px',
        }}
      >
        <div
          style={{
            width: '100%',
            maxWidth: '520px',
            textAlign: 'center',
            padding: '50px 30px',
            border:
              '1px solid rgba(245, 240, 232, 0.1)',
            background: '#111',
          }}
        >
          <XCircle
            size={32}
            strokeWidth={1.2}
          />

          <h2
            style={{
              marginTop: '18px',
              color: '#f5f0e8',
              fontFamily:
                "'Playfair Display', serif",
              fontWeight: 400,
            }}
          >
            Reservation unavailable
          </h2>

          <p
            style={{
              marginTop: '10px',
              color: '#666',
              fontSize: '12px',
              lineHeight: 1.7,
            }}
          >
            {error ||
              'We could not find this reservation.'}
          </p>

          <button
            type="button"
            onClick={() => navigate('/account')}
            style={{
              marginTop: '25px',
              background: 'transparent',
              border:
                '1px solid rgba(198, 161, 91, 0.45)',
              padding: '12px 20px',
              color: '#c6a15b',
              fontSize: '9px',
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              cursor: 'pointer',
            }}
          >
            Back to Account
          </button>
        </div>
      </main>
    );
  }

  // ============================================================
  // STATUS
  // ============================================================

  const status = getStatusLabel(
    booking.status
  );

  const paymentStatus = payment?.status
    ? String(payment.status).toUpperCase()
    : null;

  // ============================================================
  // MAIN
  // ============================================================

  return (
    <main
      style={{
        minHeight: '100vh',
        background: '#0b0b0b',
        color: '#cfc8bc',
        padding: '30px 0 100px',
      }}
    >
      <div
        className="container"
        style={{
          maxWidth: '1050px',
          margin: '0 auto',
          padding: '0 20px',
        }}
      >
        {/* ============================================================
            HEADER
        ============================================================ */}

        <header
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingBottom: '50px',
          }}
        >
          <Link
            to="/account"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              color: '#777',
              fontSize: '10px',
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              textDecoration: 'none',
            }}
          >
            <ArrowLeft
              size={15}
              strokeWidth={1.4}
            />

            Back to Account
          </Link>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              color: '#f5f0e8',
              fontSize: '13px',
              letterSpacing: '0.25em',
            }}
          >
            <span
              style={{
                width: '30px',
                height: '30px',
                display: 'grid',
                placeItems: 'center',
                border: '1px solid #c6a15b',
                color: '#c6a15b',
                fontFamily:
                  "'Playfair Display', serif",
                fontSize: '17px',
              }}
            >
              L
            </span>

            LUMORA
          </div>
        </header>

        {/* ============================================================
            TITLE
        ============================================================ */}

        <section
          style={{
            marginBottom: '35px',
          }}
        >
          <p
            style={{
              color: '#c6a15b',
              fontSize: '9px',
              letterSpacing: '0.2em',
              marginBottom: '12px',
            }}
          >
            RESERVATION DETAILS
          </p>

          <h1
            style={{
              color: '#f5f0e8',
              fontFamily:
                "'Playfair Display', serif",
              fontSize:
                'clamp(40px, 6vw, 62px)',
              lineHeight: 1,
              fontWeight: 400,
            }}
          >
            {booking.restaurant_name ||
              'LUMORA Restaurant'}
          </h1>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              marginTop: '12px',
              color: '#666',
              fontSize: '11px',
            }}
          >
            <MapPin
              size={14}
              strokeWidth={1.3}
            />

            {booking.restaurant_city ||
              'Chennai'}
          </div>
        </section>

        {/* ============================================================
            STATUS
        ============================================================ */}

        <section
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '20px',
            padding: '22px 25px',
            border:
              '1px solid rgba(245, 240, 232, 0.1)',
            background: '#111',
            marginBottom: '20px',
          }}
        >
          <div>
            <p
              style={{
                color: '#555',
                fontSize: '8px',
                letterSpacing: '0.15em',
                marginBottom: '7px',
              }}
            >
              BOOKING ID
            </p>

            <strong
              style={{
                color: '#cfc8bc',
                fontSize: '12px',
                fontWeight: 400,
              }}
            >
              #{booking.id}
            </strong>
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '7px',
              color:
                status === 'CONFIRMED'
                  ? '#c6a15b'
                  : status === 'CANCELLED'
                    ? '#777'
                    : '#aaa',
              fontSize: '9px',
              letterSpacing: '0.1em',
            }}
          >
            {getStatusIcon(status)}

            {status}
          </div>
        </section>

        {/* ============================================================
            DETAILS
        ============================================================ */}

        <section
          style={{
            display: 'grid',
            gridTemplateColumns:
              'repeat(2, minmax(0, 1fr))',
            border:
              '1px solid rgba(245, 240, 232, 0.1)',
            background: '#111',
          }}
        >
          {/* DATE */}

          <div
            style={{
              display: 'flex',
              gap: '14px',
              padding: '30px',
              borderRight:
                '1px solid rgba(245, 240, 232, 0.08)',
              borderBottom:
                '1px solid rgba(245, 240, 232, 0.08)',
            }}
          >
            <CalendarDays
              size={20}
              strokeWidth={1.3}
            />

            <div>
              <span
                style={{
                  display: 'block',
                  color: '#555',
                  fontSize: '8px',
                  letterSpacing: '0.13em',
                  marginBottom: '8px',
                }}
              >
                DATE
              </span>

              <strong
                style={{
                  color: '#cfc8bc',
                  fontSize: '13px',
                  fontWeight: 400,
                }}
              >
                {formatDate(
                  booking.booking_date
                )}
              </strong>
            </div>
          </div>

          {/* TIME */}

          <div
            style={{
              display: 'flex',
              gap: '14px',
              padding: '30px',
              borderBottom:
                '1px solid rgba(245, 240, 232, 0.08)',
            }}
          >
            <Clock3
              size={20}
              strokeWidth={1.3}
            />

            <div>
              <span
                style={{
                  display: 'block',
                  color: '#555',
                  fontSize: '8px',
                  letterSpacing: '0.13em',
                  marginBottom: '8px',
                }}
              >
                TIME
              </span>

              <strong
                style={{
                  color: '#cfc8bc',
                  fontSize: '13px',
                  fontWeight: 400,
                }}
              >
                {formatTime(
                  booking.booking_time
                )}
              </strong>
            </div>
          </div>

          {/* GUESTS */}

          <div
            style={{
              display: 'flex',
              gap: '14px',
              padding: '30px',
              borderRight:
                '1px solid rgba(245, 240, 232, 0.08)',
            }}
          >
            <UserRound
              size={20}
              strokeWidth={1.3}
            />

            <div>
              <span
                style={{
                  display: 'block',
                  color: '#555',
                  fontSize: '8px',
                  letterSpacing: '0.13em',
                  marginBottom: '8px',
                }}
              >
                GUESTS
              </span>

              <strong
                style={{
                  color: '#cfc8bc',
                  fontSize: '13px',
                  fontWeight: 400,
                }}
              >
                {booking.guests}{' '}
                {Number(booking.guests) === 1
                  ? 'Guest'
                  : 'Guests'}
              </strong>
            </div>
          </div>

          {/* SEATING */}

          <div
            style={{
              display: 'flex',
              gap: '14px',
              padding: '30px',
            }}
          >
            <Utensils
              size={20}
              strokeWidth={1.3}
            />

            <div>
              <span
                style={{
                  display: 'block',
                  color: '#555',
                  fontSize: '8px',
                  letterSpacing: '0.13em',
                  marginBottom: '8px',
                }}
              >
                SEATING
              </span>

              <strong
                style={{
                  color: '#cfc8bc',
                  fontSize: '13px',
                  fontWeight: 400,
                }}
              >
                {getSeatingName(booking)}
              </strong>
            </div>
          </div>
        </section>

        {/* ============================================================
            PAYMENT
        ============================================================ */}

        <section
          style={{
            marginTop: '20px',
            padding: '30px',
            border:
              '1px solid rgba(245, 240, 232, 0.1)',
            background: '#111',
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: '20px',
            }}
          >
            <div>
              <p
                style={{
                  color: '#c6a15b',
                  fontSize: '9px',
                  letterSpacing: '0.18em',
                  marginBottom: '8px',
                }}
              >
                PAYMENT
              </p>

              <p
                style={{
                  color: '#666',
                  fontSize: '11px',
                }}
              >
                Reservation payment
              </p>
            </div>

            <strong
              style={{
                color: '#c6a15b',
                fontSize: '20px',
                fontFamily:
                  "'Playfair Display', serif",
                fontWeight: 400,
              }}
            >
              ₹
              {formatAmount(
                payment?.amount ??
                  booking.total_amount
              )}
            </strong>
          </div>

          {/* PAYMENT DETAILS */}

          {!paymentLoading && payment && (
            <div
              style={{
                marginTop: '25px',
                paddingTop: '20px',
                borderTop:
                  '1px solid rgba(245, 240, 232, 0.08)',
                display: 'grid',
                gridTemplateColumns:
                  'repeat(2, minmax(0, 1fr))',
                gap: '20px',
              }}
            >
              {/* PAYMENT STATUS */}

              <div>
                <span
                  style={{
                    display: 'block',
                    color: '#555',
                    fontSize: '8px',
                    letterSpacing: '0.13em',
                    marginBottom: '7px',
                  }}
                >
                  PAYMENT STATUS
                </span>

                <strong
                  style={{
                    color:
                      paymentStatus === 'PAID'
                        ? '#c6a15b'
                        : paymentStatus ===
                          'REFUNDED'
                          ? '#c6a15b'
                          : '#aaa',
                    fontSize: '11px',
                    fontWeight: 400,
                  }}
                >
                  {paymentStatus || 'UNKNOWN'}
                </strong>
              </div>

              {/* PROVIDER */}

              <div>
                <span
                  style={{
                    display: 'block',
                    color: '#555',
                    fontSize: '8px',
                    letterSpacing: '0.13em',
                    marginBottom: '7px',
                  }}
                >
                  PAYMENT PROVIDER
                </span>

                <strong
                  style={{
                    color: '#cfc8bc',
                    fontSize: '11px',
                    fontWeight: 400,
                  }}
                >
                  {payment.provider ||
                    'Unavailable'}
                </strong>
              </div>

              {/* PAYMENT ID */}

              <div>
                <span
                  style={{
                    display: 'block',
                    color: '#555',
                    fontSize: '8px',
                    letterSpacing: '0.13em',
                    marginBottom: '7px',
                  }}
                >
                  PAYMENT ID
                </span>

                <strong
                  style={{
                    color: '#cfc8bc',
                    fontSize: '11px',
                    fontWeight: 400,
                    wordBreak: 'break-all',
                  }}
                >
                  {payment.provider_payment_id ||
                    `#${payment.id}`}
                </strong>
              </div>

              {/* PAID DATE */}

              <div>
                <span
                  style={{
                    display: 'block',
                    color: '#555',
                    fontSize: '8px',
                    letterSpacing: '0.13em',
                    marginBottom: '7px',
                  }}
                >
                  PAID ON
                </span>

                <strong
                  style={{
                    color: '#cfc8bc',
                    fontSize: '11px',
                    fontWeight: 400,
                  }}
                >
                  {formatPaymentDate(
                    payment.paid_at
                  )}
                </strong>
              </div>

              {/* CURRENCY */}

              <div>
                <span
                  style={{
                    display: 'block',
                    color: '#555',
                    fontSize: '8px',
                    letterSpacing: '0.13em',
                    marginBottom: '7px',
                  }}
                >
                  CURRENCY
                </span>

                <strong
                  style={{
                    color: '#cfc8bc',
                    fontSize: '11px',
                    fontWeight: 400,
                  }}
                >
                  {payment.currency || 'INR'}
                </strong>
              </div>
            </div>
          )}

          {/* NO PAYMENT */}

          {!paymentLoading && !payment && (
            <div
              style={{
                marginTop: '20px',
                paddingTop: '18px',
                borderTop:
                  '1px solid rgba(245, 240, 232, 0.08)',
                color: '#555',
                fontSize: '10px',
                lineHeight: 1.6,
              }}
            >
              No payment record is available
              for this reservation.
            </div>
          )}

          {/* PAYMENT LOADING */}

          {paymentLoading && (
            <div
              style={{
                marginTop: '20px',
                paddingTop: '18px',
                borderTop:
                  '1px solid rgba(245, 240, 232, 0.08)',
                color: '#555',
                fontSize: '10px',
              }}
            >
              Retrieving payment information...
            </div>
          )}
        </section>

        {/* ============================================================
            CANCEL RESERVATION
        ============================================================ */}

        {(status === 'CONFIRMED' ||
          status === 'PENDING') && (
          <section
            style={{
              marginTop: '20px',
              padding: '25px 30px',
              border:
                '1px solid rgba(245, 240, 232, 0.1)',
              background: '#111',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: '20px',
            }}
          >
            <div>
              <p
                style={{
                  color: '#cfc8bc',
                  fontSize: '10px',
                  letterSpacing: '0.12em',
                  marginBottom: '7px',
                }}
              >
                NEED TO CANCEL?
              </p>

              <p
                style={{
                  color: '#555',
                  fontSize: '10px',
                  lineHeight: 1.6,
                }}
              >
                You can cancel this reservation
                before your dining time.
              </p>
            </div>

            <button
              type="button"
              onClick={async () => {
                const confirmed =
                  window.confirm(
                    'Are you sure you want to cancel this reservation?'
                  );

                if (!confirmed) {
                  return;
                }

                try {
                  const response =
                    await fetch(
                      `/api/bookings/${booking.id}/cancel`,
                      {
                        method: 'POST',
                        credentials: 'include',
                      }
                    );

                  const data =
                    await response.json();

                  if (
                    !response.ok ||
                    !data.success
                  ) {
                    throw new Error(
                      data.message ||
                        'Unable to cancel reservation.'
                    );
                  }

                  // ============================================================
                  // UPDATE BOOKING STATUS
                  // ============================================================

                  setBooking((currentBooking) => ({
                    ...currentBooking,
                    status:
                      data.booking?.status ||
                      'CANCELLED',
                  }));

                  // ============================================================
                  // UPDATE REFUND INFORMATION
                  // ============================================================

                  setRefundInfo({
                    status:
                      data.refund_status ||
                      'NOT_REQUIRED',
                    refundId:
                      data.refund_id || null,
                  });

                  // ============================================================
                  // UPDATE PAYMENT STATUS IN UI
                  // ============================================================

                  setPayment((currentPayment) => {
                    if (!currentPayment) {
                      return currentPayment;
                    }

                    if (
                      data.refund_status ===
                      'REFUNDED'
                    ) {
                      return {
                        ...currentPayment,
                        status: 'REFUNDED',
                      };
                    }

                    return currentPayment;
                  });

                  window.alert(
                    data.refund_status ===
                      'REFUNDED'
                      ? 'Your reservation has been cancelled successfully. Your refund has been initiated.'
                      : 'Your reservation has been cancelled successfully.'
                  );
                } catch (error) {
                  console.error(
                    'Cancel reservation error:',
                    error
                  );

                  window.alert(
                    error.message ||
                      'Unable to cancel reservation.'
                  );
                }
              }}
              style={{
                flexShrink: 0,
                background: 'transparent',
                border:
                  '1px solid rgba(245, 240, 232, 0.18)',
                padding: '12px 20px',
                color: '#777',
                fontSize: '9px',
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                cursor: 'pointer',
              }}
            >
              Cancel Reservation
            </button>
          </section>
        )}

        {/* ============================================================
            REFUND MESSAGE
        ============================================================ */}

        {refundInfo && (
          <section
            style={{
              marginTop: '20px',
              padding: '25px 30px',
              border:
                '1px solid rgba(198, 161, 91, 0.25)',
              background: '#111',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '14px',
              }}
            >
              <CheckCircle2
                size={20}
                strokeWidth={1.3}
                color="#c6a15b"
              />

              <div>
                <p
                  style={{
                    color: '#c6a15b',
                    fontSize: '9px',
                    letterSpacing: '0.16em',
                    marginBottom: '8px',
                  }}
                >
                  RESERVATION CANCELLED
                </p>

                {refundInfo.status ===
                'REFUNDED' ? (
                  <>
                    <p
                      style={{
                        color: '#cfc8bc',
                        fontSize: '11px',
                        lineHeight: 1.6,
                      }}
                    >
                      Your payment refund has
                      been successfully initiated.
                    </p>

                    <p
                      style={{
                        marginTop: '10px',
                        color: '#777',
                        fontSize: '10px',
                      }}
                    >
                      Refund amount: ₹
                      {formatAmount(
                        payment?.amount ??
                          booking.total_amount
                      )}
                    </p>

                    {refundInfo.refundId && (
                      <p
                        style={{
                          marginTop: '6px',
                          color: '#555',
                          fontSize: '9px',
                          wordBreak: 'break-all',
                        }}
                      >
                        Refund ID:{' '}
                        {refundInfo.refundId}
                      </p>
                    )}
                  </>
                ) : (
                  <p
                    style={{
                      color: '#777',
                      fontSize: '11px',
                      lineHeight: 1.6,
                    }}
                  >
                    Your reservation has been
                    cancelled. No refund was
                    required.
                  </p>
                )}
              </div>
            </div>
          </section>
        )}

        {/* ============================================================
            FOOTER MESSAGE
        ============================================================ */}

        <div
          style={{
            marginTop: '35px',
            textAlign: 'center',
            color: '#555',
            fontSize: '10px',
            letterSpacing: '0.08em',
          }}
        >
          Thank you for choosing LUMORA.
        </div>
      </div>
    </main>
  );
}

export default BookingDetails;