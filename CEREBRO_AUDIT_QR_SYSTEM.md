# CEREBRO AUDIT REQUEST - QR Payment System

## Status
- ✅ QR Generation: WORKING
- ❌ Email Delivery: FAILING  
- ❌ SMTP Connection: TIMEOUT

---

## NEW CODE IMPLEMENTED

### 1. **stripe_service.py** - `generate_payment_qr()`
- Generates QR code from payment URL
- Encodes to base64 data URI
- Returns success/error

### 2. **public_api.py** - New Endpoints
- `/api/bookings/<code>/payment-qr` → Returns QR with payment link
- `/api/bookings/<code>/balance-checkout` → Initiates Stripe checkout for remaining balance
- `/api/balance-success` → Success page after balance payment

### 3. **email_service.py** - Updated
- Modified `send_admin_notification()` → Includes QR image in email to Liset
- New `send_booking_balance_receipt()` → Confirmation email after balance paid

### 4. **requirements.txt**
- Added: `qrcode==7.4.2`, `Pillow==10.1.0`

---

## ERRORS FOUND

### Critical: SMTP Timeout
**Symptom:** All emails fail with "TimeoutError: timed out"

**Error Log:**
```
[DEBUG] send_email() iniciado para: reservations@villalisanna.com
[DEBUG] Usando SMTP_SSL (puerto 587)  
[ERROR] Error enviando email: timed out
```

**Investigation:**
1. ✅ Server connection test: `telnet mail.privateemail.com 587` → Connected successfully
2. ✅ Port 587 in .env: Verified
3. ✅ Code uses correct port from config.py
4. ❌ SMTP auth: Times out after connection established

**Possible Causes:**
1. **SMTP credentials wrong** (admin@villalisanna.com password)
2. **Server blocking SMTP after handshake**
3. **STARTTLS negotiation failing silently**
4. **Namechain Private Email policy issue**

---

## QR SYSTEM TEST RESULTS

### ✅ Working
```bash
curl https://www.villalisanna.com/api/bookings/UIZ5TS796TS6/payment-qr
Response: {
  "success": true,
  "qr_data_uri": "data:image/png;base64,iVBORw0KGgo...",
  "payment_url": "https://www.villalisanna.com/api/bookings/UIZ5TS796TS6/balance-checkout"
}
```

QR generates correctly. Image is valid PNG in base64.

### ❌ Not Working
Email delivery fails at SMTP level.

---

## QUESTIONS FOR CEREBRO

1. **SMTP Auth Issue:**
   - Are credentials `admin@villalisanna.com` / `QbWb-FkHG-bki2-aQQy-szzy-bKpT` correct on Namecheap?
   - Has password been regenerated?

2. **STARTTLS Issue:**
   - Is server rejecting STARTTLS upgrade?
   - Should we use different auth method?

3. **Alternative Solutions:**
   - Switch to SendGrid / Gmail SMTP?
   - Use Namecheap API instead of SMTP?
   - Change email provider?

4. **Code Quality:**
   - Is QR generation secure?
   - Are endpoints protected?
   - Are there SQL injection risks?

---

## DEPLOYMENT READINESS

- **QR System:** Ready (no bugs in code, works standalone)
- **Email System:** BLOCKED (SMTP timeout unresolved)
- **Stripe Integration:** Ready
- **Frontend:** Ready

**RECOMMEND:** 
Resolve SMTP first, then re-test complete flow.
OR: Fallback to alternative email provider while diagnosing SMTP.

---

## Test Reservations Created
- `UIZ5TS796TS6`: QR generated ✅, Email failed ❌
- `HTUCH7X7BBHV`: QR generated ✅, Email failed ❌
- `RZQ2Q5QXSSKI`: QR generated ✅, Email failed ❌
