# 🔄 PROTOCOLO: CEREBRO AUDITA ANTES, NO DESPUÉS

**De ahora en adelante, SIEMPRE seguimos este flujo.**

---

## 📋 FLUJO NUEVO (MEJOR)

```
ANTES (MAL):
YO hago cambios → CEREBRO audita → A veces fallo
                 (demasiado tarde)

AHORA (MEJOR):
YO propongo cambios → CEREBRO audita ANTES
                      ↓
                      CEREBRO reporta riesgos
                      ↓
                      YO hago cambios (seguro)
                      ↓
                      CEREBRO testea cambios (verify)
```

---

## 🎯 FASE 1: AUDITORÍA PRE-CAMBIO

**Cuando YO propongo algo, digo a Cerebro:**

```
FORMATO:

📝 CAMBIO PROPUESTO:
[Descripción del cambio]

📂 ARCHIVOS AFECTADOS:
- archivo1.py (líneas X-Y)
- archivo2.js (líneas A-B)

⚠️ RIESGO PERCIBIDO:
[Lo que yo pienso que podría fallar]

❓ PREGUNTAS PARA CEREBRO:
- ¿Qué más podría romperse?
- ¿iPhone Safari funcionará?
- ¿Dinero está seguro?
- ¿Rate limiting aguanta?

🏢 CONTEXTO NEGOCIO:
Leer CEREBRO_CONTEXT.md (ya está cargado)
```

**EJEMPLO:**

```
📝 CAMBIO PROPUESTO:
Agregar email validation con librería email-validator

📂 ARCHIVOS AFECTADOS:
- backend/app/routes/public_api.py (línea 100-110)
- backend/requirements.txt (agregar email-validator)

⚠️ RIESGO PERCIBIDO:
- Algunos emails válidos podrían rechazarse
- Podría ralentizar booking

❓ PREGUNTAS PARA CEREBRO:
- ¿Qué emails son válidos pero regex rechaza?
- ¿email-validator es seguro?
- ¿Performance está OK?

🏢 CONTEXTO NEGOCIO:
Usuario hace booking con email - si se rechaza, booking falla
```

---

## 🔍 FASE 2: CEREBRO AUDITA ANTES

**Cerebro DEBE HACER:**

```
1. LEE el código COMPLETO
   - No solo las líneas que cambian
   - Lee el contexto alrededor
   - Entiende flujo total

2. EJECUTA tests relacionados
   - pytest backend/tests/test_booking_api.py::test_create_booking_invalid_email
   - Verifica que test pasa ANTES del cambio

3. PRUEBA el código actual
   - Corre la app: python run.py
   - Intenta el flujo actual
   - Documenta comportamiento

4. IDENTIFICA RIESGOS
   - ¿Qué puede fallar?
   - ¿Cuáles son casos edge?
   - ¿Dinero está en riesgo?

5. REPORTA "GO/NO-GO"
   - GO: Adelante con cambio
   - NO-GO: Espera, hay riesgos

FORMATO DE REPORTE:

📊 AUDITORÍA PRE-CAMBIO:
Cambio: [nombre]
Riesgo: [nivel 🔴🟠🟡🟢]

✅ Verificado:
- [Punto 1]
- [Punto 2]

⚠️ Riesgos encontrados:
- [Riesgo 1 - Cómo mitigarlo]
- [Riesgo 2 - Cómo mitigarlo]

🎯 Recomendación:
[GO / NO-GO]
```

---

## ✅ FASE 3: YO IMPLEMENTO (CONFIADO)

Después de auditoria de Cerebro, yo implemento:

```
1. Hago cambios exactamente como propuse
2. No vuelvo a cambiar plan (ya fue auditado)
3. Testeo localmente (rápido)
4. Paso a Cerebro para verificación
```

---

## 🧪 FASE 4: CEREBRO VERIFICA CAMBIOS

**Cerebro ejecuta:**

```
1. CORRE tests nuevamente
   - pytest backend/tests/ -v
   - Todos deben pasar

2. INICIA app y testea
   - python run.py
   - curl POST /api/bookings
   - curl GET /api/csrf-token

3. PRUEBA el flujo completo
   - Usuario intenta booking
   - Email se envía
   - Stripe checkout funciona

4. BUSCA REGRESSIONS
   - ¿Algo viejo se rompió?
   - ¿Performance degradó?

5. REPORTA FINAL
   ✅ LISTO PARA DEPLOY
   o
   ❌ ENCONTRÉ BUGS
```

