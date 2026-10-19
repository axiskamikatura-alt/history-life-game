@echo off
cd /d "%~dp0"
where node >nul 2>nul
if errorlevel 1 (
  echo Please install Node.js LTS from https://nodejs.org/ and try again.
  pause
  exit /b 1
)
node -e "if(Number(process.versions.node.split('.')[0])<20)process.exit(1)"
if errorlevel 1 (
  echo Node.js 20 or newer is required. Please install the current LTS version.
  pause
  exit /b 1
)
echo Open http://localhost:3000 in your browser after the server starts.
echo Keep this window open while playing. Press Ctrl+C to stop.
node server.mjs
pause
