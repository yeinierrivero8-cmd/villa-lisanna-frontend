# Fixes: Blocked Dates Display & iPhone Stripe Redirection

Commit: `6815d46` - Fix: Blocked dates not displaying in red calendar & iPhone Stripe redirection

---

## PROBLEMA 1: Fechas Bloqueadas No Se Muestran Rojas

### Síntoma
Las fechas Oct 3-6, 9-11, 16-19 están bloqueadas en la BD, pero en el calendario aparecen disponibles (no están en rojo/deshabilitadas).

### Causa Raíz
**Flatpickr no puede parsear los strings ISO en el array `disable` porque el formato no coincide.**

**Detalles técnicos:**
1. Backend retorna fechas bloqueadas como strings ISO: `['2026-10-03', '2026-10-04', ...]`
2. Flatpickr está configurado con `dateFormat: 'd M Y'` (formato de visualización, ej: "3 Oct 2026")
3. Cuando Flatpickr intenta parsear los strings del array `disable`, espera que estén en el formato configurado
4. Como los strings están en ISO (YYYY-MM-DD), Flatpickr no puede interpretarlos correctamente
5. Resultado: Las fechas no son parseadas, así que no son deshabilitadas en el calendario

### Solución Implementada
**Convertir los strings ISO a objetos Date en JavaScript antes de pasarlos a Flatpickr.**

**Archivo modificado:** `js/app.js` líneas 57-67

**Código anterior:**
```javascript
async function loadAvailability() {
  try {
    const response = await fetch(API_BASE_URL + '/api/availability');
    if (response.ok) {
      const data = await response.json();
      occupiedDates = data.unavailable_dates || [];  // Array de strings ISO
      initializeCalendar();
```

**Código nuevo:**
```javascript
async function loadAvailability() {
  try {
    const response = await fetch(API_BASE_URL + '/api/availability');
    if (response.ok) {
      const data = await response.json();
      // Convert ISO date strings to Date objects for Flatpickr to parse correctly
      occupiedDates = (data.unavailable_dates || []).map(dateStr => {
        return new Date(dateStr + 'T00:00:00Z');
      });
      console.log('[CALENDAR] Loaded unavailable dates:', occupiedDates.length, 'dates');
      initializeCalendar();
```

**Por qué funciona:**
- Convertir a `new Date()` crea objetos Date que Flatpickr reconoce nativamente
- El `'T00:00:00Z'` añadido asegura que la fecha se interpreta correctamente en UTC
- Flatpickr no intenta parsear objetos Date, simplemente los usa directamente
- Las fechas aparecen rojas/deshabilitadas en el calendario

**Verificación:**
Para verificar que las fechas están siendo cargadas correctamente:
1. Abre el navegador DevTools (F12)
2. Ve a la consola
3. Deberías ver: `[CALENDAR] Loaded unavailable dates: 12 dates` (u otro número según fechas bloqueadas)
4. En el calendario, las fechas Oct 3-6, 9-11, 16-19 deberían estar rojas/deshabilitadas

---

## PROBLEMA 2: iPhone No Redirige a Stripe

### Síntoma
- En Android: La reserva se envía correctamente y redirige a Stripe
- En iPhone: El modal se queda bloqueado, no ocurre redirección a Stripe

### Causa Raíz
**`setTimeout()` crea un contexto asincrónico que Safari bloquea por restricciones de seguridad.**

**Detalles técnicos:**
1. El código original usaba: `setTimeout(() => { window.location.replace(data.checkout_url); }, 100);`
2. En iOS/Safari, hay restricciones sobre navegación desde callbacks asincronicos
3. Los `setTimeout` crean un contexto que Safari considera "inseguro" para cambiar `window.location`
4. Android Chrome (y otros navegadores) no tienen esta restricción tan estricta
5. Resultado: En iPhone, la navegación nunca ocurre, el usuario se queda en el modal sin feedback

### Solución Implementada
**Remover el `setTimeout` y hacer la navegación directamente + añadir try/catch con fallback.**

