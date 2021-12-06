const Loki = require('lokijs');
const fs = require('fs');
const FileAdapter = require('lokijs/src/loki-fs-sync-adapter');
const crypto = require('crypto');
const { shell } = require('electron');
const path = require('path');
const { hashFile, encryptFile, decryptFile } = require('./utils');
const NymClient = require('./nym-client');

const COLLECTION_NAME = 'files';

const Statuses = {
  PENDING: 'PENDING',
  STORED: 'STORED',
};

class DB {
  /**
   *
   * @param {{ app: import("electron").App} } args
   */
  constructor() {
    this.createFolder = this.createFolder.bind(this);
    this.createFile = this.createFile.bind(this);
    this.findFiles = this.findFiles.bind(this);
    this.updateFile = this.updateFile.bind(this);
    this.fetchFile = this.fetchFile.bind(this);
    this.processPendingFiles = this.processPendingFiles.bind(this);
    this.deleteFileLocally = this.deleteFileLocally.bind(this);
    this.deleteFile = this.deleteFile.bind(this);

    this.isReady = false;

    this.appDataPath = '/tmp'; // TODO: Change this to app.getPath() (not working with contextIsolation)

    /** @type {import("./nym-client")} */
    this.nymClient = new NymClient({
      onConnect: this.processPendingFiles,
    });

    this.db = new Loki('nymdrive.db', {
      adapter: new FileAdapter(),
      autoload: true,
      autosave: true,
      autosaveInterval: 1000,
      autoloadCallback: () => {
        this.filesCollection = this.db.getCollection(COLLECTION_NAME);
        if (this.filesCollection === null) {
          this.filesCollection = this.db.addCollection(COLLECTION_NAME);
        }
        this.isReady = true;
      },
    });
  }

  async processPendingFiles() {
    // Upload pending files
    this.findFiles({ status: Statuses.PENDING })
      .then((files) => (files || []).forEach((f) => this.encryptAndStore(f)));
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

    const encryptedFileString = await encryptFile(file.systemPath, key);
    const hash = await hashFile(encryptedFileString);

    console.log(`Encrypted ${file.name}`);

    await this.updateFile(file.id, {
      id: hash, // Set new ID
      hash,
      encryptionKey: key.toString('hex'),
    });

    console.log(encryptedFileString);

    // Upload to NYM and wait for response
    const response = await this.nymClient.sendData({
      action: 'STORE',
      content: encryptedFileString,
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
    const file = this.filesCollection.find({
      hash,
    })[0];

    if (!file) {
      throw new Error(`No file found with hash ${hash}`);
    }

    const response = await this.nymClient.sendData({
      action: 'FETCH',
      hash,
    });

    const { content: encryptedFileString } = response;

    console.log(encryptedFileString);

    const decrypted = await decryptFile(encryptedFileString, file.encryptionKey);

    const destinationPath = path.join(this.appDataPath, file.path);
    fs.writeFileSync(destinationPath, decrypted);
    console.log(destinationPath);

    shell.openExternal(destinationPath);
  }

  async deleteFileLocally(hash) {
    const file = this.filesCollection.find({
      hash,
    })[0];

    await fs.unlinkSync(file.systemPath);
  }

  async deleteFile(hash) {
    const file = this.filesCollection.find({
      hash,
    })[0];

    if (!file) {
      return;
    }

    await this.nymClient.sendData({
      action: 'DELETE',
      hash,
    });

    await this.filesCollection.remove({ hash });
  }
}

module.exports = DB;
