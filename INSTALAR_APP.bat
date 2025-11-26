@echo off
echo ========================================
echo   Instalando App ITCC - Sumitomo
echo ========================================
echo.

echo [1/3] Instalando dependencias...
call npm install

echo.
echo [2/3] Instalando plugin PWA...
call npm install vite-plugin-pwa --save-dev

echo.
echo [3/3] Verificando instalacao...
if exist "node_modules\vite-plugin-pwa" (
    echo.
    echo ========================================
    echo   Instalacao concluida com sucesso!
    echo ========================================
    echo.
    echo Para iniciar o app, execute:
    echo   npm run dev
    echo.
) else (
    echo.
    echo ERRO: Falha na instalacao do plugin PWA
    echo Tente executar manualmente:
    echo   npm install vite-plugin-pwa --save-dev
    echo.
)

pause

