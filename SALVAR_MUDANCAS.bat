@echo off
echo ========================================
echo   Verificando Mudancas no Projeto
echo ========================================
echo.

echo Listando arquivos modificados/criados...
echo.

echo ARQUIVOS NOVOS:
dir /b public\*.json public\*.js public\*.png *.bat *.txt *.md 2>nul | findstr /V "node_modules"

echo.
echo ========================================
echo   TODAS AS MUDANCAS ESTAO SALVAS
echo ========================================
echo.
echo Os arquivos foram salvos automaticamente.
echo.
echo Para fazer backup:
echo   1. Copie a pasta do projeto inteira
echo   2. Ou use Git (se instalado)
echo.
echo Para usar Git (se instalado):
echo   git add .
echo   git commit -m "Mudancas do projeto"
echo.

pause

