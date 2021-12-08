#!/bin/bash
sleep 1
./nym-client run --id server -p 1234 &> client.log
tail -f client.log | while read LOGLINE
do
   [[ "${LOGLINE}" == *"The current network topology seem to be insufficient"* ]] && pkill -P $$ && exec sh ./run-client.sh
   [[ "${LOGLINE}" == *"won't send any loop cover message this time"* ]] && pkill -P $$ && exec sh ./run-client.sh
done