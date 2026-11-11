import { useEffect, useState } from 'react'

const API = 'http://localhost:5000/api'
const statuses = ['Pending', 'Preparing', 'Ready', 'Collected']

function StaffDashboard() {
  const [section, setSection] = useState('overview')
  const [orders, setOrders] = useState([])
  const [menu, setMenu] = useState([])
  const [report, setReport] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [editingId, setEditingId] = useState(null)

  const [form, setForm] = useState({
    name: '',
    category: 'Coffee',
    description: '',
    price: '',
    available: true
  })

  // LOAD DASHBOARD DATA
  async function loadDashboard() {
    setLoading(true)
    setError('')

    try {
      const [ordersResponse, menuResponse, reportResponse] =
        await Promise.all([
          fetch(`${API}/orders`),
          fetch(`${API}/menu`),
          fetch(`${API}/reports/daily`)
        ])

      const [ordersData, menuData, reportData] =
        await Promise.all([
          ordersResponse.json(),
          menuResponse.json(),
          reportResponse.json()
        ])

      if (!ordersResponse.ok || !ordersData.success) {
        throw new Error('Could not load orders.')
      }

      if (!menuResponse.ok || !menuData.success) {
        throw new Error('Could not load menu.')
      }

      if (!reportResponse.ok || !reportData.success) {
        throw new Error('Could not load daily report.')
      }

      setOrders(ordersData.orders || [])
      setMenu(menuData.menu || [])
      setReport(reportData.summary || null)

    } catch (err) {
      setError(
        `${err.message} Make sure the backend server is running.`
      )
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadDashboard()
  }, [])

  // UPDATE ORDER STATUS
  async function updateStatus(orderId, status) {
    setMessage('')
    setError('')

    try {
      const response = await fetch(
        `${API}/orders/${orderId}/status`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ status })
        }
      )

      const data = await response.json()

      if (!response.ok || !data.success) {
        throw new Error(
          data.message || 'Could not update order status.'
        )
      }

      setMessage(`Order successfully updated to ${status}.`)

      await loadDashboard()

    } catch (err) {
      setError(err.message)
    }
  }

  // EDIT MENU ITEM
  function startEdit(item) {
    setEditingId(item.id)

    setForm({
      name: item.name,
      category: item.category,
      description: item.description,
      price: String(item.price),
      available: item.available
    })

    setSection('menu')
  }

  // RESET MENU FORM
  function resetForm() {
    setEditingId(null)

    setForm({
      name: '',
      category: 'Coffee',
      description: '',
      price: '',
      available: true
    })
  }

  // ADD OR UPDATE MENU ITEM
  async function saveMenuItem(event) {
    event.preventDefault()

    setMessage('')
    setError('')

    const payload = {
      ...form,
      name: form.name.trim(),
      description: form.description.trim(),
      price: Number(form.price)
    }

    try {
      const response = await fetch(
        editingId
          ? `${API}/menu/${editingId}`
          : `${API}/menu`,
        {
          method: editingId ? 'PUT' : 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(payload)
        }
      )

      const data = await response.json()

      if (!response.ok || !data.success) {
        throw new Error(
          data.message || 'Could not save menu item.'
        )
      }

      setMessage(
        data.message || 'Menu item saved successfully.'
      )

      resetForm()
      await loadDashboard()

    } catch (err) {
      setError(err.message)
    }
  }

  // DELETE MENU ITEM
  async function deleteMenuItem(item) {
    const confirmed = window.confirm(
      `Delete ${item.name} from the menu?`
    )

    if (!confirmed) return

    try {
      const response = await fetch(
        `${API}/menu/${item.id}`,
        {
          method: 'DELETE'
        }
      )

      const data = await response.json()

      if (!response.ok || !data.success) {
        throw new Error(
          data.message || 'Could not delete menu item.'
        )
      }

      setMessage('Menu item deleted successfully.')

      await loadDashboard()

    } catch (err) {
      setError(err.message)
    }
  }

  // FORMAT CURRENCY
  const money = value =>
    `M ${Number(value || 0).toFixed(2)}`

  return (
    <main className="staff-page">

      {/* HEADER */}
      <div className="staff-header">

        <div>
          <p className="eyebrow">
            BREW HAVEN MANAGEMENT
          </p>

          <h1>Staff Dashboard</h1>

          <p>
            Manage customer orders, menu products and daily sales.
          </p>
        </div>

        <button
          className="staff-refresh"
          onClick={loadDashboard}
        >
          ↻ Refresh Data
        </button>

      </div>

      {/* DASHBOARD NAVIGATION */}
      <div className="staff-tabs">

        {[
          ['overview', 'Overview'],
          ['orders', 'Orders'],
          ['menu', 'Menu Management'],
          ['reports', 'Daily Reports']
        ].map(([key, label]) => (

          <button
            key={key}
            className={
              section === key
                ? 'staff-tab active'
                : 'staff-tab'
            }
            onClick={() => setSection(key)}
          >
            {label}
          </button>

        ))}

      </div>

      {/* ERROR MESSAGE */}
      {error && (
        <div className="staff-alert error">
          {error}

          <button onClick={() => setError('')}>
            ×
          </button>
        </div>
      )}

      {/* SUCCESS MESSAGE */}
      {message && (
        <div className="staff-alert success">
          {message}

          <button onClick={() => setMessage('')}>
            ×
          </button>
        </div>
      )}

      {loading ? (

        <p className="staff-loading">
          Loading dashboard data...
        </p>

      ) : (

        <>

          {/* OVERVIEW */}
          {section === 'overview' && (

            <>

              <div className="staff-stat-grid">

                <article className="staff-stat">
                  <span>Today's Orders</span>
                  <strong>
                    {report?.totalOrders ?? 0}
                  </strong>
                </article>

                <article className="staff-stat">
                  <span>Today's Revenue</span>
                  <strong>
                    {money(report?.totalRevenue)}
                  </strong>
                </article>

                <article className="staff-stat">
                  <span>Pending Orders</span>
                  <strong>
                    {report?.pendingOrders ?? 0}
                  </strong>
                </article>

                <article className="staff-stat">
                  <span>Ready for Collection</span>
                  <strong>
                    {report?.readyOrders ?? 0}
                  </strong>
                </article>

              </div>

              <section className="staff-panel">

                <div className="staff-panel-heading">

                  <h2>Recent Orders</h2>

                  <button
                    className="staff-text-button"
                    onClick={() => setSection('orders')}
                  >
                    View All Orders →
                  </button>

                </div>

                <OrdersTable
                  orders={[...orders].reverse().slice(0, 5)}
                  onStatusChange={updateStatus}
                  money={money}
                />

              </section>

            </>

          )}

          {/* ORDERS */}
          {section === 'orders' && (

            <section className="staff-panel">

              <div className="staff-panel-heading">

                <h2>Customer Orders</h2>

                <span>
                  {orders.length} total orders
                </span>

              </div>

              <OrdersTable
                orders={[...orders].reverse()}
                onStatusChange={updateStatus}
                money={money}
              />

            </section>

          )}

          {/* MENU MANAGEMENT */}
          {section === 'menu' && (

            <div className="staff-menu-layout">

              <section className="staff-panel">

                <h2>
                  {editingId
                    ? 'Edit Menu Item'
                    : 'Add New Menu Item'}
                </h2>

                <form
                  className="staff-form"
                  onSubmit={saveMenuItem}
                >

                  <label>
                    Product Name

                    <input
                      required
                      value={form.name}
                      onChange={e =>
                        setForm({
                          ...form,
                          name: e.target.value
                        })
                      }
                    />
                  </label>

                  <label>
                    Category

                    <select
                      value={form.category}
                      onChange={e =>
                        setForm({
                          ...form,
                          category: e.target.value
                        })
                      }
                    >
                      <option>Coffee</option>
                      <option>Tea</option>
                      <option>Pastries</option>
                    </select>
                  </label>

                  <label>
                    Description

                    <textarea
                      required
                      rows="3"
                      value={form.description}
                      onChange={e =>
                        setForm({
                          ...form,
                          description: e.target.value
                        })
                      }
                    />
                  </label>

                  <label>
                    Price (M)

                    <input
                      required
                      type="number"
                      min="0.01"
                      step="0.01"
                      value={form.price}
                      onChange={e =>
                        setForm({
                          ...form,
                          price: e.target.value
                        })
                      }
                    />
                  </label>

                  <label className="staff-checkbox">

                    <input
                      type="checkbox"
                      checked={form.available}
                      onChange={e =>
                        setForm({
                          ...form,
                          available: e.target.checked
                        })
                      }
                    />

                    Available for customers

                  </label>

                  <div className="staff-form-actions">

                    <button
                      className="staff-primary"
                      type="submit"
                    >
                      {editingId
                        ? 'Save Changes'
                        : 'Add Product'}
                    </button>

                    {editingId && (

                      <button
                        type="button"
                        className="staff-secondary"
                        onClick={resetForm}
                      >
                        Cancel
                      </button>

                    )}

                  </div>

                </form>

              </section>

              {/* CURRENT MENU */}
              <section className="staff-panel">

                <div className="staff-panel-heading">

                  <h2>Current Menu</h2>

                  <span>
                    {menu.length} products
                  </span>

                </div>

                <div className="staff-menu-list">

                  {menu.map(item => (

                    <article
                      className="staff-menu-item"
                      key={item.id}
                    >

                      <div>

                        <strong>{item.name}</strong>

                        <span>
                          {item.category} · {money(item.price)} ·
                          {' '}
                          {item.available
                            ? 'Available'
                            : 'Unavailable'}
                        </span>

                      </div>

                      <div className="staff-row-actions">

                        <button
                          onClick={() => startEdit(item)}
                        >
                          Edit
                        </button>

                        <button
                          className="danger"
                          onClick={() => deleteMenuItem(item)}
                        >
                          Delete
                        </button>

                      </div>

                    </article>

                  ))}

                </div>

              </section>

            </div>

          )}

          {/* DAILY REPORTS */}
          {section === 'reports' && (

            <section className="staff-panel">

              <div className="staff-panel-heading">

                <h2>Daily Sales Report</h2>

                <span>
                  {report?.date || 'Today'}
                </span>

              </div>

              <div className="staff-report-grid">

                <div>
                  <span>Total Orders</span>
                  <strong>
                    {report?.totalOrders ?? 0}
                  </strong>
                </div>

                <div>
                  <span>Total Revenue</span>
                  <strong>
                    {money(report?.totalRevenue)}
                  </strong>
                </div>

                <div>
                  <span>Pending</span>
                  <strong>
                    {report?.pendingOrders ?? 0}
                  </strong>
                </div>

                <div>
                  <span>Preparing</span>
                  <strong>
                    {report?.preparingOrders ?? 0}
                  </strong>
                </div>

                <div>
                  <span>Ready</span>
                  <strong>
                    {report?.readyOrders ?? 0}
                  </strong>
                </div>

                <div>
                  <span>Collected</span>
                  <strong>
                    {report?.collectedOrders ?? 0}
                  </strong>
                </div>

              </div>

            </section>

          )}

        </>

      )}

    </main>
  )
}


