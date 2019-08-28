import React, { useState, useEffect, useRef } from 'react'
import { CometChat } from '@cometchat-pro/chat'
import {
  FaMicrophone,
  FaPlay,
  FaPause,
  FaChevronLeft,
  FaSignOutAlt
} from 'react-icons/fa'
import { audioRecorder } from '../scripts'
import { Redirect } from 'react-router-dom'
import axios from 'axios'
import AudioVisualizer from './audio-visualiser'

function Chat({ match, history }) {
  const [UID] = useState(match.params.uid)
  const [messages, setMessages] = useState([])
  const [currentUser, setCurrentUser] = useState(null)
  const [currentUrl, setCurrentUrl] = useState(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isRedirected, setIsRedirected] = useState(false)
  const [isVisible, setIsVisible] = useState(true)

  const recordButtonRef = useRef()
  const recorderRef = useRef()
  const audioPlayerRef = useRef()
  const streamRef = useRef()
  const URLRef = useRef()

  // get audio permission
  streamRef.current = navigator.mediaDevices.getUserMedia({ audio: true })

  useEffect(() => {
    const ref = audioPlayerRef

    const handleTimeUpdate = e => {
      if (e.target.duration === e.target.currentTime) {
        setIsPlaying(false)
        setIsVisible(false)
      }
    }
    ref.current.addEventListener('timeupdate', handleTimeUpdate)

    return () => {
      if(ref.current) {
        ref.current.removeEventListener('timeupdate', handleTimeUpdate)
      }
    } 
  }, [isPlaying])

  useEffect(() => {
    // get user via uid
    CometChat.getUser(UID).then(
      user => {
        setCurrentUser(user)
      },
      error => {
        console.log('User details fetching failed with error:', error)
      }
    )

    // listen for messages in real-time
    const messagesRequest = new CometChat.MessagesRequestBuilder()
      .setUID(UID)
      .setLimit(100)
      .build()

    messagesRequest.fetchPrevious().then(
      messages => {
        const filtered = messages.filter(m => m.file !== undefined)
        setMessages(prevMessages => [...prevMessages, ...filtered])
      },
      error => {
        console.log('Message fetching failed with error:', error)
      }
    )
  }, [UID])

  useEffect(() => {
    // receive messages
    const listenerID = UID

    CometChat.addMessageListener(
      listenerID,
      new CometChat.MessageListener({
        onMediaMessageReceived: mediaMessage => {
          setMessages(prevMessages => [...prevMessages, mediaMessage])
        },
        onMessageDeleted: deletedMessage => {},
        onMessageRead: messageReceipt => {
          CometChat.deleteMessage(messageReceipt.messageId).then(
            msg => {
              const filtered = messages.filter(
                m => m.id !== messageReceipt.messageId
              )
              setMessages([...filtered])
            },
            err => {
              console.log({ err })
            }
          )
        }
      })
    )

    return () => CometChat.removeMessageListener(listenerID)
  }, [UID, messages])

  const handleMouseDown = async () => {
    recordButtonRef.current.classList.replace('btn-secondary', 'btn-danger')
    streamRef.current
      .then(async stream => {
        recorderRef.current = await audioRecorder(stream)
        recorderRef.current.record()
      })
      .catch(err => console.log({ err }))
  }

  const handleMouseUp = async () => {
    recordButtonRef.current.classList.replace('btn-danger', 'btn-secondary')
    const audio = await recorderRef.current.stop()
    sendAudioFile(audio.audioFile)
  }

  const sendAudioFile = audioFile => {
    const receiverID = currentUser.uid
    const messageType = CometChat.MESSAGE_TYPE.AUDIO
    const receiverType = CometChat.RECEIVER_TYPE.USER

    const mediaMessage = new CometChat.MediaMessage(
      receiverID,
      audioFile,
      messageType,
      receiverType
    )

    CometChat.sendMediaMessage(mediaMessage).then(
      message => {
        setMessages([...messages, message])
      },
      error => {
        console.log('Media message sending failed with error', error)
      }
    )
  }

  const clearMessages = () => {
    messages.forEach(m => {
      CometChat.getMessageReceipts(m.id).then(
        receipts => {
          receipts.forEach(receipt => {
            if (
              receipt.sender.uid === currentUser.uid &&
              receipt.readAt === undefined
            ) {
              return
            }
            CometChat.markMessageAsRead(m)
          })
        },
        error => {
          console.log('Error in getting messag details ', error)
        }
      )
    })
  }

  const playbackAudio = message => {
    setIsVisible(true)

    axios(message.url, {
      method: 'get',
      responseType: 'blob'
    })
      .then(res => {
        const audioUrl = URL.createObjectURL(new Blob([res.data]))
        audioPlayerRef.current.src = audioUrl
        setCurrentUrl(message.url)
        URLRef.current = audioUrl
        togglePlay(audioPlayerRef.current)
      })
      .catch(err => {})
  }

  const togglePlay = player => {
    if (player.paused) {
      player.play()
      setIsPlaying(true)
    } else {
      player.pause()
      setIsPlaying(false)
    }
  }

  if (isRedirected) return <Redirect to='/' />

  return (
    <div
      className='chat-page container'
      style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        height: '100vh'
      }}
    >
      {isVisible && <audio ref={audioPlayerRef} style={{ display: 'none' }} />}
      <div className='mt-5' style={{ height: '60px' }}>
        {currentUser !== null && (
          <div className='d-flex justify-content-between align-items-end'>
            <div className='d-flex justify-content-start'>
              <button
                onClick={() => {
                  history.goBack()
                  clearMessages()
                }}
                className='btn mr-3'
                style={{ fontWeight: '500' }}
              >
                <FaChevronLeft /> Chats
              </button>
              <div className=''>
                <span className='d-block'>{currentUser.name}</span>
                <small className='d-block'>{currentUser.status}</small>
              </div>
            </div>
            <button
              className='btn btn-light'
              onClick={() => {
                clearMessages()
                setIsRedirected(true)
                localStorage.clear()
              }}
            >
              <FaSignOutAlt /> Logout
            </button>
          </div>
        )}
      </div>
      <ul className='list-group-item' style={{ flex: 1 }}>
        {messages.length > 0 ? (
          messages.map((message, i) => (
            <li
              className='list-group-item d-flex align-items-center justify-content-between'
              key={i}
            >
              <div className='d-flex align-items-center'>
                <button
                  disabled={
                    currentUrl !== message.url && isPlaying ? 'disabled' : ''
                  }
                  onClick={e => playbackAudio(message, message.id)}
                  style={{
                    width: '50px',
                    height: '50px',
                    borderRadius: '50%'
                  }}
                  className='btn btn-secondary'
                >
                  {currentUrl === message.url ? (
                    isPlaying ? (
                      <FaPause />
                    ) : (
                      <FaPlay />
                    )
                  ) : (
                    <FaPlay />
                  )}
                </button>
                <p className='pl-3'>{message.sender.uid}</p>
              </div>
              {currentUrl === message.url && isPlaying && (
                <AudioVisualizer audio={audioPlayerRef.current} />
              )}
            </li>
          ))
        ) : (
          <p className='fetching...' />
        )}
      </ul>
      <footer
        className='text-center d-flex align-items-center'
        style={{ height: '80px' }}
      >
        <button
          disabled={currentUser === null ? 'disabled' : ''}
          ref={recordButtonRef}
          className='btn btn-secondary mx-auto'
          style={{ height: '60px', width: '60px', borderRadius: '50%' }}
          onMouseDown={handleMouseDown}
          onMouseUp={handleMouseUp}
        >
          <FaMicrophone />
        </button>
      </footer>
    </div>
  )
}

export default Chat
