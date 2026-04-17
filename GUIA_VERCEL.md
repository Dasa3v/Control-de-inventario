# Guia Vercel

Esta guia deja la app publicada en Vercel usando el frontend Vite y la base conectada a Supabase.

## 1. Subir el proyecto a GitHub

1. Crea un repositorio nuevo en GitHub.
2. Sube este proyecto completo.
3. Verifica que estén incluidos:

- `src/`
- `package.json`
- `vite.config.js`
- `tailwind.config.js`
- `supabase-schema.sql`

Y que no subas:

- `node_modules`
- `dist`
- `.env`

## 2. Importar el repositorio en Vercel

1. Entra a Vercel.
2. Pulsa `Add New -> Project`.
3. Elige el repositorio de GitHub.
4. Importa el proyecto.

## 3. Revisar configuración de build

Para esta app Vite normalmente Vercel detecta solo la configuración correcta.

Si te pide confirmarla, usa:

```text
Framework Preset: Vite
Build Command: npm run build
Output Directory: dist
Install Command: npm install
```

## 4. Agregar variables de entorno

Antes de desplegar, agrega estas variables en `Settings -> Environment Variables`:

```text
VITE_SUPABASE_URL
VITE_SUPABASE_ANON_KEY
```

Pega exactamente los valores que usaste en tu `.env` local.

Importante:

- si cambias variables de entorno, debes hacer un nuevo deploy para aplicarlas

## 5. Desplegar

1. Pulsa `Deploy`.
2. Espera a que termine el build.
3. Abre la URL que te entrega Vercel.

## 6. Confirmar que quedó funcionando

Ya en producción revisa:

- que cargue el dashboard
- que puedas registrar una entrada o salida
- que el movimiento sí aparezca en el historial
- que el Excel descargue correctamente
- que el panel admin funcione con `admin / 1234`

## 7. Si quieres dominio propio

Luego puedes agregarlo desde:

`Project -> Settings -> Domains`

## 8. Si algo falla en Vercel

Revisa:

- que el repo tenga `package.json`
- que el comando de build sea `npm run build`
- que el directorio de salida sea `dist`
- que las variables `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY` estén bien escritas
- que Supabase ya tenga ejecutado [supabase-schema.sql](C:/Users/ADMIN/Desktop/EPP/supabase-schema.sql:1)

## 9. Flujo recomendado

El orden correcto es:

1. crear Supabase
2. ejecutar [supabase-schema.sql](C:/Users/ADMIN/Desktop/EPP/supabase-schema.sql:1)
3. probar localmente con `.env`
4. subir a GitHub
5. importar en Vercel
6. agregar variables de entorno
7. desplegar

## 10. Fuentes oficiales consultadas

- Vite en Vercel: https://vercel.com/docs/frameworks/frontend/vite
- Variables de entorno: https://vercel.com/docs/projects/environment-variables
- Gestión de variables: https://vercel.com/docs/environment-variables/managing-environment-variables
- Entornos de despliegue: https://vercel.com/docs/deployments/custom-environments
