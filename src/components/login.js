import React, { useState } from 'react'
import { Redirect } from 'react-router-dom'
import { CometChat } from '@cometchat-pro/chat'

function Login() {
  const [username, setUsername] = useState('')
  const [error, setError] = useState(null)
  const [isRedirected, setIsRedirected] = useState(false)
  const [isLoggingIn, setIsLoggingIn] = useState(false)

  const handleLogin = e => {
    e.preventDefault()
    const _username = username

    setIsLoggingIn(true)
    setUsername('')

    CometChat.login(_username, process.env.REACT_APP_COMETCHAT_API_KEY).then(
      user => {
        localStorage.setItem('cometchat:token', user.authToken)
        setIsLoggingIn(false)
        setIsRedirected(true)
      },
      error => {
        setIsLoggingIn(false)
        setError(error.message)
      }
    )
  }

  const handleUsernameChange = e => {
    setUsername(e.target.value)
  }

  if (isRedirected) return <Redirect to='/' />

  return (
    <div className='container'>
      <div className='row' style={{ marginTop: '30vh' }}>
        <div className='col-xs-12 col-sm-12 col-md-8 col-lg-6 mx-auto'>
          <h1>Login</h1>
          {error !== null && <div className='alert alert-danger'>{error}</div>}
          <div className='card card-body'>
            <form onSubmit={e => handleLogin(e)}>
              <div className='form-group'>
                <label htmlFor='username'>Username</label>
                <input
                  type='text'
                  id='username'
                  value={username}
                  onChange={handleUsernameChange}
                  required
                  className='form-control'
                  placeholder='Username'
                />
              </div>
              <input
                disabled={isLoggingIn ? 'disabled' : ''}
                type='submit'
                value={isLoggingIn ? 'Please wait...' : 'Login'}
                className='btn btn-primary'
              />
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Login
