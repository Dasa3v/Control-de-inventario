# Guia Supabase

Esta guia deja lista la base de datos para esta app de control EPP.

## 1. Crear el proyecto

1. Entra a Supabase y crea un proyecto nuevo.
2. Elige nombre, contraseña de base de datos y region.
3. Espera a que el proyecto termine de aprovisionarse.

## 2. Abrir el SQL Editor

1. En el panel del proyecto entra a `SQL Editor`.
2. Crea una consulta nueva.
3. Abre el archivo [supabase-schema.sql](C:/Users/ADMIN/Desktop/EPP/supabase-schema.sql:1).
4. Copia todo el contenido y ejecútalo.

Esto crea las tablas:

- `people`
- `epps`
- `movements`

Y carga el personal y los EPP iniciales.

## 3. Si ya tenías una base anterior

Como el modelo del historial cambió para guardar nombre y cédula dentro del movimiento, si ya habías creado una tabla `movements` anterior te conviene:

1. hacer respaldo si lo necesitas
2. borrar la tabla vieja o crear un proyecto nuevo
3. ejecutar otra vez [supabase-schema.sql](C:/Users/ADMIN/Desktop/EPP/supabase-schema.sql:1)

Si solo quieres vaciar el historial sin tocar personal ni EPP, ejecuta [vaciar-historial.sql](C:/Users/ADMIN/Desktop/EPP/vaciar-historial.sql:1).

## 4. Obtener URL y clave pública

Necesitas:

- `Project URL`
- `anon key` o `publishable key`

Puedes encontrarlas desde el panel `Connect` del proyecto o desde `Settings -> API / API Keys`, según la vista disponible en tu panel de Supabase.

## 5. Configurar variables en el proyecto local

1. Duplica [\.env.example](C:/Users/ADMIN/Desktop/EPP/.env.example:1) y renómbralo a `.env`
2. Completa:

```env
VITE_SUPABASE_URL=tu_project_url
VITE_SUPABASE_ANON_KEY=tu_anon_o_publishable_key
```

## 6. Probar la conexión localmente

En la terminal de VS Code:

```powershell
npm install
npm run dev
```

Al abrir la app, en la tarjeta superior debe aparecer `Modo de datos: supabase`.

## 7. Qué guarda la app en Supabase

- `people`: catálogo de personal
- `epps`: inventario base de elementos
- `movements`: historial de entradas y salidas

Importante:

- el historial guarda nombre y cédula dentro del movimiento
- por eso puedes borrar personal más adelante sin perder trazabilidad en reportes

## 8. Si algo falla

Revisa:

- que `VITE_SUPABASE_URL` esté completo
- que `VITE_SUPABASE_ANON_KEY` o tu publishable key sea correcta
- que sí ejecutaste [supabase-schema.sql](C:/Users/ADMIN/Desktop/EPP/supabase-schema.sql:1)
- que reiniciaste `npm run dev` después de cambiar el `.env`

## 9. Fuentes oficiales consultadas

- Supabase Docs: https://supabase.com/docs/
- API URL y claves: https://supabase.com/docs/guides/api/creating-routes
- API keys: https://supabase.com/docs/guides/api/api-keys
- Data API: https://supabase.com/docs/guides/api/data-apis
