import { useEffect, useState } from 'react';

import {
  Search,
  RefreshCw,
  CreditCard,
  Receipt,
  RotateCcw,
  X,
  AlertTriangle,
} from 'lucide-react';

const AdminPayments = () => {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const [refundingPaymentId, setRefundingPaymentId] =
    useState(null);

  // ============================================================
  // REFUND CONFIRMATION MODAL
  // ============================================================

  const [confirmPayment, setConfirmPayment] =
    useState(null);

  // ============================================================
  // FETCH PAYMENTS
  // ============================================================

  const fetchPayments = async () => {
    try {
      setLoading(true);
      setError('');

      const response = await fetch(
        'http://localhost:5000/api/admin/payments',
        {
          method: 'GET',
          credentials: 'include',
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message || 'Unable to load payments'
        );
      }

      setPayments(data.payments || []);
    } catch (error) {
      console.error(
        'Admin payments error:',
        error
      );

      setError(
        error.message || 'Unable to load payments'
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

    const loadPayments = async () => {
      try {
        const response = await fetch(
          'http://localhost:5000/api/admin/payments',
          {
            method: 'GET',
            credentials: 'include',
          }
        );

        const data = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(
            data.message || 'Unable to load payments'
          );
        }

        if (!cancelled) {
          setPayments(data.payments || []);
          setError('');
          setLoading(false);
        }
      } catch (error) {
        console.error(
          'Admin payments error:',
          error
        );

        if (!cancelled) {
          setError(
            error.message ||
              'Unable to load payments'
          );

          setLoading(false);
        }
      }
    };

    loadPayments();

    return () => {
      cancelled = true;
    };
  }, []);

  // ============================================================
  // OPEN REFUND CONFIRMATION
  // ============================================================

  const handleRefund = (payment) => {
    if (payment.status !== 'PAID') {
      alert('Only PAID payments can be refunded.');
      return;
    }

    setConfirmPayment(payment);
  };

  // ============================================================
  // CLOSE REFUND MODAL
  // ============================================================

  const closeRefundModal = () => {
    if (refundingPaymentId !== null) {
      return;
    }

    setConfirmPayment(null);
  };

  // ============================================================
  // CONFIRM REFUND
  // ============================================================

  const confirmRefund = async () => {
    if (!confirmPayment) {
      return;
    }

    const payment = confirmPayment;

    try {
      setRefundingPaymentId(payment.id);

      const response = await fetch(
        `http://localhost:5000/api/admin/payments/${payment.id}/refund`,
        {
          method: 'POST',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message || 'Payment refund failed'
        );
      }

      setPayments((currentPayments) =>
        currentPayments.map((item) =>
          Number(item.id) === Number(payment.id)
            ? {
                ...item,
                status: 'REFUNDED',
              }
            : item
        )
      );

      setConfirmPayment(null);

      alert(
        data.message ||
          'Payment refunded successfully.'
      );
    } catch (error) {
      console.error(
        'Admin payment refund error:',
        error
      );

      alert(
        error.message ||
          'Payment refund failed.'
      );
    } finally {
      setRefundingPaymentId(null);
    }
  };

  // ============================================================
  // FORMAT DATE
  // ============================================================

  const formatDate = (date) => {
    if (!date) return '--';

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

  const formatTime = (date) => {
    if (!date) return '--';

    const parsed = new Date(date);

    if (Number.isNaN(parsed.getTime())) {
      return '--';
    }

    return parsed.toLocaleTimeString('en-IN', {
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
  // STATUS CLASS
  // ============================================================

  const getStatusClass = (status) => {
    return `admin-status admin-status-${String(
      status || ''
    ).toLowerCase()}`;
  };

  // ============================================================
  // FILTER PAYMENTS
  // ============================================================

  const filteredPayments = payments.filter(
    (payment) => {
      const search = searchTerm
        .trim()
        .toLowerCase();

      const matchesSearch =
        !search ||
        String(payment.id || '')
          .toLowerCase()
          .includes(search) ||
        String(payment.booking_id || '')
          .toLowerCase()
          .includes(search) ||
        String(payment.user_name || '')
          .toLowerCase()
          .includes(search) ||
        String(payment.user_email || '')
          .toLowerCase()
          .includes(search) ||
        String(payment.restaurant_name || '')
          .toLowerCase()
          .includes(search) ||
        String(payment.provider_payment_id || '')
          .toLowerCase()
          .includes(search) ||
        String(payment.provider_order_id || '')
          .toLowerCase()
          .includes(search);

      const matchesStatus =
        statusFilter === 'ALL' ||
        String(payment.status || '')
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

        <p>Loading payments...</p>
      </div>
    );
  }

  // ============================================================
  // ERROR
  // ============================================================

  if (error) {
    return (
      <div className="admin-error">
        <h3>Unable to load payments</h3>

        <p>{error}</p>

        <button
          type="button"
          onClick={fetchPayments}
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
    <div className="admin-payments-page">

      {/* ======================================================
          PAGE HEADING
      ====================================================== */}

      <div className="admin-page-heading">

        <div>
          <span className="admin-eyebrow">
            FINANCE
          </span>

          <h2>Payments</h2>

          <p>
            View and monitor all LUMORA
            payment transactions.
          </p>
        </div>

        <button
          type="button"
          className="admin-refresh-button"
          onClick={fetchPayments}
          disabled={loading}
        >
          <RefreshCw size={14} />

          Refresh
        </button>

      </div>

      {/* ======================================================
          TOOLBAR
      ====================================================== */}

      <div className="admin-payments-toolbar">

        <div className="admin-payments-search">

          <Search size={17} />

          <input
            type="text"
            placeholder="Search payment, booking, customer..."
            value={searchTerm}
            onChange={(event) =>
              setSearchTerm(event.target.value)
            }
          />

        </div>

        <div className="admin-payments-filters">

          {[
            'ALL',
            'PAID',
            'PENDING',
            'FAILED',
            'REFUNDED',
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

      {/* ======================================================
          META
      ====================================================== */}

      <div className="admin-payments-meta">

        <span>
          Showing{' '}

          <strong>
            {filteredPayments.length}
          </strong>{' '}

          of{' '}

          <strong>
            {payments.length}
          </strong>{' '}

          payments
        </span>

      </div>

      {/* ======================================================
          TABLE
      ====================================================== */}

      <div className="admin-table-card">

        <div className="admin-table-wrapper">

          <table className="admin-payments-table">

            <thead>
              <tr>
                <th>PAYMENT</th>
                <th>BOOKING</th>
                <th>CUSTOMER</th>
                <th>RESTAURANT</th>
                <th>AMOUNT</th>
                <th>STATUS</th>
                <th>DATE</th>
                <th>ACTION</th>
              </tr>
            </thead>

            <tbody>

              {filteredPayments.length > 0 ? (

                filteredPayments.map(
                  (payment) => (
                    <tr key={payment.id}>

                      {/* PAYMENT */}

                      <td>
                        <div className="admin-payment-table-id">

                          <div className="admin-payment-table-icon">
                            <CreditCard size={15} />
                          </div>

                          <div>
                            <strong>
                              #{payment.id}
                            </strong>

                            <span>
                              {payment.provider ||
                                'PAYMENT'}
                            </span>
                          </div>

                        </div>
                      </td>

                      {/* BOOKING */}

                      <td>
                        <div className="admin-payment-booking">

                          <Receipt size={14} />

                          <strong>
                            #{payment.booking_id}
                          </strong>

                        </div>
                      </td>

                      {/* CUSTOMER */}

                      <td>
                        <div className="admin-payment-customer">

                          <strong>
                            {payment.user_name ||
                              '--'}
                          </strong>

                          <span>
                            {payment.user_email ||
                              '--'}
                          </span>

                        </div>
                      </td>

                      {/* RESTAURANT */}

                      <td>
                        <span className="admin-payment-restaurant">
                          {payment.restaurant_name ||
                            '--'}
                        </span>
                      </td>

                      {/* AMOUNT */}

                      <td>
                        <strong className="admin-payment-amount">
                          {formatCurrency(
                            payment.amount
                          )}
                        </strong>
                      </td>

                      {/* STATUS */}

                      <td>
                        <span
                          className={getStatusClass(
                            payment.status
                          )}
                        >
                          {payment.status ||
                            '--'}
                        </span>
                      </td>

                      {/* DATE */}

                      <td>
                        <div className="admin-payment-date">

                          <strong>
                            {formatDate(
                              payment.created_at
                            )}
                          </strong>

                          <span>
                            {formatTime(
                              payment.created_at
                            )}
                          </span>

                        </div>
                      </td>

                      {/* ACTION */}

                      <td>
                        {String(
                          payment.status || ''
                        ).toUpperCase() === 'PAID' ? (

                          <button
                            type="button"
                            className="admin-payment-refund-button"
                            onClick={() =>
                              handleRefund(payment)
                            }
                            disabled={
                              refundingPaymentId ===
                              payment.id
                            }
                          >
                            <RotateCcw size={13} />

                            {refundingPaymentId ===
                            payment.id
                              ? 'Refunding...'
                              : 'Refund'}
                          </button>

                        ) : (

                          <span className="admin-payment-no-action">
                            --
                          </span>

                        )}
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

                    <CreditCard size={30} />

                    <strong>
                      No payments found
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

      {/* ======================================================
          REFUND CONFIRMATION MODAL
      ====================================================== */}

      {confirmPayment && (
        <div
          className="admin-confirm-overlay"
          onMouseDown={(event) => {
            if (
              event.target ===
              event.currentTarget
            ) {
              closeRefundModal();
            }
          }}
        >
          <div
            className="admin-confirm-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="refund-confirm-title"
          >

            <button
              type="button"
              className="admin-confirm-close"
              onClick={closeRefundModal}
              disabled={
                refundingPaymentId !== null
              }
              aria-label="Close"
            >
              <X size={17} />
            </button>

            <div className="admin-confirm-icon">
              <AlertTriangle size={22} />
            </div>

            <div className="admin-confirm-content">

              <h3 id="refund-confirm-title">
                Refund Payment?
              </h3>

              <p>
                Are you sure you want to
                refund payment{' '}
                <strong>
                  #{confirmPayment.id}
                </strong>
                ?
              </p>

              <div
                style={{
                  marginTop: '14px',
                  padding: '12px 14px',
                  borderRadius: '10px',
                  background: '#f7f5f1',
                  fontSize: '13px',
                  lineHeight: '1.7',
                }}
              >
                <div>
                  <strong>Amount:</strong>{' '}
                  {formatCurrency(
                    confirmPayment.amount
                  )}
                </div>

                <div>
                  <strong>Booking:</strong>{' '}
                  #{confirmPayment.booking_id}
                </div>

                <div>
                  <strong>Customer:</strong>{' '}
                  {confirmPayment.user_name ||
                    '--'}
                </div>
              </div>

              <p
                style={{
                  marginTop: '12px',
                  fontSize: '12px',
                  color: '#777',
                }}
              >
                This will also cancel the
                confirmed booking.
              </p>

            </div>

            <div className="admin-confirm-actions">

              <button
                type="button"
                className="admin-confirm-secondary"
                onClick={closeRefundModal}
                disabled={
                  refundingPaymentId !== null
                }
              >
                Cancel
              </button>

              <button
                type="button"
                className="admin-confirm-danger"
                onClick={confirmRefund}
                disabled={
                  refundingPaymentId !== null
                }
              >
                {refundingPaymentId !== null
                  ? 'Refunding...'
                  : 'Confirm Refund'}
              </button>

            </div>

          </div>
        </div>
      )}

    </div>
  );
};

export default AdminPayments;