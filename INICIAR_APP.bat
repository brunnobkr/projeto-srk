@echo off
echo ========================================
echo   Iniciando App ITCC - Sumitomo
echo ========================================
echo.
echo O app sera iniciado em: http://localhost:5173
echo.
echo Para acessar de outros dispositivos na rede:
echo   1. Encontre seu IP com: ipconfig
echo   2. Acesse: http://SEU_IP:5173
echo.
echo Pressione Ctrl+C para parar o servidor
echo.
echo ========================================
echo.

call npm run dev

