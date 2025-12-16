# 🎯 Sistema de Dashboards y Sesiones - Doña Repartos

## 📋 Resumen

Se ha implementado un sistema completo de autenticación y dashboards personalizados para cada tipo de usuario (Admin, Restaurant, Client, Delivery).

## 🏗️ Arquitectura Implementada

### 1. Middleware de Protección de Rutas (`middleware.ts`)

El middleware protege las rutas y redirige automáticamente según el rol del usuario:

```typescript
Rutas Protegidas:
- /admin → Solo administradores
- /socios/dashboard → Solo restaurantes
- /clientes/dashboard → Solo clientes
- /repartidores/dashboard → Solo repartidores
```

**Funcionalidades:**
- ✅ Verifica sesión activa
- ✅ Obtiene rol del usuario desde la base de datos
- ✅ Redirige a login si no hay sesión
- ✅ Redirige al dashboard correcto si el usuario intenta acceder a una ruta no autorizada

### 2. Cliente Supabase para Server Components

**Archivos creados:**
- `lib/supabase/server.ts` - Cliente para Server Components
- `lib/supabase/middleware.ts` - Cliente para Middleware

### 3. Dashboards por Rol

#### 🔴 Admin Dashboard (`/admin`)

**Ubicación:** `app/admin/page.tsx`

**Características:**
- Vista general de toda la plataforma
- Estadísticas globales:
  - Total de usuarios
  - Total de restaurantes
  - Total de repartidores
  - Total de clientes
- Tabs para gestión:
  - Usuarios
  - Restaurantes
  - Repartidores

**Componentes:**
- `components/dashboard/admin/AdminDashboardContent.tsx`

#### 🍽️ Restaurant Dashboard (`/socios/dashboard`)

**Ubicación:** `app/socios/dashboard/page.tsx`

**Características:**
- Panel de control para restaurantes
- Estadísticas del restaurante:
  - Pedidos hoy
  - Pedidos del mes
  - Ingresos del mes
  - Calificación promedio
- Vista de pedidos recientes

**Nota:** La ruta `/socios` sigue siendo el formulario de registro

#### 👤 Client Dashboard (`/clientes/dashboard`)

**Ubicación:** `app/clientes/dashboard/page.tsx`

**Características:**
- Panel de control para clientes
- Estadísticas del cliente:
  - Pedidos activos
  - Total de pedidos
  - Restaurantes favoritos
  - Total gastado
- Vista de pedidos recientes
- Vista de restaurantes favoritos

#### 🚚 Delivery Dashboard (`/repartidores/dashboard`)

**Ubicación:** `app/repartidores/dashboard/page.tsx`

**Características:**
- Panel de control para repartidores
- Estadísticas del repartidor:
  - Entregas hoy
  - Entregas del mes
  - Ganancias del mes
  - Calificación promedio
- Vista de entregas disponibles
- Vista de entregas recientes

### 4. Componentes Compartidos

#### DashboardLayout (`components/dashboard/DashboardLayout.tsx`)

Layout común para todos los dashboards con:
- Header con logo
- Menú de usuario con:
  - Nombre/Email
  - Rol del usuario
  - Botón de cerrar sesión
- Área de contenido principal

#### StatCard (`components/dashboard/StatCard.tsx`)

Tarjeta de estadística reutilizable con:
- Título
- Valor
- Icono
- Tendencia opcional (↑ ↓)
- Colores personalizables (pink, blue, green, yellow, purple)

## 🔐 Flujo de Autenticación

### Login Flow

```
1. Usuario ingresa a /login
2. Completa formulario (email/password o Google OAuth)
3. Sistema valida credenciales
4. Sistema obtiene rol del usuario desde DB
5. Sistema redirige según rol:
   - admin → /admin
   - restaurant → /socios/dashboard
   - client → /clientes/dashboard
   - delivery → /repartidores/dashboard
```

### Protected Route Flow

```
1. Usuario intenta acceder a ruta protegida
2. Middleware intercepta la petición
3. Middleware verifica sesión
4. Si no hay sesión → Redirige a /login
5. Si hay sesión:
   a. Obtiene rol del usuario
   b. Verifica permisos para la ruta
   c. Si tiene permiso → Permite acceso
   d. Si no tiene permiso → Redirige a su dashboard
```

### Logout Flow

```
1. Usuario hace clic en "Cerrar Sesión"
2. Sistema llama a signOut()
3. Sistema limpia sesión de Supabase
4. Sistema redirige a /login
```

## 📁 Estructura de Archivos

```
donna-website/
├── middleware.ts                          # Protección de rutas
├── lib/
│   └── supabase/
│       ├── auth.ts                        # Funciones de autenticación
│       ├── client.ts                      # Cliente para Client Components
│       ├── server.ts                      # Cliente para Server Components ✨ NUEVO
│       └── middleware.ts                  # Cliente para Middleware ✨ NUEVO
├── components/
│   └── dashboard/
│       ├── DashboardLayout.tsx            # Layout compartido ✨ NUEVO
│       ├── StatCard.tsx                   # Tarjeta de estadística ✨ NUEVO
│       └── admin/
│           └── AdminDashboardContent.tsx  # Contenido admin ✨ NUEVO
├── app/
│   ├── admin/
│   │   └── page.tsx                       # Dashboard admin ✨ NUEVO
│   ├── socios/
│   │   ├── page.tsx                       # Formulario registro (existente)
│   │   └── dashboard/
│   │       └── page.tsx                   # Dashboard restaurant ✨ NUEVO
│   ├── clientes/
│   │   ├── page.tsx                       # Landing clientes (existente)
│   │   └── dashboard/
│   │       └── page.tsx                   # Dashboard client ✨ NUEVO
│   └── repartidores/
│       └── dashboard/
│           └── page.tsx                   # Dashboard delivery ✨ NUEVO
```

