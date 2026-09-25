echo START BACKEND JAVA
cd /d E:\books\1_BACK_END
echo BUILD PROJECT
call mvn clean install -DskipTests

echo RUN WAR/JAR
java -jar E:\books\1_BACK_END\target\demo.war

pause
