import { API_BASE_URL } from '../../api';
import { useEffect, useState } from 'react';
import {
  Search,
  Users,
  RefreshCw,
  Mail,
  ShieldCheck,
  UserCog,
  AlertTriangle,
  X,
} from 'lucide-react';

const AdminUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');

  const [updatingUserId, setUpdatingUserId] =
    useState(null);

  // ============================================================
  // CUSTOM CONFIRMATION MODAL
  // ============================================================

  const [confirmUser, setConfirmUser] =
    useState(null);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError('');

      const response = await fetch(
        `${API_BASE_URL}/api/admin/users`,
        {
          method: 'GET',
          credentials: 'include',
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message || 'Unable to load users'
        );
      }

      setUsers(data.users || []);
    } catch (error) {
      console.error(
        'Admin users error:',
        error
      );

      setError(
        error.message || 'Unable to load users'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let cancelled = false;

    const loadUsers = async () => {
      try {
        const response = await fetch(
          `${API_BASE_URL}/api/admin/users`,
          {
            method: 'GET',
            credentials: 'include',
          }
        );

        const data = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(
            data.message || 'Unable to load users'
          );
        }

        if (!cancelled) {
          setUsers(data.users || []);
          setError('');
          setLoading(false);
        }
      } catch (error) {
        console.error(
          'Admin users error:',
          error
        );

        if (!cancelled) {
          setError(
            error.message ||
              'Unable to load users'
          );

          setLoading(false);
        }
      }
    };

    loadUsers();

    return () => {
      cancelled = true;
    };
  }, []);

  // ============================================================
  // OPEN ROLE CHANGE CONFIRMATION
  // ============================================================

  const handleRoleChange = (user) => {
    const currentRole = String(
      user.role || ''
    ).toUpperCase();

    const newRole =
      currentRole === 'ADMIN'
        ? 'CUSTOMER'
        : 'ADMIN';

    setConfirmUser({
      ...user,
      currentRole,
      newRole,
    });
  };

  // ============================================================
  // CONFIRM ROLE CHANGE
  // ============================================================

  const confirmRoleChange = async () => {
    if (!confirmUser) {
      return;
    }

    const user = confirmUser;
    const newRole = user.newRole;

    try {
      setUpdatingUserId(user.id);

      const response = await fetch(
        `${API_BASE_URL}/api/admin/users/${user.id}/role`,
        {
          method: 'PATCH',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            role: newRole,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message ||
            'Unable to update user role'
        );
      }

      setUsers((currentUsers) =>
        currentUsers.map((item) =>
          String(item.id) ===
          String(user.id)
            ? {
                ...item,
                role:
                  data.user?.role ||
                  newRole,
              }
            : item
        )
      );

      setConfirmUser(null);
    } catch (error) {
      console.error(
        'User role update error:',
        error
      );

      alert(
        error.message ||
          'Unable to update user role.'
      );
    } finally {
      setUpdatingUserId(null);
    }
  };

  // ============================================================
  // CLOSE CONFIRMATION MODAL
  // ============================================================

  const closeConfirmModal = () => {
    if (updatingUserId !== null) {
      return;
    }

    setConfirmUser(null);
  };

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

  const filteredUsers = users.filter((user) => {
    const search = searchTerm
      .trim()
      .toLowerCase();

    const matchesSearch =
      !search ||
      String(user.id || '')
        .toLowerCase()
        .includes(search) ||
      String(user.name || '')
        .toLowerCase()
        .includes(search) ||
      String(user.email || '')
        .toLowerCase()
        .includes(search);

    const matchesRole =
      roleFilter === 'ALL' ||
      String(user.role || '')
        .toUpperCase() === roleFilter;

    return matchesSearch && matchesRole;
  });

  if (loading) {
    return (
      <div className="admin-loading">
        <div className="admin-loader" />

        <p>
          Loading users...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="admin-error">
        <h3>
          Unable to load users
        </h3>

        <p>
          {error}
        </p>

        <button
          type="button"
          onClick={fetchUsers}
          className="admin-retry-button"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="admin-users-page">

      {/* PAGE HEADING */}

      <div className="admin-page-heading">
        <div>
          <span className="admin-eyebrow">
            MANAGEMENT
          </span>

          <h2>
            Users
          </h2>

          <p>
            View and manage all registered
            LUMORA users.
          </p>
        </div>

        <button
          type="button"
          className="admin-refresh-button"
          onClick={fetchUsers}
        >
          <RefreshCw size={14} />
          Refresh
        </button>
      </div>

      {/* FILTER BAR */}

      <div className="admin-users-toolbar">

        <div className="admin-users-search">
          <Search size={17} />

          <input
            type="text"
            placeholder="Search name, email or user ID..."
            value={searchTerm}
            onChange={(event) =>
              setSearchTerm(
                event.target.value
              )
            }
          />
        </div>

        <div className="admin-users-filters">
          {[
            'ALL',
            'CUSTOMER',
            'ADMIN',
          ].map((role) => (
            <button
              key={role}
              type="button"
              className={
                roleFilter === role
                  ? 'admin-filter-active'
                  : ''
              }
              onClick={() =>
                setRoleFilter(role)
              }
            >
              {role}
            </button>
          ))}
        </div>

      </div>

      {/* RESULTS INFO */}

      <div className="admin-users-meta">
        <span>
          Showing{' '}
          <strong>
            {filteredUsers.length}
          </strong>{' '}
          of{' '}
          <strong>
            {users.length}
          </strong>{' '}
          users
        </span>
      </div>

      {/* USERS TABLE */}

      <div className="admin-table-card">

        <div className="admin-table-wrapper">

          <table className="admin-users-table">

            <thead>
              <tr>
                <th>
                  USER
                </th>

                <th>
                  EMAIL
                </th>

                <th>
                  ROLE
                </th>

                <th>
                  JOINED
                </th>

                <th>
                  USER ID
                </th>

                <th>
                  ACTION
                </th>
              </tr>
            </thead>

            <tbody>

              {filteredUsers.length > 0 ? (
                filteredUsers.map((user) => (
                  <tr key={user.id}>

                    {/* USER */}

                    <td>
                      <div className="admin-user-table-profile">

                        <div className="admin-user-table-avatar">
                          {user.name
                            ? user.name
                                .charAt(0)
                                .toUpperCase()
                            : 'U'}
                        </div>

                        <div className="admin-user-table-info">
                          <strong>
                            {user.name ||
                              'Unknown User'}
                          </strong>

                          <span>
                            Registered user
                          </span>
                        </div>

                      </div>
                    </td>

                    {/* EMAIL */}

                    <td>
                      <div className="admin-user-table-email">
                        <Mail size={14} />

                        <span>
                          {user.email || '--'}
                        </span>
                      </div>
                    </td>

                    {/* ROLE */}

                    <td>
                      <span
                        className={`admin-user-role admin-user-role-${String(
                          user.role || ''
                        ).toLowerCase()}`}
                      >
                        <ShieldCheck
                          size={13}
                        />

                        {user.role || '--'}
                      </span>
                    </td>

                    {/* JOINED */}

                    <td>
                      <span className="admin-user-table-date">
                        {formatDate(
                          user.created_at
                        )}
                      </span>
                    </td>

                    {/* USER ID */}

                    <td>
                      <strong className="admin-user-table-id">
                        #{user.id}
                      </strong>
                    </td>

                    {/* ACTION */}

                    <td>
                      <button
                        type="button"
                        className={`admin-user-role-button ${
                          String(
                            user.role || ''
                          ).toUpperCase() ===
                          'ADMIN'
                            ? 'admin-user-role-button-demote'
                            : 'admin-user-role-button-promote'
                        }`}
                        onClick={() =>
                          handleRoleChange(
                            user
                          )
                        }
                        disabled={
                          updatingUserId ===
                          user.id
                        }
                        title={
                          String(
                            user.role || ''
                          ).toUpperCase() ===
                          'ADMIN'
                            ? 'Change to customer'
                            : 'Promote to admin'
                        }
                      >
                        <UserCog
                          size={13}
                        />

                        {updatingUserId ===
                        user.id
                          ? 'Updating...'
                          : String(
                              user.role || ''
                            ).toUpperCase() ===
                            'ADMIN'
                          ? 'Make Customer'
                          : 'Make Admin'}
                      </button>
                    </td>

                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan="6"
                    className="admin-table-empty"
                  >
                    <Users size={30} />

                    <strong>
                      No users found
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
          CUSTOM CONFIRMATION MODAL
      ======================================================== */}

      {confirmUser && (
        <div
          className="admin-confirm-overlay"
          onMouseDown={(event) => {
            if (
              event.target ===
              event.currentTarget
            ) {
              closeConfirmModal();
            }
          }}
        >

          <div
            className="admin-confirm-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="admin-confirm-title"
          >

            <button
              type="button"
              className="admin-confirm-close"
              onClick={closeConfirmModal}
              disabled={
                updatingUserId !== null
              }
              aria-label="Close"
            >
              <X size={17} />
            </button>

            <div className="admin-confirm-icon">
              <AlertTriangle size={22} />
            </div>

            <div className="admin-confirm-content">

              <h3 id="admin-confirm-title">
                Change User Role?
              </h3>

              <p>
                Are you sure you want to change
                <strong>
                  {' '}
                  "{confirmUser.name ||
                    'this user'}"
                </strong>
                {' '}
                from{' '}
                <strong>
                  {confirmUser.currentRole}
                </strong>
                {' '}
                to{' '}
                <strong>
                  {confirmUser.newRole}
                </strong>
                ?
              </p>

            </div>

            <div className="admin-confirm-actions">

              <button
                type="button"
                className="admin-confirm-secondary"
                onClick={closeConfirmModal}
                disabled={
                  updatingUserId !== null
                }
              >
                Cancel
              </button>

              <button
                type="button"
                className="admin-confirm-danger"
                onClick={confirmRoleChange}
                disabled={
                  updatingUserId !== null
                }
              >
                {updatingUserId !== null
                  ? 'Updating...'
                  : 'Confirm Change'}
              </button>

            </div>

          </div>

        </div>
      )}

    </div>
  );
};

export default AdminUsers;