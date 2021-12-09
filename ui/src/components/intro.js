import React from 'react';
import Loader from 'react-loader-spinner';
import usePrompt from '../hooks/use-prompt';

const Intro = function Intro() {
  const prompt = usePrompt();
  const [isAwaiting, setIsAwaiting] = React.useState(false);

  React.useEffect(() => {
    window.API.registerNewDeviceHandler(async (address) => {
      const accepted = await window.confirm(`A new device connection request from ${address}. \nDo you want to allow this?`);
      return accepted;
    });
  }, []);

  async function onLinkDeviceClick() {
    const clientAddress = await prompt({
      title: 'Connect to existing device',
      description: 'Enter the address of the Nym client your other device is connected to:',
    });

    if (clientAddress) {
      const promise = window.API.addDevice(clientAddress);
      setIsAwaiting(true);
      try {
        const result = await promise;
        setIsAwaiting(false);
        if (result) {
          window.alert('New device added successfully');
        } else {
          window.alert('New device request failed');
        }
      } catch (error) {
        window.alert('New device request failed');
      }
    }
  }

  if (isAwaiting) {
    <div className="loader">
      <Loader
        type="Oval"
        color="#000"
        height={50}
        width={50}
      />
      <div>Approve the request from your other device</div>
    </div>;
  }

  return (
    <div className="intro">
      <p className="mb-1">Welcome to NymDrive</p>
      <p>
        Start by dropping files here or Click
        {' '}
        <span className="icon icon-folder" />
        {' '}
        to create a new folder.
      </p>
      <p>
        <span>Or </span>
        <button
          type="button"
          onClick={onLinkDeviceClick}
          className="btn btn-primary"
        >
          Add an existing device
        </button>
        <span> where you already use NymDrive.</span>
      </p>
    </div>
  );
};

export default React.memo(Intro);
