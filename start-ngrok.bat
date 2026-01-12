@echo off
title Ngrok - Flipbook Frontend Tunnel
color 0A
echo ========================================
echo   FLIPBOOK - NGROK TUNNEL
echo ========================================
echo.
echo This will create a public URL for port 3000
echo.
echo Make sure:
echo   [1] Backend is running on port 8000
echo   [2] Frontend is running on port 3000
echo.
echo ========================================
echo.
pause
echo.
echo Starting ngrok...
echo.
echo IMPORTANT: 
echo   1. COPY the https URL that appears below
echo   2. Update frontend/.env file
echo   3. Restart your frontend server
echo.
echo ========================================
echo   Keep this window OPEN while testing!
echo ========================================
echo.
ngrok http 3000 --log=stdout
pause
