# Backend Blueprint — Doña Repartos

> Documento de referencia para integrar WhatsApp con la infraestructura existente.
> Escrito para que un agente IA (clawbot) entienda cómo funciona el sistema y pueda crear la integración sin romper nada.

---

## 1. Resumen de la plataforma

**Doña Repartos** es un marketplace de delivery de comida con 4 roles de usuario.

| Stack | Tecnología |
|-------|-----------|
| Frontend | Next.js 15.5 + React 19 + TypeScript |
| Base de datos | Supabase (PostgreSQL 15) |
| Auth | Supabase Auth (email/password + Google OAuth) |
| Realtime | Supabase Realtime (WebSockets sobre Postgres) |
| Storage | Supabase Storage (S3-compatible) |
| Edge Functions | Deno (TypeScript) desplegadas en Supabase |
| Geocodificación | Google Maps API (via edge function proxy) |

---

## 2. Roles de usuario

| Rol en DB | Dashboard | Descripción |
|-----------|-----------|-------------|
| `admin` | `/admin` | Gestiona todo el sistema |
| `restaurant` | `/restaurant/dashboard` | Recibe y gestiona pedidos |
| `client` | `/client/dashboard` | Hace pedidos |
| `delivery_agent` | `/delivery_agent/dashboard` | Entrega pedidos |

Cada rol tiene:
- Perfil dedicado en la DB
- RLS policies propias (Row Level Security)
- Rutas protegidas por middleware de Next.js

---

## 3. Diagrama de tablas y relaciones

```
auth.users (Supabase interno)
    │
    └── users (tabla pública principal)
           │
           ├── user_preferences (1:1) — onboarding, login history
           ├── accounts (1:1) — balance financiero
           │     ├── account_transactions (1:N)
           │     └── settlements (N:N con otras accounts)
           │
           ├── restaurants (1:1, solo role=restaurant)
           │     ├── products (1:N)
           │     │     └── product_combos (1:N)
           │     │           └── product_combo_items (N:N → products)
           │     └── reviews (1:N)
           │
           ├── client_profiles (1:1, solo role=client)
           ├── delivery_agent_profiles (1:1, solo role=delivery_agent)
           │
           └── orders (1:N, como cliente — user_id)
                 │
                 ├── order_items (1:N) → products
                 ├── order_status_updates (1:N)
                 ├── payments (1:1)
                 ├── reviews (1:N)
                 ├── client_debts (0:1)
                 └── courier_locations_history (1:N)

courier_locations_latest (1:1 con users — repartidor activo)
admin_notifications (log de eventos admin)
```

---

## 4. Esquema de tablas clave

### `users`
```sql
id              uuid PRIMARY KEY  -- igual que auth.users.id
email           text UNIQUE
name            text
phone           text              -- formato libre, idealmente E.164
role            text              -- CHECK: 'client','restaurant','delivery_agent','admin'
email_confirm   boolean
created_at      timestamptz
updated_at      timestamptz
```

### `restaurants`
```sql
id                              uuid PRIMARY KEY
user_id                         uuid UNIQUE → users.id
name                            text UNIQUE
phone                           text
address                         text
online                          boolean         -- true = acepta pedidos ahora
status                          text            -- 'pending','approved','rejected'
delivery_radius_km              numeric         -- default 5.0
min_order_amount                numeric         -- default 0.0
estimated_delivery_time_minutes integer         -- default 30
commission_bps                  integer         -- 0-3000 (basis points, 1500 = 15%)
location_lat                    double precision
location_lon                    double precision
cuisine_type                    text
business_hours                  jsonb
created_at / updated_at         timestamptz
```

### `products`
```sql
id            uuid PRIMARY KEY
restaurant_id uuid → restaurants.id
name          text
description   text
price         numeric
image_url     text
is_available  boolean  -- default true
type          enum     -- 'principal','bebida','complemento','postre'
contains      jsonb    -- ingredientes/composición
created_at / updated_at timestamptz
```

### `orders` ⬅ tabla central para WhatsApp
```sql
id                        uuid PRIMARY KEY
user_id                   uuid → users.id          -- cliente que hace el pedido
restaurant_id             uuid → restaurants.id
delivery_agent_id         uuid → users.id          -- repartidor asignado (nullable)
restaurant_account_id     uuid → users.id

status                    text  -- ver máquina de estados abajo
payment_method            text  -- 'cash' | 'card'
payment_status            text  -- 'pending','paid','failed','refunded'

total_amount              numeric  -- subtotal + delivery_fee
subtotal                  numeric  -- solo productos
delivery_fee              numeric  -- default 3.0 MXN

delivery_address          text
delivery_lat              double precision
delivery_lon              double precision
delivery_place_id         text
delivery_address_structured jsonb

order_notes               text   -- instrucciones especiales
cancellation_reason       text

confirm_code              varchar  -- código para confirmar entrega
pickup_code               varchar  -- código para confirmar recolección

assigned_at               timestamptz
delivery_time             timestamptz
pickup_time               timestamptz
created_at / updated_at   timestamptz
```

