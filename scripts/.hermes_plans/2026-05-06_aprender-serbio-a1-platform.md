# Plan: Plataforma A1 Aprende Serbio — estilo Duolingo

**Goal:** Transformar `/serbio` en una plataforma interactiva de aprendizaje de serbio A1 con flashcards animadas, progreso del usuario, y audio de pronunciación, solo para usuarios autenticados.

**Created:** 2026-05-06
**Status:** draft

---

## Context

- **Data:** Directus `learning_entries` — 294 entradas A1 (`difficulty: starter`, `status: published`) agrupadas en 8 unidades (1, 4-9, 23), todas con `audio_file` generado (voces Sophie/Nicholas).
- **Auth:** WordPress-backed session via `getSessionUser()` + cookie `serbia_latina_session`.
- **Stack:** Next.js 16 (App Router), React 19, Tailwind v4. Sin librerías de animación ni estado global.
- **Ruta actual:** `/serbio` es un placeholder estático ("En desarrollo").

---

## Arquitectura

```
/serbio                         ← landing (pública, muestra preview)
/serbio/unidades                ← lista de unidades (protegida)
/serbio/unidades/[unitId]       ← lección interactiva (protegida)
/serbio/flashcards              ← repaso libre (protegida)
/serbio/progreso                ← dashboard de progreso (protegida)
```

### Componentes nuevos
```
src/
├── app/serbio/
│   ├── page.tsx                       ← landing (reemplaza placeholder)
│   ├── layout.tsx                     ← layout compartido con auth gate
│   ├── unidades/
│   │   ├── page.tsx                   ← lista de unidades con progreso
│   │   └── [unitId]/
│   │       └── page.tsx               ← lección interactiva
│   ├── flashcards/
│   │   └── page.tsx                   ← modo repaso libre
│   └── progreso/
│       └── page.tsx                   ← dashboard de estadísticas
├── components/learn/
│   ├── flashcard.tsx                  ← tarjeta animada (frente/dorso)
│   ├── lesson-flow.tsx                ← flujo de lección (secuencia de ejercicios)
│   ├── progress-bar.tsx               ← barra de progreso animada
│   ├── audio-button.tsx               ← botón de audio reutilizable
│   ├── unit-card.tsx                  ← tarjeta de unidad en la lista
│   ├── exercise-choice.tsx            ← ejercicio de selección múltiple
│   ├── exercise-type.tsx              ← ejercicio de escribir respuesta
│   └── streak-display.tsx             ← racha de días
├── lib/learn/
│   ├── directus.ts                    ← cliente Directus (server-side)
│   ├── progress-store.ts              ← progreso del usuario (archivo JSON local)
│   ├── streak.ts                      ← lógica de racha diaria
│   └── types.ts                       ← tipos compartidos
```

---

## Fases

### Fase 1 — Cliente Directus + tipos (server-side)

1. Crear `src/lib/learn/directus.ts`:
   - `getEntriesByUnit(unitId)` — fetch entries filtered by `unit`
   - `getAllUnits()` — distinct units with entry counts
   - `getEntryAudioUrl(fileId)` — Directus file URL builder
   - Todas las llamadas son server-side (no exponer `DIRECTUS_TOKEN` al cliente)
   
2. Crear `src/lib/learn/types.ts`:
   ```ts
   type LearningEntry = {
     id: number; unit: number; sort: number;
     serbian_latin: string; serbian_cyrillic: string;
     spanish_translation: string;
     entry_type: "word" | "phrase" | "expression" | "sentence" | "question";
     part_of_speech: string; difficulty: string;
     example_latin?: string; example_cyrillic?: string; example_spanish?: string;
     audio_file?: string; pronunciation_hint?: string;
   }
   type UnitInfo = { id: number; count: number; label: string; }
   ```

3. Agregar `DIRECTUS_URL` y `DIRECTUS_TOKEN` a `.env.local` y `.env.example`.

### Fase 2 — Progreso del usuario

4. Crear `src/lib/learn/progress-store.ts`:
   - Archivo JSON en `data/learn-progress/<userId>.json`
   - Estructura: `{ completedEntries: number[], completedUnits: number[], streak: { count, lastDate }, xp: number }`
   - Funciones: `getProgress(userId)`, `markEntryComplete(userId, entryId)`, `markUnitComplete(userId, unitId)`
   - `getUnitProgress(userId, unitId)` → `{ completed, total, percentage }`

