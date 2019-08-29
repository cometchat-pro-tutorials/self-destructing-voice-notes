import React from 'react';
import { BrowserRouter as Router, Route, Switch } from 'react-router-dom';
import Home from './components/home';
import Login from './components/login';
import Chat from './components/chat';

function App() {
  return (
    <Router>
      <Switch>
        <Route exact path='/' component={Home} />
        <Route exact path='/login' component={Login} />
        <Route exact path='/chat/:uid' component={Chat} />
      </Switch>
    </Router>
  );
}

export default App;