### `order_items`
```sql
id                       uuid PRIMARY KEY
order_id                 uuid → orders.id
product_id               uuid → products.id
quantity                 integer  -- default 1
price_at_time_of_order   numeric  -- precio congelado al momento de ordenar
unit_price               numeric  -- default 0.00
created_at               timestamptz
```

### `order_status_updates`
```sql
id                bigint PRIMARY KEY
order_id          uuid → orders.id
status            text
actor_role        text    -- quién cambió el status
actor_id          uuid    -- user_id del actor
updated_by_user_id uuid → users.id
notes             text
created_at        timestamptz
```

### `accounts`
```sql
id           uuid PRIMARY KEY
user_id      uuid UNIQUE → users.id
account_type text  -- 'client','restaurant','delivery_agent','platform','platform_revenue','platform_payables'
balance      numeric  -- default 0.00
created_at / updated_at timestamptz
```

### `account_transactions`
```sql
id            uuid PRIMARY KEY
account_id    uuid → accounts.id
type          text  -- ver tipos abajo
amount        numeric
order_id      uuid → orders.id (nullable)
settlement_id uuid → settlements.id (nullable)
description   text
metadata      jsonb
created_at    timestamptz
```

Tipos de transacción:
- `ORDER_REVENUE` — ingreso del restaurante
- `PLATFORM_COMMISSION` — comisión de la plataforma
- `DELIVERY_EARNING` — pago al repartidor
- `CASH_COLLECTED` — efectivo recolectado
- `SETTLEMENT_PAYMENT` / `SETTLEMENT_RECEPTION` — liquidaciones entre partes
- `RESTAURANT_PAYABLE` / `DELIVERY_PAYABLE` — deudas pendientes
- `PLATFORM_DELIVERY_MARGIN` — margen de delivery de la plataforma
- `PLATFORM_NOT_DELIVERED_REFUND` — reembolso por pedido no entregado
- `CLIENT_DEBT` — deuda del cliente

### `client_debts`
```sql
id           uuid PRIMARY KEY
client_id    uuid → users.id
order_id     uuid → orders.id
amount       numeric
reason       text  -- 'not_delivered','client_no_show','fake_address','other'
status       text  -- 'pending','paid','forgiven','disputed'
created_at / updated_at timestamptz
```

### `courier_locations_latest`
```sql
user_id      uuid PRIMARY KEY → users.id  -- repartidor
order_id     uuid → orders.id
lat          double precision
lon          double precision
accuracy     double precision
speed        double precision
heading      double precision
last_seen_at timestamptz
```

---

## 5. Máquina de estados de órdenes

```
CLIENTE CREA PEDIDO
      │
      ▼
  [pending]
      │  Restaurante confirma
      ▼
 [confirmed]
      │  Restaurante empieza
      ▼
 [preparing] / [in_preparation]
      │  Listo para recoger
      ▼
[ready_for_pickup]
      │  Se asigna repartidor
      ▼
 [assigned]
      │  Repartidor recoge
      ▼
 [picked_up]
      │  En camino
      ▼
[on_the_way] / [in_transit]
      │  Entregado
      ▼
 [delivered] ✅

En cualquier punto → [cancelled] ❌
Al entregar, si falla → [not_delivered] ❌
```

> **Para WhatsApp:** crear órdenes con `status = 'pending'`. El restaurante las verá en su dashboard en tiempo real via Supabase Realtime.

---

## 6. RPC Functions (Stored Procedures en PostgreSQL)

Estas funciones se llaman con `supabase.rpc('nombre_funcion', { params })`.

### Validación
```typescript
// Verificar si un teléfono ya existe
supabase.rpc('check_phone_availability', { p_phone: '+521234567890' })
// → { data: true/false }

// Verificar si un email ya existe
supabase.rpc('check_email_availability', { p_email: 'user@email.com' })
// → { data: true/false }
```

### Obtener perfil de usuario
```typescript
supabase.rpc('get_user_profile', { user_uuid: 'uuid-del-usuario' })
// → { id, email, name, role, phone, email_confirm, created_at }
```

