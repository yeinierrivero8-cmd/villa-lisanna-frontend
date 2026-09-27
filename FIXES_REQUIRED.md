# Fixes Requeridos - Villa Lisanna QR System

## Status: CRÍTICO
Sistema QR está 95% listo pero hay 1 BUG CRÍTICO + 1 BLOQUEO que debe resolverse

---

## FIX #1: BUG CRÍTICO - URL Incorrecta en QR ⚠️ URGENTE

### Problema
En `email_service.py` línea 104, se genera un QR con la URL INCORRECTA.

**Archivo:** `backend/app/services/email_service.py`  
**Función:** `send_admin_notification()`  
**Línea:** 104-105

### Código Actual (MALO)
```python
payment_qr_url = f"{current_app.config.get('BASE_URL', 'https://www.villalisanna.com')}/api/bookings/{booking.confirmation_code}/payment-qr"
qr_result = StripeService.generate_payment_qr(booking.confirmation_code, payment_qr_url)
```

### Problema
- El QR contiene URL a `/api/bookings/{code}/payment-qr`
- Este endpoint retorna un JSON con el QR en base64
- **Cuando se escanea el QR, el celular abre un navegador a este JSON - NO a Stripe checkout**
- Admin Liset no puede cobrar el saldo

### Código Correcto (BUENO)
```python
payment_qr_url = f"{current_app.config.get('BASE_URL', 'https://www.villalisanna.com')}/api/bookings/{booking.confirmation_code}/balance-checkout"
qr_result = StripeService.generate_payment_qr(booking.confirmation_code, payment_qr_url)
```

### Por qué funciona
- `/api/bookings/{code}/balance-checkout` **redirige a Stripe checkout**
- Cuando se escanea el QR, va directo a Stripe
- Cliente paga → Stripe redirige a `/api/balance-success`
- Sistema marca pago completo

### Cómo Corregir
1. Abre: `backend/app/services/email_service.py`
2. Reemplaza línea 104:
   ```python
   # DE:
   payment_qr_url = f"{current_app.config.get('BASE_URL', 'https://www.villalisanna.com')}/api/bookings/{booking.confirmation_code}/payment-qr"
   
   # A:
   payment_qr_url = f"{current_app.config.get('BASE_URL', 'https://www.villalisanna.com')}/api/bookings/{booking.confirmation_code}/balance-checkout"
   ```

3. Guarda el archivo
4. Deploy a VPS: `git push`

**Tiempo:** 2 minutos

---

## FIX #2: BLOQUEO - SMTP Timeout ⚠️ CRÍTICO

### Problema
Todos los emails fallan con `TimeoutError: timed out` en puerto 465

**Servidor:** mail.privateemail.com  
**Puerto:** 465 (SMTP_SSL)  
**Estado:** No conecta (timeout)

### Causa Raíz
Hetzner VPS probablemente bloquea puerto 465 (anti-spam). Es una restricción común.

### Solución Recomendada (Opción 1 - Intentar primero)

**Cambiar a puerto 587 + STARTTLS**

Namecheap soporta puerto 587. El código ya maneja STARTTLS correctamente.

**Archivo:** `.env`

**Cambio:**
```bash
# DE:
SMTP_PORT=465

# A:
SMTP_PORT=587
```

**Pasos:**
1. SSH al VPS: `ssh -i ~/.ssh/hetzner_key root@188.245.80.35`
2. Edita `.env`: `nano /var/www/villalisanna/.env`
3. Cambia `SMTP_PORT=465` a `SMTP_PORT=587`
4. Guarda (Ctrl+X, Y, Enter)
5. Reinicia app: `pm2 restart villa-lisanna`
6. Test emails: Crea booking de prueba
7. Verifica logs: `tail -f ~/.pm2/logs/villa-lisanna-out.log`

**Resultado esperado:**
```
[DEBUG] Usando SMTP + STARTTLS (puerto 587)
[DEBUG] Conexión SMTP establecida
[DEBUG] STARTTLS completado
[DEBUG] Login exitoso
[SUCCESS] Email enviado
```

**Probabilidad de éxito:** 70% (Namecheap casi siempre funciona en 587)

---

### Solución Fallback (Opción 2 - Si puerto 587 no funciona)

**Usar SendGrid SMTP (muy confiable)**

SendGrid es especializado en email transaccional. Nunca bloquea puertos.

**Ventajas:**
- ✅ Confiable (99.9% uptime)
- ✅ Free tier: 100 emails/día (suficiente)
- ✅ Fácil de implementar
- ✅ Mejor deliverability

**Pasos:**

1. **Crear cuenta SendGrid:**
   - Ir a: https://sendgrid.com/free
   - Registrarse con email
   - Confirmar email
   - Crear API key en: Settings → API Keys → Create API Key

