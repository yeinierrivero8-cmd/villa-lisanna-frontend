# Configuración Stripe — Para Pagos de Reservas

## 📌 Resumen
Stripe es la plataforma que recibe los pagos de tus clientes. Los depósitos y saldos de reservas se cobran aquí, y el dinero va **directamente a tu cuenta bancaria**.

---

## 🔧 PASO 1: Crear tu Cuenta Stripe

**1. Ve a:** https://stripe.com/

**2. Haz clic en "Registrarse"** (arriba a la derecha)

**3. Completa con:**
   - Tu email (el de Liset)
   - Contraseña fuerte
   - País: **Estados Unidos** (o donde esté tu banco)
   - Acepta términos

**4. Verifica tu email** — busca el email de confirmación de Stripe

---

## ✅ PASO 2: Completa tu Perfil

Stripe te pedirá:

1. **Nombre Completo:** Liset [tu apellido]
2. **Fecha de Nacimiento:** [tu fecha]
3. **Teléfono:** [tu número]
4. **Dirección:** [tu dirección completa]
5. **Aceptar términos de servicio**

---

## 💳 PASO 3: Vincula tu Banco

Stripe necesita tu información bancaria para enviar los pagos:

1. En el Dashboard, ve a **"Información Bancaria"** o **"Bank Account"**
2. Selecciona tu país
3. Ingresa:
   - Nombre del banco
   - Número de cuenta
   - Routing number (si es USA)
4. Verifica (Stripe hará 2 depósitos pequeños en 1-2 días para confirmar)

---

## 🔑 PASO 4: Obtén tus Claves API

Estas son las que vamos a usar en el sistema:

1. En el Dashboard, ve a **"Developers"** (esquina izquierda abajo)
2. Luego **"API Keys"**
3. Asegúrate de estar en **"Live"** mode (no Test)
4. Verás dos claves:
   - **Publishable Key** (comienza con `pk_live_`)
   - **Secret Key** (comienza con `sk_live_`)

**⚠️ IMPORTANTE:** 
- Anota la **Secret Key** en un lugar seguro
- NUNCA la compartas públicamente
- Nosotros la usaremos en el servidor

---

## 🔔 PASO 5: Configura el Webhook

El webhook es cómo Stripe nos avisa cuando se cobró un pago:

1. En **Developers** → **Webhooks**
2. Haz clic en **"Add an endpoint"**
3. En "URL to send events to" ingresa:
   ```
   https://villalisanna.com/api/stripe/webhook
   ```
   (O cuando esté en producción: `https://188.245.80.35/api/stripe/webhook`)

4. En "Select events to send", marca:
   - `checkout.session.completed`
   - `payment_intent.payment_failed`

5. Copia el **Webhook Secret** (comienza con `whsec_`)

---

## 📝 Resumen de Datos a Compartir

Una vez completado todo, **avísame con estos datos:**

```
Email de Stripe: [tu email]
Publishable Key: pk_live_...
Secret Key: sk_live_...
Webhook Secret: whsec_...
```

Con eso, activo todo en producción.

---

## 🔒 Seguridad

- La **Secret Key** NUNCA debe exponerse en el navegador
- Solo existe en el servidor (`.env`)
- El dinero va directamente a tu banco, Stripe es intermediario
- Los clientes paguen con Stripe (seguro, sin guardar tarjetas nuestras)

---

## 🆘 Problemas?

- **Stripe rechaza tu banco:** Algunos bancos no son compatibles. Prueba otro.
- **Tarda en verificar:** Normalmente 1-2 días. Es seguridad de Stripe.
- **Necesitas ayuda:** Contacta a Stripe support: support@stripe.com

---

**Cuando termines todos los pasos, avísame y activamos los pagos en vivo.** 🚀
