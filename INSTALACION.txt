GUIA DE INSTALACION - APP CONTROL EPP

1. Requisitos
- Tener instalado Node.js 20 o superior.
- Tener VS Code.
- Tener una cuenta en Vercel.
- Tener una cuenta en Supabase si quieres usar base de datos en la nube.

2. Ejecutar localmente
- Abre la carpeta del proyecto en VS Code.
- Abre una terminal.
- Ejecuta: npm install
- Ejecuta: npm run dev
- Abre la URL local que te muestre Vite.

3. Modo de prueba local
- Si no configuras variables de entorno, la app funciona con localStorage.
- Ya trae personal, EPP y movimientos de ejemplo.

4. Conectar base de datos real con Supabase
- Crea un proyecto en Supabase.
- Abre el SQL Editor.
- Copia y ejecuta el archivo supabase-schema.sql.
- Duplica el archivo .env.example y renombralo a .env
- Completa:
  VITE_SUPABASE_URL=tu_url_de_supabase
  VITE_SUPABASE_ANON_KEY=tu_anon_key
- Reinicia el servidor con npm run dev

5. Desplegar en Vercel
- Sube este proyecto a GitHub.
- En Vercel importa el repositorio.
- Framework preset: Vite.
- Build command: npm run build
- Output directory: dist
- En Variables de entorno agrega:
  VITE_SUPABASE_URL
  VITE_SUPABASE_ANON_KEY
- Despliega.

6. Archivos importantes
- src/App.jsx: interfaz principal.
- src/lib/storage.js: conexion local o Supabase.
- src/lib/exportExcel.js: exportacion a Excel.
- supabase-schema.sql: estructura y datos iniciales.

7. Login administrativo
- Usuario: admin
- Contraseña: 1234

8. Si quieres instalar algo adicional
- Solo necesitas ejecutar npm install.
- Si deseas volver a instalar desde cero:
  1. borra node_modules
  2. ejecuta npm install

9. Nota importante
- Para aprendizaje y simplicidad, la zona administrativa usa un login en cliente.
- Si luego quieres seguridad real multiusuario, el siguiente paso ideal seria mover autenticacion y permisos al backend.
