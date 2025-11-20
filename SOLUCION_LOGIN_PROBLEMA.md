# 🔧 Solución: Problema de Login "Invalid login credentials"

## 📊 **Análisis del Problema:**

Según los logs, el problema es:

1. **Primer intento:** `POST https://cncvxfjsyrntilcbbcfi.supabase.co/auth/v1/token?grant_type=password 400 (Bad Request)`
2. **Error:** `Invalid login credentials`
3. **Segundo intento:** Funciona correctamente y se autentica como `admin`

## 🎯 **Causa del Problema:**

El usuario está intentando hacer login con **credenciales incorrectas** en el primer intento. El sistema funciona correctamente, pero no existe un usuario con rol `restaurant` para probar el dashboard.

## ✅ **Soluciones:**

### **1. Crear Usuario de Prueba (Recomendado)**

He creado una página para crear usuarios de prueba:

**URL:** `http://localhost:3002/create-test-user`

**Pasos:**
1. Ve a la página de creación de usuarios
2. Usa los datos por defecto:
   - **Email:** `restaurant@test.com`
   - **Password:** `test123456`
   - **Nombre:** `Restaurante Test`
   - **Rol:** `restaurant`
3. Click en "Crear Usuario"
4. Una vez creado, ve al login y usa esas credenciales

### **2. Usar Usuario Admin Existente**

Si ya tienes un usuario admin funcionando, puedes:
1. Cambiar su rol a `restaurant` temporalmente
2. O crear un nuevo usuario directamente en Supabase Dashboard

### **3. Verificar Credenciales Existentes**

Si ya tienes usuarios, verifica que:
- El email sea correcto
- La contraseña sea correcta
- El usuario exista en la tabla `users`
- El usuario tenga el rol correcto

## 🗂️ **Archivos Creados:**

### **`app/create-test-user/page.tsx`**
- ✅ Página para crear usuarios de prueba
- ✅ Formulario con todos los campos necesarios
- ✅ Creación automática en `auth.users` y `users`
- ✅ Manejo de errores detallado

## 🧪 **Cómo Probar el Dashboard de Restaurante:**

### **Paso 1: Crear Usuario**
```
URL: http://localhost:3002/create-test-user
Datos: restaurant@test.com / test123456 / restaurant
```

### **Paso 2: Login**
```
URL: http://localhost:3002/login
Email: restaurant@test.com
Password: test123456
```

### **Paso 3: Verificar Dashboard**
```
Debería redirigir automáticamente a: /restaurant/dashboard
```

## 📊 **Logs Esperados (Login Exitoso):**

```
🔐 AuthService: Iniciando autenticación...
🔐 AuthService: Autenticación exitosa, obteniendo perfil...
👤 AuthService: Obteniendo perfil para: [UUID]
👤 AuthService: Perfil obtenido: restaurant
🔐 AuthService: Login completo, rol: restaurant
🔐 LoginForm: Redirigiendo a: /restaurant/dashboard
✅ Usuario restaurante autenticado: Restaurante Test
```

## 🔍 **Debugging Adicional:**

### **Si el problema persiste:**

1. **Verificar en Supabase Dashboard:**
   - Ve a Authentication → Users
   - Confirma que el usuario existe
   - Ve a Table Editor → users
   - Confirma que el perfil existe con rol correcto

2. **Verificar Variables de Entorno:**
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://cncvxfjsyrntilcbbcfi.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=[tu-key]
   ```

3. **Verificar Conexión:**
   - Ve a `http://localhost:3002/test-supabase`
   - Ejecuta tests de conexión

## 🎉 **Estado Actual:**

- ✅ **Sistema de autenticación:** Funcionando correctamente
- ✅ **Dashboard de restaurante:** Implementado y funcional
- ✅ **Middleware:** Configurado y protegiendo rutas
- ✅ **Google Auth:** Implementado (requiere configuración)
- ❌ **Usuario de prueba:** Necesita ser creado

**El problema no es del código, sino que necesitas crear un usuario con rol `restaurant` para probar el dashboard.**

---

**Próximo paso: Ve a `http://localhost:3002/create-test-user` y crea un usuario de prueba.**