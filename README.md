# Serbia Latina Frontend

Frontend en Next.js 16 conectado a `admin.segun2idioma.com` vía WordPress REST API.

## Qué hace

- Consume entradas, páginas, categorías y autores desde WordPress.
- Renderiza portada dinámica, archivos por categoría y rutas para entradas y páginas.
- Muestra ofertas laborales desde Jooble en `/trabajos` y un bloque de últimos trabajos en la portada; la búsqueda usa ciudades de Serbia con Belgrado como ubicación inicial.
- Usa navegación automática basada en contenido público.
- Soporta menús protegidos de WordPress si defines usuario + application password.

## Variables

Parte de `.env.example`:

```bash
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_WORDPRESS_API_URL=https://admin.segun2idioma.com/wp-json
WORDPRESS_API_USERNAME=
WORDPRESS_API_PASSWORD=
JOOBLE_API_KEY=
```

`WORDPRESS_API_USERNAME` es necesario si quieres leer menús protegidos. Con solo el endpoint público, el sitio ya levanta y consume posts, páginas, categorías y usuarios públicos.

`JOOBLE_API_KEY` debe quedarse solo en el entorno del servidor. No uses prefijo `NEXT_PUBLIC_`; la ruta `/trabajos` consulta Jooble desde Server Components y cachea los resultados por horas para reducir consumo del límite de solicitudes.

## Desarrollo

```bash
npm run dev
```

## Rutas principales

- `/` portada editorial
- `/entradas/[slug]` detalle de posts
- `/categorias/[slug]` archivo por categoría
- `/trabajos` buscador de ofertas de Jooble
- `/paginas/[slug]` páginas fijas de WordPress

## Validación

```bash
npm run lint
npm run build
```

## Estado actual del backend detectado el 24 de abril de 2026

- Categorías públicas: `Noticias`, `Trabajos`, `Sin categoría`
- Páginas públicas: `Página de ejemplo`
- Autores públicos visibles
- Autenticación verificada para el usuario `darkness`
- La colección `menus` responde, pero actualmente está vacía
