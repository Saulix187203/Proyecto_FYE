@echo off
setlocal

echo ========================================
echo  SISCA Backend - Configuracion local
echo ========================================
echo.

where npm >nul 2>nul
if errorlevel 1 (
  echo ERROR: npm no esta instalado o no esta disponible en el PATH.
  echo Instala Node.js y vuelve a ejecutar este archivo.
  pause
  exit /b 1
)

echo [1/4] Instalando dependencias con npm install...
call npm install
if errorlevel 1 (
  echo.
  echo ERROR: npm install fallo. Revisa los mensajes anteriores.
  pause
  exit /b 1
)

echo.
echo [2/4] Verificando archivo .env...
if not exist ".env" (
  if exist ".env.example" (
    copy ".env.example" ".env" >nul
    echo Se creo .env a partir de .env.example.
  ) else (
    echo ADVERTENCIA: No existe .env.example. Crea el archivo .env manualmente.
  )
) else (
  echo El archivo .env ya existe. No se sobrescribio.
)

echo.
echo IMPORTANTE:
echo Revisa la variable DATABASE_URL en .env antes de ejecutar migraciones.
echo Ejemplo:
echo DATABASE_URL="postgresql://postgres:TU_PASSWORD@localhost:5432/sisca_db?schema=public"
echo.

echo [3/4] Generando Prisma Client...
call npx prisma generate
if errorlevel 1 (
  echo.
  echo ERROR: npx prisma generate fallo. Revisa la configuracion de Prisma.
  pause
  exit /b 1
)

echo.
echo [4/4] Configuracion inicial completada.
echo.
echo Siguientes pasos recomendados:
echo 1. Crear la base de datos sisca_db en PostgreSQL.
echo 2. Revisar DATABASE_URL en .env.
echo 3. Ejecutar migraciones:
echo    npx prisma migrate dev
echo 4. Ejecutar seed inicial:
echo    npx prisma db seed
echo.
echo Para iniciar el backend:
echo    npm run dev
echo.

pause
endlocal
