#!/bin/bash


###########################
####### LOAD CONFIG #######
###########################
 
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


# Creates backup files (bson) of all MongoDb databases on a given server.
# Default behaviour dumps the mongo database and tars the output into a file

### Set server settings
HOST="localhost"
PORT="27017" # default mongoDb port is 27017
USERNAME=""
PASSWORD=""

# Set where database backups will be stored
# keyword DATE gets replaced by the current date, you can use it in either path below
BACKUP_PATH=$MONGO_BACKUP_DIR
FILE_NAME=$MONGO_FILE_NAME


##################################################################################
# Should not have to edit below this line unless you require special functionality
# or wish to make improvements to the script
##################################################################################

echo "##########################################"
echo "######### START MONGO BACKUP  ############"
echo "##########################################"

# Auto detect unix bin paths, enter these manually if script fails to auto detect
MONGO_DUMP_BIN_PATH="$(which mongodump)"
TAR_BIN_PATH="$(which tar)"

# Get todays date to use in filename of backup output
TODAYS_DATE=`date "+%Y-%m-%d"`

# replace DATE with todays date in the backup path
#BACKUP_PATH="${BACKUP_PATH//DATE/$TODAYS_DATE}"

echo "Backup path : "$BACKUP_PATH


# Create BACKUP_PATH directory if it does not exist
[ ! -d $BACKUP_PATH ] && mkdir -p $BACKUP_PATH || :

# Ensure directory exists before dumping to it
if [ -d "$BACKUP_PATH" ]; then

	cd $BACKUP_PATH
	
	# initialize temp backup directory
	TMP_BACKUP_DIR="mongodb-$TODAYS_DATE"
	
	echo; echo "=> Backing up Mongo Server: $HOST:$PORT"; echo -n '   ';
	
	# run dump on mongoDB
	if [ "$USERNAME" != "" -a "$PASSWORD" != "" ]; then 
		$MONGO_DUMP_BIN_PATH --host $HOST:$PORT -u $USERNAME -p $PASSWORD --out $TMP_BACKUP_DIR >> /dev/null
	else 
		$MONGO_DUMP_BIN_PATH --host $HOST:$PORT --out $TMP_BACKUP_DIR >> /dev/null
	fi
	
	# check to see if mongoDb was dumped correctly
	if [ -d "$TMP_BACKUP_DIR" ]; then

		# turn dumped files into a single tar file
		$TAR_BIN_PATH --remove-files -czf $FILE_NAME.tar.gz $TMP_BACKUP_DIR >> /dev/null

		# verify that the file was created
		if [ -f "$FILE_NAME.tar.gz" ]; then
			echo "=> Success: `du -sh $FILE_NAME.tar.gz`"; echo;
	
			# forcely remove if files still exist and tar was made successfully
			# this is done because the --remove-files flag on tar does not always work
			if [ -d "$BACKUP_PATH/$TMP_BACKUP_DIR" ]; then
				rm -rf "$BACKUP_PATH/$TMP_BACKUP_DIR"
			fi
		else
			 echo "!!!=> Failed to create backup file: $BACKUP_PATH/$FILE_NAME.tar.gz"; echo;
		fi
	else 
		echo; echo "!!!=> Failed to backup mongoDB"; echo;	
	fi
else

	echo "!!!=> Failed to create backup path: $BACKUP_PATH"

fi
