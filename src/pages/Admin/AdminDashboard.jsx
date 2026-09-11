import { API_BASE_URL } from '../../api';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import {
  Users,
  Utensils,
  CalendarDays,
  IndianRupee,
  ArrowUpRight,
  Clock3,
  RefreshCw,
  TrendingUp,
  RotateCcw,
} from 'lucide-react';

const AdminDashboard = () => {
  const navigate = useNavigate();

  const [dashboard, setDashboard] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // ============================================================
  // FETCH DASHBOARD + ANALYTICS
  // ============================================================

  const fetchDashboard = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setLoading(true);
      }

      setError('');

      const [
        dashboardResponse,
        analyticsResponse,
      ] = await Promise.all([
        fetch(
          `${API_BASE_URL}/api/admin/dashboard`,
          {
            method: 'GET',
            credentials: 'include',
          }
        ),

        fetch(
          `${API_BASE_URL}/api/admin/analytics`,
          {
            method: 'GET',
            credentials: 'include',
          }
        ),
      ]);

      const dashboardData =
        await dashboardResponse.json();

      const analyticsData =
        await analyticsResponse.json();

      if (
        !dashboardResponse.ok ||
        !dashboardData.success
      ) {
        throw new Error(
          dashboardData.message ||
            'Unable to load dashboard'
        );
      }

      if (
        !analyticsResponse.ok ||
        !analyticsData.success
      ) {
        throw new Error(
          analyticsData.message ||
            'Unable to load analytics'
        );
      }

      setDashboard(dashboardData);
      setAnalytics(analyticsData.analytics);
    } catch (error) {
      console.error(
        'Admin dashboard error:',
        error
      );

      setError(
        error.message ||
          'Unable to load dashboard'
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

    const loadInitialDashboard = async () => {
      try {
        setError('');

        const [
          dashboardResponse,
          analyticsResponse,
        ] = await Promise.all([
          fetch(
            `${API_BASE_URL}/api/admin/dashboard`,
            {
              method: 'GET',
              credentials: 'include',
            }
          ),

          fetch(
            `${API_BASE_URL}/api/admin/analytics`,
            {
              method: 'GET',
              credentials: 'include',
            }
          ),
        ]);

        const dashboardData =
          await dashboardResponse.json();

        const analyticsData =
          await analyticsResponse.json();

        if (
          !dashboardResponse.ok ||
          !dashboardData.success
        ) {
          throw new Error(
            dashboardData.message ||
              'Unable to load dashboard'
          );
        }

        if (
          !analyticsResponse.ok ||
          !analyticsData.success
        ) {
          throw new Error(
            analyticsData.message ||
              'Unable to load analytics'
          );
        }

        if (!cancelled) {
          setDashboard(dashboardData);
          setAnalytics(analyticsData.analytics);
          setError('');
        }
      } catch (error) {
        console.error(
          'Admin dashboard error:',
          error
        );

        if (!cancelled) {
          setError(
            error.message ||
              'Unable to load dashboard'
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadInitialDashboard();

    return () => {
      cancelled = true;
    };
  }, []);

  // ============================================================
  // REFRESH
  // ============================================================

  const handleRefresh = () => {
    fetchDashboard(true);
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

    const [hours, minutes] = String(time)
      .slice(0, 5)
      .split(':')
      .map(Number);

    if (
      Number.isNaN(hours) ||
      Number.isNaN(minutes)
    ) {
      return time;
    }

    const date = new Date();

    date.setHours(hours);
    date.setMinutes(minutes);

    return date.toLocaleTimeString('en-IN', {
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  // ============================================================
  // LOADING
  // ============================================================

  if (loading) {
    return (
      <div className="admin-loading">
        <div className="admin-loader" />

        <p>
          Loading dashboard...
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
          Unable to load dashboard
        </h3>

        <p>
          {error}
        </p>

        <button
          type="button"
          onClick={handleRefresh}
          className="admin-retry-button"
        >
          Try Again
        </button>
      </div>
    );
  }

  const stats = dashboard?.stats || {};
  const dashboardAnalytics = analytics || {};

  // ============================================================
  // LAST 7 DAYS CHART DATA
  // ============================================================

  const sevenDayBookings =
    dashboardAnalytics.sevenDayBookings || [];

  const sevenDayRevenue =
    dashboardAnalytics.sevenDayRevenue || [];

  const maxBookings = Math.max(
    ...sevenDayBookings.map(
      (item) => Number(item.bookings || 0)
    ),
    1
  );

  const maxRevenue = Math.max(
    ...sevenDayRevenue.map(
      (item) => Number(item.revenue || 0)
    ),
    1
  );

  const formatChartDate = (date) => {
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
    });
  };

  // ============================================================
  // PAGE
  // ============================================================

  return (
    <div className="admin-dashboard">

      {/* PAGE HEADING */}

      <div className="admin-page-heading">

        <div>
          <span className="admin-eyebrow">
            OVERVIEW
          </span>

          <h2>
            Dashboard
          </h2>

          <p>
            Monitor your LUMORA restaurant
            operations from one place.
          </p>
        </div>

        <button
          type="button"
          className="admin-refresh-button"
          onClick={handleRefresh}
          disabled={loading}
        >
          <RefreshCw size={14} />

          Refresh
        </button>

      </div>

      {/* MAIN STATS */}

      <div className="admin-stats-grid">

        {/* USERS */}

        <div className="admin-stat-card">

          <div className="admin-stat-icon">
            <Users size={21} />
          </div>

          <div className="admin-stat-content">
            <span>
              Total Users
            </span>

            <strong>
              {stats.users ?? 0}
            </strong>
          </div>

          <ArrowUpRight
            className="admin-stat-arrow"
            size={18}
          />

        </div>

        {/* RESTAURANTS */}

        <div className="admin-stat-card">

          <div className="admin-stat-icon">
            <Utensils size={21} />
          </div>

          <div className="admin-stat-content">
            <span>
              Restaurants
            </span>

            <strong>
              {stats.restaurants ?? 0}
            </strong>
          </div>

          <ArrowUpRight
            className="admin-stat-arrow"
            size={18}
          />

        </div>

        {/* BOOKINGS */}

        <div className="admin-stat-card">

          <div className="admin-stat-icon">
            <CalendarDays size={21} />
          </div>

          <div className="admin-stat-content">
            <span>
              Total Bookings
            </span>

            <strong>
              {stats.bookings ?? 0}
            </strong>
          </div>

          <ArrowUpRight
            className="admin-stat-arrow"
            size={18}
          />

        </div>

        {/* REVENUE */}

        <div className="admin-stat-card admin-stat-revenue">

          <div className="admin-stat-icon">
            <IndianRupee size={21} />
          </div>

          <div className="admin-stat-content">
            <span>
              Paid Revenue
            </span>

            <strong>
              {formatCurrency(stats.revenue)}
            </strong>
          </div>

          <ArrowUpRight
            className="admin-stat-arrow"
            size={18}
          />

        </div>

      </div>

      {/* ========================================================
          BUSINESS ANALYTICS
      ======================================================== */}

      <div className="admin-analytics-section">

        <div className="admin-section-heading">

          <div>
            <span className="admin-eyebrow">
              PERFORMANCE
            </span>

            <h3>
              Business Analytics
            </h3>

            <p>
              A quick overview of your current
              booking and payment activity.
            </p>
          </div>

          <TrendingUp size={21} />

        </div>

        <div className="admin-analytics-grid">

          {/* TODAY BOOKINGS */}

          <div className="admin-analytics-card">

            <div className="admin-analytics-icon">
              <CalendarDays size={18} />
            </div>

            <div className="admin-analytics-content">

              <span>
                Today's Bookings
              </span>

              <strong>
                {dashboardAnalytics.todayBookings ?? 0}
              </strong>

            </div>

          </div>

          {/* MONTH BOOKINGS */}

          <div className="admin-analytics-card">

            <div className="admin-analytics-icon">
              <CalendarDays size={18} />
            </div>

            <div className="admin-analytics-content">

              <span>
                This Month
              </span>

              <strong>
                {dashboardAnalytics.monthBookings ?? 0}
              </strong>

              <small>
                Bookings
              </small>

            </div>

          </div>

          {/* TODAY REVENUE */}

          <div className="admin-analytics-card">

            <div className="admin-analytics-icon">
              <IndianRupee size={18} />
            </div>

            <div className="admin-analytics-content">

              <span>
                Today's Revenue
              </span>

              <strong>
                {formatCurrency(
                  dashboardAnalytics.todayRevenue
                )}
              </strong>

            </div>

          </div>

          {/* MONTH REVENUE */}

          <div className="admin-analytics-card">

            <div className="admin-analytics-icon">
              <IndianRupee size={18} />
            </div>

            <div className="admin-analytics-content">

              <span>
                Monthly Revenue
              </span>

              <strong>
                {formatCurrency(
                  dashboardAnalytics.monthRevenue
                )}
              </strong>

            </div>

          </div>

          {/* REFUNDED */}

          <div className="admin-analytics-card">

            <div className="admin-analytics-icon">
              <RotateCcw size={18} />
            </div>

            <div className="admin-analytics-content">

              <span>
                Refunded Amount
              </span>

              <strong>
                {formatCurrency(
                  dashboardAnalytics.refundedAmount
                )}
              </strong>

            </div>

          </div>

          {/* NEW USERS */}

          <div className="admin-analytics-card">

            <div className="admin-analytics-icon">
              <Users size={18} />
            </div>

            <div className="admin-analytics-content">

              <span>
                New Users Today
              </span>

              <strong>
                {dashboardAnalytics.newUsersToday ?? 0}
              </strong>

            </div>

          </div>

        </div>

      </div>

      {/* ========================================================
          LAST 7 DAYS PERFORMANCE
      ======================================================== */}

      <div className="admin-chart-section">

        <div className="admin-section-heading">

          <div>
            <span className="admin-eyebrow">
              LAST 7 DAYS
            </span>

            <h3>
              Booking & Revenue Trends
            </h3>

            <p>
              Track your booking volume and paid
              revenue over the last seven days.
            </p>
          </div>

          <TrendingUp size={21} />

        </div>

        <div className="admin-chart-grid">

          {/* BOOKINGS CHART */}

          <div className="admin-chart-card">

            <div className="admin-chart-card-header">

              <div>
                <span>
                  Bookings
                </span>

                <strong>
                  {sevenDayBookings.reduce(
                    (total, item) =>
                      total +
                      Number(item.bookings || 0),
                    0
                  )}
                </strong>
              </div>

              <CalendarDays size={18} />

            </div>

            <div className="admin-bar-chart">

              {sevenDayBookings.map(
                (item, index) => {

                  const bookings =
                    Number(item.bookings || 0);

                  const height =
                    bookings === 0
                      ? 4
                      : Math.max(
                          (bookings / maxBookings) * 100,
                          8
                        );

                  return (
                    <div
                      className="admin-bar-column"
                      key={`${item.date}-${index}`}
                    >

                      <div className="admin-bar-value">
                        {bookings}
                      </div>

                      <div className="admin-bar-track">

                        <div
                          className="admin-bar-fill"
                          style={{
                            height: `${height}%`,
                          }}
                        />

                      </div>

                      <span>
                        {formatChartDate(item.date)}
                      </span>

                    </div>
                  );
                }
              )}

            </div>

          </div>

          {/* REVENUE CHART */}

          <div className="admin-chart-card">

            <div className="admin-chart-card-header">

              <div>
                <span>
                  Paid Revenue
                </span>

                <strong>
                  {formatCurrency(
                    sevenDayRevenue.reduce(
                      (total, item) =>
                        total +
                        Number(item.revenue || 0),
                      0
                    )
                  )}
                </strong>
              </div>

              <IndianRupee size={18} />

            </div>

            <div className="admin-bar-chart">

              {sevenDayRevenue.map(
                (item, index) => {

                  const revenue =
                    Number(item.revenue || 0);

                  const height =
                    revenue === 0
                      ? 4
                      : Math.max(
                          (revenue / maxRevenue) * 100,
                          8
                        );

                  return (
                    <div
                      className="admin-bar-column"
                      key={`${item.date}-${index}`}
                    >

                      <div className="admin-bar-value">
                        {formatCurrency(revenue)}
                      </div>

                      <div className="admin-bar-track">

                        <div
                          className="admin-bar-fill"
                          style={{
                            height: `${height}%`,
                          }}
                        />

                      </div>

                      <span>
                        {formatChartDate(item.date)}
                      </span>

                    </div>
                  );
                }
              )}

            </div>

          </div>

        </div>

      </div>

      {/* ========================================================
          QUICK ACTIONS
      ======================================================== */}

      <div className="admin-quick-actions-section">

        <div className="admin-section-heading">

          <div>
            <span className="admin-eyebrow">
              QUICK ACCESS
            </span>

            <h3>
              Quick Actions
            </h3>

            <p>
              Manage the most important parts of
              your LUMORA admin panel.
            </p>
          </div>

          <ArrowUpRight size={21} />

        </div>

        <div className="admin-quick-actions-grid">

          {/* BOOKINGS */}

          <button
            type="button"
            className="admin-quick-action-card"
            onClick={() =>
              navigate('/admin/bookings')
            }
          >
            <div className="admin-quick-action-icon">
              <CalendarDays size={20} />
            </div>

            <div className="admin-quick-action-content">

              <strong>
                Manage Bookings
              </strong>

              <span>
                View and manage customer reservations
              </span>

            </div>

            <ArrowUpRight size={17} />
          </button>

          {/* USERS */}

          <button
            type="button"
            className="admin-quick-action-card"
            onClick={() =>
              navigate('/admin/users')
            }
          >
            <div className="admin-quick-action-icon">
              <Users size={20} />
            </div>

            <div className="admin-quick-action-content">

              <strong>
                Manage Users
              </strong>

              <span>
                View customers and admin accounts
              </span>

            </div>

            <ArrowUpRight size={17} />
          </button>

          {/* RESTAURANTS */}

          <button
            type="button"
            className="admin-quick-action-card"
            onClick={() =>
              navigate('/admin/restaurants')
            }
          >
            <div className="admin-quick-action-icon">
              <Utensils size={20} />
            </div>

            <div className="admin-quick-action-content">

              <strong>
                Manage Restaurants
              </strong>

              <span>
                Update restaurant details and status
              </span>

            </div>

            <ArrowUpRight size={17} />
          </button>

          {/* PAYMENTS */}

          <button
            type="button"
            className="admin-quick-action-card"
            onClick={() =>
              navigate('/admin/payments')
            }
          >
            <div className="admin-quick-action-icon">
              <IndianRupee size={20} />
            </div>

            <div className="admin-quick-action-content">

              <strong>
                View Payments
              </strong>

              <span>
                Track payments and refunds
              </span>

            </div>

            <ArrowUpRight size={17} />
          </button>

        </div>

      </div>

      {/* ========================================================
          CONTENT GRID
      ======================================================== */}

      <div className="admin-dashboard-grid">

        {/* UPCOMING BOOKINGS */}

        <div className="admin-panel-card">

          <div className="admin-panel-header">

            <div>

              <span className="admin-eyebrow">
                RESERVATIONS
              </span>

              <h3>
                Upcoming Bookings
              </h3>

            </div>

            <div className="admin-panel-header-actions">

              <button
                type="button"
                className="admin-view-all-button"
                onClick={() =>
                  navigate('/admin/bookings')
                }
              >
                View All
                <ArrowUpRight size={14} />
              </button>

              <Clock3 size={20} />

            </div>

          </div>

          {dashboard?.upcomingBookings?.length ? (

            <div className="admin-booking-list">

              {dashboard.upcomingBookings.map(
                (booking) => (
                  <div
                    className="admin-booking-row"
                    key={booking.id}
                  >

                    <div className="admin-booking-main">

                      <strong>
                        {booking.restaurant_name}
                      </strong>

                      <span>
                        {booking.user_name}
                      </span>

                    </div>

                    <div className="admin-booking-date">

                      <strong>
                        {formatDate(
                          booking.booking_date
                        )}
                      </strong>

                      <span>
                        {formatTime(
                          booking.booking_time
                        )}
                      </span>

                    </div>

                    <div className="admin-booking-guests">
                      {booking.guests} Guests
                    </div>

                    <div className="admin-booking-amount">
                      {formatCurrency(
                        booking.total_amount
                      )}
                    </div>

                  </div>
                )
              )}

            </div>

          ) : (

            <div className="admin-empty-state">

              <CalendarDays size={30} />

              <p>
                No upcoming confirmed bookings.
              </p>

            </div>

          )}

        </div>

        {/* RECENT BOOKINGS */}

        <div className="admin-panel-card">

          <div className="admin-panel-header">

            <div>

              <span className="admin-eyebrow">
                ACTIVITY
              </span>

              <h3>
                Recent Bookings
              </h3>

            </div>

            <div className="admin-panel-header-actions">

              <button
                type="button"
                className="admin-view-all-button"
                onClick={() =>
                  navigate('/admin/bookings')
                }
              >
                View All
                <ArrowUpRight size={14} />
              </button>

              <CalendarDays size={20} />

            </div>

          </div>

          {dashboard?.recentBookings?.length ? (

            <div className="admin-recent-list">

              {dashboard.recentBookings.map(
                (booking) => (
                  <div
                    className="admin-recent-row"
                    key={booking.id}
                  >

                    <div>

                      <strong>
                        #{booking.id}
                      </strong>

                      <span>
                        {booking.restaurant_name}
                      </span>

                    </div>

                    <div className="admin-recent-user">
                      {booking.user_name}
                    </div>

                    <span
                      className={`admin-status admin-status-${String(
                        booking.status || ''
                      ).toLowerCase()}`}
                    >
                      {booking.status}
                    </span>

                    <strong className="admin-recent-amount">
                      {formatCurrency(
                        booking.total_amount
                      )}
                    </strong>

                  </div>
                )
              )}

            </div>

          ) : (

            <div className="admin-empty-state">

              <CalendarDays size={30} />

              <p>
                No recent bookings.
              </p>

            </div>

          )}

        </div>

      </div>

    </div>
  );
};

export default AdminDashboard;