### Registro de usuarios
```typescript
// Registro atómico de restaurante (crea user + restaurant + account en 1 transacción)
supabase.rpc('register_restaurant_v2', {
  p_user_id, p_email, p_restaurant_name,
  p_phone, p_address, p_location_lat, p_location_lon,
  p_location_place_id, p_address_structured
})

// Registro atómico de repartidor
supabase.rpc('register_delivery_agent_atomic', {
  p_user_id, p_email, p_name, p_phone,
  p_vehicle_type: 'motocicleta',
  // ... otros campos de vehículo
})
```

> **Nota:** Para registrar clientes nuevos desde WhatsApp se puede usar `register_client_v2` (si existe) o insertar directamente en `users` + `accounts` + `client_profiles`.

---

## 7. Edge Functions existentes

Solo existe **una** edge function desplegada actualmente:

### `google-maps-proxy`
**URL:** `https://[project-ref].supabase.co/functions/v1/google-maps-proxy`
**Método:** `POST`
**Auth:** Bearer token (anon key o service role)

Usos:

```typescript
// Autocompletar dirección
{ input: "Av Insurgentes", components: "country:mx", types: "geocode", language: "es" }

// Obtener detalles de un lugar
{ placeId: "ChIJ...", fields: "geometry,formatted_address,name" }

// Geocodificar dirección a coordenadas
{ address: "Av Insurgentes Sur 1234, CDMX" }

// Reverse geocoding (coordenadas → dirección)
{ latlng: "19.4326,-99.1332" }
```

> **Para WhatsApp:** usar esta edge function para convertir la dirección que escribe el usuario en coordenadas y dirección estructurada para guardar en `orders.delivery_lat/lon/address_structured`.

---

## 8. Sistema de autenticación

```
Supabase Auth
├── Email + Password → supabase.auth.signInWithPassword()
├── Google OAuth    → supabase.auth.signInWithOAuth()
└── Sesiones        → cookies HTTP-only (SSR-safe via @supabase/ssr)

Middleware (middleware.ts)
└── Protege: /admin, /restaurant, /client/dashboard, /delivery_agent/dashboard
    └── Verifica sesión → consulta tabla users → valida rol → redirige si no autorizado

RPC get_user_profile() → fuente de verdad para rol del usuario
```

> **Para WhatsApp:** la edge function de webhook usará `SUPABASE_SERVICE_ROLE_KEY` para operar como admin y bypassear RLS. No necesita sesión de usuario.

---

## 9. Sistema financiero (cómo fluye el dinero)

Cada orden genera transacciones automáticas en `account_transactions`:

```
Orden de $100 MXN, comisión restaurante = 15% (1500 bps), delivery_fee = $3 MXN:

Cliente paga: $103 MXN (total_amount)
  │
  ├── Restaurante recibe: $85 MXN (ORDER_REVENUE, ya descontada comisión)
  ├── Plataforma recibe: $15 MXN (PLATFORM_COMMISSION)
  └── Repartidor recibe: $3 MXN (DELIVERY_EARNING)

Si el cliente paga en efectivo y no se entrega → client_debts
```

> La comisión se calcula con `commission_bps` del restaurante. Default: 1500 = 15%.

---

## 10. Storage Buckets

| Bucket | Visibilidad | Contenido |
|--------|-------------|-----------|
| `restaurant-images` | Público | Logos, portadas, fachadas |
| `profile-images` | Público | Avatares de usuarios |
| `vehicle-images` | Público | Fotos de vehículos |
| `documents` | Privado | Documentos legales (INE, permisos) |

URLs públicas: `https://[project-ref].supabase.co/storage/v1/object/public/[bucket]/[path]`

---

## 11. Supabase Realtime (notificaciones en tiempo real)

Los dashboards escuchan cambios vía WebSocket:

```typescript
// Ejemplo: restaurante escucha nuevas órdenes
supabase
  .channel('restaurant-orders')
  .on('postgres_changes', {
    event: 'INSERT',
    schema: 'public',
    table: 'orders',
    filter: `restaurant_id=eq.${restaurantId}`
  }, (payload) => {
    // Nueva orden llegó — actualizar UI
  })
  .subscribe()
```

> **Para WhatsApp:** cuando el bot inserte una orden, el restaurante la verá automáticamente sin necesidad de polling. También se puede usar Realtime desde la edge function para suscribirse a cambios de status y notificar al cliente vía WhatsApp.

---

## 12. Qué NO existe aún (gaps a llenar para WhatsApp)

