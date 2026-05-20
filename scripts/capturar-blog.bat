@echo off
cd /d "%~dp0.."
py -m pip install playwright -q
py -m playwright install chromium
py scripts\capturar-blog.py %*
pause
