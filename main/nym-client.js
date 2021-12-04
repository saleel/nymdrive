const WebSocket = require('ws');
const { NYM_CLIENT_URL, NYM_SERVER_ADDRESS } = require('./config');

class NymClient {
  constructor({ onConnect }) {
    this.actionWaiters = {};
    this.connect();
    this.onConnect = onConnect;
  }

  connect() {
    console.log('Connecting NYM client...');
    this.ws = new WebSocket(NYM_CLIENT_URL);

    this.ws.on('open', () => {
      console.log('Socket connected');
      this.ws.send(JSON.stringify({ type: 'selfAddress' }));
      this.onConnect();
    });

    this.ws.on('close', (e) => {
      console.log('Socket is closed. Reconnect will be attempted in 1 second.', e.reason);
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
    const message = JSON.parse(dataBuff.toString());

    if (message.type === 'selfAddress') {
      const selfAdd = message.address;
      this.myNymAddress = selfAdd;
      console.log(`nymAddress: ${selfAdd}`);
    } else {
      try {
        const data = JSON.parse(message.message);
        if (data.actionId && this.actionWaiters[data.actionId]) {
          this.actionWaiters[data.actionId](data);
        } else {
          throw new Error('No handler for data', data);
        }
      } catch (error) {
        console.warn(error, message.message);
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

  async sendData(message) {
    await this.isReady();

    const actionId = Math.random().toString(36).slice(2);

    this.ws.send(JSON.stringify({
      type: 'send',
      message: JSON.stringify({
        ...message,
        senderAddress: this.myNymAddress,
        actionId,
      }),
      recipient: NYM_SERVER_ADDRESS,
      withReplySurb: false,
    }), (err) => {
      if (err) {
        throw err;
      }

      console.log(`Action ${actionId} send to nym`);
    });

    return new Promise((resolve) => {
      this.actionWaiters[actionId] = (response) => {
        console.log(`Found response for action ${actionId}`);
        resolve(response);
      };
    });
  }
}

module.exports = NymClient;