| Gap | Descripción |
|-----|-------------|
| Webhook endpoint | No hay `supabase/functions/whatsapp-webhook/` |
| Orden via API | Órdenes solo se crean desde el frontend directamente |
| Notificaciones outbound | Sin envío de WhatsApp/SMS/push saliente |
| Cart/Checkout UI | No implementado en el frontend aún |
| Endpoint público de menú | No hay REST endpoint para consultar menú |
| Búsqueda de restaurantes | No hay endpoint de búsqueda por zona |

---

## 13. Guía de integración WhatsApp para el clawbot

### A. Crear la Edge Function de webhook

**Archivo:** `supabase/functions/whatsapp-webhook/index.ts`
**URL:** `https://[project-ref].supabase.co/functions/v1/whatsapp-webhook`

```typescript
// Estructura básica del webhook
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')! // Service role bypasea RLS
)

Deno.serve(async (req) => {
  // 1. Verificar firma del proveedor (Twilio o Meta)
  // 2. Parsear mensaje entrante
  // 3. Identificar/crear usuario
  // 4. Procesar intención (ver menú, hacer pedido, ver status)
  // 5. Crear orden en DB
  // 6. Responder con WhatsApp outbound
})
```

### B. Identificar al usuario por teléfono

```typescript
// El número llega en formato E.164 desde Twilio/Meta: +521234567890
const phone = incomingMessage.from // e.g. 'whatsapp:+521234567890'
const phoneNumber = phone.replace('whatsapp:', '')

const { data: user } = await supabase
  .from('users')
  .select('id, name, role, email')
  .eq('phone', phoneNumber)
  .single()

if (!user) {
  // Registrar nuevo cliente
  // Opción 1: crear en auth + users + accounts + client_profiles
  // Opción 2: pedir email al usuario primero y usar signUp
}
```

### C. Consultar restaurantes disponibles

```typescript
const { data: restaurants } = await supabase
  .from('restaurants')
  .select('id, name, address, estimated_delivery_time_minutes, min_order_amount, cuisine_type')
  .eq('status', 'approved')
  .eq('online', true)
  .order('name')
```

### D. Consultar menú de un restaurante

```typescript
const { data: products } = await supabase
  .from('products')
  .select('id, name, description, price, type, is_available')
  .eq('restaurant_id', restaurantId)
  .eq('is_available', true)
  .order('type')
  .order('name')

// Agrupar por type para mostrar al usuario:
// PLATOS PRINCIPALES: Tacos de pastor $45, Quesadillas $35...
// BEBIDAS: Agua $15, Refresco $20...
// COMPLEMENTOS: Guacamole $15...
// POSTRES: Flan $25...
```

### E. Crear la orden

```typescript
// 1. Calcular totales
const subtotal = items.reduce((sum, item) => sum + (item.price * item.qty), 0)
const deliveryFee = 3.00
const totalAmount = subtotal + deliveryFee

// 2. Insertar orden
const { data: order, error } = await supabase
  .from('orders')
  .insert({
    user_id: clientUserId,
    restaurant_id: restaurantId,
    status: 'pending',
    payment_method: 'cash', // WhatsApp = siempre efectivo inicialmente
    payment_status: 'pending',
    total_amount: totalAmount,
    subtotal: subtotal,
    delivery_fee: deliveryFee,
    delivery_address: clientAddress,
    delivery_lat: clientLat,
    delivery_lon: clientLon,
    order_notes: userNotes ?? null,
  })
  .select()
  .single()

// 3. Insertar order_items
const orderItems = items.map(item => ({
  order_id: order.id,
  product_id: item.productId,
  quantity: item.qty,
  price_at_time_of_order: item.price,
  unit_price: item.price,
}))

await supabase.from('order_items').insert(orderItems)

// 4. Registrar el status inicial
await supabase.from('order_status_updates').insert({
  order_id: order.id,
  status: 'pending',
  actor_role: 'client',
  notes: 'Pedido creado via WhatsApp',
})
```

### F. Enviar respuesta al cliente (outbound WhatsApp)

```typescript
// Via Twilio
const twilioClient = new Twilio(accountSid, authToken)
await twilioClient.messages.create({
  from: 'whatsapp:+14155238886', // número Twilio WhatsApp
  to: `whatsapp:${clientPhone}`,
  body: `✅ Pedido #${order.id.slice(0, 8)} confirmado!\n` +
        `🍽 ${restaurantName}\n` +
        `💰 Total: $${totalAmount} MXN\n` +
        `⏱ Tiempo estimado: ${estimatedMinutes} min\n` +
        `📍 Dirección: ${clientAddress}`
})
```

### G. Notificar al restaurante (opcional, outbound)

```typescript
// Buscar teléfono del restaurante
const { data: restaurant } = await supabase
  .from('restaurants')
  .select('phone, name')
  .eq('id', restaurantId)
  .single()

