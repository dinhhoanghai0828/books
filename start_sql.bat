@echo on
cd /d D:\1. INSTALL\1.XAMPP\mysql\bin
net stop mysql
mysqld --remove mysql
mysqld --install mysql --defaults-file="D:\1. INSTALL\1.XAMPP\mysql\bin\my.ini"
net start mysql
mysql -u root -p books < D:\20_PROJECT\books\3_DATABASE\CHART.sql
echo ================================
echo DONE
pause
