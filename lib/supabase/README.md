# Configuración de Base de Datos Supabase

## 🔄 Reutilizar Funciones RPC Existentes (RECOMENDADO)

**Si ya tienes una app Flutter con funciones RPC**, es mejor reutilizar esas funciones para mantener consistencia.

### 1. Configurar funciones existentes

Edita el archivo `lib/supabase/rpc-config.ts` y actualiza los nombres de las funciones que ya usas en Flutter:

```typescript
export const PROJECT_RPC_FUNCTIONS = {
  emailValidation: 'tu_funcion_validar_email',        // ← Nombre real de tu función
  phoneValidation: 'tu_funcion_validar_telefono',     // ← O null si no tienes
  userProfileEnsure: 'tu_funcion_crear_perfil',       // ← Nombre real de tu función
  deliveryAgentRegister: 'tu_funcion_registrar_repartidor', // ← Nombre real
};
```

### 2. Verificar parámetros

Asegúrate de que los parámetros coincidan con los que espera tu función de Flutter.

## 🆕 Crear Funciones RPC Nuevas (Solo si no tienes Flutter app)

Si no tienes funciones existentes, ejecuta el contenido del archivo `rpc-functions.sql` en tu dashboard de Supabase → SQL Editor.

### 2. Verificar el Schema

Asegúrate de que tu base de datos tenga las siguientes tablas con la estructura correcta:

#### Tabla `users`
```sql
- id (uuid, PK, FK a auth.users)
- email (text, UNIQUE, NOT NULL) ✅
- name (text)
- phone (text) ⚠️ NO es UNIQUE
- role (text, CHECK constraint con valores: 'client', 'restaurant', 'delivery_agent', 'admin')
```

#### Tabla `restaurants`
```sql
- id (uuid, PK)
- user_id (uuid, FK a users, UNIQUE)
- name (text, UNIQUE, NOT NULL) ✅
- address (text)
- phone (text)
- ... otros campos del restaurante
```

#### Tabla `delivery_agent_profiles`
```sql
- user_id (uuid, PK, FK a users)
- status (enum: 'pending', 'approved', 'rejected', etc.)
- account_state (enum: 'pending', 'active', etc.)
- ... otros campos del perfil
```

### 3. Validaciones Implementadas

#### ✅ Email (usuarios)
- Tiene constraint UNIQUE en la tabla `users`
- Se valida en tiempo real con `check_email_availability()`
- Muestra indicadores visuales de disponibilidad

#### ✅ Nombre de Restaurante
- Tiene constraint UNIQUE en la tabla `restaurants`
- Se valida en tiempo real con `check_restaurant_name_availability()`
- Muestra indicadores visuales de disponibilidad

#### ⚠️ Teléfono
- NO tiene constraint UNIQUE en la tabla `users`
- No se valida disponibilidad (por diseño del schema actual)
- Solo validación de formato

#### ✅ Email
- Tiene constraint UNIQUE en la tabla `users`
- Se valida en tiempo real con `check_email_availability()`
- Muestra indicadores visuales de disponibilidad

#### ⚠️ Teléfono
- NO tiene constraint UNIQUE en la tabla `users`
- No se valida disponibilidad (por diseño del schema actual)
- Solo validación de formato

### 4. Flujo de Registro

1. **Validación de email** - Verifica disponibilidad en tiempo real
2. **Signup en Auth** - Crea usuario en Supabase Auth
3. **Perfil de usuario** - Crea/actualiza registro en tabla `users`
4. **Perfil de repartidor** - Crea registro en `delivery_agent_profiles`
5. **Cuenta financiera** - Crea cuenta en tabla `accounts`
6. **Notificación admin** - Notifica a administradores del nuevo registro

### 5. Roles y Permisos

Asegúrate de que las funciones RPC tengan `SECURITY DEFINER` para que puedan ejecutarse con permisos elevados y acceder a todas las tablas necesarias.

### 6. Troubleshooting

Si encuentras errores:

1. **Función no encontrada**: Ejecuta las funciones RPC del archivo `rpc-functions.sql`
2. **Permisos**: Verifica que las funciones tengan `SECURITY DEFINER`
3. **Constraint violations**: Revisa que el schema coincida con `DATABASE_SCHEMA.sql`
4. **Auth errors**: Verifica la configuración de Supabase Auth

### 7. Testing

Para probar el registro:

1. Ve a `/registro-repartidor`
2. Completa el formulario
3. Verifica que se cree el usuario en Auth
4. Verifica que se creen los registros en `users` y `delivery_agent_profiles`
5. Verifica que aparezca la notificación en `admin_notifications`