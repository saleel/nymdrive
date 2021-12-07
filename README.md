# NymDrive

An open-source, decentralized, E2E encrypted, privacy friendly alternative to Google Drive/Dropbox.

Version: 0.1.1

## Features
- Files are encrypted locally and uploaded to server app using Nym mixnet. 
- Server app (service-provider) store the files in IPFS using Textile buckets. 
- Files can be retrieved/deleted later using the file hash. Knowledge of hash proves the ownership of files.
- Neither service-provider or IPFS storage providers can see the contents or name of the stored files.


This repo contain code for both client app (written in Electron) and service-provider.

- Client app can be found in folder `/ui`
- service-provider can be found in `/service-provider`

## Running

- Download NymDrive Client - [NymDrive v0.1.1](https://github.com/saleel/nymdrive/releases/download/0.1.1/NymDrive-mac.zip)
- Run Nym web-socket client in your machine like `./nym-client run --id saleel`
- Open the NymDrive app. It should connect to your local Nym client and bring up the application.
- Note: The service provider app will be hosted in a cloud provider. It may not work all the time due to connection timeout from the Nym client running in the server.
- The address of the service provider is hardcoded in the client. The hosted server app will be listening to that address.
- You can also chose to run your own service provider app. You will need to provide [Textile Buckets](https://docs.textile.io/buckets/) API keys as env variables.
- You will also need to edit the server app Nym address in `ui/electron/config.js`

## Running Locally / Development Mode

To run the server app, go to `/service-provider` and run
- `npm run start`

To run the client app in dev mode, go to `/ui` and run both the commands below:

- `npm run start-react`
- `npm run electron`

## TODO
- Add file logger instead on console logs
- Use nym web-assembly client for UI when ready
- Option for publishing Public un-encrypted files to nym blockchain
- UI to match Windows/Linux


[Presentation](https://docs.google.com/presentation/d/1MpvIK32Mx9VKLVfMTcvbeyrsKHHUsTvDQ-3n31dR0NE/)

[Demo Video](https://youtu.be/oSLlbUhLkH0)