## 🚀 Cómo Usar

### Para Desarrolladores

1. **Crear un usuario de prueba:**
```sql
-- En Supabase SQL Editor
INSERT INTO users (id, email, full_name, role)
VALUES (
  'user-id-from-auth',
  'test@example.com',
  'Test User',
  'admin' -- o 'restaurant', 'client', 'delivery_agent'
);
```

2. **Probar el login:**
```
1. Ve a /login
2. Ingresa credenciales
3. Serás redirigido a tu dashboard según tu rol
```

3. **Probar protección de rutas:**
```
1. Intenta acceder a /admin sin sesión → Redirige a /login
2. Intenta acceder a /admin con rol 'client' → Redirige a /clientes/dashboard
```

### Para Usuarios

#### Admin:
```
1. Login → /admin
2. Ver estadísticas globales
3. Gestionar usuarios, restaurantes, repartidores
```

#### Restaurant:
```
1. Registro → /socios
2. Login → /socios/dashboard
3. Ver pedidos y estadísticas
```

#### Client:
```
1. Registro → /clientes (pendiente implementar)
2. Login → /clientes/dashboard
3. Ver pedidos y favoritos
```

#### Delivery:
```
1. Registro → /registro-repartidor
2. Login → /repartidores/dashboard
3. Ver entregas disponibles y ganancias
```

## 🔧 Configuración Requerida

### Variables de Entorno

Ya configuradas en `.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=https://cncvxfjsyrntilcbbcfi.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOi...
```

### Base de Datos

Tabla `users` debe tener:
```sql
- id (uuid, PK)
- email (text)
- full_name (text)
- role (text) -- 'admin', 'restaurant', 'client', 'delivery_agent'
- created_at (timestamp)
```

## 🎨 Personalización

### Cambiar Colores de StatCard

```tsx
<StatCard
  title="Mi Estadística"
  value={100}
  color="pink"  // pink, blue, green, yellow, purple
  icon={<svg>...</svg>}
/>
```

### Agregar Nuevas Secciones al Dashboard

```tsx
// En cualquier dashboard page.tsx
<div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
  <h3 className="text-lg font-semibold text-gray-900 mb-4">
    Nueva Sección
  </h3>
  {/* Tu contenido aquí */}
</div>
```

### Modificar el Layout

Edita `components/dashboard/DashboardLayout.tsx` para:
- Cambiar el header
- Agregar sidebar
- Modificar el menú de usuario

## 📊 Próximos Pasos

### Funcionalidades Pendientes:

1. **Admin Dashboard:**
   - [ ] Tabla de usuarios con paginación
   - [ ] Filtros y búsqueda
   - [ ] Acciones (editar, eliminar, suspender)
   - [ ] Gráficas de estadísticas

2. **Restaurant Dashboard:**
   - [ ] Lista de pedidos en tiempo real
   - [ ] Gestión de menú
   - [ ] Configuración del restaurante
   - [ ] Reportes de ventas

3. **Client Dashboard:**
   - [ ] Historial de pedidos completo
   - [ ] Seguimiento de pedidos activos
   - [ ] Gestión de direcciones
   - [ ] Métodos de pago

4. **Delivery Dashboard:**
   - [ ] Mapa con entregas disponibles
   - [ ] Aceptar/rechazar entregas
   - [ ] Navegación GPS
   - [ ] Historial de ganancias

5. **General:**
   - [ ] Notificaciones en tiempo real
   - [ ] Chat de soporte
   - [ ] Sistema de calificaciones
   - [ ] Reportes y analytics

## 🐛 Troubleshooting

### Error: "Redirect to login"
**Causa:** No hay sesión activa o el token expiró
**Solución:** Hacer login nuevamente

### Error: "Redirected to wrong dashboard"
**Causa:** El rol en la base de datos no coincide
**Solución:** Verificar el campo `role` en la tabla `users`

### Error: "Cannot read properties of null"
**Causa:** Usuario no existe en la tabla `users`
**Solución:** Crear el registro del usuario en la tabla

### Error: "Middleware not working"
**Causa:** El matcher no incluye la ruta
**Solución:** Agregar la ruta al `config.matcher` en `middleware.ts`

## 📚 Referencias

- [Next.js Middleware](https://nextjs.org/docs/app/building-your-application/routing/middleware)
- [Supabase Auth](https://supabase.com/docs/guides/auth)
- [Supabase SSR](https://supabase.com/docs/guides/auth/server-side-rendering)
- [Next.js Server Components](https://nextjs.org/docs/app/building-your-application/rendering/server-components)

## ✅ Checklist de Implementación

- [x] Middleware de protección de rutas
- [x] Cliente Supabase para Server Components
- [x] Cliente Supabase para Middleware
- [x] Dashboard de Admin
- [x] Dashboard de Restaurant
- [x] Dashboard de Client
- [x] Dashboard de Delivery
- [x] Componente DashboardLayout
- [x] Componente StatCard
- [x] Sistema de redirección por rol
- [x] Función de logout
- [x] Documentación completa

## 🎉 Resultado Final

Ahora cuando un usuario hace login:
1. ✅ Se valida su sesión
2. ✅ Se obtiene su rol de la base de datos
3. ✅ Se redirige automáticamente a su dashboard correspondiente
4. ✅ Solo puede acceder a las rutas permitidas para su rol
5. ✅ Puede cerrar sesión desde cualquier dashboard

**¡El sistema de sesiones y dashboards está completamente funcional!** 🚀