2. **Copiar API Key** (formato: `SG.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`)

3. **Actualizar `.env` en VPS:**
   ```bash
   SMTP_SERVER=smtp.sendgrid.net
   SMTP_PORT=587
   SMTP_USER=apikey
   SMTP_PASSWORD=SG.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
   SMTP_FROM_EMAIL=noreply@villalisanna.com
   ```

4. **Reiniciar app:**
   ```bash
   pm2 restart villa-lisanna
   ```

5. **Test:**
   - Crear booking de prueba
   - Verificar email en inbox

**Costo:** Gratis (free tier) o $14.95/mes (si necesitas más de 100/día)

**Tiempo de implementación:** 10 minutos

---

### Solución Fallback (Opción 3 - Gmail)

Si quieres usar Gmail (opción más familiar):

**Pasos:**

1. **Crear Google App Password:**
   - Ir a: https://myaccount.google.com/security
   - Search: "App passwords"
   - Seleccionar "Mail" y "Windows Computer"
   - Copiar contraseña (será de 16 caracteres)

2. **Actualizar `.env`:**
   ```bash
   SMTP_SERVER=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USER=tu-email@gmail.com
   SMTP_PASSWORD=xxxx xxxx xxxx xxxx
   SMTP_FROM_EMAIL=tu-email@gmail.com
   ```

3. **Reiniciar y testear**

**Desventaja:** Gmail tiene límite de 100 emails/día

---

## TEST PLAN

Después de implementar FIX #1 + FIX #2, testear el flujo completo:

### Paso 1: Crear booking de prueba
```bash
curl -X POST https://www.villalisanna.com/api/bookings \
  -H "Content-Type: application/json" \
  -d '{
    "guest_name": "Test User",
    "guest_email": "test@gmail.com",
    "guest_phone": "1234567890",
    "guest_count": 2,
    "check_in_date": "2026-10-01",
    "check_out_date": "2026-10-03"
  }'
```

Respuesta esperada:
```json
{
  "success": true,
  "booking": {
    "confirmation_code": "ABC123XYZ789"
  }
}
```

### Paso 2: Verificar emails
- ✅ Email a guest (confirmación)
- ✅ Email a admin (con QR)

Buscar en inbox:
- Email asunto: "Solicitud de Reserva #ABC123XYZ789"
- Email asunto: "Nueva Solicitud de Reserva: ABC123XYZ789"

### Paso 3: Testear QR
```bash
curl https://www.villalisanna.com/api/bookings/ABC123XYZ789/payment-qr
```

Respuesta esperada:
```json
{
  "success": true,
  "qr_data_uri": "data:image/png;base64,iVBORw...",
  "payment_url": "https://www.villalisanna.com/api/bookings/ABC123XYZ789/balance-checkout"
}
```

### Paso 4: Escanear QR
- Generar QR desde `qr_data_uri` (mostrar en navegador)
- Usar teléfono para escanear QR
- Debería ir a: `https://www.villalisanna.com/api/bookings/ABC123XYZ789/balance-checkout`
- Redirige automáticamente a Stripe checkout

### Paso 5: Completar pago
- Usar Stripe test card: `4242 4242 4242 4242`
- Completar pago
- Debería mostrar: "✅ ¡Pago Completado!"
- Verificar en DB que `balance_paid = True`

---

## CHECKLIST PRE-DEPLOYMENT

- [ ] Corregir FIX #1 (URL en email_service.py)
- [ ] Probar FIX #1 localmente
- [ ] Intentar FIX #2 Opción 1 (puerto 587)
- [ ] Si no funciona, implementar FIX #2 Opción 2 (SendGrid)
- [ ] Testear flujo completo (5 pasos arriba)
- [ ] Verificar logs en VPS (no errors)
- [ ] Deploy a producción

---

## URGENCIA Y TIMELINE

| Fix | Urgencia | Tiempo | Impacto |
|-----|----------|--------|--------|
| #1 | CRÍTICA | 2 min | Sistema QR no funciona sin esto |
| #2 | CRÍTICA | 5-10 min | Admin no recibe notificaciones |

**Recomendación:** Hacer ambos fixes HOY antes de cualquier test de producción.

**Tiempo total:** ~15 minutos

---

## PREGUNTAS?

- ¿Namecheap cuenta tiene permisos? Verificar en: https://www.namecheap.com → Private Email
- ¿Puedo usar cuenta de email diferente? Sí, cambiar `SMTP_USER` en `.env`
- ¿Qué puerto Namecheap soporta? Ambos 465 y 587 (intenta 587 primero)

---

**Status:** Listo para implementación
**Próximo paso:** Aplicar FIX #1, luego intentar FIX #2 Opción 1
