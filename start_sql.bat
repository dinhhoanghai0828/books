@echo on
cd /d G:\100_INSTALLER\2_XAMPP\mysql\bin
net stop mysql
mysqld --remove mysql
mysqld --install mysql --defaults-file="G:\100_INSTALLER\2_XAMPP\mysql\bin\my.ini"
net start mysql
mysql -u root -p books < G:\20_PROJECT\books\3_DATABASE\CHART.sql
echo ================================
echo DONE
pause