5. Crear `src/lib/learn/streak.ts`:
   - `updateStreak(userId)`: si hoy > lastDate por 1 día → incrementa, si más → reset a 1, si mismo día → no-op

6. Crear server action `src/app/serbio/actions.ts`:
   - `completeEntryAction(entryId, unitId)` — marca entrada como completada
   - Solo funciona si `getSessionUser()` no es null

### Fase 3 — Layout protegido + landing

7. `src/app/serbio/layout.tsx` — wrapper con auth gate:
   - Si `getSessionUser()` es null → redirect a `/acceso?redirect=/serbio/unidades`
   - La landing (`/serbio`) es la única página pública de esta sección
   
8. `src/app/serbio/page.tsx` — landing pública:
   - Hero: "Aprende serbio como un local"
   - Preview de unidades (3-4 tarjetas con candado si no está autenticado)
   - CTA: "Empieza gratis" → `/acceso?redirect=/serbio/unidades`
   - Si ya autenticado: muestra progreso general + CTA "Continuar aprendiendo"

### Fase 4 — Lista de unidades

9. `src/app/serbio/unidades/page.tsx`:
   - Grid de `UnitCard` con: nombre de unidad, progreso (barra circular), conteo "X/294"
   - Las unidades tienen nombres temáticos inferidos:
     - Unit 1: "Primeros pasos" (saludos, cortesía)
     - Unit 4: "Vocabulario básico" (100 palabras Pinhok)
     - Unit 5: "Frases útiles" (peticiones, cortesía)
     - Unit 6: "El calendario" (meses, tiempo)
     - Unit 7: "La familia" (parentesco)
     - Unit 8: "Los números" (1-1000)
     - Unit 9: "El cuerpo" (partes del cuerpo)
     - Unit 23: "En contexto" (frases reales)
   - Animación: entrada staggered (cada tarjeta aparece con delay creciente)

### Fase 5 — Lección interactiva

10. `src/app/serbio/unidades/[unitId]/page.tsx`:
    - Server component: fetch entries for unit, pre-compute exercise data
    - Client child `LessonFlow` recibe datos como props (sin lógica de fetch en cliente)

11. `src/components/learn/lesson-flow.tsx` ("use client"):
    - Estado: `currentStep`, `answers`, `isFlipped`, `streak`
    - Tipos de ejercicios por ronda (3 rondas por lección):
      - **Ronda 1 — Presentación**: flashcard con palabra serbia (cirílico + latino), traducción al dorso, botón de audio. El usuario pasa manualmente.
      - **Ronda 2 — Selección múltiple**: muestra traducción español + 4 opciones en serbio (1 correcta + 3 distractores de la misma unidad)
      - **Ronda 3 — Escritura**: muestra traducción español, el usuario escribe en serbio latino (comparación case-insensitive y tolerante a acentos)
    - Animaciones:
      - Transición entre tarjetas: slide horizontal con fade
      - Flip de flashcard: rotación 3D (CSS `transform: rotateY(180deg)`)
      - Correcto: confeti verde + shake sutil
      - Incorrecto: shake rojo + revelar respuesta correcta
    - `AudioButton`: reproduce audio via Directus file URL. Usa `<audio>` nativo con toggle play/pause.
    - Al completar: animación de celebración + XP ganado + botón "Volver a unidades"

### Fase 6 — Modo flashcards

12. `src/app/serbio/flashcards/page.tsx`:
    - El usuario puede elegir unidad o "todas"
    - Modo swipe-less: botones "No sé" / "Sé" (como Anki simplificado)
    - Tarjeta: frente = serbio (latino + cirílico) + botón audio, dorso = español + ejemplo
    - Animación de flip 3D al revelar
    - Al final de la sesión: resumen "X recordadas, Y por repasar"

### Fase 7 — Dashboard de progreso

13. `src/app/serbio/progreso/page.tsx`:
    - Stats: XP total, racha de días 🔥, entradas completadas, unidades completadas
    - Gráfico simple (barras CSS): progreso por unidad
    - Próxima unidad sugerida
    - Logros básicos:
      - 🥉 10 entradas, 🥈 50 entradas, 🥇 100 entradas
      - 🔥 Racha 3 días, 🔥🔥 7 días, 🔥🔥🔥 30 días

### Fase 8 — Navegación + integración

14. Agregar "Aprender 🇷🇸" al `site-shell.tsx`:
    - Link en la navegación principal
    - Si el usuario está autenticado, mostrar mini-indicador de racha junto al link

