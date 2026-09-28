# 🧠 CEREBRO - CONTEXTO DEL NEGOCIO PERMANENTE

**Este documento es para Cerebro. Úsalo SIEMPRE que hagas auditorías o reviews.**

---

## 📍 EL NEGOCIO

**Villa Lisanna** - Rental de villa de lujo en Little Gasparilla Island, Florida

### Precios & Política
```
Tarifa noche: $500 USD
Limpieza/servicios: $300 USD (fijo)
Depósito de seguridad: $500 USD (reembolsable)
Impuestos: 12%
Depósito al reservar: 50% del total
Saldo: 30 días antes check-in

⚠️ CRÍTICO: Mínimo 3 NOCHES
   - Usuario intenta 2 noches → Error claro
   - Sistema debe rechazar
   - Email debe explicar por qué
```

### Capacidad
```
Máx 10 huéspedes
3+ baños
Mín edad: 25 años
Mascotas: NO permitidas
Fumar: NO permitido (multa $500)
```

### Amenidades Principales
```
✓ Jacuzzi calentado
✓ Starlink 100+ Mbps
✓ Golf cart privado 24/7
✓ Concierge 24/7
✓ Vista al océano
✗ NO hay piscina (solo jacuzzi)
```

---

## 👥 USUARIOS CRÍTICOS

### **User Type 1: El Turista**
- Accede desde **iPhone Safari** (crítico)
- Galería debe funcionar sin errores
- Booking debe ser simple (máx 3 clicks)
- Email confirmación DEBE llegar
- Pago Stripe debe ser claro

### **User Type 2: El Admin (Liset)**
- Necesita ver bookings, pagos, guests
- Cambiar precios/disponibilidad
- Enviar emails custom
- Manejar refunds

### **User Type 3: El Hacker (Nosotros)**
- Intenta romper sistema
- Busca rate limiting débil
- Intenta manipular precios
- Intenta duplicar bookings

---

## 💰 FLUJO DE DINERO CRÍTICO

```
1. Usuario ve sitio
   ↓
2. Elige fechas (mín 3 noches)
   ↓
3. Ve precio final (subtotal + cleaning + impuestos)
   ↓
4. Hace booking (depósito 50%)
   ↓
5. Stripe checkout (DEBE funcionar)
   ↓
6. Email confirmación (DEBE llegar)
   ↓
7. 30 días antes check-in: saldo (50% restante)
   ↓
8. Check-in (4 PM) → Check-out (10 AM)
   ↓
9. Liset verifica daños
   ↓
10. Refund depósito si OK

⚠️ BUGS CRÍTICOS:
- Si Step 3 calcula mal → $ perdido
- Si Step 5 falla → Booking sin pago
- Si Step 6 no llega → User confundido
- Si Step 7 no se cobra → $ perdido
```

---

## 🔐 SEGURIDAD CRÍTICA

```
Nivel 1: CSRF Protection (todos los POSTs)
         - Stripe webhook EXCEPCIÓN
         - Otros endpoints requieren token

Nivel 2: Rate Limiting
         - POST /api/bookings: 5/hora
         - GET /api/bookings/<code>/status: 10/minuto
         - Previene fuerza bruta en confirmation codes

Nivel 3: Email Validation
         - Usa email-validator (no regex débil)
         - Rechaza emails inválidos

Nivel 4: Montos Validados en Backend
         - Cliente NO puede manipular precios
         - Backend SIEMPRE recalcula

Nivel 5: HTTPS + Cookies Seguras
         - Production: FORZAR HTTPS
         - Cookies: SECURE, HTTPONLY, SAMESITE

⚠️ AMENAZA ACTUAL:
- Alguien intenta 6+ bookings/hora → bloqueado
- Alguien intenta 100+ status checks → bloqueado
- Alguien intenta inyectar HTML en email → escapado
```

---

## 📱 COMPATIBLE CON IPHONE

```
Browser: Safari (iOS 15+)
Screen: 390px ancho (pequeño)

QUÉ DEBE FUNCIONAR:
✓ Galería expandible (sin modal)
✓ Calendario (flatpickr)
✓ Stripe checkout (redirecta a Safari)
✓ Email confirmación (abierto en Mail app)

QUÉ NO DEBE PASAR:
✗ Modal con select nativo (intercepta clicks)
✗ JavaScript bloqueante (freezes)
✗ Mixed content HTTP (HTTPS bloqueado)
✗ Fonts que no cargan (layout quebrado)
```

---

## 📧 EMAIL CRÍTICO

