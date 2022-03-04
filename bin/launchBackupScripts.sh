#!/bin/bash

##################################
########### LOAD CONFIG ##########
# LOAD HERE FOR DIRECTORY BACKUP #
##################################
 
while [ $# -gt 0 ]; do
        case $1 in
                -c)
                        if [ -r "$2" ]; then
                                source "$2"
                                shift 2
                        else
                                ${ECHO} "Unreadable config file \"$2\"" 1>&2
                                exit 1
                        fi
                        ;;
                *)
                        ${ECHO} "Unknown Option \"$1\"" 1>&2
                        exit 2
                        ;;
        esac
done
 
if [ $# = 0 ]; then
        SCRIPTPATH=$(cd ${0%/*} && pwd -P)
        source $SCRIPTPATH/backup.config
fi;

###########################
#### START THE BACKUPS ####
###########################
(
rm -rf $BACKUP_DIRECTORY/*
if ! mkdir -p $LOG_DIRECTORY; then
	echo "Cannot create log directory" 
	exit 1;
fi;
touch $LOG_DIRECTORY/$LOG_FILENAME
cd /home/yajade/bin/
./pg_backup.sh
./mongodb-backup.sh
./directoryBackup.sh $YAJADE_BACKUP_DIR $YAJADE_FILENAME $YAJADE_SOURCES_DIR
./directoryBackup.sh $ATLASSIAN_BACKUP_DIR $ATLASSIAN_FILENAME $ATLASSIAN_SOURCES_DIR
) 2>&1 | tee -a $LOG_DIRECTORY/$LOG_FILENAME