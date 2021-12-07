import React from 'react';
import './photon.css';
import './main.css';
import 'react-loader-spinner/dist/loader/css/react-spinner-loader.css';
import FileExplorer from './components/file-explorer';

const App = function App() {
  return (
    <FileExplorer />
  );
};

export default App;
