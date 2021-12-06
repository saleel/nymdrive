import React from 'react';
import PropTypes from 'prop-types';
import {
  GlobalPaths, GlobalPathsDisplay, Icons, Statuses,
} from '../constants';
import usePromise from '../hooks/use-promise';
import usePrompt from './use-prompt';

const FileExplorer = function FileExplorer({ path: initialPath }) {
  const [currentPath, setCurrentPath] = React.useState(initialPath);
  const [selectedFile, setSelectedFile] = React.useState();

  const prompt = usePrompt();

  const [files, { reFetch: reFetchFiles }] = usePromise(
    () => window.DB.findFiles({ path: currentPath }),
    { defaultValue: [], dependencies: [currentPath], refreshInterval: 1000 },
  );

  async function onDrop(e) {
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

    await window.DB.fetchFile(file.hash);
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

  async function onFileDrag(file) {
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
        <div className="toolbar-actions pull-right">

          {isStoredFileSelected() && (
            <>
              <button
                type="button"
                className="btn"
                onClick={onDeleteLocalClick}
                title="Delete local copy"
              >
                <span className="icon icon-trash" />
              </button>

              <button
                type="button"
                className="btn"
                onClick={onDeleteClick}
                title="Delete stored"
              >
                <span className="icon icon-trash" />
              </button>
            </>
          )}

          {isFileSelected() && (
            <button
              type="button"
              className="btn"
              onClick={onShare}
              title="Share"
            >
              <span className="icon icon-share" />
            </button>
          )}

          <button
            type="button"
            className="btn"
            onClick={onCreateFolderClick}
            title="New Folder"
          >
            <span className="icon icon-folder" />
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
          </div>

          <div
            className="pane"
            onDragEnter={(e) => { e.preventDefault(); }}
            onDragOver={(e) => { e.preventDefault(); }}
            onDrop={onDrop}
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
                    draggable={file.localPath ? 'true' : 'false'}
                    onClick={() => { onFileClick(file); }}
                    onDoubleClick={() => { onFileDoubleClick(file); }}
                    className={selectedFile?.name === file.name ? 'active' : ''}
                    onDragStart={(e) => { e.preventDefault(); onFileDrag(file); }}
                  >
                    <td>
                      <span className={`icon icon-${Icons[file.type] || Icons.file} mr-2`} />
                      {file.name}
                    </td>
                    <td>{file.type === 'FOLDER' ? '' : file.type}</td>
                    <td>{file.updatedAt ? new Date(file.updatedAt).toISOString() : ''}</td>
                    <td>{file.hash}</td>
                    <td>{file.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

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