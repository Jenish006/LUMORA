import { API_BASE_URL } from '../../api';
import { useEffect, useState } from 'react';
import {
  Search,
  RefreshCw,
  MapPin,
  Star,
  Utensils,
  Power,
  Pencil,
  X,
  AlertTriangle,
} from 'lucide-react';

const AdminRestaurants = () => {
  const [restaurants, setRestaurants] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState('');

  const [searchTerm, setSearchTerm] =
    useState('');

  const [statusFilter, setStatusFilter] =
    useState('ALL');

  const [editingRestaurant, setEditingRestaurant] =
    useState(null);

  const [saving, setSaving] =
    useState(false);

  const [confirmRestaurant, setConfirmRestaurant] =
    useState(null);

  const [updatingStatus, setUpdatingStatus] =
    useState(false);

  const [editForm, setEditForm] = useState({
    name: '',
    cuisine: '',
    description: '',
    city: '',
    address: '',
    phone: '',
    rating: '',
    price_range: '',
    image_url: '',
  });

  // ============================================================
  // RESTAURANT STATUS CHANGE
  // ============================================================

  const handleStatusChange = (restaurant) => {
    const newStatus =
      !restaurant.is_active;

    const action = newStatus
      ? 'activate'
      : 'deactivate';

    setConfirmRestaurant({
      ...restaurant,
      newStatus,
      action,
    });
  };

  // ============================================================
  // CONFIRM STATUS CHANGE
  // ============================================================

  const confirmStatusChange = async () => {
    if (!confirmRestaurant) {
      return;
    }

    const restaurant =
      confirmRestaurant;

    const newStatus =
      restaurant.newStatus;

    try {
      setUpdatingStatus(true);

      const response = await fetch(
        `${API_BASE_URL}/api/admin/restaurants/${restaurant.id}/status`,
        {
          method: 'PATCH',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            is_active: newStatus,
          }),
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
            'Unable to update restaurant status'
        );
      }

      setRestaurants(
        (currentRestaurants) =>
          currentRestaurants.map(
            (item) =>
              String(item.id) ===
              String(restaurant.id)
                ? {
                    ...item,
                    is_active:
                      newStatus,
                    updated_at:
                      data.restaurant
                        ?.updated_at ||
                      item.updated_at,
                  }
                : item
          )
      );

      setConfirmRestaurant(null);
    } catch (error) {
      console.error(
        'Restaurant status update error:',
        error
      );

      alert(
        error.message ||
          'Unable to update restaurant status.'
      );
    } finally {
      setUpdatingStatus(false);
    }
  };

  // ============================================================
  // CLOSE STATUS CONFIRMATION
  // ============================================================

  const closeStatusModal = () => {
    if (updatingStatus) {
      return;
    }

    setConfirmRestaurant(null);
  };

  // ============================================================
  // EDIT RESTAURANT
  // ============================================================

  const handleEditClick = (
    restaurant
  ) => {
    setEditingRestaurant(
      restaurant
    );

    setEditForm({
      name:
        restaurant.name || '',

      cuisine:
        restaurant.cuisine || '',

      description:
        restaurant.description || '',

      city:
        restaurant.city || '',

      address:
        restaurant.address || '',

      phone:
        restaurant.phone || '',

      rating:
        restaurant.rating || '',

      price_range:
        restaurant.price_range || '',

      image_url:
        restaurant.image_url || '',
    });
  };

  // ============================================================
  // EDIT FORM CHANGE
  // ============================================================

  const handleEditChange = (
    event
  ) => {
    const {
      name,
      value,
    } = event.target;

    setEditForm(
      (currentForm) => ({
        ...currentForm,
        [name]: value,
      })
    );
  };

  // ============================================================
  // SAVE RESTAURANT EDIT
  // ============================================================

  const handleEditSubmit = async (
    event
  ) => {
    event.preventDefault();

    if (!editingRestaurant) {
      return;
    }

    try {
      setSaving(true);

      const response = await fetch(
        `${API_BASE_URL}/api/admin/restaurants/${editingRestaurant.id}`,
        {
          method: 'PATCH',
          credentials: 'include',
          headers: {
            'Content-Type':
              'application/json',
          },
          body: JSON.stringify({
            ...editForm,
            rating: Number(
              editForm.rating
            ),
          }),
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
            'Unable to update restaurant'
        );
      }

      setRestaurants(
        (currentRestaurants) =>
          currentRestaurants.map(
            (item) =>
              String(item.id) ===
              String(
                editingRestaurant.id
              )
                ? data.restaurant
                : item
          )
      );

      setEditingRestaurant(null);

      alert(
        'Restaurant updated successfully'
      );
    } catch (error) {
      console.error(
        'Restaurant edit error:',
        error
      );

      alert(
        error.message ||
          'Unable to update restaurant.'
      );
    } finally {
      setSaving(false);
    }
  };

  // ============================================================
  // FETCH RESTAURANTS
  // ============================================================

  const fetchRestaurants =
    async () => {
      try {
        setLoading(true);
        setError('');

        const response =
          await fetch(
            `${API_BASE_URL}/api/admin/restaurants`,
            {
              method: 'GET',
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
              'Unable to load restaurants'
          );
        }

        setRestaurants(
          data.restaurants || []
        );
      } catch (error) {
        console.error(
          'Admin restaurants error:',
          error
        );

        setError(
          error.message ||
            'Unable to load restaurants'
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

    const loadRestaurants =
      async () => {
        try {
          const response =
            await fetch(
              `${API_BASE_URL}/api/admin/restaurants`,
              {
                method: 'GET',
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
                'Unable to load restaurants'
            );
          }

          if (!cancelled) {
            setRestaurants(
              data.restaurants || []
            );

            setError('');
            setLoading(false);
          }
        } catch (error) {
          console.error(
            'Admin restaurants error:',
            error
          );

          if (!cancelled) {
            setError(
              error.message ||
                'Unable to load restaurants'
            );

            setLoading(false);
          }
        }
      };

    loadRestaurants();

    return () => {
      cancelled = true;
    };
  }, []);

  // ============================================================
  // FILTER RESTAURANTS
  // ============================================================

  const filteredRestaurants =
    restaurants.filter(
      (restaurant) => {
        const search =
          searchTerm
            .trim()
            .toLowerCase();

        const matchesSearch =
          !search ||
          String(
            restaurant.id || ''
          )
            .toLowerCase()
            .includes(search) ||
          String(
            restaurant.name || ''
          )
            .toLowerCase()
            .includes(search) ||
          String(
            restaurant.city || ''
          )
            .toLowerCase()
            .includes(search) ||
          String(
            restaurant.cuisine || ''
          )
            .toLowerCase()
            .includes(search);

        const isActive =
          Boolean(
            restaurant.is_active
          );

        const matchesStatus =
          statusFilter === 'ALL' ||
          (
            statusFilter ===
              'ACTIVE' &&
            isActive
          ) ||
          (
            statusFilter ===
              'INACTIVE' &&
            !isActive
          );

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
          Loading restaurants...
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
          Unable to load restaurants
        </h3>

        <p>
          {error}
        </p>

        <button
          type="button"
          onClick={fetchRestaurants}
          className="admin-retry-button"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="admin-restaurants-page">

      {/* ======================================================
          PAGE HEADING
      ====================================================== */}

      <div className="admin-page-heading">

        <div>

          <span className="admin-eyebrow">
            MANAGEMENT
          </span>

          <h2>
            Restaurants
          </h2>

          <p>
            View and monitor all LUMORA
            restaurant locations.
          </p>

        </div>

        <button
          type="button"
          className="admin-refresh-button"
          onClick={fetchRestaurants}
        >
          <RefreshCw size={14} />
          Refresh
        </button>

      </div>

      {/* ======================================================
          FILTER BAR
      ====================================================== */}

      <div className="admin-restaurants-toolbar">

        <div className="admin-restaurants-search">

          <Search size={17} />

          <input
            type="text"
            placeholder="Search restaurant, city or cuisine..."
            value={searchTerm}
            onChange={(event) =>
              setSearchTerm(
                event.target.value
              )
            }
          />

        </div>

        <div className="admin-restaurants-filters">

          {[
            'ALL',
            'ACTIVE',
            'INACTIVE',
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
          RESULTS INFO
      ====================================================== */}

      <div className="admin-restaurants-meta">

        <span>
          Showing{' '}

          <strong>
            {
              filteredRestaurants.length
            }
          </strong>

          {' '}of{' '}

          <strong>
            {restaurants.length}
          </strong>

          {' '}restaurants
        </span>

      </div>

      {/* ======================================================
          RESTAURANT TABLE
      ====================================================== */}

      <div className="admin-table-card">

        <div className="admin-table-wrapper">

          <table className="admin-restaurants-table">

            <thead>

              <tr>

                <th>
                  RESTAURANT
                </th>

                <th>
                  CUISINE
                </th>

                <th>
                  LOCATION
                </th>

                <th>
                  RATING
                </th>

                <th>
                  PRICE
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

              {filteredRestaurants.length >
              0 ? (

                filteredRestaurants.map(
                  (restaurant) => (

                    <tr
                      key={
                        restaurant.id
                      }
                    >

                      {/* RESTAURANT */}

                      <td>

                        <div className="admin-restaurant-table-profile">

                          <div className="admin-restaurant-image-wrapper">

                            {restaurant.image_url ? (

                              <img
                                src={
                                  restaurant.image_url
                                }
                                alt={
                                  restaurant.name
                                }
                                className="admin-restaurant-image"
                              />

                            ) : (

                              <div className="admin-restaurant-image-placeholder">

                                <Utensils
                                  size={17}
                                />

                              </div>

                            )}

                          </div>

                          <div className="admin-restaurant-table-info">

                            <strong>
                              {restaurant.name ||
                                '--'}
                            </strong>

                            <span>
                              #
                              {
                                restaurant.id
                              }
                            </span>

                          </div>

                        </div>

                      </td>

                      {/* CUISINE */}

                      <td>

                        <div className="admin-restaurant-cuisine">

                          <Utensils
                            size={14}
                          />

                          <span>
                            {restaurant.cuisine ||
                              '--'}
                          </span>

                        </div>

                      </td>

                      {/* LOCATION */}

                      <td>

                        <div className="admin-restaurant-location">

                          <MapPin
                            size={14}
                          />

                          <div>

                            <strong>
                              {restaurant.city ||
                                '--'}
                            </strong>

                            <span>
                              {restaurant.address ||
                                '--'}
                            </span>

                          </div>

                        </div>

                      </td>

                      {/* RATING */}

                      <td>

                        <div className="admin-restaurant-rating">

                          <Star
                            size={14}
                            fill="currentColor"
                          />

                          <strong>
                            {restaurant.rating ||
                              '--'}
                          </strong>

                        </div>

                      </td>

                      {/* PRICE */}

                      <td>

                        <span className="admin-restaurant-price">
                          {restaurant.price_range ||
                            '--'}
                        </span>

                      </td>

                      {/* STATUS */}

                      <td>

                        <div className="admin-restaurant-status-cell">

                          <span
                            className={`admin-restaurant-status ${
                              restaurant.is_active
                                ? 'admin-restaurant-status-active'
                                : 'admin-restaurant-status-inactive'
                            }`}
                          >
                            {restaurant.is_active
                              ? 'ACTIVE'
                              : 'INACTIVE'}
                          </span>

                          <button
                            type="button"
                            className={`admin-restaurant-status-button ${
                              restaurant.is_active
                                ? 'admin-restaurant-status-button-disable'
                                : 'admin-restaurant-status-button-enable'
                            }`}
                            onClick={() =>
                              handleStatusChange(
                                restaurant
                              )
                            }
                            title={
                              restaurant.is_active
                                ? 'Deactivate restaurant'
                                : 'Activate restaurant'
                            }
                          >

                            <Power
                              size={13}
                            />

                            {restaurant.is_active
                              ? 'Disable'
                              : 'Enable'}

                          </button>

                        </div>

                      </td>

                      {/* ACTION */}

                      <td>

                        <button
                          type="button"
                          className="admin-restaurant-edit-button"
                          onClick={() =>
                            handleEditClick(
                              restaurant
                            )
                          }
                        >

                          <Pencil
                            size={13}
                          />

                          Edit

                        </button>

                      </td>

                    </tr>

                  )
                )

              ) : (

                <tr>

                  <td
                    colSpan="7"
                    className="admin-table-empty"
                  >

                    <Utensils
                      size={30}
                    />

                    <strong>
                      No restaurants found
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
          STATUS CONFIRMATION MODAL
      ====================================================== */}

      {confirmRestaurant && (

        <div
          className="admin-confirm-overlay"
          onMouseDown={(event) => {

            if (
              event.target ===
              event.currentTarget
            ) {
              closeStatusModal();
            }

          }}
        >

          <div
            className="admin-confirm-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="restaurant-status-confirm-title"
          >

            <button
              type="button"
              className="admin-confirm-close"
              onClick={
                closeStatusModal
              }
              disabled={
                updatingStatus
              }
              aria-label="Close"
            >
              <X size={17} />
            </button>

            <div className="admin-confirm-icon">

              <AlertTriangle
                size={22}
              />

            </div>

            <div className="admin-confirm-content">

              <h3 id="restaurant-status-confirm-title">

                {confirmRestaurant.newStatus
                  ? 'Activate Restaurant?'
                  : 'Deactivate Restaurant?'}

              </h3>

              <p>

                Are you sure you want to{' '}

                <strong>
                  {confirmRestaurant.action}
                </strong>

                {' '}

                <strong>
                  "{confirmRestaurant.name}"
                </strong>

                ?

              </p>

            </div>

            <div className="admin-confirm-actions">

              <button
                type="button"
                className="admin-confirm-secondary"
                onClick={
                  closeStatusModal
                }
                disabled={
                  updatingStatus
                }
              >
                Cancel
              </button>

              <button
                type="button"
                className="admin-confirm-danger"
                onClick={
                  confirmStatusChange
                }
                disabled={
                  updatingStatus
                }
              >

                {updatingStatus
                  ? 'Updating...'
                  : 'Confirm'}

              </button>

            </div>

          </div>

        </div>

      )}

      {/* ======================================================
          EDIT RESTAURANT MODAL
      ====================================================== */}

      {editingRestaurant && (

        <div className="admin-modal-overlay">

          <div className="admin-restaurant-edit-modal">

            <div className="admin-modal-header">

              <div>

                <span className="admin-eyebrow">
                  RESTAURANT MANAGEMENT
                </span>

                <h3>
                  Edit Restaurant
                </h3>

                <p>

                  Update details for{' '}

                  <strong>
                    {
                      editingRestaurant.name
                    }
                  </strong>

                </p>

              </div>

              <button
                type="button"
                className="admin-modal-close"
                onClick={() =>
                  setEditingRestaurant(
                    null
                  )
                }
                disabled={saving}
              >
                <X size={19} />
              </button>

            </div>

            <form
              className="admin-restaurant-edit-form"
              onSubmit={
                handleEditSubmit
              }
            >

              <div className="admin-edit-form-grid">

                {/* NAME */}

                <div className="admin-form-group">

                  <label>
                    Restaurant Name
                  </label>

                  <input
                    type="text"
                    name="name"
                    value={
                      editForm.name
                    }
                    onChange={
                      handleEditChange
                    }
                    required
                  />

                </div>

                {/* CUISINE */}

                <div className="admin-form-group">

                  <label>
                    Cuisine
                  </label>

                  <input
                    type="text"
                    name="cuisine"
                    value={
                      editForm.cuisine
                    }
                    onChange={
                      handleEditChange
                    }
                    required
                  />

                </div>

                {/* CITY */}

                <div className="admin-form-group">

                  <label>
                    City
                  </label>

                  <input
                    type="text"
                    name="city"
                    value={
                      editForm.city
                    }
                    onChange={
                      handleEditChange
                    }
                    required
                  />

                </div>

                {/* ADDRESS */}

                <div className="admin-form-group">

                  <label>
                    Address
                  </label>

                  <input
                    type="text"
                    name="address"
                    value={
                      editForm.address
                    }
                    onChange={
                      handleEditChange
                    }
                    required
                  />

                </div>

                {/* PHONE */}

                <div className="admin-form-group">

                  <label>
                    Phone
                  </label>

                  <input
                    type="text"
                    name="phone"
                    value={
                      editForm.phone
                    }
                    onChange={
                      handleEditChange
                    }
                  />

                </div>

                {/* RATING */}

                <div className="admin-form-group">

                  <label>
                    Rating
                  </label>

                  <input
                    type="number"
                    name="rating"
                    value={
                      editForm.rating
                    }
                    onChange={
                      handleEditChange
                    }
                    min="0"
                    max="5"
                    step="0.1"
                    required
                  />

                </div>

                {/* PRICE RANGE */}

                <div className="admin-form-group">

                  <label>
                    Price Range
                  </label>

                  <input
                    type="text"
                    name="price_range"
                    value={
                      editForm.price_range
                    }
                    onChange={
                      handleEditChange
                    }
                    placeholder="INR 2000+"
                  />

                </div>

                {/* IMAGE URL */}

                <div className="admin-form-group">

                  <label>
                    Image URL
                  </label>

                  <input
                    type="text"
                    name="image_url"
                    value={
                      editForm.image_url
                    }
                    onChange={
                      handleEditChange
                    }
                    placeholder="/images/restaurants/restaurant-01.jpg"
                  />

                </div>

              </div>

              {/* DESCRIPTION */}

              <div className="admin-form-group admin-form-group-full">

                <label>
                  Description
                </label>

                <textarea
                  name="description"
                  value={
                    editForm.description
                  }
                  onChange={
                    handleEditChange
                  }
                  rows="4"
                />

              </div>

              {/* FORM ACTIONS */}

              <div className="admin-edit-form-actions">

                <button
                  type="button"
                  className="admin-edit-cancel-button"
                  onClick={() =>
                    setEditingRestaurant(
                      null
                    )
                  }
                  disabled={saving}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="admin-edit-save-button"
                  disabled={saving}
                >

                  {saving
                    ? 'Saving...'
                    : 'Save Changes'}

                </button>

              </div>

            </form>

          </div>

        </div>

      )}

    </div>
  );
};

export default AdminRestaurants;