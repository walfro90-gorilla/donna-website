# 🔐 Configuración de Google Authentication

## ✅ **Estado Actual:**
- ✅ **Botón de Google Auth** implementado en LoginForm
- ✅ **Función signInWithGoogle()** en AuthService
- ✅ **Página de callback** `/auth/callback` creada
- ✅ **Creación automática de perfiles** para usuarios nuevos
- ✅ **Error en página `/restaurant`** corregido (await createClient())

## 🔧 **Configuración Requerida en Supabase:**

### 1. **Habilitar Google Provider:**
1. Ve a **Supabase Dashboard** → **Authentication** → **Providers**
2. Busca **Google** y habilítalo
3. Necesitarás configurar:
   - **Client ID** de Google
   - **Client Secret** de Google

### 2. **Configurar Google Cloud Console:**
1. Ve a [Google Cloud Console](https://console.cloud.google.com/)
2. Crea un proyecto o selecciona uno existente
3. Ve a **APIs & Services** → **Credentials**
4. Crea **OAuth 2.0 Client IDs**
5. Configura **Authorized redirect URIs**:
   ```
   https://[TU-PROYECTO-ID].supabase.co/auth/v1/callback
   ```

### 3. **Configurar URLs en Supabase:**
En **Authentication** → **URL Configuration**:

**Para Desarrollo:**
```
Site URL: http://localhost:3001
Redirect URLs: http://localhost:3001/auth/callback
```

**Para Producción:**
```
Site URL: https://tudominio.com
Redirect URLs: https://tudominio.com/auth/callback
```

## 🧪 **Cómo Probar:**

### 1. **Página de Prueba:**
Ve a: `http://localhost:3001/test-google-auth`
- Botón de prueba aislado
- Logs detallados
- Manejo de errores

### 2. **Login Principal:**
Ve a: `http://localhost:3001/login`
- Debería mostrar el botón "Continuar con Google"
- Separador visual "O continúa con"
- Icono oficial de Google

### 3. **Flujo Completo:**
1. Click en "Continuar con Google"
2. Redirige a Google para autenticación
3. Google redirige a `/auth/callback`
4. Se procesa la sesión y crea/obtiene perfil
5. Redirige al dashboard según rol

## 🐛 **Problemas Solucionados:**

### ❌ **Error: "Cannot read properties of undefined (reading 'getSession')"**
**Causa:** `createClient()` es async pero no se esperaba
**Solución:** Cambiar `const supabase = createClient()` por `const supabase = await createClient()`

### ❌ **Botón de Google no aparece**
**Verificar:**
1. ✅ AuthService.signInWithGoogle() existe
2. ✅ LoginForm importa AuthService
3. ✅ Función handleGoogleLogin está implementada
4. ✅ JSX del botón está en el render

## 📊 **Logs Esperados:**

### **Desarrollo (sin configurar Google):**
```
🔐 AuthService: Iniciando Google OAuth...
🔐 AuthService: Error en Google OAuth: [mensaje de error]
❌ Error: [mensaje en español]
```

### **Producción (configurado correctamente):**
```
🔐 AuthService: Iniciando Google OAuth...
🔐 AuthService: Google OAuth iniciado correctamente
[Redirige a Google]
🔐 AuthCallback: Procesando callback de Google...
👤 AuthService: Creando perfil para usuario nuevo
🔐 AuthCallback: Usuario autenticado: client
```

## 🎯 **Próximos Pasos:**

1. **Configurar Google Cloud Console**
2. **Obtener Client ID y Secret**
3. **Configurar en Supabase Dashboard**
4. **Probar en `http://localhost:3001/test-google-auth`**
5. **Probar flujo completo en `/login`**

## 🔒 **Seguridad:**

- ✅ **Rol por defecto:** `client` (más seguro)
- ✅ **Email verificado:** `true` (Google pre-verifica)
- ✅ **Validación de sesión** antes de crear perfil
- ✅ **Manejo de errores** sin exponer datos sensibles

---

**El código está listo. Solo necesitas configurar Google OAuth en Supabase Dashboard.**