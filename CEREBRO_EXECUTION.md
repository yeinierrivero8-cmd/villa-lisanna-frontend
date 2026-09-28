# ⚙️ INSTRUCCIONES: CEREBRO EJECUTA CÓDIGO (NO SOLO LEE)

**Esto es para que Cerebro pueda testear, no solo auditar.**

---

## 🎯 LO QUE CEREBRO PUEDE HACER AHORA

```
✅ Leer archivos Python
✅ Verificar sintaxis (python -m py_compile)
✅ Ejecutar tests (pytest)
✅ Verificar imports
✅ Analizar flujos de código

⚠️ NO PUEDE (limitaciones):
❌ Iniciar servidor real (no tiene shell persistente)
❌ Hacer requests HTTP (sin acceso a red)
❌ Ver iPhone real (no tiene dispositivo)
❌ Cambiar variables de entorno permanentes
```

---

## 🔧 HERRAMIENTAS QUE CEREBRO PUEDE USAR

### **1. Validar Sintaxis**
```bash
# Cerebro ejecuta esto:
python -m py_compile backend/app/__init__.py

# Si hay error → Cerebro reporta línea exacta
# Si OK → Continúa
```

### **2. Ejecutar Tests**
```bash
# Cerebro ejecuta esto:
cd backend
pytest tests/test_booking_api.py -v

# Cerebro lee output:
PASSED test_get_availability_success
FAILED test_create_booking_invalid_email
ERROR test_quote_invalid_date_format

# Cerebro reporta: Qué pasó, por qué, cómo fix
```

### **3. Verificar Imports**
```python
# Cerebro simula esto:
from flask_wtf.csrf import csrf_exempt  # ¿Existe?
from email_validator import validate_email  # ¿Existe?
from flask_limiter import Limiter  # ¿Existe?

# Si import falla → Reporta error
# Si OK → Continúa con auditoría
```

### **4. Analizar Código Estático**
```python
# Cerebro busca en código:
- ¿CSRF protege POSTs?
- ¿Rate limiting está?
- ¿HTML está escapado?
- ¿Stripe tiene webhook?

# Reporta: ENCONTRADO / NO ENCONTRADO / INCORRECTO
```

### **5. Simular Flujos**
```python
# Cerebro simula (sin correr):
Usuario intenta booking con 2 noches
  ↓ (sistema debería rechazar)
Backend valida MIN_NIGHTS = 3
  ↓ (¿Lo hace?)
Retorna error 400
  ↓ (¿El mensaje es claro?)

Cerebro reporta: SI/NO funciona
```

---

## 📝 CUÁNDO CEREBRO EJECUTA (AUTOMÁTICO)

**CEREBRO EJECUTA AUTOMÁTICAMENTE CUANDO:**

```
1. Le pido una auditoría PRE-CAMBIO
   → Ejecuta tests para verificar baseline

2. Le pido verificar cambios POST-CAMBIO
   → Ejecuta tests para verificar que pasó

3. Le encuentro un bug
   → Ejecuta tests relacionados para confirmar

4. Propongo feature nueva
   → Ejecuta tests para ver qué falta
```

**CEREBRO NO EJECUTA SI:**

```
1. Solo pido "revisar código"
   → Lee, no ejecuta
   
2. Pido "¿Es esto seguro?"
   → Analiza estático, no ejecuta

3. Tengo dudas teóricas
   → Explica, no ejecuta
```

---

## 🚀 CÓMO INVOCAR A CEREBRO PARA EJECUTAR

### **Opción 1: Auditoría Pre-Cambio CON TESTS**

```
@CEREBRO AUDITA Y EJECUTA TESTS

📝 CAMBIO PROPUESTO:
Cambiar email validation de regex a librería

📂 ARCHIVOS:
- backend/app/routes/public_api.py

🧪 TESTS A EJECUTAR:
pytest backend/tests/test_booking_api.py::test_create_booking_invalid_email -v

⚠️ PREGUNTA:
¿Qué emails son válidos pero regex rechaza?

📋 LEER PRIMERO:
- CEREBRO_CONTEXT.md (contexto negocio)
- CEREBRO_PROTOCOL.md (protocolo)
```

**Cerebro entonces:**
1. Lee CEREBRO_CONTEXT.md
2. Lee código propuesto
3. Ejecuta: `pytest ... -v`
4. Analiza: Qué falló, por qué
5. Reporta: RIESGOS + GO/NO-GO

### **Opción 2: Verificación Post-Cambio CON TESTS**

```
@CEREBRO VERIFICA CAMBIOS Y EJECUTA TESTS

📝 CAMBIOS HECHOS:
Implementado email validation con librería

📂 ARCHIVOS MODIFICADOS:
- backend/app/routes/public_api.py (línea 100-110)
- backend/requirements.txt (agregado email-validator)

🧪 TESTS A EJECUTAR:
pytest backend/tests/ -v

📋 VERIFICAR:
1. ¿Todos los tests pasan?
2. ¿Hay regressions?
3. ¿Email válidos se aceptan?
4. ¿Performance está OK?
```

