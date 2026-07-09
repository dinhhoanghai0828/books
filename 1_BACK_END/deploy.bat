@echo off


set userName=haidh8
set password=haiha92
set server_ip=192.168.1.14

REM Xoa file cu
call "%~dp0putty\plink.exe" -batch -ssh %userName%@%server_ip% -pw %password% "rm -f /var/www/backend/demo.war"

REM Copy war len server
call "%~dp0putty\pscp.exe" -batch -pw %password% "%~dp0target\demo.war" %userName%@%server_ip%:/var/www/backend/

REM Kill app cu
call "%~dp0putty\plink.exe" -batch -ssh %userName%@%server_ip% -pw %password% "pkill -f demo.war || true"

REM Chay app
call "%~dp0putty\plink.exe" -batch -ssh %userName%@%server_ip% -pw %password% "nohup java -jar /var/www/backend/demo.war >/var/www/backend/nohup.out 2>&1 &"

REM Xem log
call "%~dp0putty\plink.exe" -batch -ssh %userName%@%server_ip% -pw %password% "tail -f /var/www/backend/nohup.out"

pause