15. Agregar `/serbio/unidades` como redirect desde `/aprender` si se usa esa URL

---

## Animaciones (detalle técnico)

Sin instalar framer-motion — usamos solo CSS + React state:

- **Flip 3D**: `perspective(800px)` en contenedor, `rotateY(180deg)` con `backface-visibility: hidden` en frente/dorso. Transición `transform 0.5s`.
- **Slide entre tarjetas**: `translateX` con `transition: transform 0.3s ease-out`. La tarjeta saliente va a `-100%`, la entrante desde `100%`.
- **Confeti**: SVG/CSS animado con `@keyframes` — pequeños círculos/cuadrados de colores que caen (solo cuando acierta).
- **Shake**: `@keyframes shake { 0%,100% { transform: translateX(0) } 25% { transform: translateX(-6px) } 75% { transform: translateX(6px) } }`
- **Barra de progreso**: `width` con `transition: width 0.6s ease-out`
- **Staggered entrance**: cada `UnitCard` recibe `animation-delay: ${index * 100}ms`

---

## Archivos a crear/modificar

| Archivo | Acción |
|---|---|
| `src/lib/learn/directus.ts` | NUEVO — cliente Directus server-side |
| `src/lib/learn/types.ts` | NUEVO — tipos de aprendizaje |
| `src/lib/learn/progress-store.ts` | NUEVO — almacenamiento de progreso |
| `src/lib/learn/streak.ts` | NUEVO — lógica de racha |
| `src/app/serbio/actions.ts` | NUEVO — server actions de progreso |
| `src/app/serbio/layout.tsx` | NUEVO — layout con auth gate |
| `src/app/serbio/page.tsx` | REEMPLAZAR — landing pública |
| `src/app/serbio/unidades/page.tsx` | NUEVO — lista de unidades |
| `src/app/serbio/unidades/[unitId]/page.tsx` | NUEVO — lección interactiva |
| `src/app/serbio/flashcards/page.tsx` | NUEVO — modo repaso |
| `src/app/serbio/progreso/page.tsx` | NUEVO — dashboard |
| `src/components/learn/flashcard.tsx` | NUEVO — tarjeta animada |
| `src/components/learn/lesson-flow.tsx` | NUEVO — flujo de lección |
| `src/components/learn/progress-bar.tsx` | NUEVO — barra de progreso |
| `src/components/learn/audio-button.tsx` | NUEVO — botón audio |
| `src/components/learn/unit-card.tsx` | NUEVO — tarjeta de unidad |
| `src/components/learn/exercise-choice.tsx` | NUEVO — selección múltiple |
| `src/components/learn/exercise-type.tsx` | NUEVO — ejercicio escritura |
| `src/components/learn/streak-display.tsx` | NUEVO — indicador de racha |
| `src/components/site-shell.tsx` | MODIFICAR — agregar link "Aprender" |
| `.env.example` | MODIFICAR — agregar DIRECTUS_* vars |
| `.env.local` (server) | MODIFICAR — agregar DIRECTUS_* vars |
| `data/learn-progress/` | NUEVO — directorio datos progreso |

---

## Verificación

- [ ] `npm run build` pasa
- [ ] Usuario no autenticado → `/serbio/unidades` redirige a `/acceso`
- [ ] Usuario autenticado → puede navegar todas las rutas de aprendizaje
- [ ] Audio se reproduce en todos los ejercicios
- [ ] Progreso persiste entre sesiones
- [ ] Animaciones fluidas en mobile y desktop
- [ ] La landing pública es atractiva y tiene CTA clara

---

## Riesgos / Preguntas abiertas

1. **Directus token en server:** El token ya existe pero hay que confirmar que `DIRECTUS_URL` (`http://localhost:8055`) es accesible desde Next.js en runtime (están en la misma máquina → ✅).
2. **Progreso en archivos JSON:** Para MVP es suficiente. Si hay muchos usuarios (>1000), migrar a Directus/SQLite.
3. **Sin framer-motion:** Las animaciones CSS cubren el 95% de lo que Duolingo ofrece. Si el usuario pide animaciones más complejas (drag & drop, swipe), evaluar framer-motion después.
4. **Niveles superiores (A2, B1):** Los datos ya existen (681 basic, 303 intermediate). La arquitectura soporta extender a esos niveles agregando filtro por `difficulty`.
