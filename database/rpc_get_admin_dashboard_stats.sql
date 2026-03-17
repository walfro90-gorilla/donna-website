-- ============================================================
-- RPC: get_admin_dashboard_stats
-- Reemplaza 13+ queries paralelas del Admin Dashboard con 1 llamada.
-- Ejecutar en: Supabase → SQL Editor → Run
-- ============================================================

CREATE OR REPLACE FUNCTION get_admin_dashboard_stats()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result          JSON;
  thirty_days_ago TIMESTAMPTZ := NOW() - INTERVAL '30 days';
  today_start     TIMESTAMPTZ := DATE_TRUNC('day', NOW());
  active_statuses TEXT[]      := ARRAY[
    'pending','confirmed','preparing','in_preparation',
    'ready_for_pickup','assigned','picked_up','on_the_way','in_transit'
  ];
BEGIN
  SELECT json_build_object(

    -- ── Conteos generales ────────────────────────────────────
    'total_users',
      (SELECT COUNT(*) FROM users WHERE role = 'client'),
    'total_restaurants',
      (SELECT COUNT(*) FROM restaurants),
    'total_couriers',
      (SELECT COUNT(*) FROM delivery_agent_profiles),
    'total_orders',
      (SELECT COUNT(*) FROM orders),
    'pending_restaurants',
      (SELECT COUNT(*) FROM restaurants WHERE status = 'pending'),
    'pending_couriers',
      (SELECT COUNT(*) FROM delivery_agent_profiles WHERE status = 'pending'),
    'online_restaurants',
      (SELECT COUNT(*) FROM restaurants WHERE online = true),
    'approved_couriers',
      (SELECT COUNT(*) FROM delivery_agent_profiles WHERE status = 'approved'),
    'active_orders',
      (SELECT COUNT(*) FROM orders WHERE status = ANY(active_statuses)),
    'orders_today',
      (SELECT COUNT(*) FROM orders WHERE created_at >= today_start),

    -- ── Ingresos ─────────────────────────────────────────────
    'revenue_today',
      (SELECT COALESCE(SUM(total_amount), 0)
         FROM orders
        WHERE status = 'delivered' AND created_at >= today_start),
    'revenue_30d',
      (SELECT COALESCE(SUM(total_amount), 0)
         FROM orders
        WHERE status = 'delivered' AND created_at >= thirty_days_ago),

    -- ── Gráfica de ingresos: últimos 7 días ──────────────────
    -- Devuelve solo días con ventas — el TS rellena los días vacíos con 0
    'revenue_by_day',
      (SELECT COALESCE(
         json_agg(json_build_object('date', day::text, 'revenue', rev) ORDER BY day),
         '[]'::json
       )
       FROM (
         SELECT DATE(created_at) AS day, SUM(total_amount) AS rev
           FROM orders
          WHERE status = 'delivered'
            AND created_at >= NOW() - INTERVAL '7 days'
          GROUP BY DATE(created_at)
       ) q),

    -- ── Distribución de estatus: últimos 30 días ─────────────
    'orders_status_counts',
      (SELECT COALESCE(json_object_agg(status, cnt), '{}'::json)
       FROM (
         SELECT status, COUNT(*) AS cnt
           FROM orders
          WHERE created_at >= thirty_days_ago
          GROUP BY status
       ) q),

    -- ── Pedidos recientes (últimos 10) ────────────────────────
    'recent_orders',
      (SELECT COALESCE(
         json_agg(
           json_build_object(
             'id',           o.id,
             'status',       o.status,
             'total_amount', o.total_amount,
             'created_at',   o.created_at,
             'restaurants',  json_build_object('name', r.name),
             'client',       json_build_object('name', u.name)
           ) ORDER BY o.created_at DESC
         ),
         '[]'::json
       )
       FROM (SELECT * FROM orders ORDER BY created_at DESC LIMIT 10) o
       LEFT JOIN restaurants r ON r.id = o.restaurant_id
       LEFT JOIN users u       ON u.id = o.user_id)

  ) INTO result;

  RETURN result;
END;
$$;

-- Otorgar permiso de ejecución al rol autenticado
GRANT EXECUTE ON FUNCTION get_admin_dashboard_stats() TO authenticated;
GRANT EXECUTE ON FUNCTION get_admin_dashboard_stats() TO service_role;
