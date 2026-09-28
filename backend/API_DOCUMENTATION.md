# Villa Lisanna API Documentation

## CSRF Token Protection

All POST, PUT, DELETE, and PATCH requests to the API require CSRF token protection.

### How to get a CSRF token

```bash
GET /api/csrf-token
```

**Response:**
```json
{
  "csrf_token": "eyJjc3JmX3Rva2VuIjoi..."
}
```

### How to send requests with CSRF token

**Option 1: Include in Header** (Recommended)
```javascript
const token = response.csrf_token;

fetch('/api/bookings', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-CSRFToken': token  // ← Add this header
  },
  body: JSON.stringify({
    guest_name: "John Doe",
    guest_email: "john@example.com",
    // ... other fields
  })
});
```

**Option 2: Include in POST body**
```javascript
fetch('/api/bookings', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    csrf_token: token,  // ← Add this field
    guest_name: "John Doe",
    // ... other fields
  })
});
```

## API Endpoints

### Availability
**GET** `/api/availability`

Get list of unavailable dates

**Response:**
```json
{
  "success": true,
  "unavailable_dates": ["2026-10-01", "2026-10-02"]
}
```

---

### Quote
**POST** `/api/quote`

Calculate booking quote

**Request:**
```json
{
  "check_in": "2026-10-10",
  "check_out": "2026-10-15",
  "guest_count": 2
}
```

**Response:**
```json
{
  "success": true,
  "nights": 5,
  "subtotal": 2500.00,
  "cleaning_fee": 300.00,
  "taxes": 336.00,
  "damage_deposit": 500.00,
  "deposit_amount": 1418.00,
  "balance_amount": 1418.00,
  "total_amount": 2836.00
}
```

---

### Create Booking
**POST** `/api/bookings`

Create a new booking request

**Request:**
```json
{
  "csrf_token": "...",
  "guest_name": "John Doe",
  "guest_email": "john@example.com",
  "guest_phone": "+1234567890",
  "guest_count": 2,
  "check_in": "2026-10-10",
  "check_out": "2026-10-15",
  "age_confirmed": true
}
```

**Response:**
```json
{
  "success": true,
  "booking": {
    "id": 1,
    "confirmation_code": "ABC123XYZ456",
    "status": "pending"
  },
  "checkout_url": "https://checkout.stripe.com/..."
}
```

**Rate Limit:** 5 requests per hour per IP

---

### Get Booking Status
**GET** `/api/bookings/<confirmation_code>/status`

Check booking status and payment details

**Response:**
```json
{
  "success": true,
  "booking": {
    "id": 1,
    "confirmation_code": "ABC123XYZ456",
    "status": "confirmed",
    "guest_name": "John Doe",
    "check_in_date": "2026-10-10",
    "check_out_date": "2026-10-15",
    "deposit_paid": true,
    "balance_amount": 1418.00
  }
}
```

**Rate Limit:** 10 requests per minute per IP

---

## Security Notes

- **CSRF Protection:** All state-changing requests require CSRF tokens
- **HTTPS:** Always use HTTPS in production
- **Rate Limiting:** Booking creation is limited to 5 per hour per IP
- **Email Validation:** Emails are validated before processing
- **Input Validation:** All input is validated on the server side
- **Stripe Test Mode:** Currently running in Stripe test mode (no real charges)

---

## Error Responses

**400 Bad Request**
```json
{
  "success": false,
  "error": "Description of what went wrong"
}
```

**429 Too Many Requests** (Rate limit exceeded)
```json
{
  "success": false,
  "error": "Rate limit exceeded"
}
```

**500 Internal Server Error**
```json
{
  "success": false,
  "error": "Server error"
}
```

---

## Environment Variables

Required in `.env` file:

```
FLASK_ENV=production
SECRET_KEY=<generate-random-secret>
BASE_URL=https://villalisanna.com

STRIPE_PUBLIC_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

SMTP_SERVER=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your@email.com
SMTP_PASSWORD=your-password
SMTP_FROM_EMAIL=reservations@villalisanna.com

VILLA_OWNER_EMAIL=liset@villalisanna.com
NIGHTLY_RATE=500
CLEANING_FEE=300
MIN_NIGHTS=3
MAX_NIGHTS=28
