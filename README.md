# Doña Repartos - Webapp Fullstack

Plataforma de entrega de comida que conecta restaurantes locales, clientes y repartidores.

## Características

- **Registro de Clientes**: Formulario completo con validación en tiempo real
- **Registro de Restaurantes**: Inscripción de socios con autocompletado de dirección
- **Registro de Repartidores**: Formulario optimizado para delivery drivers
- **UI/UX Responsive**: Diseño optimizado para desktop y móvil
- **Validación en Tiempo Real**: Verificación de email, teléfono y disponibilidad
- **Manejo de Errores**: Sistema centralizado de manejo de errores
- **Accesibilidad**: ARIA labels, navegación por teclado, focus states

## Tecnologías

- **Framework**: Next.js 15.5.6 (App Router)
- **Lenguaje**: TypeScript 5+
- **Estilos**: Tailwind CSS 4
- **Backend**: Supabase (Autenticación y Base de Datos)
- **Maps**: Google Maps API (Places Autocomplete)

## Configuración

### Variables de Entorno

Crea un archivo `.env.local` en la raíz del proyecto con las siguientes variables:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Google Maps API
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_google_maps_api_key
```

### Instalación

```bash
npm install
```

### Desarrollo

```bash
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000) en tu navegador.

### Build

```bash
npm run build
npm start
```

## Estructura del Proyecto

```
donna-website/
├── app/                    # Next.js App Router
│   ├── clientes/          # Registro de clientes
│   ├── socios/            # Registro de restaurantes
│   ├── repartidores/      # Registro de repartidores
│   ├── page.tsx           # Homepage
│   ├── layout.tsx         # Layout principal
│   └── globals.css        # Estilos globales
├── components/             # Componentes reutilizables
│   ├── FormField.tsx      # Campo de formulario
│   ├── FormButton.tsx     # Botón con estados
│   ├── PasswordStrength.tsx # Indicador de fuerza de contraseña
│   ├── AddressAutocomplete.tsx # Autocompletado de direcciones
│   ├── Header.tsx         # Navegación principal
│   └── Footer.tsx         # Pie de página
├── lib/
│   ├── hooks/            # Hooks personalizados
│   ├── utils/             # Utilidades (validación, errores, etc.)
│   └── supabase/          # Cliente Supabase
└── types/                 # Tipos TypeScript
```

## Funciones de Supabase Requeridas

La aplicación requiere las siguientes funciones RPC en Supabase:

- `validate_email(p_email text, p_user_type text)`
- `validate_phone(p_phone text, p_user_type text)`
- `validate_name(p_name text, p_user_type text)` (para restaurantes)
- `register_restaurant_v2(...)` (para restaurantes)
- `register_client_v2(...)` (para clientes)

## Mejoras Implementadas

### UI/UX
- ✅ Diseño responsive optimizado para móvil y desktop
- ✅ Componentes reutilizables con estilos consistentes
- ✅ Validación en tiempo real con feedback visual
- ✅ Indicador de fuerza de contraseña
- ✅ Manejo de estados de carga
- ✅ Mensajes de error claros y amigables

### Accesibilidad
- ✅ ARIA labels en todos los elementos interactivos
- ✅ Navegación por teclado mejorada
- ✅ Focus states visibles
- ✅ Skip links para navegación
- ✅ Contraste de colores optimizado

### Funcionalidad
- ✅ Registro completo de clientes, restaurantes y repartidores
- ✅ Validación de email, teléfono y nombres únicos
- ✅ Autocompletado de direcciones con Google Maps
- ✅ Manejo centralizado de errores
- ✅ Tipos TypeScript completos

## Licencia

Este proyecto es privado.
