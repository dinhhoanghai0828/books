@rem C:\Windows\System32\cmd.exe\PLINK.EXE 91.108.111.253
@rem I:\books\2_books\1_BACK_END\putty\PLINK.EXE 91.108.111.253
@rem mvn clean install -DskipTests
set userName=root
set password=Thanphong@93
set server_ip=91.108.111.253

call %~dp0\putty\plink.exe -batch -ssh %userName%@%server_ip% -pw %password% "sudo kill -9 `sudo lsof -t -i:8080`"
call %~dp0\putty\plink.exe -batch -ssh %userName%@%server_ip% -pw %password% "nohup java -jar /var/www/backend/demo.war  &"
call %~dp0\putty\plink.exe -batch -ssh %userName%@%server_ip% -pw %password% "sudo tail -500f /var/www/backend/nohup.out"