**Archivo modificado:** `js/app.js` líneas 798-807

**Código anterior:**
```javascript
console.log('[BOOKING] Redirecting to:', data.checkout_url);
// Use replace instead of href for better iOS compatibility
// Use a small delay for iOS but with replace() method
setTimeout(() => {
  window.location.replace(data.checkout_url);
}, 100);
```

**Código nuevo:**
```javascript
console.log('[BOOKING] Redirecting to:', data.checkout_url);

// iOS/Safari fix: Do NOT use setTimeout for navigation
// setTimeout creates an async context that Safari blocks for security
// Use window.location.replace directly instead
// Fallback to href if replace fails
try {
  window.location.replace(data.checkout_url);
} catch (navError) {
  console.warn('[BOOKING] location.replace failed, trying href:', navError.message);
  window.location.href = data.checkout_url;
}
```

**Por qué funciona:**
- Remover `setTimeout` mantiene la navegación en el contexto de la interacción del usuario
- Safari permite navigación directa en este contexto
- El `try/catch` proporciona robustez:
  - Si `replace()` falla por cualquier razón, intenta `href`
  - Ambos métodos logran la navegación, pero con diferentes comportamientos del historial
- `location.replace()` no añade a historial (mejor UX para pagos)
- `location.href` añade a historial (fallback si replace falla)

**Verificación:**
Para verificar que funciona en iPhone:
1. Abre DevTools en Chrome para simular iPhone (F12 → Toggle device toolbar → iPhone)
2. Completa un booking
3. Deberías ver en la consola: `[BOOKING] Redirecting to: https://checkout.stripe.com/...`
4. La página debe redirigir a Stripe automáticamente
5. Si hay error, verás: `[BOOKING] location.replace failed, trying href: ...`

---

## Backend Verification

El endpoint `/api/availability` está funcionando correctamente:

**Archivo:** `backend/app/routes/public_api.py` líneas 29-50

```python
@api.route('/availability', methods=['GET'])
def get_availability():
    try:
        blocked_dates = BlockedDate.query.all()
        blocked_list = [bd.date.isoformat() for bd in blocked_dates]
        
        booked_dates = set()
        bookings = Booking.query.filter(Booking.status.in_(['approved', 'confirmed', 'completed'])).all()
        for booking in bookings:
            current = booking.check_in_date
            while current < booking.check_out_date:
                booked_dates.add(current.isoformat())
                current += timedelta(days=1)
        
        unavailable_dates = list(set(blocked_list) | booked_dates)
        
        return jsonify({
            'success': True,
            'unavailable_dates': sorted(unavailable_dates)
        })
```

**Fechas bloqueadas en BD:** `backend/block_dates.py`
- Oct 3-6 (4 días)
- Oct 9-11 (3 días)
- Oct 16-19 (4 días)
- Total: 11 fechas bloqueadas

---

## Testing & Deployment

### Para probar localmente:

1. **Fechas bloqueadas:**
   ```bash
   # En DevTools console
   fetch('/api/availability').then(r => r.json()).then(d => console.log(d.unavailable_dates.filter(x => x.includes('2026-10'))))
   ```
   Deberías ver: 11 fechas en octubre bloqueadas

2. **iPhone redirection:**
   - Simula iPhone en DevTools
   - Completa un booking
   - Verifica que redirige a Stripe (no queda stuck en modal)

### Para deploy:
- Los cambios están en `js/app.js`
- No hay cambios en backend
- Simple: push a `main` → Netlify auto-deploya

---

## Summary

| Problema | Causa | Solución | Archivo | Líneas |
|----------|-------|----------|---------|--------|
| Fechas bloqueadas no rojas | Flatpickr no parsea strings ISO en formato diferente | Convertir ISO strings a Date objects | `js/app.js` | 57-67 |
| iPhone no redirige a Stripe | `setTimeout` crea contexto que Safari bloquea | Remover `setTimeout`, usar `replace()` directo + fallback | `js/app.js` | 798-807 |

Ambos problemas están **RESUELTOS** en el commit `6815d46`.
