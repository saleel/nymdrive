import React from 'react';
import PropTypes from 'prop-types';
import Loader from 'react-loader-spinner';
import {
  GlobalPaths, GlobalPathsDisplay, Icons, Statuses,
} from '../constants';
import usePromise from '../hooks/use-promise';
import usePrompt from './use-prompt';

const FileExplorer = function FileExplorer({ path: initialPath }) {
  const [currentPath, setCurrentPath] = React.useState(initialPath);
  const [selectedFile, setSelectedFile] = React.useState();

  const prompt = usePrompt();

  const [files, { isFetching, reFetch: reFetchFiles }] = usePromise(
    () => window.DB.findFiles({ path: currentPath }),
    { defaultValue: [], dependencies: [currentPath], refreshInterval: 1000 },
  );

  const [favoriteFolders, { reFetch: reFetchFavoriteFolders }] = usePromise(
    () => window.DB.getFavoriteFolders(),
    { defaultValue: [] },
  );

  async function onFavoriteDrop(e) {
    const id = e.dataTransfer.getData('fileId');
    await window.DB.setFolderFavorite(id);
    await reFetchFavoriteFolders();
  }

  async function onFileDrop(e) {
    if (currentPath === GlobalPaths.SharedWithMe) {
      return;
    }

    const droppedFiles = [...e.dataTransfer.files];

    const existing = droppedFiles.find((d) => files.some((f) => f.name === d.name));
    if (existing) {
      alert(`There already exist a file named ${existing.name}. No files copied.`);
      return;
    }

    for (const f of droppedFiles) {
      window.DB.createFile({
        name: f.name,
        systemPath: f.path,
        path: currentPath,
        type: f.type,
        size: f.size,
      });
    }

    reFetchFiles();
  }

  async function onCreateFolderClick(e) {
    e.preventDefault();
    const folderName = await prompt({
      title: 'Create folder',
      description: 'Enter the name of the folder you want to create',
    });

    if (folderName) {
      if (files.some((f) => f.name === folderName)) {
        alert(`There already exist a file or folder named ${folderName}.`);
        return;
      }

      await window.DB.createFolder({
        name: folderName,
        path: currentPath,
      });

      reFetchFiles();
    }
  }

  async function onFileClick(file) {
    setSelectedFile(file);
  }

  async function onFileDoubleClick(file) {
    if (file.type === 'FOLDER') {
      setCurrentPath(`${currentPath}/${file.name}`);
    }

    await window.DB.openFile(file.hash);
  }

  async function onDownloadClick() {
    await window.DB.fetchFile(selectedFile.hash);
  }

  async function onClearCacheClick() {
    await window.DB.clearCache();
    alert('All temporary files have been deleted');
  }

  async function onDeleteLocalClick() {
    if (window.confirm(`Are you sure you want to delete the local copy ${selectedFile.systemPath}?`)) {
      await window.DB.deleteFileLocally(selectedFile.hash);
    }
  }

  async function onDeleteClick() {
    if (window.confirm('Are you sure you want to delete the file stored in the cloud?')) {
      await window.DB.deleteFile(selectedFile.hash);
    }
  }

  async function onFileDrag(e, file) {
    if (file.type === 'FOLDER') {
      e.dataTransfer.setData('fileId', file.id);
      return;
    }

    if (window.electron?.startDrag) {
      await window.electron.startDrag(file);
    }
  }

  async function onShare() {
    const clientAddress = await prompt({
      title: `Share ${selectedFile.name}`,
      description: 'Enter the nym client address of the person you want to share this file with',
    });

    const message = await window.DB.shareFile(selectedFile.hash, clientAddress);

    window.alert(message || 'File shared successfully');
  }

  function isFileSelected() {
    return selectedFile && selectedFile.type !== 'FOLDER';
  }

  function isStoredFileSelected() {
    return isFileSelected() && selectedFile.status !== Statuses.PENDING;
  }

  return (
    <div className="window">

      <div className="toolbar">

        <div className="toolbar-actions">
          <div className="btn-group">
            <button
              type="button"
              className="btn"
            >
              <span className="icon icon-left" />
            </button>
            <button
              type="button"
              className="btn"
            >
              <span className="icon icon-right" />
            </button>
          </div>

          {isStoredFileSelected() && (
            <div className="btn-group pull-right">
              <button
                type="button"
                className="btn"
                onClick={onDeleteLocalClick}
                title="Delete local copy"
              >
                <span className="icon icon-cancel" />
              </button>

              <button
                type="button"
                className="btn"
                onClick={onDeleteClick}
                title="Delete stored"
              >
                <span className="icon icon-trash" />
              </button>

              <button
                type="button"
                className="btn"
                onClick={onDownloadClick}
                title="Download file"
              >
                <span className="icon icon-download" />
              </button>
            </div>
          )}

          {isFileSelected() && (
            <button
              type="button"
              className="btn pull-right"
              onClick={onShare}
              title="Share"
            >
              <span className="icon icon-share" />
            </button>
          )}

          <button
            type="button"
            className="btn pull-right"
            onClick={onCreateFolderClick}
            title="New Folder"
          >
            <span className="icon icon-folder" />
          </button>

          <button
            type="button"
            className="btn pull-right"
            onClick={onClearCacheClick}
            title="Clear cache"
          >
            <span className="icon icon-block" />
          </button>

        </div>
      </div>

      <div className="window-content">
        <div className="pane-group">

          <div className="pane pane-sm sidebar">
            <nav className="nav-group">
              <h5 className="nav-group-title">NymDrive</h5>
              {Object.keys(GlobalPaths).map((path) => (
                <span
                  key={path}
                  className={`nav-group-item p-1 ${GlobalPaths[path] === currentPath ? 'active' : ''}`}
                  onClick={() => { setCurrentPath(GlobalPaths[path]); }}
                >
                  <span className={`icon icon-${Icons[path]}`} />
                  {GlobalPathsDisplay[path]}
                </span>
              ))}

            </nav>

            <nav
              className="nav-group"
              onDragEnter={(e) => { e.preventDefault(); }}
              onDragOver={(e) => { e.preventDefault(); }}
              onDrop={onFavoriteDrop}
              style={{ minHeight: '150px' }}
            >
              <h5 className="nav-group-title">Favorites</h5>
              {favoriteFolders.map((folder) => (
                <span
                  key={folder.path + folder.name}
                  className={`nav-group-item p-1 ${`${folder.path}/${folder.name}` === currentPath ? 'active' : ''}`}
                  onClick={() => { setCurrentPath(`${folder.path}/${folder.name}`); }}
                >
                  {folder.name}
                </span>
              ))}
            </nav>
          </div>

          {isFetching ? (
            <div className="loader">
              <Loader
                type="Oval"
                color="#000"
                height={50}
                width={50}
              />
            </div>
          ) : (
            <div
              className="pane"
              onDragEnter={(e) => { e.preventDefault(); }}
              onDragOver={(e) => { e.preventDefault(); }}
              onDrop={onFileDrop}
            >
              <table className="table-striped">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Type</th>
                    <th>Date Modified</th>
                    <th>Hash</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {files.map((file) => (
                    <tr
                      key={file.id || file.name}
                      draggable={(file.temporaryLocalPath || file.type === 'FOLDER') ? 'true' : 'false'}
                      onClick={() => { onFileClick(file); }}
                      onDoubleClick={() => { onFileDoubleClick(file); }}
                      className={selectedFile?.name === file.name ? 'active' : ''}
                      onDragStart={(e) => { onFileDrag(e, file); }}
                    >
                      <td>
                        <span className={`icon icon-${Icons[file.type] || Icons.file} mr-2`} />
                        {file.name}
                      </td>
                      <td>{file.type === 'FOLDER' ? '' : file.type}</td>
                      <td>{file.updatedAt ? new Date(file.updatedAt).toISOString() : ''}</td>
                      <td>{file.hash}</td>
                      <td style={{ width: '90px' }}>
                        {file.status}
                        {file.isFetching && (<span title="Fetching" className="blinking-dot" />)}
                        {!file.isFetching && file.temporaryLocalPath && (<span title="Available locally" className="green-dot" />)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

FileExplorer.propTypes = {
  path: PropTypes.string,
};

FileExplorer.defaultProps = {
  path: '/',
};

export default FileExplorer;
