import React, { useEffect, useState } from 'react'
import { Redirect } from 'react-router-dom'
import { CometChat } from '@cometchat-pro/chat'
import { FaSignOutAlt } from 'react-icons/fa'

function Home({ history }) {
  const authToken = localStorage.getItem('cometchat:token')
  const [users, setUsers] = useState([])
  const [isRedirected, setIsRedirected] = useState(false)

  useEffect(() => {
    if (authToken !== null) {
      CometChat.login(authToken).then(
        user => {
          const limit = 4
          const usersRequest = new CometChat.UsersRequestBuilder()
            .setLimit(limit)
            .build()

          usersRequest.fetchNext().then(
            userList => {
              setUsers([...userList])
            },
            error => {
              console.log('User list fetching failed with error:', error)
            }
          )
        },
        err => {
          console.log({ err })
        }
      )
    }
  }, [authToken])

  useEffect(() => {
    const listenerID = 'online_listener'

    CometChat.addUserListener(
      listenerID,
      new CometChat.UserListener({
        onUserOnline: onlineUser => {
          const otherUsers = users.filter(u => u.uid !== onlineUser.uid)
          setUsers([onlineUser, ...otherUsers])
        },
        onUserOffline: offlineUser => {
          const otherUsers = users.filter(u => u.uid !== offlineUser.uid)
          setUsers([...otherUsers, offlineUser])
        }
      })
    )

    return () => CometChat.removeUserListener(listenerID)
  }, [users])

  useEffect(() => {
    const listenerID = 'home_component'

    CometChat.addMessageListener(
      listenerID,
      new CometChat.MessageListener({
        onMediaMessageReceived: mediaMessage => {
          const _users = [...users]

          const selectedUser = _users.find(
            u => u.uid === mediaMessage.sender.uid
          )

          selectedUser.messageCount = selectedUser.messageCount
            ? selectedUser.messageCount + 1
            : 1

          const filtered = [..._users].filter(u => u.uid !== selectedUser.uid)

          setUsers([selectedUser, ...filtered])
        },
        onMessageDeleted: deletedMessage => {},
        onMessageRead: messageReceipt => {
          CometChat.deleteMessage(messageReceipt.messageId).then(
            msg => {},
            err => {
              console.log({ err })
            }
          )
        }
      })
    )

    return () => CometChat.removeMessageListener(listenerID)
  }, [users])

  if (authToken === null || isRedirected) return <Redirect to='/login' />

  return (
    <div className='container'>
      <h2 className='text-center mt-2'>Ephemeral Voice Messaging</h2>
      <div className='d-flex justify-content-between align-items-end'>
        {users.length > 0 && (
          <p className='lead mt-5'>Users ({users.length})</p>
        )}
        <button
          className='btn btn-light mb-2'
          onClick={() => {
            localStorage.clear()
            setIsRedirected(true)
          }}
        >
          <FaSignOutAlt /> Logout
        </button>
      </div>
      <ul className='list-group-item'>
        {users.length > 0 ? (
          users.map(user => (
            <li
              className='list-group-item d-flex justify-content-between align-items-center'
              key={user.uid}
              onClick={() => history.push(`/chat/${user.uid}`)}
              style={{ cursor: 'pointer' }}
            >
              <div className='left d-flex'>
                <img
                  style={{ borderRadius: '50%' }}
                  src={user.avatar}
                  height={50}
                  width={50}
                  alt={user.name}
                />
                <div className='ml-3'>
                  <span className='d-block'>{user.name}</span>
                  <small
                    className={
                      user.status === 'online'
                        ? 'd-block text-success'
                        : 'd-block text-danger'
                    }
                  >
                    {user.status}
                  </small>
                </div>
              </div>
              <span className='badge badge-primary'>
                {user.messageCount !== undefined && user.messageCount}
              </span>
            </li>
          ))
        ) : (
          <p className='text-center'>Fetching Users...</p>
        )}
      </ul>
    </div>
  )
}

export default Home
