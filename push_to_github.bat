@echo off
chcp 65001 > nul
echo ========================================================
echo   正在推送 Piano Sheet Studio 至 GitHub...
echo ========================================================
echo.

git push -u origin main

if %ERRORLEVEL% equ 0 (
    echo.
    echo ========================================================
    echo   [成功] 專案已成功推送至您的 GitHub！
    echo   👉 https://github.com/grantchiang1983/piano-sheet-studio
    echo ========================================================
) else (
    echo.
    echo ========================================================
    echo   [提醒] 若提示 Repository not found，請先至 GitHub 建立該 Repository:
    echo   👉 https://github.com/new?name=piano-sheet-studio
    echo   建立完成後再次執行此腳本即可！
    echo ========================================================
)

pause
