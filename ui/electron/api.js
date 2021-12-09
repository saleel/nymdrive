const { shell } = require('electron');
const Loki = require('lokijs');
const fs = require('fs');
const FileAdapter = require('lokijs/src/loki-fs-sync-adapter');
const crypto = require('crypto');
const pathLib = require('path');
const EventEmitter = require('events');
const { hashFile, encryptFile, decryptFile } = require('./utils');
const NymClient = require('./nym-client');

const FILES_COLLECTION_NAME = 'files';
const DEVICES_COLLECTION_NAME = 'devices';

const Statuses = {
  PENDING: 'PENDING',
  STORED: 'STORED',
};

class DB extends EventEmitter {
  /**
   *
   * @param {{ app: import("electron").App} } args
   */
  constructor() {
    super();

    this.createFolder = this.createFolder.bind(this);
    this.createFile = this.createFile.bind(this);
    this.findFiles = this.findFiles.bind(this);
    this.updateFile = this.updateFile.bind(this);
    this.fetchFile = this.fetchFile.bind(this);
    this.processPendingFiles = this.processPendingFiles.bind(this);
    this.deleteFileLocally = this.deleteFileLocally.bind(this);
    this.deleteFile = this.deleteFile.bind(this);
    this.openFile = this.openFile.bind(this);
    this.shareFile = this.shareFile.bind(this);
    this.onReceive = this.onReceive.bind(this);
    this.onConnect = this.onConnect.bind(this);
    this.onDisconnect = this.onDisconnect.bind(this);
    this.clearCache = this.clearCache.bind(this);
    this.getFavoriteFolders = this.getFavoriteFolders.bind(this);
    this.setFolderFavorite = this.setFolderFavorite.bind(this);
    this.removeFolderFavorite = this.removeFolderFavorite.bind(this);
    this.addDevice = this.addDevice.bind(this);
    this.onNewDevice = this.onNewDevice.bind(this);
    this.registerNewDeviceHandler = this.registerNewDeviceHandler.bind(this);
    this.isClientConnected = this.isClientConnected.bind(this);

    this.isReady = false;

    const appDataDir = process.env.APPDATA || (process.platform === 'darwin' ? `${process.env.HOME}/Library/Application Support/` : `${process.env.HOME}/.local/share`);
    this.appDataPath = `${appDataDir}nym-drive`; // TODO: Change to app.getPath (not working with contextIsolation)

    console.debug('App Data Path: ', this.appDataPath);

    /** @type {import("./nym-client")} */
    this.nymClient = new NymClient({
      onConnect: this.onConnect, // Upload all pending files
      onReceive: this.onReceive,
      onDisconnect: this.onDisconnect,
    });
  }

  isClientConnected() {
    return this.isReady;
  }

  async onConnect(address) {
    this.emit('client-connected');

    this.db = new Loki(`${this.appDataPath}/nymdrive-${address}.db`, {
      adapter: new FileAdapter(),
      autoload: true,
      autosave: true,
      autosaveInterval: 1000,
      autoloadCallback: () => {
        this.filesCollection = this.db.getCollection(FILES_COLLECTION_NAME);
        if (this.filesCollection === null) {
          this.filesCollection = this.db.addCollection(FILES_COLLECTION_NAME);
        }

        this.devicesCollection = this.db.getCollection(DEVICES_COLLECTION_NAME);
        if (this.devicesCollection === null) {
          this.devicesCollection = this.db.addCollection(DEVICES_COLLECTION_NAME);
        }

        this.isReady = true;

        // Delete any temporarily downloaded files in the previous session
        this.clearCache();
      },
    });

    await this.processPendingFiles();
  }

  async onDisconnect() {
    this.isReady = false;
    this.emit('client-disconnected');
  }

  async processPendingFiles() {
    // Upload pending files
    await this.findFiles({ status: Statuses.PENDING })
      .then((files) => (files || [])
        .filter((f) => f.path !== 'SharedWithMe' && f.type !== 'FOLDER')
        .forEach((f) => this.encryptAndStore(f)));
  }

  async onReceive(data) {
    console.log('Received', data.name);

    await this.waitTillReady();

    if (data.action === 'SHARE') {
      return this.onNewSharedFile(data);
    }

    if (data.action === 'NEW_DEVICE') {
      return this.onNewDevice(data);
    }
  }

  async registerNewDeviceHandler(handler) {
    if (!this.onNewDeviceHandler) {
      this.onNewDeviceHandler = handler;
    }
  }

  async onNewDevice(data) {
    const approved = this.onNewDeviceHandler(data.senderAddress);

    if (!approved) {
      await this.nymClient.sendData({
        action: 'ADD_DEVICE_APPROVED',
        actionId: data.actionId,
        files: await this.findFiles(),
      }, data.senderAddress);
    } else {
      await this.nymClient.sendData({
        action: 'ADD_DEVICE_DENIED',
        actionId: data.actionId,
      }, data.senderAddress);
    }
  }