// Enviar WhatsApp al restaurante
await twilioClient.messages.create({
  from: 'whatsapp:+14155238886',
  to: `whatsapp:${restaurant.phone}`,
  body: `🔔 Nuevo pedido!\n` +
        `💰 Total: $${totalAmount} MXN\n` +
        `📦 Items: ${itemSummary}\n` +
        `📍 Entrega: ${clientAddress}`
})
```

> Nota: el restaurante ya recibe la orden en tiempo real vía Supabase Realtime en su dashboard web. El WhatsApp outbound es adicional.

### H. Variables de entorno necesarias

Configurar en Supabase Dashboard → Edge Functions → Secrets:

```bash
SUPABASE_URL=https://[project-ref].supabase.co   # ya existe
SUPABASE_SERVICE_ROLE_KEY=eyJ...                  # ya existe, usar con cuidado
TWILIO_ACCOUNT_SID=AC...                          # de tu cuenta Twilio
TWILIO_AUTH_TOKEN=...                             # de tu cuenta Twilio
TWILIO_WHATSAPP_NUMBER=+14155238886               # número Twilio sandbox o producción
META_VERIFY_TOKEN=...                             # si se usa Meta Business API en vez de Twilio
```

---

## 14. Flujo completo de un pedido via WhatsApp

```
USUARIO                    BOT (Edge Function)              BASE DE DATOS
   │                              │                               │
   │── "Hola quiero pedir" ──────▶│                               │
   │                              │── SELECT users WHERE phone ──▶│
   │                              │◀─ user found / not found ─────│
   │◀─ "¿Cuál restaurante?" ──────│                               │
   │                              │                               │
   │── "El de las quesadillas" ──▶│                               │
   │                              │── SELECT restaurants ─────────▶│
   │◀─ Lista de productos ────────│◀─ products list ───────────────│
   │                              │                               │
   │── "2 quesadillas y 1 agua" ─▶│                               │
   │                              │── [calcular totales] ─────────│
   │◀─ "Resumen: $93 MXN ¿ok?" ──│                               │
   │                              │                               │
   │── "Sí, mi dirección es..." ─▶│                               │
   │                              │── google-maps-proxy ──────────▶│ (geocoding)
   │                              │── INSERT orders ──────────────▶│
   │                              │── INSERT order_items ─────────▶│
   │                              │── INSERT order_status_updates ─▶│
   │◀─ "✅ Pedido confirmado!" ───│                               │
   │                              │                               │
   │                              │── WhatsApp outbound ──────────▶ RESTAURANTE notificado
   │                              │                               │
   │                              │     [Restaurante acepta en dashboard]
   │                              │                               │
   │                              │◀─ Realtime: status='confirmed'─│
   │◀─ "Tu pedido está en camino"─│                               │
```

---

## 15. Consideraciones de seguridad

1. **Siempre usar `SUPABASE_SERVICE_ROLE_KEY`** en la edge function — nunca exponer el anon key para escrituras no autenticadas
2. **Verificar la firma del webhook** de Twilio/Meta antes de procesar cualquier mensaje para evitar spoofing
3. **Rate limiting**: implementar límite de pedidos por número de teléfono (máximo N pedidos por hora)
4. **Validar totales** en el servidor, nunca confiar en totales enviados por el usuario
5. **Sanitizar inputs** de texto libre (notas, dirección) antes de insertar en DB
6. **El `commission_bps` del restaurante** determina la comisión — calcularlo desde la DB, no hardcodearlo

---

## 16. Supabase URL y keys (estructura)

```
URL base:        https://[project-ref].supabase.co
Anon Key:        eyJ... (público, para cliente browser)
Service Role:    eyJ... (secreto, solo servidor/edge functions)

Edge Functions:  https://[project-ref].supabase.co/functions/v1/[nombre-funcion]
Storage:         https://[project-ref].supabase.co/storage/v1/object/public/[bucket]/[path]
Realtime WS:     wss://[project-ref].supabase.co/realtime/v1/websocket
```

Las variables de entorno están en `.env.local`:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` (solo server-side, no NEXT_PUBLIC)

---

*Blueprint generado el 2026-03-01. Actualizar cuando se agreguen nuevas tablas o edge functions.*
