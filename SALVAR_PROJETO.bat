@echo off
REM ========================================
REM   SALVAR PROJETO (Wrapper para PowerShell)
REM ========================================

echo ========================================
echo   SALVANDO PROJETO
echo ========================================
echo.

REM Verificar se PowerShell está disponível
powershell -Command "Get-Host" >nul 2>&1
if %errorlevel% neq 0 (
    echo ERRO: PowerShell nao encontrado!
    echo Por favor, execute SALVAR_PROJETO.ps1 diretamente
    pause
    exit /b 1
)

REM Executar script PowerShell
powershell -ExecutionPolicy Bypass -File "%~dp0SALVAR_PROJETO.ps1"

if %errorlevel% neq 0 (
    echo.
    echo ERRO ao executar script de salvamento!
    pause
    exit /b 1
)

exit /b 0

