#!/bin/sh

#path to pgrep command
PGREP="/usr/bin/pgrep"


echo *********Restart apache2 if down****************
RESTART="/etc/init.d/apache2 restart"

# Httpd daemon name,
HTTPD="apache2"

# find httpd pid
$PGREP -l ${HTTPD}
 
if [ $? -ne 0 ] # if apache is not running
then
# restart apache
$RESTART
else
	echo "apache2 is already running"
fi


echo *********Start mongo daemon if down*************
RESTARTMONGOD="service mongod start"
MONGOD="mongod"
$PGREP -l ${MONGOD}
if [ $? -ne 0 ] # if mongod is not running
then
# restart mongod
$RESTARTMONGOD
else
	echo "mongod is already running"
fi


echo ******Start yajade.com node.js application******
RESTARTNODEJS="forever start /home/yajade/app.js"
NODEJS="nodejs"
$PGREP -l ${NODEJS}
if [ $? -ne 0 ] # if nodejs is not running
then
# restart node.js application
exec $RESTARTNODEJS
else
	echo "NodeJS is already running"
fi


exit 0
