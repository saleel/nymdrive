# NymDrive

An open-source, decentralized, E2E encrypted, privacy friendly alternative to Google Drive/Dropbox.

- Files are encrypted locally and uploaded to server app using Nym mixnet. 
- Server app (service-provider) store the files in IPFS using Textile buckets. 
- Files can be retrieved/deleted later using the file hash. Knowledge of hash proves the ownership of files.
- Neither service-provider or IPFS storage providers can see the contents or name of the stored files.


This repo contain code for both client app (written in Electron) and service-provider.

- Client app can be found in folder `/ui`
- service-provider can be found in `/service-provider`


### [Download Client v0.1.0](https://github.com/saleel/nymdrive/releases/download/0.1.0/NymDrive-mac.zip)


## TODO
- Add file logger instead on console logs
- Use nym web-assembly client for UI when ready
- Option for publishing Public un-encrypted files to nym blockchain
- UI to match Windows/Linux