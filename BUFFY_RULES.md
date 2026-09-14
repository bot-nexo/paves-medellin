# 📋 Reglas del Agente (Buffy) — LEER SIEMPRE

> **Archivo de reglas permanentes.** Debe leerse al inicio de CADA sesión y
> cumplirse sin excepción. El usuario puede agregar o modificar reglas aquí.

---

## 1. Idioma de comunicación

- **SIEMPRE responder en español**, sin importar el idioma del mensaje del usuario.
- Código, nombres de variables y commits: en inglés (estándar de la industria).
- Comentarios de código y textos de UI (botones, labels, mensajes): **en español**.

## 2. Formato de preguntas

- **TODA pregunta al usuario debe tener selector de respuestas** (opciones múltiples /
  de selección única). Nunca hacer preguntas abiertas que esperen texto libre.
- Cada opción debe incluir una breve descripción de sus implicaciones para que el
  usuario decida con información.
- Máximo 4 preguntas por bloque para no saturar.

## 3. Reglas del proyecto (Catálogo Pavés Medellín)

- **NO romper la funcionalidad existente** del catálogo público (carrito, WhatsApp,
  personalizaciones, checkout). Toda prueba de regresión es obligatoria al terminar.
- Usar el stack existente: React 18 + Vite, sin agregar dependencias pesadas sin
  justificarlas primero con el usuario.
- Los datos del catálogo viven en `src/data/menu.js` (fuente única de verdad).
  Cualquier migración de datos debe ser 100% compatible con la estructura actual.
- Estilo visual del panel admin: profesional y limpio, pero coherente con la
  identidad del catálogo (tonos café/crema, `#3D2314` como color primario).
- Commits y mensajes en español, descriptivos.

## 4. Flujo de trabajo

- **Definir antes de programar:** para módulos nuevos, primero acordar el alcance
  y la arquitectura con el usuario (con opciones a elegir), y recién entonces codificar.
- Verificar con `npm run build` / typecheck antes de dar un cambio por terminado.
