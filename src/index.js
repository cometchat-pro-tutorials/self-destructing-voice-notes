import React from 'react';
import ReactDOM from 'react-dom';
import App from './App';
import { CometChat } from '@cometchat-pro/chat';

CometChat.init(process.env.REACT_APP_COMETCHAT_APP_ID)
  .then(() => {
    console.log('Successfully Initialised CometChat');
  })
  .catch(() => {
    console.log('Failed to Initialise CometChat');
  });

ReactDOM.render(<App />, document.getElementById('root'));
