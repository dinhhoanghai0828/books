@rem C:\Windows\System32\cmd.exe\PLINK.EXE 91.108.111.253
@echo off

REM Thiết lập các biến
set userName=root
set password=Thanphong@92
set server_ip=91.108.111.253

REM Cấp quyền truy cập thư mục trên server
call "%~dp0\putty\plink.exe" -batch -ssh %userName%@%server_ip% -pw %password% "sudo chmod 777 /var/www/book2"

REM Xóa nội dung thư mục book2 cũ
call "%~dp0\putty\plink.exe" -batch -ssh %userName%@%server_ip% -pw %password% "sudo rm -rf /var/www/book2/*"

REM Sao chép toàn bộ tệp và thư mục vào thư mục book2 trên server
call "%~dp0\putty\pscp.exe" -r -pw %password% "%~dp0*.*" %userName%@%server_ip%:/var/www/book2/

REM Chạy npm install để cài đặt các phụ thuộc
call "%~dp0\putty\plink.exe" -batch -ssh %userName%@%server_ip% -pw %password% "cd /var/www/book2 && sudo npm install"

REM Chạy npm run build để build dự án
call "%~dp0\putty\plink.exe" -batch -ssh %userName%@%server_ip% -pw %password% "cd /var/www/book2 && sudo npm run build"

REM Chạy npm run build để start dự án
call "%~dp0\putty\plink.exe" -batch -ssh %userName%@%server_ip% -pw %password% "cd /var/www/book2 && sudo npm stop"

REM Khởi động lại dịch vụ nextjs
call "%~dp0\putty\plink.exe" -batch -ssh %userName%@%server_ip% -pw %password% "sudo systemctl restart nextjs"

REM Thông báo hoàn thành
echo Done!

REM Pause để kiểm tra kết quả
pause