### Confirmación de Booking
```
TO: guest_email (VALIDADO)
SUBJECT: Solicitud de Reserva #{confirmation_code}
BODY:
- Código de confirmación (12 chars)
- Fechas exactas
- Total con desglose (noche, limpieza, impuestos)
- Depósito requerido
- Link a Stripe checkout

⚠️ BUGS:
- Si HTML tiene inyección → XSS
- Si no llega → User piensa que no se reservó
- Si tiene datos malformados → User confundido
```

### Confirmación de Pago
```
TO: guest_email
SUBJECT: Pago Recibido - Reserva {code}
BODY:
- Pago procesado
- Saldo pendiente (30 días antes)
- Info check-in (4 PM, golf cart, WiFi)
```

---

## 🐛 BUGS COMUNES QUE DEBO BUSCAR

```
NEGOCIO:
❌ Mínimo 3 noches no se valida → Usuario reserva 1 noche
❌ Precio calcula mal → Stripe cobra diferente
❌ Email no llega → User nunca confirma
❌ Confirmation code reutilizable → Seguridad

TÉCNICO:
❌ Stripe webhook falla → Pago no se registra
❌ CSRF en webhook → Webhook bloqueado
❌ Rate limiting muy débil → DDoS posible
❌ Email injection → Hacker envía spam

USABILIDAD:
❌ Galería no abre en Safari → User no ve fotos
❌ Dropdown de huéspedes abierto → Intercepta clicks
❌ Calendario bloqueante → Freezes app
❌ Número teléfono/email mal → User no puede contactar
```

---

## 📊 MODOS DE OPERACIÓN

### Development
```
STRIPE: TEST mode (no cobra)
EMAIL: Log a console (no envía)
HTTPS: NO forzado
CSRF: Puede desactivarse
DEBUG: Verbose logging

BRAIN: Testea todo, encuentra bugs funcionales
```

### Production
```
STRIPE: LIVE mode (COBRA)
EMAIL: ENVÍA a gmail/outlook
HTTPS: FORZADO (301 redirect)
CSRF: ACTIVO siempre
DEBUG: Minimal, solo errores

BRAIN: Audita seguridad, previene dinero perdido
```

---

## 🎯 PRIORIDAD DE BUGS

```
🔴 CRÍTICO (Dinero/Seguridad):
   - Stripe webhook falla
   - Precio calcula mal
   - Email injection
   - CSRF bypass
   - Rate limiting débil
   → FIX INMEDIATO

🟠 ALTO (Negocio roto):
   - Galería no abre
   - Booking no se crea
   - Email no llega
   - Mínimo 3 noches no valida
   → FIX HORAS

🟡 MEDIO (Experiencia):
   - Layout quebrado en iPhone
   - Mensaje de error confuso
   - Datos no escapados
   → FIX DÍAS

🟢 BAJO (Polish):
   - Estilos CSS
   - Animaciones
   - Loading states
   → FIX CUANDO HAYA TIEMPO
```

---

## 🚀 INSTRUCCIONES PARA CEREBRO

**CADA VEZ que audites código:**

1. **LEE** el código completo
2. **EJECUTA** los tests (`pytest`)
3. **CORRE** la app (`python run.py`)
4. **PRUEBA** los endpoints (curl, requests)
5. **PIENSA** en el negocio (¿Qué podría fallar?)
6. **REPORTA** con ejemplos concretos

**SIEMPRE pregunta:**
- ¿Qué pasa si usuario intenta [acción]?
- ¿Cuánto dinero se pierde si [bug]?
- ¿Puede el hacker [ataque]?
- ¿En iPhone Safari funciona [feature]?

---

## 📋 CHECKLIST DE AUDITORÍA PRE-DEPLOY

```
DINERO:
☐ Stripe mock funciona en tests
☐ Precios recalculados en backend
☐ Mínimo 3 noches validado
☐ Confirmation code único

SEGURIDAD:
☐ CSRF en webhooks exempt
☐ Rate limiting en bookings
☐ Email validation con librería
☐ HTML escapado en emails
☐ HTTPS forzado en prod

EXPERIENCIA:
☐ iPhone Safari funciona
☐ Galería no abre/cierra
☐ Email llega en < 10 segundos
☐ Teléfono/email correctos

OPERACIONES:
☐ Logs de transacciones
☐ Alertas si webhook falla
☐ Backup de base de datos
```

---

**GUARDADO: Use este documento SIEMPRE que trabaje con Cerebro. No es solo técnica - es NEGOCIO.**
