#!/bin/bash


###########################
#### START THE BACKUPS ####
###########################
 
 
FINAL_BACKUP_DIR=$1
 
echo "Making backup directory in $FINAL_BACKUP_DIR"
 
if ! mkdir -p $FINAL_BACKUP_DIR; then
	echo "Cannot create backup directory in $FINAL_BACKUP_DIR. Go and fix it!" 1>&2
	exit 1;
fi;

###########################
#### START THE BACKUPS ####
###########################

echo "##########################################"
echo "######## START BACKUP DIRECTORY ##########"
echo "##########################################"
echo "Backup $3 into $FINAL_BACKUP_DIR"

tar -cpzf $FINAL_BACKUP_DIR/$2 $3
 
echo -e "\n $FINAL_BACKUP_DIR/$2 - Backup complete!"
