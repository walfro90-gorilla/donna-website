# ⚠️ REINICIO REQUERIDO

## 🔄 Acción necesaria:

Para que el mapa se muestre correctamente, necesitas **reiniciar el servidor de desarrollo** de Next.js.

### Pasos:

1. **Detén el servidor actual:**
   - Presiona `Ctrl + C` en la terminal donde está corriendo el servidor

2. **Inicia el servidor nuevamente:**
   ```bash
   npm run dev
   ```
   o
   ```bash
   yarn dev
   ```

3. **Recarga la página** en el navegador

### ¿Por qué es necesario?

Las variables de entorno (`NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`) solo se cargan cuando el servidor de Next.js inicia. Cualquier cambio en `.env.local` requiere un reinicio del servidor para que surta efecto.

### ✅ Después del reinicio:

El mapa estático de Google Maps debería mostrarse correctamente con:
- Mapa real de la ubicación
- Marcador rosa con la letra "R" indicando el restaurante
- Zoom nivel 16 para ver detalles de la zona
- Alta resolución (scale=2) para pantallas retina

---

**Nota:** Si después del reinicio el mapa aún no se muestra, revisa la consola del navegador para ver mensajes de error específicos.