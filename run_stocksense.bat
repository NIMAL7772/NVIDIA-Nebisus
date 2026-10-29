@echo off
setlocal
set "PYTHON=C:\Users\Admin\AppData\Local\Programs\Python\Python313\python.exe"

if not exist "%PYTHON%" (
  echo Python 3.13 was not found at: %PYTHON%
  echo Install Python 3.13 or update the PYTHON path in this file.
  pause
  exit /b 1
)

"%PYTHON%" -c "import streamlit" >nul 2>&1
if errorlevel 1 (
  echo Installing StockSense requirements. This is needed only the first time.
  "%PYTHON%" -m pip install -r requirements.txt
  if errorlevel 1 (
    echo Installation failed. Check your internet connection and try again.
    pause
    exit /b 1
  )
)

"%PYTHON%" -m streamlit run app.py
pause
