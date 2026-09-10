@echo off
chcp 65001 > nul
title 우리 가족 앨범 서버 실행기

echo ======================================================
echo 🏡 [우리 가족 앨범] 웹사이트를 실행하고 있습니다...
echo ======================================================
echo.

if not exist node_modules (
    echo [안내] 최초 실행을 위한 의존성 패키지를 설치합니다...
    call npm install
)

echo [안내] 브라우저를 열고 서버를 기동합니다...
timeout /t 2 /nobreak > nul
start http://localhost:3000

call node server.js
pause
