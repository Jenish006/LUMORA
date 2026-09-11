import {
  ArrowLeft,
  ArrowRight,
  Check,
  CreditCard,
  LockKeyhole,
  Smartphone,
  Landmark,
  CalendarDays,
  Clock3,
  Users,
  Sparkles,
} from 'lucide-react';

import { Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';

import './Payment.css';

// ============================================================
// RAZORPAY SCRIPT LOADER
// ============================================================

const loadRazorpayScript = () => {
  return new Promise((resolve) => {
    if (window.Razorpay) {
      resolve(true);
      return;
    }

    const existingScript = document.querySelector(
      'script[src="https://checkout.razorpay.com/v1/checkout.js"]'
    );

    if (existingScript) {
      existingScript.addEventListener('load', () => resolve(true));
      existingScript.addEventListener('error', () => resolve(false));
      return;
    }

    const script = document.createElement('script');

    script.src =
      'https://checkout.razorpay.com/v1/checkout.js';

    script.async = true;

    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);

    document.body.appendChild(script);
  });
};

// ============================================================
// PAYMENT COMPONENT
// ============================================================

function Payment() {
  const navigate = useNavigate();

  const [paymentMethod, setPaymentMethod] = useState('upi');
  const [processing, setProcessing] = useState(false);

  // ==========================================================
  // GET SAVED BOOKING
  // ==========================================================

  let savedBooking = null;

  try {
    savedBooking = JSON.parse(
      localStorage.getItem('lumoraBooking')
    );
  } catch (error) {
    console.error(
      'Failed to read booking:',
      error
    );
  }

  const booking = savedBooking || {
    restaurant: 'The Aurelia',
    date: '',
    guests: 2,
    time: '',
    tableType: 'Indoor Table',
  };

  // ==========================================================
  // GET BOOKING AMOUNT
  //
  // IMPORTANT:
  // No hardcoded ₹2500.
  // Backend amount is the source of truth.
  // ==========================================================

  const initialAmount = Number(
    booking.totalAmount ??
      booking.total_amount ??
      booking.amount ??
      0
  );

  const [displayAmount, setDisplayAmount] = useState(
    Number.isFinite(initialAmount)
      ? initialAmount
      : 0
  );

  // ==========================================================
  // FORMAT AMOUNT
  // ==========================================================

  const formatAmount = (amount) => {
    const numericAmount = Number(amount);

    if (
      !Number.isFinite(numericAmount) ||
      numericAmount <= 0
    ) {
      return '₹0';
    }

    return `₹${numericAmount.toLocaleString('en-IN')}`;
  };

  // ==========================================================
  // HANDLE PAYMENT
  // ==========================================================

  const handlePayment = async (event) => {
    event.preventDefault();

    if (processing) {
      return;
    }

    // ========================================================
    // GET LOGGED-IN USER
    // ========================================================

    let savedUser = null;

    try {
      savedUser = JSON.parse(
        localStorage.getItem('lumoraUser')
      );
    } catch (error) {
      console.error(
        'Failed to read user:',
        error
      );
    }

    // ========================================================
    // GET CURRENT BOOKING
    // ========================================================

    let currentBooking = null;

    try {
      currentBooking = JSON.parse(
        localStorage.getItem('lumoraBooking')
      );
    } catch (error) {
      console.error(
        'Failed to read current booking:',
        error
      );
    }

    // ========================================================
    // AUTHENTICATION CHECK
    // ========================================================

    if (!savedUser?.id) {
      alert(
        'Please login before making a payment.'
      );

      navigate('/login');
      return;
    }

    // ========================================================
    // BOOKING CHECK
    // ========================================================

    const bookingId =
      currentBooking?.bookingId ||
      currentBooking?.id;

    if (!bookingId) {
      alert(
        'Booking information is missing.'
      );

      navigate('/booking-summary');
      return;
    }

    setProcessing(true);

    try {
      // ======================================================
      // STEP 1
      // LOAD RAZORPAY
      // ======================================================

      const razorpayLoaded =
        await loadRazorpayScript();

      if (!razorpayLoaded) {
        alert(
          'Unable to load Razorpay. Please check your internet connection and try again.'
        );

        setProcessing(false);
        return;
      }

      // ======================================================
      // STEP 2
      // CREATE ORDER FROM BACKEND
      // ======================================================

      const orderResponse = await fetch(
        '/api/payments/create-order',
        {
          method: 'POST',

          credentials: 'include',

          headers: {
            'Content-Type': 'application/json',
          },

          body: JSON.stringify({
            booking_id: bookingId,
          }),
        }
      );

      const orderData =
        await orderResponse.json();

      console.log(
        'Razorpay create-order response:',
        orderData
      );

      // ======================================================
      // CREATE ORDER FAILED
      // ======================================================

      if (
        !orderResponse.ok ||
        !orderData.success ||
        !orderData.order?.id
      ) {
        console.error(
          'Create order failed:',
          orderData
        );

        if (orderResponse.status === 401) {
          alert(
            'Your session has expired. Please login again.'
          );

          navigate('/login');
          setProcessing(false);
          return;
        }

        alert(
          orderData.message ||
            'Unable to create Razorpay order.'
        );

        setProcessing(false);
        return;
      }

      // ======================================================
      // BACKEND ORDER AMOUNT
      // ======================================================

      const backendAmountInPaise =
        Number(orderData.order.amount);

      const backendAmountInRupees =
        backendAmountInPaise / 100;

      if (
        !Number.isFinite(
          backendAmountInPaise
        ) ||
        backendAmountInPaise <= 0
      ) {
        alert(
          'Invalid payment amount received from server.'
        );

        setProcessing(false);
        return;
      }

      // ======================================================
      // UPDATE DISPLAY AMOUNT
      // ======================================================

      setDisplayAmount(
        backendAmountInRupees
      );

      // ======================================================
      // STEP 3
      // RAZORPAY CHECKOUT OPTIONS
      // ======================================================

      const options = {
        // ----------------------------------------------------
        // PUBLIC RAZORPAY TEST KEY
        // ----------------------------------------------------

        key:
          'rzp_test_TZrCs1FrKhOsqW',

        // ----------------------------------------------------
        // AMOUNT IS IN PAISE
        // ----------------------------------------------------

        amount:
          backendAmountInPaise,

        currency:
          orderData.order.currency || 'INR',

        name:
          'LUMORA',

        description:
          `Reservation at ${
            currentBooking.restaurant ||
            'LUMORA'
          }`,

        order_id:
          orderData.order.id,

        // ----------------------------------------------------
        // PREFILL
        // ----------------------------------------------------

        prefill: {
          name:
            savedUser.name ||
            savedUser.full_name ||
            '',

          email:
            savedUser.email ||
            '',

          contact:
            savedUser.phone ||
            savedUser.mobile ||
            '',
        },

        // ----------------------------------------------------
        // NOTES
        // ----------------------------------------------------

        notes: {
          booking_id:
            String(bookingId),

          restaurant:
            currentBooking.restaurant ||
            'LUMORA',
        },

        // ----------------------------------------------------
        // PAYMENT METHODS
        // ----------------------------------------------------

        config: {
          display: {
            blocks: {
              lumora: {
                name: 'LUMORA Payment',

                instruments: [
                  {
                    method: 'upi',
                  },
                  {
                    method: 'card',
                  },
                  {
                    method: 'netbanking',
                  },
                ],
              },
            },

            sequence: [
              'block.lumora',
            ],

            preferences: {
              show_default_blocks: true,
            },
          },
        },

        // ----------------------------------------------------
        // THEME
        // ----------------------------------------------------

        theme: {
          color: '#111111',
        },

        // ====================================================
        // PAYMENT SUCCESS
        // ====================================================

        handler: async function (
          razorpayResponse
        ) {
          console.log(
            'Razorpay payment response:',
            razorpayResponse
          );

          try {
            // ==================================================
            // STEP 4
            // VERIFY PAYMENT WITH BACKEND
            // ==================================================

            const verifyResponse =
              await fetch(
                '/api/payments/verify',
                {
                  method: 'POST',

                  credentials: 'include',

                  headers: {
                    'Content-Type':
                      'application/json',
                  },

                  body: JSON.stringify({
                    booking_id:
                      bookingId,

                    razorpay_order_id:
                      razorpayResponse.razorpay_order_id,

                    razorpay_payment_id:
                      razorpayResponse.razorpay_payment_id,

                    razorpay_signature:
                      razorpayResponse.razorpay_signature,
                  }),
                }
              );

            const verifyData =
              await verifyResponse.json();

            console.log(
              'Payment verification response:',
              verifyData
            );

            // ==================================================
            // VERIFY FAILED
            // ==================================================

            if (
              !verifyResponse.ok ||
              !verifyData.success
            ) {
              console.error(
                'Payment verification failed:',
                verifyData
              );

              alert(
                verifyData.message ||
                  'Payment verification failed.'
              );

              setProcessing(false);
              return;
            }

            // ==================================================
            // PAYMENT VERIFIED SUCCESSFULLY
            // ==================================================

            const verifiedAmount =
              Number(
                verifyData.payment?.amount ??
                  backendAmountInRupees
              );

            // ==================================================
            // SAVE PAYMENT INFORMATION
            // ==================================================

            localStorage.setItem(
              'lumoraPayment',
              JSON.stringify({
                paymentMethod,

                amount:
                  Number.isFinite(
                    verifiedAmount
                  )
                    ? verifiedAmount
                    : backendAmountInRupees,

                currency:
                  verifyData.payment?.currency ??
                  'INR',

                status:
                  verifyData.payment?.status ??
                  'PAID',

                paymentId:
                  verifyData.payment?.id ??
                  null,

                razorpayPaymentId:
                  verifyData.payment
                    ?.provider_payment_id ??
                  razorpayResponse
                    .razorpay_payment_id,

                razorpayOrderId:
                  verifyData.payment
                    ?.provider_order_id ??
                  razorpayResponse
                    .razorpay_order_id,

                bookingId:
                  verifyData.booking?.id ??
                  bookingId,
              })
            );

            // ==================================================
            // UPDATE BOOKING STATUS
            // ==================================================

            localStorage.setItem(
              'lumoraBookingStatus',
              'CONFIRMED'
            );

            // ==================================================
            // UPDATE BOOKING DATA
            // ==================================================

            const updatedBooking = {
              ...currentBooking,

              bookingId:
                currentBooking.bookingId ||
                currentBooking.id,

              id:
                currentBooking.id ||
                bookingId,

              status:
                verifyData.booking?.status ||
                'CONFIRMED',

              bookingStatus:
                verifyData.booking?.status ||
                'CONFIRMED',

              paymentStatus:
                'PAID',

              totalAmount:
                Number.isFinite(
                  verifiedAmount
                )
                  ? verifiedAmount
                  : backendAmountInRupees,
            };

            localStorage.setItem(
              'lumoraBooking',
              JSON.stringify(
                updatedBooking
              )
            );

            // ==================================================
            // GO TO CONFIRMATION PAGE
            // ==================================================

            navigate(
              '/booking-confirmation'
            );

          } catch (error) {
            console.error(
              'Payment verification error:',
              error
            );

            alert(
              'Payment was completed, but verification could not be completed. Please contact LUMORA support.'
            );

            setProcessing(false);
          }
        },

        // ====================================================
        // CHECKOUT DISMISSED
        // ====================================================

        modal: {
          ondismiss: function () {
            console.log(
              'Razorpay checkout closed by user.'
            );

            setProcessing(false);
          },
        },

        // ====================================================
        // RETRY
        // ====================================================

        retry: {
          enabled: true,
          max_count: 2,
        },
      };

      // ======================================================
      // STEP 5
      // CREATE RAZORPAY INSTANCE
      // ======================================================

      const razorpay =
        new window.Razorpay(options);

      // ======================================================
      // PAYMENT FAILED
      // ======================================================

      razorpay.on(
        'payment.failed',
        function (response) {
          console.error(
            'Razorpay payment failed:',
            response.error
          );

          alert(
            response.error?.description ||
              'Payment failed. Please try again.'
          );

          setProcessing(false);
        }
      );

      // ======================================================
      // OPEN RAZORPAY CHECKOUT
      // ======================================================

      razorpay.open();

    } catch (error) {
      console.error(
        'Payment error:',
        error
      );

      alert(
        'Unable to connect to LUMORA payment server.'
      );

      setProcessing(false);
    }
  };

  // ==========================================================
  // UI
  // ==========================================================

  return (
    <main className="payment-page">

      {/* HERO */}

      <section className="payment-hero">

        <div className="container">

          <Link
            to="/booking-summary"
            className="payment-back"
          >
            <ArrowLeft
              size={16}
              strokeWidth={1.4}
            />

            Back to summary
          </Link>

          <div className="payment-hero-content">

            <p className="section-eyebrow">
              SECURE CHECKOUT
            </p>

            <h1>
              Complete
              <span>
                your reservation.
              </span>
            </h1>

            <p>
              Secure your table and get ready for an
              evening worth remembering.
            </p>

          </div>

        </div>

      </section>

      {/* PAYMENT SECTION */}

      <section className="payment-section">

        <div className="container">

          <div className="payment-layout">

            {/* LEFT SIDE */}

            <div className="payment-main">

              <div className="payment-heading">

                <span className="payment-number">
                  01 — PAYMENT METHOD
                </span>

                <h2>
                  Choose how
                  <span>
                    you'd like to pay.
                  </span>
                </h2>

              </div>

              {/* PAYMENT METHODS */}

              <div className="payment-methods">

                {/* UPI */}

                <button
                  type="button"
                  className={`payment-method ${
                    paymentMethod === 'upi'
                      ? 'active'
                      : ''
                  }`}
                  onClick={() =>
                    setPaymentMethod('upi')
                  }
                  disabled={processing}
                >

                  <div className="payment-method-icon">

                    <Smartphone
                      size={20}
                      strokeWidth={1.3}
                    />

                  </div>

                  <div className="payment-method-content">

                    <strong>
                      UPI
                    </strong>

                    <span>
                      Google Pay · PhonePe · Paytm
                    </span>

                  </div>

                  <div className="payment-radio">

                    {paymentMethod === 'upi' && (
                      <Check
                        size={13}
                        strokeWidth={2}
                      />
                    )}

                  </div>

                </button>

                {/* CARD */}

                <button
                  type="button"
                  className={`payment-method ${
                    paymentMethod === 'card'
                      ? 'active'
                      : ''
                  }`}
                  onClick={() =>
                    setPaymentMethod('card')
                  }
                  disabled={processing}
                >

                  <div className="payment-method-icon">

                    <CreditCard
                      size={20}
                      strokeWidth={1.3}
                    />

                  </div>

                  <div className="payment-method-content">

                    <strong>
                      Credit / Debit Card
                    </strong>

                    <span>
                      Visa · Mastercard · RuPay
                    </span>

                  </div>

                  <div className="payment-radio">

                    {paymentMethod === 'card' && (
                      <Check
                        size={13}
                        strokeWidth={2}
                      />
                    )}

                  </div>

                </button>

                {/* NET BANKING */}

                <button
                  type="button"
                  className={`payment-method ${
                    paymentMethod === 'netbanking'
                      ? 'active'
                      : ''
                  }`}
                  onClick={() =>
                    setPaymentMethod('netbanking')
                  }
                  disabled={processing}
                >

                  <div className="payment-method-icon">

                    <Landmark
                      size={20}
                      strokeWidth={1.3}
                    />

                  </div>

                  <div className="payment-method-content">

                    <strong>
                      Net Banking
                    </strong>

                    <span>
                      All major Indian banks
                    </span>

                  </div>

                  <div className="payment-radio">

                    {paymentMethod === 'netbanking' && (
                      <Check
                        size={13}
                        strokeWidth={2}
                      />
                    )}

                  </div>

                </button>

              </div>

              {/* UPI INFORMATION */}

              {paymentMethod === 'upi' && (
                <div className="payment-extra">

                  <label>
                    UPI PAYMENT
                  </label>

                  <p>
                    Select Google Pay, PhonePe, Paytm
                    or UPI QR inside Razorpay Checkout.
                  </p>

                </div>
              )}

              {/* CARD INFORMATION */}

              {paymentMethod === 'card' && (
                <div className="payment-extra">

                  <label>
                    CARD PAYMENT
                  </label>

                  <p>
                    Card details will be securely handled
                    by Razorpay Checkout.
                  </p>

                </div>
              )}

              {/* NET BANKING INFORMATION */}

              {paymentMethod === 'netbanking' && (
                <div className="payment-extra">

                  <label>
                    NET BANKING
                  </label>

                  <p>
                    Select your bank and complete the
                    payment securely inside Razorpay.
                  </p>

                </div>
              )}

              {/* SECURITY */}

              <div className="payment-security">

                <LockKeyhole
                  size={16}
                  strokeWidth={1.3}
                />

                <div>

                  <strong>
                    Secure payment
                  </strong>

                  <span>
                    Your payment information is encrypted
                    and securely processed by Razorpay.
                  </span>

                </div>

              </div>

            </div>

            {/* RIGHT SIDE */}

            <aside className="payment-summary">

              <div className="payment-summary-top">

                <span>
                  YOUR RESERVATION
                </span>

                <Sparkles
                  size={16}
                  strokeWidth={1.3}
                />

              </div>

              <h3>
                {booking.restaurant}
              </h3>

              <div className="payment-location">
                Chennai · Lumora Dining
              </div>

              {/* BOOKING DETAILS */}

              <div className="payment-details">

                <div>

                  <CalendarDays
                    size={16}
                    strokeWidth={1.3}
                  />

                  <div>

                    <span>
                      DATE
                    </span>

                    <strong>
                      {booking.date ||
                        'Not selected'}
                    </strong>

                  </div>

                </div>

                <div>

                  <Clock3
                    size={16}
                    strokeWidth={1.3}
                  />

                  <div>

                    <span>
                      TIME
                    </span>

                    <strong>
                      {booking.time ||
                        'Not selected'}
                    </strong>

                  </div>

                </div>

                <div>

                  <Users
                    size={16}
                    strokeWidth={1.3}
                  />

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

                <div>

                  <Sparkles
                    size={16}
                    strokeWidth={1.3}
                  />

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

              {/* TOTAL */}

              <div className="payment-total">

                <span>
                  TOTAL
                </span>

                <strong>
                  {formatAmount(displayAmount)}
                </strong>

              </div>

              {/* PAY BUTTON */}

              <form
                onSubmit={handlePayment}
              >

                <button
                  type="submit"
                  className="payment-submit"
                  disabled={
                    processing ||
                    displayAmount <= 0
                  }
                >

                  {processing ? (
                    <>
                      <span className="payment-loader"></span>

                      Opening secure checkout...
                    </>
                  ) : (
                    <>
                      Pay {formatAmount(displayAmount)}
                      {' '}Securely

                      <ArrowRight
                        size={16}
                        strokeWidth={1.4}
                      />
                    </>
                  )}

                </button>

              </form>

              <p className="payment-terms">

                By continuing, you agree to Lumora's
                reservation terms and conditions.

              </p>

            </aside>

          </div>

        </div>

      </section>

    </main>
  );
}

export default Payment;