@echo off
chcp 65001 >nul
echo ========================================================
echo   啟動 Piano Sheet Studio - 音樂鋼琴五線譜互動系統
echo ========================================================
echo.
echo 正在開啟預設瀏覽器...
start "" "%~dp0index.html"
echo.
echo 系統已於瀏覽器中成功啟動！
echo 支援：滑鼠彈奏、電腦鍵盤(QWERTY)、USB MIDI 電子琴隨插即彈。
echo.
pause
