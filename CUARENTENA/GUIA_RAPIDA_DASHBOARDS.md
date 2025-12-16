# 🚀 Guía Rápida: Sistema de Dashboards

## ✅ ¿Qué se implementó?

Se creó un sistema completo de autenticación y dashboards personalizados para cada tipo de usuario.

## 🎯 Dashboards Creados

| Rol | Ruta | Descripción |
|-----|------|-------------|
| **Admin** | `/admin` | Panel de administración completo |
| **Restaurant** | `/socios/dashboard` | Panel para gestionar restaurante |
| **Client** | `/clientes/dashboard` | Panel para ver pedidos y favoritos |
| **Delivery** | `/repartidores/dashboard` | Panel para gestionar entregas |

## 🔐 Flujo de Login

```
Usuario hace login → Sistema verifica rol → Redirige a su dashboard
```

### Redirecciones Automáticas:

- **Admin** → `/admin`
- **Restaurant** → `/socios/dashboard`
- **Client** → `/clientes/dashboard`
- **Delivery** → `/repartidores/dashboard`

## 🧪 Cómo Probar

### 1. Crear Usuario de Prueba en Supabase

Ve a Supabase Dashboard → SQL Editor y ejecuta:

```sql
-- Para crear un admin
INSERT INTO users (id, email, full_name, role, phone, created_at)
VALUES (
  'auth-user-id-aqui',  -- Reemplaza con el ID del usuario de Auth
  'admin@dona.app',
  'Admin Test',
  'admin',
  '1234567890',
  NOW()
);

-- Para crear un restaurante
INSERT INTO users (id, email, full_name, role, phone, created_at)
VALUES (
  'auth-user-id-aqui',
  'restaurant@dona.app',
  'Restaurant Test',
  'restaurant',
  '1234567890',
  NOW()
);

-- Para crear un cliente
INSERT INTO users (id, email, full_name, role, phone, created_at)
VALUES (
  'auth-user-id-aqui',
  'client@dona.app',
  'Client Test',
  'client',
  '1234567890',
  NOW()
);

-- Para crear un repartidor
INSERT INTO users (id, email, full_name, role, phone, created_at)
VALUES (
  'auth-user-id-aqui',
  'delivery@dona.app',
  'Delivery Test',
  'delivery_agent',
  '1234567890',
  NOW()
);
```

**Nota:** Primero debes crear el usuario en Supabase Auth, luego usar su ID en la tabla `users`.

### 2. Probar el Login

1. Inicia el servidor de desarrollo:
```bash
npm run dev
```

2. Ve a `http://localhost:3000/login`

3. Ingresa las credenciales del usuario que creaste

4. Deberías ser redirigido automáticamente a tu dashboard según tu rol

### 3. Probar Protección de Rutas

Intenta acceder directamente a:
- `http://localhost:3000/admin` (sin login) → Redirige a `/login`
- `http://localhost:3000/admin` (con rol 'client') → Redirige a `/clientes/dashboard`

## 📱 Características de Cada Dashboard

### 🔴 Admin Dashboard

**Estadísticas:**
- Total de usuarios
- Total de restaurantes
- Total de repartidores
- Total de clientes

**Tabs:**
- Gestión de usuarios
- Gestión de restaurantes
- Gestión de repartidores

### 🍽️ Restaurant Dashboard

**Estadísticas:**
- Pedidos hoy
- Pedidos del mes
- Ingresos del mes
- Calificación promedio

**Secciones:**
- Pedidos recientes

### 👤 Client Dashboard

**Estadísticas:**
- Pedidos activos
- Total de pedidos
- Restaurantes favoritos
- Total gastado

**Secciones:**
- Pedidos recientes
- Restaurantes favoritos

### 🚚 Delivery Dashboard

**Estadísticas:**
- Entregas hoy
- Entregas del mes
- Ganancias del mes
- Calificación promedio

**Secciones:**
- Entregas disponibles
- Entregas recientes

## 🎨 Componentes Principales

### DashboardLayout
Layout compartido con:
- Header con logo
- Menú de usuario
- Botón de cerrar sesión

### StatCard
Tarjeta de estadística con:
- Título
- Valor
- Icono
- Color personalizable

## 🔧 Archivos Importantes

```
middleware.ts                              # Protege las rutas
lib/supabase/server.ts                     # Cliente para Server Components
lib/supabase/middleware.ts                 # Cliente para Middleware
components/dashboard/DashboardLayout.tsx   # Layout compartido
components/dashboard/StatCard.tsx          # Tarjeta de estadística
app/admin/page.tsx                         # Dashboard admin
app/socios/dashboard/page.tsx              # Dashboard restaurant
app/clientes/dashboard/page.tsx            # Dashboard client
app/repartidores/dashboard/page.tsx        # Dashboard delivery
```

## 🐛 Solución de Problemas Comunes

### "Redirect to login" al intentar acceder al dashboard

**Causa:** No hay sesión activa

**Solución:**
1. Ve a `/login`
2. Ingresa tus credenciales
3. Intenta acceder al dashboard nuevamente

### "Redirected to wrong dashboard"

**Causa:** El rol en la base de datos no coincide con el esperado

**Solución:**
1. Ve a Supabase Dashboard
2. Tabla `users`
3. Verifica que el campo `role` sea correcto:
   - `admin` para administradores
   - `restaurant` para restaurantes
   - `client` para clientes
   - `delivery_agent` para repartidores

### Usuario no existe en la tabla users

**Causa:** El usuario existe en Auth pero no en la tabla `users`

**Solución:**
1. Obtén el ID del usuario de Supabase Auth
2. Inserta un registro en la tabla `users` con ese ID

## 📊 Próximos Pasos

Para hacer los dashboards completamente funcionales, necesitas:

1. **Conectar con datos reales:**
   - Crear tablas de pedidos
   - Crear tablas de entregas
   - Crear relaciones entre tablas

2. **Agregar funcionalidades:**
   - CRUD de usuarios (admin)
   - Gestión de pedidos (restaurant)
   - Historial de pedidos (client)
   - Aceptar entregas (delivery)

3. **Mejorar UI/UX:**
   - Agregar gráficas
   - Agregar tablas con paginación
   - Agregar filtros y búsqueda
   - Agregar notificaciones en tiempo real

## 🎉 ¡Listo!

Ahora tienes un sistema completo de dashboards con:
- ✅ Autenticación por rol
- ✅ Protección de rutas
- ✅ Redirección automática
- ✅ Dashboards personalizados
- ✅ Componentes reutilizables
- ✅ Diseño responsive

**¡Tu aplicación está lista para crecer!** 🚀

---

## 📞 Soporte

Si tienes problemas:
1. Revisa `SISTEMA_DASHBOARDS.md` para documentación completa
2. Verifica las variables de entorno con `npm run verify:env`
3. Revisa la consola del navegador para errores
4. Verifica los logs de Supabase

## 📚 Documentación Adicional

- `SISTEMA_DASHBOARDS.md` - Documentación técnica completa
- `SOLUCION_MAPA_PRODUCCION.md` - Guía de variables de entorno
- `VERCEL_DEPLOYMENT_GUIDE.md` - Guía de despliegue en Vercel
