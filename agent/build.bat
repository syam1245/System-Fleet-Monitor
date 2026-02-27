@echo off
echo ===================================================
echo Building System Fleet Monitor Agent (.EXE)
echo ===================================================

echo.
echo Installing PyInstaller...
python -m pip install pyinstaller

echo.
echo Compiling python agent into a single hidden executable...
echo (This may take a minute)
pyinstaller --noconfirm --onefile --windowed --name "SystemFleetAgent" --clean "agent.py"

echo.
echo ===================================================
echo Build Complete!
echo You can find SystemFleetAgent.exe in the \dist\ folder.
echo You can deploy this silently via Group Policy or Intune.
echo ===================================================
pause
