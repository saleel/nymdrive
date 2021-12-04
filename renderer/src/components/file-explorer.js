import React from 'react';
import {
  GlobalPaths, GlobalPathsDisplay, Icons, Statuses,
} from '../constants';
import usePromise from '../hooks/use-promise';

const FileExplorer = function FileExplorer(props) {
  const [currentPath, setCurrentPath] = React.useState(props.path);
  const [selectedFile, setSelectedFile] = React.useState();

  const [files, { reFetch: reFetchFiles }] = usePromise(
    () => window.DB.findFiles({ path: currentPath }),
    { defaultValue: [], dependencies: [currentPath], refreshInterval: 5000 },
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
    const folderName = 'photos' || window.prompt('Enter the name of the folder you want to create');

    if (files.some((f) => f.name === folderName)) {
      alert(`There already exist a file or folder named ${folderName}.`);
      return;
    }

    if (folderName) {
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
    await window.DB.deleteFileLocally(selectedFile.hash);
  }

  async function onDeleteClick() {
    await window.DB.deleteFile(selectedFile.hash);
  }

  return (
    <div className="window">

      <div className="toolbar">
        <div className="toolbar-actions pull-right">

          {selectedFile && selectedFile.status === Statuses.STORED && (
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
              <h5 className="nav-group-title">nymDrive</h5>
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
                    onClick={() => { onFileClick(file); }}
                    onDoubleClick={() => { onFileDoubleClick(file); }}
                    className={selectedFile?.name === file.name ? 'active' : ''}
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

FileExplorer.defaultProps = {
  path: '/',
};
export default FileExplorer;
