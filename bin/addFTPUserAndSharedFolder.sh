#!/bin/bash

htpasswd -d /etc/vsftpd/ftpd.passwd $1
service vsftpd restart

mkdir /var/ftp/data/$1
chmod -w /var/ftp/data/$1
mkdir /var/ftp/data/$1/$1
chmod -R 755 /var/ftp/data/$1/$1
chown -R vsftpd:nogroup /var/ftp/data/$1
