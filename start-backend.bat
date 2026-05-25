@echo off
echo.
echo ╔══════════════════════════════════════════════════╗
echo ║        Plutus Trading App - Quick Start          ║
echo ╚══════════════════════════════════════════════════╝
echo.
echo Starting Backend API Server...
echo.

cd server

if not exist "node_modules" (
    echo Installing backend dependencies...
    call npm install
    echo.
)

echo Backend server will start on port 3001
echo Frontend should be started in a separate terminal with: npm run dev
echo.
echo Press Ctrl+C to stop the server
echo.

call npm run dev
