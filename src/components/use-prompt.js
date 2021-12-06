import React from 'react';
import ReactDOM from 'react-dom';
import PropTypes from 'prop-types';

function usePrompt() {
  function prompt({ title, description }) {
    return new Promise((resolve) => {
      document.getElementById('modal').style.display = 'block';

      function closeModal() {
        document.getElementById('prompt-input').value = '';
        document.getElementById('modal').style.display = 'none';
      }

      function onClose(e) {
        e.preventDefault();
        closeModal(false);
        resolve();
      }

      function onSubmit(e) {
        e.preventDefault();
        const { value } = document.getElementById('prompt-input');
        closeModal(false);
        resolve(value);
      }

      const Component = (
        <div className="modal-content">
          <header className="toolbar toolbar-header">
            <h1 className="title">{title}</h1>
          </header>

          <form className="prompt-form" onSubmit={onSubmit}>
            <div className="form-group">
              <label htmlFor="prompt-input">{description}</label>
              <input id="prompt-input" type="input" className="form-control" />

              <input className="btn btn-mini btn-primary mt-2 mr-2" type="submit" />
              <button className="btn btn-mini btn-default mt-2" type="button" onClick={onClose}>Close</button>
            </div>
          </form>

          <footer className="toolbar toolbar-footer" />
        </div>
      );

      ReactDOM.render(Component, document.getElementById('modal'), () => {
        document.getElementById('prompt-input').focus();
      });
    });
  }

  return prompt;
}

usePrompt.propTypes = {
  title: PropTypes.string.isRequired,
  description: PropTypes.string.isRequired,
};

export default usePrompt;
