# NymDrive

An open-source, decentralized, E2E encrypted, privacy friendly alternative to Google Drive/Dropbox.

- Files are encrypted locally and uploaded to server app using Nym mixnet. 
- Server app (service-provider) store the files in IPFS using Textile buckets. 
- Files can be retrieved/deleted later using the file hash. Knowledge of hash proves the ownership of files.
- Neither service-provider or IPFS storage providers can see the contents or name of the stored files.


This repo contain code for both client app (written in Electron) and service-provider.

- Client app can be found in folder `/ui`
- service-provider can be found in `/service-provider`


## TODO
- Add logger
- Encrypt local DB
- UI to match windows