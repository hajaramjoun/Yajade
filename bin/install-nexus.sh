#!/bin/bash

# Start by creating new user and group, you will prompted do add additional info.
adduser nexus

#change to work dir
cd /tmp/

#Then download fresh version of nexus. In my case v2.11.4-01
wget www.sonatype.org/downloads/nexus-2.11.4-01-bundle.tar.gz
  
cp nexus-2.11.4-01-bundle.tar.gz /usr/local
cd /usr/local
tar xvzf nexus-2.11.4-01-bundle.tar.gz

# create symbolic link
ln -s nexus-2.11.4-01 nexus

# create environment variable
export NEXUS_HOME=/usr/local/nexus 

# remove unused tar.gz
rm /tmp/nexus-2.11.4-01-bundle.tar.gz
 
# change nexus config work directory and context path
mkdir /home/nexus/sonatype-work
mkdir /home/nexus/sonatype-work/main-repo
sed -i "s/nexus-work=\${bundleBasedir}\/..\/sonatype-work\/nexus/nexus-work=\/home\/nexus\/sonatype-work\/main-repo/g" /usr/local/nexus/conf/nexus.properties
sed -i "s/nexus-webapp-context-path=\/nexus/nexus-webapp-context-path=\//g" /usr/local/nexus/conf/nexus.properties
 
#Set owner user and group
chown nexus:nexus /home/nexus/sonatype-work/main-repo
chown -R nexus:nexus /usr/local/nexus-2.11.4-01/
chown -R nexus:nexus /usr/local/nexus

# Launch As a service 
# copy init.d script to proper place
cp /usr/local/nexus/bin/nexus /etc/init.d/nexus
 
#replace default location
sed -i "s/NEXUS_HOME=\"..\"/NEXUS_HOME=\"\/usr\/local\/nexus\"/g" /etc/init.d/nexus

#create dir in /var/run + rights
mkdir /var/run/nexus
chown nexus:nexus /var/run/nexus

#Set PID dir
sed -i "s/#PIDDIR=\".\"/PIDDIR=\"\/var\/run\/nexus\"/g" /etc/init.d/nexus

#Set RUN_AS user to nexus
sed -i "s/#RUN_AS_USER=/RUN_AS_USER=nexus/g" /etc/init.d/nexus

#now register the new script
update-rc.d nexus defaults

#run as service
service nexus start