**Cerebro entonces:**
1. Lee cambios
2. Ejecuta tests
3. Reporta: PASS/FAIL por test
4. Reporta: READY TO DEPLOY o BUGS FOUND

### **Opción 3: Buscar Bugs Específicos CON TESTS**

```
@CEREBRO BUSCA BUG Y EJECUTA TEST

📝 BUG REPORTADO:
Booking con 2 noches no se rechaza

📂 ARCHIVO SOSPECHOSO:
- backend/app/routes/public_api.py (validación)
- backend/app/services/pricing.py (cálculo)

🧪 TEST QUE FALLA:
pytest backend/tests/test_booking_api.py::test_create_booking_too_short_stay -v

📋 ENCONTRAR:
1. ¿Dónde está el bug?
2. ¿Qué código falla?
3. ¿Cómo fixearlo?
```

**Cerebro entonces:**
1. Ejecuta el test que falla
2. Ve el error exacto
3. Lee código relacionado
4. Reporta: LÍNEA EXACTA DEL BUG + SOLUCIÓN

---

## 📋 CHECKLIST: CEREBRO DEBE USAR ESTO

**Cada vez que audite o verifique:**

```
☐ Leer CEREBRO_CONTEXT.md (contexto negocio)
☐ Leer CEREBRO_PROTOCOL.md (protocolo)
☐ Leer código propuesto/modificado
☐ Ejecutar tests relacionados
☐ Analizar resultados de tests
☐ Reportar riesgos con ejemplos
☐ Reportar GO/NO-GO claramente
☐ Explicar cómo mitigar riesgos
```

---

## 🧠 MEJORA PROGRESIVA

**A medida que Cerebro audita más:**

```
AUDITORÍA #1-3: Cerebro aprende estructura
AUDITORÍA #4-6: Cerebro anticipaa problemas
AUDITORÍA #7-10: Cerebro sugiere mejoras
AUDITORÍA #11+: Cerebro es co-architect

Después de 10 auditorías, Cerebro:
- Entiende arquitectura
- Conoce flujos críticos
- Anticipa bugs
- Sugiere optimizaciones
```

---

## 📞 INVOCACIÓN RÁPIDA

**De ahora en adelante, estas son las 3 invocaciones estándar:**

### **Invocación 1: PRE-CAMBIO**
```
@CEREBRO AUDITA Y EJECUTA TESTS

[Tu propuesta de cambio]
```

### **Invocación 2: POST-CAMBIO**
```
@CEREBRO VERIFICA CAMBIOS Y EJECUTA TESTS

[Los cambios que hiciste]
```

### **Invocación 3: BUG ENCONTRADO**
```
@CEREBRO BUSCA BUG Y EJECUTA TEST

[Descripción del bug]
```

---

## 🎓 EJEMPLO COMPLETO

### **YO digo:**
```
@CEREBRO AUDITA Y EJECUTA TESTS

📝 CAMBIO PROPUESTO:
Agregar rate limiting a POST /api/bookings

📂 ARCHIVOS:
- backend/app/__init__.py (Limiter)
- backend/app/routes/public_api.py (decorador)
- backend/requirements.txt (flask-limiter)

🧪 TESTS A EJECUTAR:
pytest backend/tests/test_booking_api.py::test_rate_limit_booking_creation -v

⚠️ PREGUNTA:
¿Rate limiting realmente detiene ataques?

📋 LEER:
CEREBRO_CONTEXT.md
CEREBRO_PROTOCOL.md
```

### **CEREBRO HACE:**
1. Lee contexto
2. Lee protocolo
3. Lee código
4. Ejecuta: `pytest ... -v`
5. Analiza output
6. Reporta:

```
📊 AUDITORÍA PRE-CAMBIO:
Cambio: Rate limiting a bookings
Riesgo: 🟢 BAJO

✅ Verificado:
- Flask-Limiter sintaxis correcta
- Test rate_limit_booking_creation verifica: OK
- Limite de 5/hora bloquea bot

⚠️ Riesgos (bajos):
- Redis no configurado (usa memory://)
  → Funciona para desarrollo
  → En producción usar Redis

🎯 Recomendación:
GO - Adelante con cambio
Pero agregar TODO: switch a Redis en producción
```

### **YO implemento y digo:**
```
@CEREBRO VERIFICA CAMBIOS Y EJECUTA TESTS

[Los cambios que hice]
```

### **CEREBRO ejecuta tests y reporta:**
```
✅ TODOS LOS TESTS PASARON

Verificaciones:
✓ test_rate_limit_booking_creation: PASSED
✓ test_get_availability_success: PASSED
✓ test_create_booking_valid: PASSED
✓ 7 más: PASSED

Regressions: NINGUNO

🎯 VERDICT:
LISTO PARA DEPLOY ✅
```

---

**GUARDADO: Use este documento SIEMPRE que necesite que Cerebro ejecute código.**
