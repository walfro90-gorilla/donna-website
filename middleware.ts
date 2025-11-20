// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/middleware';

// Define protected routes and their required roles
const protectedRoutes: Record<string, string[]> = {
  '/admin': ['admin'],
  '/restaurant': ['restaurant'],
  '/restaurant/dashboard': ['restaurant'],
  '/client/dashboard': ['client'],
  '/delivery_agent/dashboard': ['delivery'],
};

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  console.log('🔒 Middleware ejecutado para:', pathname);

  // Check if the route is protected
  const protectedRoute = Object.keys(protectedRoutes).find(route =>
    pathname.startsWith(route)
  );

  if (!protectedRoute) {
    console.log('✅ Ruta no protegida, permitiendo acceso');
    return NextResponse.next();
  }

  console.log('🔐 Ruta protegida detectada:', protectedRoute);

  try {
    // Create Supabase client for middleware
    const { supabase, response } = createClient(request);

    // Get session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();

    console.log('👤 Sesión:', session ? 'Existe' : 'No existe');
    console.log('❌ Error de sesión:', sessionError);

    // If no session, redirect to login
    if (sessionError || !session) {
      console.log('🚫 Sin sesión, redirigiendo a login');
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }

    console.log('👤 User ID:', session.user.id);

    // Get user role from database
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('role')
      .eq('id', session.user.id)
      .single();

    console.log('📊 User data:', userData);
    console.log('❌ User error:', userError);

    if (userError || !userData) {
      console.log('🚫 Error obteniendo datos de usuario, redirigiendo a login');
      const loginUrl = new URL('/login', request.url);
      return NextResponse.redirect(loginUrl);
    }

    // Map database role to auth role
    const roleMap: Record<string, string> = {
      'delivery_agent': 'delivery',
      'client': 'client',
      'restaurant': 'restaurant',
      'admin': 'admin',
    };

    const userRole = roleMap[userData.role] || userData.role;
    console.log('🎭 Rol del usuario:', userRole);

    // Get required roles for this route
    const requiredRoles = protectedRoutes[protectedRoute];
    console.log('🔑 Roles requeridos:', requiredRoles);

    if (!requiredRoles.includes(userRole)) {
      console.log('🚫 Usuario no tiene permiso, redirigiendo a su dashboard');
      // Redirect to user's appropriate dashboard
      const redirectMap: Record<string, string> = {
        'admin': '/admin',
        'restaurant': '/restaurant/dashboard',
        'client': '/client/dashboard',
        'delivery': '/delivery_agent/dashboard',
      };

      const redirectUrl = new URL(redirectMap[userRole] || '/', request.url);
      return NextResponse.redirect(redirectUrl);
    }

    console.log('✅ Usuario tiene permiso, permitiendo acceso');
    return response;
  } catch (error) {
    console.error('💥 Middleware error:', error);
    const loginUrl = new URL('/login', request.url);
    return NextResponse.redirect(loginUrl);
  }
}

export const config = {
  matcher: [
    '/admin/:path*',
    '/restaurant/:path*',
    '/client/dashboard/:path*',
    '/delivery_agent/dashboard/:path*',
  ],
};