---

## 📌 REGLAS DE ORO

```
1. SIEMPRE audita ANTES (no después)
   - Previene bugs
   - Ahorra tiempo fix

2. SIEMPRE ejecuta código (no solo lee)
   - Los tests encuentran lo que la lectura no ve
   - Cerebro también puede ejecutar localmente

3. SIEMPRE piensa en DINERO
   - ¿Cuánto se pierde si bug?
   - ¿Stripe está seguro?
   - ¿Email llega?

4. SIEMPRE piensa en IPHONE
   - ¿Safari funciona?
   - ¿Viewport correcto?
   - ¿Galería abre?

5. SIEMPRE reporta RIESGO NIVEL
   🔴 CRÍTICO: Arreglar ANTES de tocar código
   🟠 ALTO: Mitigar en diseño
   🟡 MEDIO: Documental y monitor
   🟢 BAJO: Proceder seguro
```

---

## 🚀 EJEMPLO DE USO

### **Yo digo a Cerebro:**

```
📝 CAMBIO PROPUESTO:
Agregar monitoring de Stripe webhooks con Sentry

📂 ARCHIVOS AFECTADOS:
- backend/app/routes/stripe_webhook.py (agregar logging)
- backend/requirements.txt (agregar sentry-sdk)
- backend/app/config.py (agregar SENTRY_DSN)

⚠️ RIESGO PERCIBIDO:
- Sentry podría ralentizar webhook
- Webhooks podrían timeout

❓ PREGUNTAS PARA CEREBRO:
- ¿Performance Sentry está OK?
- ¿Webhook timeout si Sentry cae?
- ¿Logs sensibles en Sentry (seguro)?
- ¿iPhone puede causar webhooks extra?

🏢 CONTEXTO NEGOCIO:
Webhook Stripe = Dinero registrado
Si webhook falla silenciosamente = Dinero perdido
Necesitamos ALERTAS
```

### **Cerebro reporta:**

```
📊 AUDITORÍA PRE-CAMBIO:
Cambio: Agregar Sentry monitoring a Stripe webhook
Riesgo: 🟡 MEDIO

✅ Verificado:
- Sentry-SDK async (no bloquea webhook)
- Si Sentry cae, webhook continúa
- Logs no incluyen datos de tarjeta

⚠️ Riesgos encontrados:
- Sentry podría enviar datos personales → Usar sample_rate=0.1
- Webhook rate limit podría incrementar → Monitored en Sentry

🎯 Recomendación:
GO - Adelante, pero:
1. Implementa sample_rate=0.1 (10% muestras)
2. No loguear guest_email, guest_phone
3. Agregar test que webhook sigue sin Sentry
```

### **Yo implemento con confianza:**

```
Hago cambios
Testing local ✅
Paso a Cerebro
Cerebro verifica ✅
Deploy ✅
```

---

## 📞 CÓMO INVOCAR A CEREBRO

**De ahora en adelante, cuando proponga cambio, escribo:**

```
@CEREBRO AUDITA ANTES

[Incluir toda la información de arriba]
```

**Y en el mensaje, siempre linkeo:**
- CEREBRO_CONTEXT.md (este documento)
- CEREBRO_PROTOCOL.md (este flujo)

---

## 🎓 ENTRENAR A CEREBRO

Cada vez que Cerebro audita, aprende:

```
AUDITORÍA #1: Email validation
- Identifica: emails válidos que regex rechaza
- Aprende: usar librería, no regex

AUDITORÍA #2: Stripe webhook
- Identifica: CSRF bloquea webhook
- Aprende: necesita @csrf_exempt

AUDITORÍA #3: Monitoring
- Identifica: webhook sin alertas
- Aprende: agregar Sentry/logging

AUDITORÍA #N: Patrón emerge
- Cerebro entiende sistema
- Anticipa problemas
- Sugiere mejoras
```

---

## 📈 OBJETIVO FINAL

```
SEMANA 1: Cerebro audita cambios básicos
SEMANA 2: Cerebro anticipa problemas
SEMANA 3: Cerebro sugiere mejoras
SEMANA 4: Cerebro = co-architect

De aquí a 1 mes, Cerebro será MEJOR que yo
en encontrar bugs de seguridad & negocio
```

---

**GUARDADO: Use este protocolo para TODOS los cambios futuros.**
**A partir de AHORA, Cerebro es parte del equipo de desarrollo.**
