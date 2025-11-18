#!/usr/bin/env node

/**
 * Script de verificación de variables de entorno
 * Verifica que todas las variables necesarias estén configuradas
 */

const fs = require('fs');
const path = require('path');

// Cargar .env.local si existe
const envLocalPath = path.join(process.cwd(), '.env.local');
if (fs.existsSync(envLocalPath)) {
  const envContent = fs.readFileSync(envLocalPath, 'utf8');
  envContent.split('\n').forEach(line => {
    const trimmedLine = line.trim();
    if (trimmedLine && !trimmedLine.startsWith('#')) {
      const [key, ...valueParts] = trimmedLine.split('=');
      if (key && valueParts.length > 0) {
        const value = valueParts.join('=').trim();
        process.env[key.trim()] = value;
      }
    }
  });
}

const requiredEnvVars = [
  {
    name: 'NEXT_PUBLIC_SUPABASE_URL',
    description: 'URL de tu proyecto Supabase',
    example: 'https://xxxxx.supabase.co',
    isPublic: true,
    isSafe: true,
    reason: 'URL pública de Supabase, segura para exponer'
  },
  {
    name: 'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    description: 'Clave anónima de Supabase',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    isPublic: true,
    isSafe: true,
    reason: 'Clave pública de Supabase, protegida por RLS'
  },
  {
    name: 'NEXT_PUBLIC_GOOGLE_MAPS_API_KEY',
    description: 'API Key de Google Maps',
    example: 'AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX',
    isPublic: true,
    isSafe: true,
    reason: 'API Key pública de Google Maps, protegida por restricciones de dominio'
  }
];

console.log('\n🔍 Verificando variables de entorno...\n');

let allValid = true;
const results = [];

requiredEnvVars.forEach(envVar => {
  const value = process.env[envVar.name];
  const isSet = !!value;
  const isValid = isSet && value.length > 0 && !value.includes('your_') && !value.includes('tu_');

  results.push({
    name: envVar.name,
    isSet,
    isValid,
    description: envVar.description,
    isPublic: envVar.isPublic,
    isSafe: envVar.isSafe,
    reason: envVar.reason
  });

  if (!isValid) {
    allValid = false;
  }
});

// Mostrar resultados
results.forEach(result => {
  const status = result.isValid ? '✅' : '❌';
  const visibility = result.isPublic ? '🌐 PÚBLICA' : '🔒 PRIVADA';
  const safety = result.isSafe ? '✅ SEGURA' : '⚠️  CUIDADO';
  
  console.log(`${status} ${result.name}`);
  console.log(`   ${result.description}`);
  console.log(`   Visibilidad: ${visibility} | Seguridad: ${safety}`);
  
  if (result.isPublic && result.isSafe) {
    console.log(`   💡 ${result.reason}`);
  }
  
  if (!result.isValid) {
    console.log(`   ⚠️  NO CONFIGURADA o valor inválido`);
  } else {
    const maskedValue = result.name.includes('KEY') 
      ? `${process.env[result.name].substring(0, 10)}...${process.env[result.name].slice(-4)}`
      : process.env[result.name];
    console.log(`   Valor: ${maskedValue}`);
  }
  
  console.log('');
});

// Resumen
console.log('━'.repeat(60));
if (allValid) {
  console.log('✅ Todas las variables de entorno están configuradas correctamente\n');
  console.log('📝 Notas importantes:');
  console.log('   • Las variables NEXT_PUBLIC_* son visibles en el navegador');
  console.log('   • Esto es NORMAL y SEGURO para estas variables específicas');
  console.log('   • Supabase y Google Maps están diseñados para usar keys públicas');
  console.log('   • La seguridad se maneja mediante:');
  console.log('     - Supabase: Row Level Security (RLS)');
  console.log('     - Google Maps: Restricciones de dominio y API');
  console.log('');
  console.log('🚀 Tu aplicación está lista para funcionar correctamente');
  process.exit(0);
} else {
  console.log('❌ Faltan variables de entorno o tienen valores inválidos\n');
  console.log('📋 Pasos para solucionar:');
  console.log('');
  console.log('1. LOCAL (desarrollo):');
  console.log('   • Crea/edita el archivo .env.local en la raíz del proyecto');
  console.log('   • Agrega las variables faltantes');
  console.log('   • Reinicia el servidor de desarrollo (npm run dev)');
  console.log('');
  console.log('2. VERCEL (producción):');
  console.log('   • Ve a tu proyecto en Vercel Dashboard');
  console.log('   • Settings → Environment Variables');
  console.log('   • Agrega las variables faltantes');
  console.log('   • Marca: Production, Preview, Development');
  console.log('   • Guarda y redespliega el proyecto');
  console.log('');
  console.log('📖 Consulta VERCEL_DEPLOYMENT_GUIDE.md para más detalles');
  process.exit(1);
}