  async onNewSharedFile(data) {
    const existing = this.filesCollection.find({
      path: 'SharedWithMe',
      name: data.name,
    })[0];

    if (existing) {
      return false;
    }

    return this.filesCollection.insert({
      path: 'SharedWithMe',
      encryptionKey: data.encryptionKey,
      hash: data.hash,
      name: data.name,
      size: data.size,
      type: data.type,
      status: Statuses.STORED,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  async waitTillReady() {
    if (this.isReady) {
      return Promise.resolve();
    }

    return new Promise((resolve) => {
      const internal = setInterval(() => {
        if (this.isReady) {
          clearInterval(internal);
          resolve();
        }
      }, 1000);
    });
  }

  async findFiles({ path, status }) {
    await this.waitTillReady();

    const results = this.filesCollection.find({
      ...path && { path: { $eq: path } },
      ...status && { status: { $eq: status } },
    });

    return results;
  }

  async createFile({
    name, path, systemPath, type, size,
  }) {
    await this.waitTillReady();

    const file = {
      id: path + name, // temporary id
      name,
      path,
      systemPath,
      size,
      type,
      status: Statuses.PENDING,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.filesCollection.insert(file);

    return this.encryptAndStore(file);
  }

  async encryptAndStore(file) {
    // Encrypt file
    const key = crypto.randomBytes(32); // Each file encrypted with a new key

    let fileStringToUpload;
    if (file.path === 'Public') {
      fileStringToUpload = fs.readFileSync(file.systemPath).toString('base64');
    } else {
      fileStringToUpload = await encryptFile(file.systemPath, key);
      console.log(`Encrypted ${file.name}`);
    }

    const hash = await hashFile(fileStringToUpload);

    await this.updateFile(file.id, {
      id: hash, // Set new ID
      hash,
      encryptionKey: key.toString('hex'),
    });

    // Upload to NYM and wait for response
    const response = await this.nymClient.sendData({
      action: 'STORE',
      content: fileStringToUpload,
      hash,
    });

    console.log(`Stored ${file.name}`);

    // Set file as stored
    await this.updateFile(hash, {
      status: 'STORED',
      storedPath: response.path,
    });

    return file;
  }

  async createFolder({ name, path }) {
    await this.waitTillReady();

    this.filesCollection.insert({
      id: Math.random().toString(16).slice(2),
      name,
      path,
      type: 'FOLDER',
    });
  }

  async updateFile(id, changes) {
    await this.waitTillReady();

    const file = this.filesCollection.findOne({ id: { $eq: id } });

    if (file) {
      Object.keys(changes).forEach((key) => {
        file[key] = changes[key];
      });

      file.updatedAt = new Date();
      this.filesCollection.update(file);
    }
  }

  async fetchFile(hash) {
    await this.waitTillReady();

    const file = this.filesCollection.find({
      hash,
    })[0];

    if (!file) {
      throw new Error(`No file found with hash ${hash}`);
    }

    if (file.temporaryLocalPath) {
      return file.temporaryLocalPath;
    }

    await this.updateFile(hash, {
      isFetching: true,
    });

    const response = await this.nymClient.sendData({
      action: 'FETCH',
      hash,
    });

    const { content: encryptedFileString } = response;

    const decrypted = await decryptFile(encryptedFileString, file.encryptionKey);

    const destinationPath = pathLib.join(this.appDataPath, '/', file.name);

    fs.writeFileSync(destinationPath, decrypted);

    await this.updateFile(hash, {
      isFetching: false,
      temporaryLocalPath: destinationPath,
    });

    return destinationPath;
  }

  async openFile(hash) {
    const file = this.filesCollection.find({
      hash,
    })[0];

    if (!file) {
      return;
    }

    const destinationPath = await this.fetchFile(hash);

    shell.openPath(destinationPath);
  }

  async deleteFileLocally(hash) {
    await this.waitTillReady();

    const file = this.filesCollection.find({
      hash,
    })[0];

    try {
      await fs.unlinkSync(file.systemPath); // TODO: Make it hard delete
    } catch (error) {
      console.error(error);
    }
  }

  async deleteFile(hash) {
    await this.waitTillReady();

    const file = this.filesCollection.find({
      hash,
    })[0];

    if (!file) {
      return;
    }

    await this.nymClient.sendData({
      action: 'REMOVE',
      hash,
    });

    this.filesCollection.remove(file);
  }

  // Delete file downloaded for opening
  async clearCache() {
    await this.waitTillReady();

    const allFiles = this.filesCollection.find();

    for (const file of allFiles) {
      if (file.status === Statuses.STORED && file.temporaryLocalPath) {
        try {
          fs.unlinkSync(file.temporaryLocalPath);
        } catch (e) {
          console.error(e);
        }

        this.updateFile(file.hash, {
          temporaryLocalPath: null,
        });
      }
    }

    // Clean old status
    this.findFiles({ isFetching: true })
      .then((files) => (files || [])
        .forEach((f) => this.updateFile(f.hash, { isFetching: false })));
  }

  async shareFile(hash, recipient) {
    await this.waitTillReady();

    const file = this.filesCollection.find({
      hash,
    })[0];

    if (file) {
      try {
        // TODO: See if this data needs to be encrypted
        await this.nymClient.sendData({
          action: 'SHARE',
          encryptionKey: file.encryptionKey,
          hash,
          name: file.name,
          size: file.size,
          type: file.type,
        }, recipient);

        return `File shared with ${recipient}`;
      } catch (error) {
        console.error(error);
        return error.message;
      }
    }

    return 'File not found';
  }

  async setFolderFavorite(id) {
    await this.waitTillReady();

    const folder = this.filesCollection.find({
      type: 'FOLDER',
      id,
    })[0];

    if (folder) {
      this.updateFile(id, { isFavorite: true });
    }
  }

  async removeFolderFavorite(hash) {
    await this.waitTillReady();

    const folder = this.filesCollection.find({
      type: 'FOLDER',
      hash,
    })[0];

    if (folder) {
      this.updateFile(hash, { isFavorite: true });
    }
  }

  async getFavoriteFolders() {
    await this.waitTillReady();

    return this.filesCollection.find({
      type: 'FOLDER',
      isFavorite: true,
    });
  }

  async addDevice(address) {
    await this.waitTillReady();

    const result = await this.nymClient.sendData({
      action: 'ADD_DEVICE',
    }, address);

    if (result.action === 'ADD_DEVICE_APPROVED') {
      await this.filesCollection.insert(result.files);
      return true;
    }

    return false;
  }
}

module.exports = DB;
