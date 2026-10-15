# RPJ CRM (frontend)

Frontend del CRM interno de RPJ Labs. Es una SPA que consume la API de `agency-crm` para dar seguimiento a prospectos (principalmente clínicas dentales) hasta cerrar la venta.

Stack: Vite, React, TypeScript (`strict`), TanStack Router, Query, Table y Form, Zod, Tailwind CSS v4, shadcn/ui (Radix), date-fns con `@date-fns/tz` y Vitest. Gestor de paquetes: pnpm.

## Requisitos

- Node.js 22 o más reciente.
- pnpm 10.
- El backend `agency-crm` corriendo en `http://localhost:8000`.

## Variables de entorno

Copia `.env.example` a `.env`:

```bash
cp .env.example .env
```

| Variable | Descripción | Valor en desarrollo |
|---|---|---|
| `VITE_API_URL` | URL base de la API, sin barra final | `http://localhost:8000` |

## Cómo levantarlo junto al backend

1. Levanta el backend (desde el repo `agency-crm`), con `CORS_ORIGINS` incluyendo el origen del frontend:

   ```env
   CORS_ORIGINS=["http://localhost:5173"]
   ```

   ```bash
   uvicorn app.main:app --port 8000
   ```

2. Instala dependencias y levanta el frontend:

   ```bash
   pnpm install
   pnpm dev
   ```

3. Abre `http://localhost:5173` y entra con un usuario del backend.

El servidor de Vite usa siempre el puerto `5173` (`strictPort`), porque es el único origen que el backend acepta por CORS. Si necesitas otro origen, agrégalo a `CORS_ORIGINS` en el backend.

La documentación viva de la API está en `http://localhost:8000/docs` con el backend corriendo.

## Scripts

| Script | Qué hace |
|---|---|
| `pnpm dev` | Servidor de desarrollo en `http://localhost:5173` |
| `pnpm build` | Revisa tipos y genera `dist/` para producción |
| `pnpm lint` | Linter (oxlint) |
| `pnpm typecheck` | Revisión de tipos con TypeScript |
| `pnpm test` | Pruebas unitarias con Vitest |

`pnpm build` genera archivos estáticos: se pueden servir desde cualquier hosting de estáticos, configurado para responder `index.html` en todas las rutas.

## Deploy en Railway

El frontend se despliega en Railway directo desde este repo (`ReyPJ/crm-frontend`), sin Docker. Railpack detecta Vite, corre `pnpm build` y sirve `dist/` con Caddy, con fallback a `index.html` para las rutas de la SPA.

- Variable obligatoria: `VITE_API_URL=https://${{crm-backend.RAILWAY_PUBLIC_DOMAIN}}`. Se usa al construir; si falta, el build falla.
- La versión de pnpm sale de `packageManager` en `package.json`.
- El backend debe incluir el dominio del frontend en `CORS_ORIGINS`.

La guía completa (base de datos, backend, frontend y primer administrador) está en el repo del backend: `docs/deploy-railway.md`.

## Estructura del proyecto

```
src/
  main.tsx                    QueryClient, router y cierre de sesión global
  routeTree.gen.ts            generado por el plugin de TanStack Router (no editar)
  routes/
    __root.tsx                proveedores, toasts y 404
    login.tsx                 inicio de sesión
    _app.tsx                  layout autenticado (protege las rutas privadas)
    _app/index.tsx            Hoy: agenda de seguimientos
    _app/leads/index.tsx      lista de leads con filtros en la URL
    _app/leads/$leadId.tsx    detalle, registro de contacto e historial
    _app/activity.tsx         actividad del equipo
    _app/users.tsx            usuarios (solo administrador)
  lib/
    api/client.ts             fetch con URL base, token, ApiError y 401
    api/types.ts              tipos de la API
    api/auth.ts               login y usuario actual
    api/leads.ts              leads y sus queryOptions
    api/interactions.ts       historial y actividad
    api/users.ts              usuarios
    auth.ts                   token en localStorage, expiración y permisos
    format.ts                 fechas en America/Mexico_City, MXN, teléfonos y enlaces
    labels.ts                 etiquetas en español de los enums de la API
    form.ts                   errores visibles y foco del primer campo inválido
    notify.ts                 toasts de error
  components/
    ui/                       componentes de shadcn/ui
    layout/                   sidebar, barra inferior en celular y encabezado
    shared/                   piezas comunes (fechas, selectores, errores)
    leads/                    agenda, tabla, filtros y diálogo de alta y edición de leads
    interactions/             formulario de contacto e historial
    users/                    alta de usuarios
```

Claves de caché de TanStack Query: `["me"]`, `["users"]`, `["leads", filtros]`, `["lead", id]`, `["lead", id, "interactions"]` y `["interactions", filtros]`.

## Pendiente de backend

Cosas que la interfaz necesitaría y que hoy no existen en la API. No se inventaron en el frontend.

- **Cambio de contraseña.** No hay endpoint para que un usuario cambie su contraseña ni para que el administrador la restablezca. Si alguien la olvida, hoy solo se puede crear otro usuario.
- **Editar nombre o usuario.** `PATCH /users/{id}` solo acepta `role` e `is_active`; un error de captura en el nombre no se puede corregir.
- **Lista de compañeros para vendedores.** `GET /users/` es solo para administradores, así que un vendedor no puede filtrar la actividad o los leads por un compañero específico (solo "Todo el equipo", "Solo yo", "Míos" o "Sin asignar"). Bastaría un endpoint de usuarios activos con `id` y `name`.
- **Renovar la sesión.** El token dura 8 horas y no hay refresh: si la jornada se alarga, la sesión se cierra a media tarea y hay que volver a entrar.
- **Protección del último administrador.** El backend permite que un administrador se quite el rol o se desactive a sí mismo. La interfaz lo impide, pero la regla debería vivir en la API.
- **Búsqueda por palabras.** `q` busca la frase completa como subcadena: "clinica pena" no encuentra "Clínica Dental Peña". Buscar cada palabra por separado haría la búsqueda más tolerante.
- **Límite de intentos de login.** `POST /users/login` no limita intentos fallidos; en producción conviene limitarlos por IP o por usuario.
- **Lista de ciudades.** El filtro `city` es por coincidencia exacta y no hay forma de consultar las ciudades existentes, así que el filtro es texto libre en lugar de una lista.
