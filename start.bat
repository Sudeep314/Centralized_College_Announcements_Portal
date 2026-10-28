@echo off
cd /d "%~dp0"
echo ====================================================================
echo   CampusNotice - Centralized College Announcements Portal
echo ====================================================================
echo.
echo [1/2] Starting Backend API Server (Port 5000)...
start "CampusNotice Backend (Port 5000)" cmd /k "node test-backend-server.js"

echo [2/2] Starting Frontend Web Server (Port 3000)...
start "CampusNotice Frontend (Port 3000)" cmd /k "node serve.js"

echo.
echo Waiting 2 seconds for servers to initialize...
timeout /t 2 /nobreak >nul

echo Opening Student Dashboard in browser: http://localhost:3000 ...
start http://localhost:3000

echo.
echo ====================================================================
echo   System running! Keep the backend & frontend windows open.
echo   - Student Portal: http://localhost:3000
echo   - Admin Login:    http://localhost:3000/pages/admin-login.html
echo   - Credentials:    admin / admin123
echo ====================================================================
pause
