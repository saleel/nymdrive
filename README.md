# NymDrive

![NymDrive](https://raw.githubusercontent.com/saleel/nymdrive/main/ui/icons/png/128x128.png)

An open-source, decentralized, E2E encrypted, privacy friendly alternative to Google Drive/Dropbox.

Version: **0.1.2**

[Presentation](https://docs.google.com/presentation/d/1MpvIK32Mx9VKLVfMTcvbeyrsKHHUsTvDQ-3n31dR0NE/)

[Demo Video](https://www.youtube.com/watch?v=aWpZVNete9o)


## Features
- Files are encrypted locally and uploaded to server app using Nym mixnet. 
- Server app (service-provider) store the files in IPFS using Textile buckets. 
- Files can be retrieved/deleted later using the file hash. Knowledge of hash proves the ownership of files.
- Neither service-provider or IPFS storage providers can see the contents or name of the stored files.


This repo contain code for both client app (written in Electron) and service-provider.

- Client app can be found in folder `/ui`
- service-provider can be found in `/service-provider`

Note: Even though the client can be theoretically built for Windows, Linux and Mac, **only Mac build is tested and available** for download at the moment. Feel free to build for Windows and Linux and raise an issue if you find any challenge.

## Running

- Download NymDrive Client - [NymDrive v0.1.2](https://github.com/saleel/nymdrive/releases/download/0.1.2/NymDrive-mac.zip)
- Run Nym web-socket client in your machine like `./nym-client run --id client-id`
- Open the NymDrive app. It should connect to your local Nym client and bring up the application.
- Note: The service provider app will be hosted in a cloud provider. It may not work all the time due to connection timeout from the Nym client running in the server.
- The address of the service provider is configurable in the client. The hosted server app will be listening to the default address configured in the app.
- You can chose to run your own service provider and have your client send messages to that (read below).

## Running Locally / Development Mode

To run the server app, go to `/service-provider` and run
- `npm run start`

- You will need to provide [Textile Buckets](https://docs.textile.io/buckets/) API keys for env variables (`THREAD_KEY` and `THREAD_SECRET`).
- To update the client to point to your own service provider, update `NYM_SERVER_ADDRESS` key in `config.json` file in your Application Data folder. The AppData folder in Mac would be `~/Library/Application Support/nym-drive/`.

You can also run using Docker
- `docker build -t nymdrive .`
- `docker run -e THREAD_KEY=your-key -e THREAD_SECRET=your-secret -e NYM_CLIENT_URL="ws://host.docker.internal:1234" nymdrive` (if nym-client is running on port 1234 in host machine).

To run the client app in dev mode, go to `/ui` and run both the commands below:

- `npm run start-react`
- `npm run electron`

Tp build the client, run
- `npm run make`

## TODO
- Add file logger instead on console logs
- Sync DB between multiple devices running NymDrive connected to same client address
- Use nym web-assembly client for UI when ready
- Option for publishing Public un-encrypted files to nym blockchain
- UI to match Windows/Linux

