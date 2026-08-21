@echo off
chcp 65001 > nul
title 실시간 강연 질문 보드 (Live Q&A)

echo =======================================================
echo   🎤 실시간 강연 질문 보드 (Live Q&A) 서버를 시작합니다
echo =======================================================
echo.

cd /d "%~dp0"

echo [1/2] 기존 실행 중인 서버 정리 중...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :3001') do (
    taskkill /f /pid %%a > nul 2>&1
)

echo [2/2] 서버 구동 및 외부 LTE 접속 주소 생성 중...
echo.
npm run share

pause
