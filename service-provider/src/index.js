import WebSocket from 'ws';
import store from './handlers/store.js';
import fetch from './handlers/fetch.js';
import remove from './handlers/remove.js';
import buildContext from './context.js';

const handlers = {
  STORE: store,
  FETCH: fetch,
  REMOVE: remove,
};

/** @type {WebSocket} */
let ws;
let timeout;
function connect(context) {
  ws = new WebSocket(process.env.NYM_CLIENT_URL);

  ws.on('open', () => {
    console.log('Socket connected');
    ws.send(JSON.stringify({ type: 'selfAddress' }));
  });

  ws.onclose = (e) => {
    if (e.code !== 999) {
      console.log('Socket is closed. Reconnect will be attempted in 1 second.', e.code, e.reason);
      timeout = setTimeout(() => {
        connect(context);
      }, 1000);
    }
  };

  ws.onerror = (err) => {
    console.error('Socket encountered error: ', err.message, 'Closing socket');
    ws.close();
  };

  ws.on('message', async (dataBuff) => {
    let message;
    let messageString = dataBuff.toString();

    try {
      // A few junk characters appear while parsing messages that
      // was sent before the socket was started.
      // Also in this case only the inner message is available.
      if (!messageString.startsWith('{')) {
        messageString = messageString.slice(messageString.indexOf('{'), messageString.length);
      }
      message = JSON.parse(messageString);
    } catch (error) {
      console.error('Error parsing JSON', messageString);
      return;
    }

    if (message.type === 'selfAddress') {
      console.log(`Connected to NYM client: ${message.address}`);
    } else {
      try {
        const {
          action, actionId, senderAddress, ...data
        } = message.action ? message : JSON.parse(message.message);

        console.log({
          action, actionId, senderAddress,
        });

        if (handlers[action]) {
          const result = await handlers[action](data, context);

          if (result) {
            ws.send(JSON.stringify({
              type: 'send',
              message: JSON.stringify({
                ...result,
                actionId,
              }),
              recipient: senderAddress,
              withReplySurb: false,
            }));
          }
        } else {
          throw new Error(`No handler found for ${action}`);
        }
      } catch (error) {
        console.error(error);
      }
    }
  });

  return ws;
}

buildContext().then((context) => {
  connect(context);
});

process.on('SIGINT', () => {
  ws.close(999);
  clearTimeout(timeout);
  process.exit(0);
});
