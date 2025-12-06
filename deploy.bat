@rem C:\Windows\System32\cmd.exe\PLINK.EXE 91.108.111.253
@rem I:\books\2_books\1_BACK_END\putty\PLINK.EXE 91.108.111.253
@rem mvn clean install -DskipTests
set userName=root
set password=Thanphong@92
set server_ip=91.108.111.253

call %~dp0\putty\plink.exe -batch -ssh %userName%@%server_ip% -pw %password% "sudo chmod 777 /etc/nginx/sites-available"
call %~dp0\putty\pscp.exe -pw %password% %~dp0\default %userName%@%server_ip%:/etc/nginx/sites-available
call %~dp0\putty\plink.exe -batch -ssh %userName%@%server_ip% -pw %password% "sudo systemctl restart nginx"




