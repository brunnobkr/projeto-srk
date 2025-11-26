# Script para Configurar e Fazer Upload no GitHub
# Execute este script no PowerShell: .\CONFIGURAR_GITHUB.ps1

Write-Host "🚀 Configurando Git e GitHub..." -ForegroundColor Cyan

# Função para encontrar Git
function Find-Git {
    $gitPaths = @(
        "C:\Program Files\Git\bin\git.exe",
        "C:\Program Files (x86)\Git\bin\git.exe",
        "$env:LOCALAPPDATA\Programs\Git\bin\git.exe",
        "$env:ProgramFiles\Git\cmd\git.exe",
        "$env:ProgramFiles(x86)\Git\cmd\git.exe",
        "C:\Users\$env:USERNAME\AppData\Local\Programs\Git\bin\git.exe"
    )
    
    foreach ($path in $gitPaths) {
        if (Test-Path $path) {
            return $path
        }
    }
    
    # Tentar encontrar via where.exe
    try {
        $whereResult = where.exe git 2>$null
        if ($whereResult) {
            return $whereResult
        }
    } catch {}
    
    return $null
}

# Encontrar Git
$gitPath = Find-Git

if (-not $gitPath) {
    Write-Host "❌ Git não encontrado!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Por favor, instale o Git:" -ForegroundColor Yellow
    Write-Host "1. Baixe em: https://git-scm.com/download/win" -ForegroundColor Yellow
    Write-Host "2. Instale o Git" -ForegroundColor Yellow
    Write-Host "3. Reinicie o terminal e execute este script novamente" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "OU use a extensão do GitHub no Cursor (já aceita por você):" -ForegroundColor Cyan
    Write-Host "1. Abra o Source Control (Ctrl+Shift+G)" -ForegroundColor Cyan
    Write-Host "2. Clique em 'Publish to GitHub'" -ForegroundColor Cyan
    Write-Host "3. Siga as instruções na tela" -ForegroundColor Cyan
    exit 1
}

Write-Host "✅ Git encontrado em: $gitPath" -ForegroundColor Green

# Adicionar Git ao PATH da sessão atual
$gitDir = Split-Path $gitPath -Parent
$env:PATH = "$gitDir;$env:PATH"

# Verificar versão do Git
Write-Host ""
Write-Host "📋 Verificando configuração do Git..." -ForegroundColor Cyan
& $gitPath --version

# Verificar se já está inicializado
if (Test-Path ".git") {
    Write-Host ""
    Write-Host "✅ Repositório Git já inicializado" -ForegroundColor Green
} else {
    Write-Host ""
    Write-Host "📦 Inicializando repositório Git..." -ForegroundColor Cyan
    & $gitPath init
    Write-Host "✅ Repositório inicializado" -ForegroundColor Green
}

# Verificar configuração do usuário
Write-Host ""
Write-Host "👤 Verificando configuração do usuário Git..." -ForegroundColor Cyan
$userName = & $gitPath config --global user.name
$userEmail = & $gitPath config --global user.email

if (-not $userName) {
    Write-Host "⚠️  Nome de usuário Git não configurado" -ForegroundColor Yellow
    $name = Read-Host "Digite seu nome (ou pressione Enter para pular)"
    if ($name) {
        & $gitPath config --global user.name $name
        Write-Host "✅ Nome configurado: $name" -ForegroundColor Green
    }
}

if (-not $userEmail) {
    Write-Host "⚠️  Email Git não configurado" -ForegroundColor Yellow
    $email = Read-Host "Digite seu email (ou pressione Enter para pular)"
    if ($email) {
        & $gitPath config --global user.email $email
        Write-Host "✅ Email configurado: $email" -ForegroundColor Green
    }
}

# Verificar status
Write-Host ""
Write-Host "📊 Status do repositório:" -ForegroundColor Cyan
& $gitPath status --short

# Adicionar todos os arquivos
Write-Host ""
Write-Host "➕ Adicionando arquivos ao Git..." -ForegroundColor Cyan
& $gitPath add .
Write-Host "✅ Arquivos adicionados" -ForegroundColor Green

# Verificar o que será commitado
Write-Host ""
Write-Host "📋 Arquivos que serão commitados:" -ForegroundColor Cyan
& $gitPath status --short

# Fazer commit
Write-Host ""
$commitMessage = "Configuração completa para GitHub Pages - Sistema ITCC Sumitomo S-riko"
Write-Host "💾 Fazendo commit..." -ForegroundColor Cyan
& $gitPath commit -m $commitMessage

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Commit realizado com sucesso!" -ForegroundColor Green
} else {
    Write-Host "⚠️  Nenhuma mudança para commitar ou commit já existe" -ForegroundColor Yellow
}

# Verificar se há remote configurado
Write-Host ""
Write-Host "🔗 Verificando repositório remoto..." -ForegroundColor Cyan
$remoteUrl = & $gitPath remote get-url origin 2>$null

if ($remoteUrl) {
    Write-Host "✅ Remote já configurado: $remoteUrl" -ForegroundColor Green
    Write-Host ""
    Write-Host "🚀 Para fazer push, execute:" -ForegroundColor Cyan
    Write-Host "   git push -u origin main" -ForegroundColor Yellow
} else {
    Write-Host "⚠️  Nenhum remote configurado" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "📝 Para conectar ao GitHub:" -ForegroundColor Cyan
    Write-Host "1. Crie um repositório no GitHub (https://github.com/new)" -ForegroundColor Yellow
    Write-Host "2. Execute o comando abaixo (substitua SEU-USUARIO e SEU-REPOSITORIO):" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "   git remote add origin https://github.com/SEU-USUARIO/SEU-REPOSITORIO.git" -ForegroundColor Cyan
    Write-Host "   git branch -M main" -ForegroundColor Cyan
    Write-Host "   git push -u origin main" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "OU use a extensão do GitHub no Cursor:" -ForegroundColor Cyan
    Write-Host "1. Abra o Source Control (Ctrl+Shift+G)" -ForegroundColor Cyan
    Write-Host "2. Clique em 'Publish to GitHub'" -ForegroundColor Cyan
}

Write-Host ""
Write-Host "✅ Configuração concluída!" -ForegroundColor Green
Write-Host ""
Write-Host "📚 Documentação criada:" -ForegroundColor Cyan
Write-Host "   - GUIA_GITHUB.md" -ForegroundColor Yellow
Write-Host "   - GUIA_GITHUB_PAGES.md" -ForegroundColor Yellow
Write-Host "   - ARQUIVOS_PARA_UPLOAD.md" -ForegroundColor Yellow


