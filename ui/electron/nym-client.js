const WebSocket = require('ws');
const { NYM_CLIENT_URL, NYM_SERVER_ADDRESS } = require('./config');

class NymClient {
  constructor({ onConnect, onDisconnect, onReceive }) {
    this.actionWaiters = {};
    this.connect();
    this.onConnect = onConnect;
    this.onDisconnect = onDisconnect;
    this.onReceive = onReceive; // When SHARE action is received

    this.isConnected = false;
  }

  connect() {
    console.log('Connecting NYM client...');
    this.ws = new WebSocket(NYM_CLIENT_URL);

    this.ws.on('open', () => {
      console.log('Socket connected');
      this.ws.send(JSON.stringify({ type: 'selfAddress' }));
    });

    this.ws.on('close', (e) => {
      console.log('Socket is closed. Reconnect will be attempted in 1 second.', e.reason);

      if (this.isConnected) {
        this.onDisconnect();
        this.isConnected = false;
      }

      setTimeout(() => {
        this.connect();
      }, 1000);
    });

    this.ws.on('error', (err) => {
      console.error('Socket encountered error: ', err.message, 'Closing socket');
      this.ws.close();
    });

    this.ws.on('message', (...args) => this.onMessage(...args));
  }

  onMessage(dataBuff) {
    let message;
    let messageString = dataBuff.toString();

    try {
      if (!messageString.startsWith('{')) {
        // Trim junk characters at the beginning
        messageString = messageString.slice(messageString.indexOf('{'), messageString.length);
      }
      message = JSON.parse(messageString);
    } catch (error) {
      console.error('Error parsing JSON', messageString);
      return;
    }

    if (message.type === 'selfAddress') {
      const selfAdd = message.address;
      this.myNymAddress = selfAdd;
      console.log(`nymAddress: ${selfAdd}`);

      if (!this.isConnected) {
        this.onConnect(selfAdd);
        this.isConnected = true;
      }
    } else {
      try {
        const data = message.action ? message : JSON.parse(message.message);

        if (data.actionId && this.actionWaiters[data.actionId]) {
          this.actionWaiters[data.actionId](data);
        } else {
          this.onReceive(data);
        }
      } catch (error) {
        console.warn(error, message);
      }
    }
  }

  async isReady() {
    if (this.myNymAddress) {
      return Promise.resolve();
    }

    return new Promise((resolve) => {
      const interval = setInterval(() => {
        if (this.myNymAddress) {
          clearInterval(interval);
          resolve();
        }
      }, 1000);
    });
  }

  async sendData(message, recipient) {
    await this.isReady();

    return new Promise((resolve, reject) => {
      const actionId = message.actionId || Math.random().toString(36).slice(2);

      this.ws.send(JSON.stringify({
        type: 'send',
        message: JSON.stringify({
          ...message,
          senderAddress: this.myNymAddress,
          actionId,
        }),
        recipient: recipient || NYM_SERVER_ADDRESS,
        withReplySurb: false,
      }), (err) => {
        if (err) {
          reject(err);
        }

        console.log(`Action ${message.action} with ID ${actionId} send to nym`);

        if (message.action === 'SHARE') {
          resolve(true);
        } else {
          this.actionWaiters[actionId] = (response) => {
            console.log(`Found response for action ${actionId}`);
            resolve(response);
          };
        }
      });
    });
  }
}

module.exports = NymClient;