// ORDERS TABLE COMPONENT
function OrdersTable({ orders, onStatusChange, money }) {

  if (!orders.length) {
    return (
      <p className="staff-empty">
        No orders have been placed yet.
      </p>
    )
  }

  return (

    <div className="staff-table-wrap">

      <table className="staff-table">

        <thead>
          <tr>
            <th>Order</th>
            <th>Customer</th>
            <th>Items</th>
            <th>Total</th>
            <th>Status</th>
            <th>Update Status</th>
          </tr>
        </thead>

        <tbody>

          {orders.map(order => (

            <tr key={order.id}>

              <td>
                <strong>{order.orderNumber}</strong>

                <small>
                  {order.createdAt
                    ? new Date(order.createdAt).toLocaleString()
                    : ''}
                </small>
              </td>

              <td>
                {order.customerName}

                <small>
                  {order.phone} · {order.orderType}
                </small>
              </td>

              <td>
                {(order.items || [])
                  .map(item =>
                    `${item.name} × ${item.quantity}`
                  )
                  .join(', ')}
              </td>

              <td>{money(order.total)}</td>

              <td>
                <span
                  className={`staff-status status-${String(
                    order.status
                  ).toLowerCase()}`}
                >
                  {order.status}
                </span>
              </td>

              <td>

                <select
                  value={order.status}
                  onChange={e =>
                    onStatusChange(order.id, e.target.value)
                  }
                  aria-label={`Update status for ${order.orderNumber}`}
                >

                  {statuses.map(status => (
                    <option key={status}>
                      {status}
                    </option>
                  ))}

                </select>

              </td>

            </tr>

          ))}

        </tbody>

      </table>

    </div>

  )
}

export default StaffDashboard