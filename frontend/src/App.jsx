import { useState, useEffect } from 'react'
import './App.css'
import StaffDashboard from './StaffDashboard'

// API URL
const API = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

// MENU PRODUCT IMAGES
const defaultMenuImage =
  'https://images.unsplash.com/photo-1570968915860-54d5c301fa9f?w=600'

const menuImages = {
  "1": "https://images.unsplash.com/photo-1572442388796-11668a67e53d?w=600",
  "2": "https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=600",
  "3": "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=600",
  "4": "https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=600",
  "5": "https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=600",
  "6": "https://images.unsplash.com/photo-1607958996333-41aef7caefaa?w=600"
}

function App() {

  // APPLICATION STATES
  const [cart, setCart] = useState([])
  const [activeCategory, setActiveCategory] = useState('All')
  const [currentPage, setCurrentPage] = useState('home')

  // CUSTOMER INFORMATION
  const [customerName, setCustomerName] = useState('')
  const [customerPhone, setCustomerPhone] = useState('')
  const [orderType, setOrderType] = useState('Takeaway')
  const [instructions, setInstructions] = useState('')

  // ORDER CONFIRMATION
  const [orderConfirmation, setOrderConfirmation] = useState(null)

  // MENU CATEGORIES
  const categories = ['All', 'Coffee', 'Tea', 'Pastries']

  // MENU PRODUCTS FROM BACKEND
  const [menuItems, setMenuItems] = useState([])

  // LOAD MENU FROM BACKEND
  useEffect(() => {

    async function fetchMenu() {

      try {

        const response = await fetch(`${API}/menu`)

        if (!response.ok) {
          throw new Error(`Menu request failed: ${response.status}`)
        }

        const data = await response.json()

        if (data.success && Array.isArray(data.menu)) {

          setMenuItems(
            data.menu.map(item => ({
              ...item,
              image: menuImages[String(item.id)] || defaultMenuImage
            }))
          )

        } else {

          console.error('The backend returned an unexpected menu response.')

        }

      } catch (error) {

        console.error('Error loading menu:', error)

      }

    }

    fetchMenu()

  }, [currentPage])

  // FILTER MENU
  const filteredItems = activeCategory === 'All'
    ? menuItems
    : menuItems.filter(item => item.category === activeCategory)

  // ADD PRODUCT TO CART
  function addToCart(item) {

    setCart(previousCart => {

      const existing = previousCart.find(
        product => product.id === item.id
      )

      if (existing) {

        return previousCart.map(product =>
          product.id === item.id
            ? { ...product, quantity: product.quantity + 1 }
            : product
        )

      }

      return [...previousCart, { ...item, quantity: 1 }]

    })

  }

  // CHANGE PRODUCT QUANTITY
  function changeQuantity(id, amount) {

    setCart(previousCart =>

      previousCart
        .map(item =>
          item.id === id
            ? { ...item, quantity: item.quantity + amount }
            : item
        )
        .filter(item => item.quantity > 0)

    )

  }

  // CALCULATE CART TOTALS
  const cartCount = cart.reduce(
    (total, item) => total + item.quantity, 0
  )

  const cartTotal = cart.reduce(
    (total, item) => total + item.price * item.quantity, 0
  )

  // OPEN CHECKOUT PAGE
  function openCheckout() {

    if (cart.length === 0) {

      alert('Please add products to your cart first.')
      return

    }

    setCurrentPage('checkout')

  }

  // PLACE CUSTOMER ORDER
  async function placeOrder(event) {

    event.preventDefault()

    if (cart.length === 0) {

      alert('Your shopping cart is empty.')
      setCurrentPage('cart')
      return

    }

    if (!customerName.trim() || !customerPhone.trim()) {

      alert('Please enter your name and phone number.')
      return

    }

    try {

      // SEND THE ORDER TO THE BACKEND
      const response = await fetch(`${API}/orders`, {

        method: 'POST',

        headers: {
          'Content-Type': 'application/json'
        },

        body: JSON.stringify({

          customerName: customerName.trim(),

          phone: customerPhone.trim(),

          orderType,

          specialInstructions: instructions.trim(),

          items: cart.map(item => ({

            menuItemId: String(item.id),

            quantity: item.quantity

          }))

        })

      })

      const data = await response.json()

      if (!response.ok || !data.success) {

        throw new Error(data.message || 'Your order could not be placed.')

      }

      // USE THE ORDER SAVED BY THE BACKEND
      const savedOrder = data.order || data

      const confirmation = {

        orderNumber: savedOrder.orderNumber,

        customerName: savedOrder.customerName || customerName.trim(),

        customerPhone: savedOrder.phone || customerPhone.trim(),

        orderType: savedOrder.orderType || orderType,

        instructions: savedOrder.specialInstructions || instructions.trim(),

        items: (savedOrder.items || []).map(item => ({

          id: item.menuItemId || item.id,

          name: item.name,

          quantity: item.quantity,

          price: item.price,

          image: menuImages[String(item.menuItemId || item.id)] || defaultMenuImage

        })),

        total: savedOrder.total,

        status: savedOrder.status || 'Pending',

        date: savedOrder.createdAt
          ? new Date(savedOrder.createdAt).toLocaleString()
          : new Date().toLocaleString()

      }

      setOrderConfirmation(confirmation)

      // CLEAR CART AND CUSTOMER FORM AFTER SUCCESS
      setCart([])

      setCustomerName('')

      setCustomerPhone('')

      setInstructions('')

      setOrderType('Takeaway')

      // DISPLAY CONFIRMATION PAGE
      setCurrentPage('confirmation')

    } catch (error) {

      console.error('Error placing order:', error)

      alert(error.message || 'Something went wrong while placing your order.')

    }

  }

  return (

    <div className="app">

      {/* NAVIGATION BAR */}

      <nav className="navbar">

        <a
          href="#home"
          className="logo"
          onClick={() => setCurrentPage('home')}
        >
          BREW HAVEN<span>.</span>
        </a>

        <div className="nav-links">

          <a
            href="#home"
            onClick={() => setCurrentPage('home')}
          >
            Home
          </a>

          <a
            href="#menu"
            onClick={() => setCurrentPage('menu')}
          >
            Our Menu
          </a>

          <a
            href="#about"
            onClick={() => setCurrentPage('about')}
          >
            About
          </a>

          <a
            href="#staff"
            onClick={() => setCurrentPage('staff')}
          >
            Staff
          </a>

        </div>

        <button
          className="cart-button"
          onClick={() => setCurrentPage('cart')}
        >
          My Cart ({cartCount})
        </button>

      </nav>

      {/* HOME PAGE */}

      {currentPage === 'home' && (

        <section className="hero" id="home">

          <div className="hero-content">

            <p className="eyebrow">
              WELCOME TO BREW HAVEN
            </p>

            <h1>
              Every cup tells<br />
              <span>a beautiful story.</span>
            </h1>

            <p className="hero-description">
              Discover your perfect coffee moment.
              Freshly brewed coffee, delicious pastries
              and unforgettable experiences.
            </p>

            <button
              className="primary-button"
              onClick={() => setCurrentPage('menu')}
            >
              Explore Our Menu →
            </button>

          </div>

          <div className="hero-image">

            <img
              src="https://images.unsplash.com/photo-1442512595331-e89e73853f31?w=1000"
              alt="Freshly brewed coffee"
            />

          </div>

        </section>

      )}

      {/* MENU PAGE */}

      {currentPage === 'menu' && (

        <section className="menu-section">

          <div className="section-heading">

            <p className="eyebrow">MADE WITH LOVE</p>

            <h2>Our Menu</h2>

            <p>Find something special for your day.</p>

          </div>

          {/* CATEGORY FILTERS */}

          <div className="categories">

            {categories.map(category => (

              <button
                key={category}
                className={
                  activeCategory === category
                    ? 'category active'
                    : 'category'
                }
                onClick={() => setActiveCategory(category)}
              >
                {category}
              </button>

            ))}

          </div>

          {/* PRODUCTS */}

          <div className="menu-grid">

            {filteredItems.map(item => (

              <div className="product-card" key={item.id}>

                <img
                  src={item.image || defaultMenuImage}
                  alt={item.name}
                  onError={event => {
                    event.currentTarget.onerror = null
                    event.currentTarget.src = defaultMenuImage
                  }}
                />

                <div className="product-info">

                  <span className="product-category">
                    {item.category}
                  </span>

                  <h3>{item.name}</h3>

                  <p>{item.description}</p>

                  <div className="product-bottom">

                    <strong>
                      M {item.price.toFixed(2)}
                    </strong>

                    <button onClick={() => addToCart(item)}>
                      + Add
                    </button>

                  </div>

                </div>

              </div>

            ))}

          </div>

          <div className="continue-shopping">

            <button
              className="primary-button"
              onClick={() => setCurrentPage('cart')}
            >
              View My Cart ({cartCount}) →
            </button>

          </div>

        </section>

      )}

      {/* SHOPPING CART PAGE */}

      {currentPage === 'cart' && (

        <section className="cart-section">

          <div className="section-heading">

            <p className="eyebrow">YOUR SELECTION</p>

            <h2>Shopping Cart</h2>

            <p>Review your selected items before checkout.</p>

          </div>

          {cart.length === 0 ? (

            <div className="empty-cart">

              <h3>Your cart is currently empty.</h3>

              <p>
                Discover our delicious coffee, tea and pastries.
              </p>

              <button
                className="primary-button"
                onClick={() => setCurrentPage('menu')}
              >
                Browse Our Menu →
              </button>

            </div>

          ) : (

            <div className="cart-content">

              {cart.map(item => (

                <div className="cart-item" key={item.id}>

                  <div className="cart-product">

                    <img
                      src={item.image || defaultMenuImage}
                      alt={item.name}
                      onError={event => {
                        event.currentTarget.onerror = null
                        event.currentTarget.src = defaultMenuImage
                      }}
                    />

                    <div>
                      <h3>{item.name}</h3>
                      <p>M {item.price.toFixed(2)} each</p>
                    </div>

                  </div>

                  <div className="quantity-controls">

                    <button
                      onClick={() => changeQuantity(item.id, -1)}
                    >
                      −
                    </button>

                    <span>{item.quantity}</span>

                    <button
                      onClick={() => changeQuantity(item.id, 1)}
                    >
                      +
                    </button>

                  </div>

                  <strong>
                    M {(item.price * item.quantity).toFixed(2)}
                  </strong>

                </div>

              ))}

              <div className="cart-summary">

                <h3>
                  Total: M {cartTotal.toFixed(2)}
                </h3>

                <button
                  className="primary-button"
                  onClick={openCheckout}
                >
                  Proceed to Checkout →
                </button>

              </div>

            </div>

          )}

          <button
            className="back-button"
            onClick={() => setCurrentPage('menu')}
          >
            ← Continue Shopping
          </button>

        </section>

      )}

      {/* CUSTOMER CHECKOUT PAGE */}

      {currentPage === 'checkout' && (

        <section className="cart-section">

          <div className="section-heading">

            <p className="eyebrow">ALMOST THERE</p>

            <h2>Customer Checkout</h2>

            <p>
              Please enter your details to complete your order.
            </p>

          </div>

          <div className="checkout-container">

            {/* CUSTOMER INFORMATION FORM */}

            <form
              className="checkout-form"
              onSubmit={placeOrder}
            >

              <h3>Customer Information</h3>

              <div className="form-group">

                <label htmlFor="customerName">
                  Full Name
                </label>

                <input
                  id="customerName"
                  type="text"
                  placeholder="Enter your full name"
                  value={customerName}
                  onChange={event =>
                    setCustomerName(event.target.value)
                  }
                  required
                  minLength={2}
                />

              </div>

              <div className="form-group">

                <label htmlFor="customerPhone">
                  Phone Number
                </label>

                <input
                  id="customerPhone"
                  type="tel"
                  placeholder="Enter your phone number"
                  value={customerPhone}
                  onChange={event =>
                    setCustomerPhone(event.target.value)
                  }
                  required
                  minLength={8}
                />

              </div>

              <div className="form-group">

                <label htmlFor="orderType">
                  Order Type
                </label>

                <select
                  id="orderType"
                  value={orderType}
                  onChange={event =>
                    setOrderType(event.target.value)
                  }
                >

                  <option value="Takeaway">
                    Takeaway
                  </option>

                  <option value="Dine-in">
                    Dine-in
                  </option>

                </select>

              </div>

              <div className="form-group">

                <label htmlFor="instructions">
                  Special Instructions (Optional)
                </label>

                <textarea
                  id="instructions"
                  placeholder="Any special requests?"
                  value={instructions}
                  onChange={event =>
                    setInstructions(event.target.value)
                  }
                  rows="4"
                />

              </div>

              <button
                type="submit"
                className="primary-button"
              >
                Place My Order →
              </button>

            </form>

            {/* ORDER SUMMARY */}

            <div className="checkout-summary">

              <h3>Order Summary</h3>

              {cart.map(item => (

                <div
                  className="checkout-item"
                  key={item.id}
                >

                  <span>
                    {item.name} × {item.quantity}
                  </span>

                  <strong>
                    M {(item.price * item.quantity).toFixed(2)}
                  </strong>

                </div>

              ))}

              <div className="checkout-total">

                <span>Total Amount</span>

                <strong>
                  M {cartTotal.toFixed(2)}
                </strong>

              </div>

            </div>

          </div>

          <button
            className="back-button"
            onClick={() => setCurrentPage('cart')}
          >
            ← Back to Shopping Cart
          </button>

        </section>

      )}

      {/* ORDER CONFIRMATION PAGE */}

      {currentPage === 'confirmation' && orderConfirmation && (

        <section className="confirmation-section">

          <div className="confirmation-card">

            <div className="success-icon">
              ✓
            </div>

            <p className="eyebrow">
              ORDER SUCCESSFULLY PLACED
            </p>

            <h2>
              Thank You, {orderConfirmation.customerName}!
            </h2>

            <p>
              Your order has been received by Brew Haven.
            </p>

            <div className="order-number">

              <span>Your Order Number</span>

              <strong>
                {orderConfirmation.orderNumber}
              </strong>

            </div>

            {/* ORDER DETAILS */}

            <div className="confirmation-details">

              <div>
                <span>Phone Number</span>
                <strong>{orderConfirmation.customerPhone}</strong>
              </div>

              <div>
                <span>Order Type</span>
                <strong>{orderConfirmation.orderType}</strong>
              </div>

              <div>
                <span>Order Status</span>
                <strong>{orderConfirmation.status}</strong>
              </div>

              <div>
                <span>Order Date</span>
                <strong>{orderConfirmation.date}</strong>
              </div>

            </div>

            <h3>Ordered Items</h3>

            {orderConfirmation.items.map(item => (

              <div
                className="confirmation-item"
                key={item.id}
              >

                <span>
                  {item.name} × {item.quantity}
                </span>

                <strong>
                  M {(item.price * item.quantity).toFixed(2)}
                </strong>

              </div>

            ))}

            <div className="confirmation-total">

              Total: M {Number(orderConfirmation.total).toFixed(2)}

            </div>

            {orderConfirmation.instructions && (

              <p className="order-instructions">
                Special Instructions: {orderConfirmation.instructions}
              </p>

            )}

            <p className="order-message">
              Thank you for choosing Brew Haven.
              Enjoy your coffee!
            </p>

            <button
              className="primary-button"
              onClick={() => setCurrentPage('home')}
            >
              Return to Home →
            </button>

          </div>

        </section>

      )}

      {/* STAFF DASHBOARD */}

      {currentPage === 'staff' && (

        <StaffDashboard />

      )}

      {/* ABOUT PAGE */}

      {currentPage === 'about' && (

        <section className="home-intro">

          <p className="eyebrow">OUR STORY</p>

          <h2>Welcome to Brew Haven.</h2>

          <p>
            Brew Haven is where quality coffee, delicious treats
            and beautiful moments come together.
          </p>

          <button
            className="primary-button"
            onClick={() => setCurrentPage('menu')}
          >
            Explore Our Menu →
          </button>

        </section>

      )}

      {/* FOOTER */}

      <footer>

        <h2>BREW HAVEN.</h2>

        <p>Good coffee. Good moments. Great memories.</p>

        <p>© 2026 Brew Haven. All rights reserved.</p>

      </footer>

    </div>

  )

}

export default App
