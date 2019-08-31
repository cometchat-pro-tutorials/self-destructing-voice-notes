import React, { useState, useEffect, useRef } from 'react';
import { CometChat } from '@cometchat-pro/chat';
import {
  FaMicrophone,
  FaPlay,
  FaPause,
  FaChevronLeft,
  FaSignOutAlt
} from 'react-icons/fa';
import { audioRecorder } from '../scripts';
import { Redirect } from 'react-router-dom';
import axios from 'axios';
import AudioVisualizer from './audio-visualiser';

function Chat({ match, history }) {
  const [UID] = useState(match.params.uid);
  const [messages, setMessages] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [currentMessage, setCurrentMessage] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isRedirected, setIsRedirected] = useState(false);
  const [isVisible, setIsVisible] = useState(true);

  const recordButtonRef = useRef();
  const recorderRef = useRef();
  const audioPlayerRef = useRef();
  const streamRef = useRef();
  const URLRef = useRef();

  // get audio permission
  streamRef.current = navigator.mediaDevices.getUserMedia({ audio: true });

  useEffect(() => {
    const ref = audioPlayerRef;

    const handleTimeUpdate = e => {
      if (e.target.duration === e.target.currentTime) {
        setIsPlaying(false);
        setIsVisible(false);

        CometChat.getMessageReceipts(currentMessage.id).then(
          receipts => {
            receipts.forEach(receipt => {
              if (
                receipt.sender.uid === currentUser.uid &&
                receipt.readAt === undefined
              ) {
                return;
              }
              CometChat.markMessageAsRead(currentMessage);
            });
          },
          error => {
            console.log('Error in getting messag details ', error);
          }
        );
      }
    };
    ref.current.addEventListener('timeupdate', handleTimeUpdate);

    return () => {
      if (ref.current) {
        ref.current.removeEventListener('timeupdate', handleTimeUpdate);
      }
    };
  }, [isPlaying, currentUser, currentMessage]);

  useEffect(() => {
    // get user via uid
    CometChat.getUser(UID).then(
      user => {
        setCurrentUser(user);
      },
      error => {
        console.log('User details fetching failed with error:', error);
      }
    );

    // listen for messages in real-time
    const messagesRequest = new CometChat.MessagesRequestBuilder()
      .setUID(UID)
      .setLimit(100)
      .build();

    messagesRequest.fetchPrevious().then(
      messages => {
        const filtered = messages.filter(m => m.file !== undefined);
        setMessages(prevMessages => [...prevMessages, ...filtered]);
      },
      error => {
        console.log('Message fetching failed with error:', error);
      }
    );
  }, [UID]);

  useEffect(() => {
    // receive messages
    const listenerID = UID;

    CometChat.addMessageListener(
      listenerID,
      new CometChat.MessageListener({
        onMediaMessageReceived: mediaMessage => {
          setMessages(prevMessages => [...prevMessages, mediaMessage]);
        },
        onMessageDeleted: deletedMessage => {
          const filtered = messages.filter(m => m.id !== deletedMessage.id);
          setMessages([...filtered]);
        },
        onMessageRead: messageReceipt => {
          CometChat.deleteMessage(messageReceipt.messageId).then(
            msg => {
              const filtered = messages.filter(
                m => m.id !== messageReceipt.messageId
              );
              setMessages([...filtered]);
            },
            err => {
              console.log({ err });
            }
          );
        }
      })
    );

    return () => CometChat.removeMessageListener(listenerID);
  }, [UID, messages]);

  const handleMouseDown = async () => {
    recordButtonRef.current.classList.replace('btn-secondary', 'btn-danger');
    streamRef.current
      .then(async stream => {
        recorderRef.current = await audioRecorder(stream);
        recorderRef.current.record();
      })
      .catch(err => console.log({ err }));
  };

  const handleMouseUp = async () => {
    recordButtonRef.current.classList.replace('btn-danger', 'btn-secondary');
    const audio = await recorderRef.current.stop();
    sendAudioFile(audio.audioFile);
  };

  const sendAudioFile = audioFile => {
    const receiverID = currentUser.uid;
    const messageType = CometChat.MESSAGE_TYPE.AUDIO;
    const receiverType = CometChat.RECEIVER_TYPE.USER;

    const mediaMessage = new CometChat.MediaMessage(
      receiverID,
      audioFile,
      messageType,
      receiverType
    );

    CometChat.sendMediaMessage(mediaMessage).then(
      message => {
        setMessages([...messages, message]);
      },
      error => {
        console.log('Media message sending failed with error', error);
      }
    );
  };

  const playbackAudio = message => {
    setIsVisible(true);

    axios(message.url, {
      method: 'get',
      responseType: 'blob'
    })
      .then(res => {
        const audioUrl = URL.createObjectURL(new Blob([res.data]));
        audioPlayerRef.current.src = audioUrl;
        setCurrentMessage(message);
        URLRef.current = audioUrl;
        audioPlayerRef.current.play();
        setIsPlaying(true);
      })
      .catch(err => {});
  };

  if (isRedirected) return <Redirect to='/' />;

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
                  history.goBack();
                }}
                className='btn mr-3'
                style={{ fontWeight: '500' }}
              >
                <FaChevronLeft /> Chats
              </button>
              <div className='d-flex align-items-center'>
                <span className='d-block'>{currentUser.name}</span>
              </div>
            </div>
            <button
              className='btn btn-light'
              onClick={() => {
                setIsRedirected(true);
                localStorage.clear();
              }}
            >
              <FaSignOutAlt /> Logout
            </button>
          </div>
        )}
      </div>
      <ul className='list-group-item' style={{ flex: 1 }}>
        {messages.length > 0
          ? messages.map((message, i) => (
              <li
                className='list-group-item d-flex align-items-center justify-content-between'
                key={i}
              >
                <div className='d-flex align-items-center'>
                  <button
                    disabled={
                      currentMessage &&
                      currentMessage.url !== message.url &&
                      isPlaying
                        ? 'disabled'
                        : ''
                    }
                    onClick={e => playbackAudio(message, message.id)}
                    style={{
                      width: '50px',
                      height: '50px',
                      borderRadius: '50%'
                    }}
                    className='btn btn-secondary'
                  >
                    {currentMessage && currentMessage.url === message.url ? (
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
                {currentMessage &&
                  currentMessage.url === message.url &&
                  isPlaying && (
                    <AudioVisualizer audio={audioPlayerRef.current} />
                  )}
              </li>
            ))
          : null}
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
  );
}

export default Chat;
