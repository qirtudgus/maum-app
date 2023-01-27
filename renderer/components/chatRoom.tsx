import { off, onValue, push, ref } from 'firebase/database';
import { Timestamp } from 'firebase/firestore';
import React, { useEffect, useRef, useState } from 'react';
import styled from 'styled-components';
import { authService, realtimeDbService } from '../firebaseConfig';

const MessageContainer = styled.div`
  position: relative;
  width: 100%;
  height: 100%;
  overflow-y: auto;
  background: #f1f1f1;
  padding-top: 25px;
  /* overflow-x: hidden; */
`;

interface MessageSendData {
  createdAt: string;
}

const MessageWrap = styled.div<MessageSendData>`
  width: 95%;
  margin: 0 auto;
  position: relative;
  display: flex;
  align-items: flex-start;
  /* justify-content: flex-start; */
  flex-direction: column;

  margin-bottom: 30px;
  /* flex-direction: column; */
  &.myMessage {
    align-items: flex-end;
  }

  &.myMessage > li {
    background: #79d82b;
  }

  & .sendDate {
    font-size: 12px;
    color: #494949;
  }

  & > li::after {
    content: '${(props) => props.createdAt}';
    position: absolute;
    right: -140px;
    font-size: 12px;
  }
  &.myMessage > li::after {
    content: '';
  }

  &.myMessage > li::before {
    content: '${(props) => props.createdAt}';
    position: absolute;
    left: -140px;
    font-size: 12px;
  }

  & .messageWrite {
    margin-bottom: 5px;
  }
`;

const Message = styled.li`
  width: fit-content;
  position: relative;
  max-width: 60%;
  /* height: 30px; */
  min-height: 30px;
  max-height: fit-content;
  padding: 13px 10px;
  display: flex;
  align-items: center;
  border-radius: 7px;
  box-shadow: 0px 0px 3px 1px rgba(0, 0, 0, 0.2);
  background: #fff;
  color: #000;
`;

const ChatTitle = styled.div`
  width: 100%;
  margin: 0 auto;
  height: 40px;
  line-height: 40px;
  text-align: center;
  font-size: 20px;
  font-weight: bold;
  border-bottom: 1px solid#eee;
  position: relative;
  & .closeBtn {
    cursor: pointer;
    position: absolute;
    right: 10px;
  }
`;

const MessageInput = styled.div`
  width: 100%;
  border: 1px solid#eee;
  padding: 5px;
  display: flex;
  align-items: center;
  & > input {
    padding: 10px 10px;
    width: 100%;
    border: none;
  }

  & > input:focus {
    outline: none;
  }
  & > button {
    cursor: pointer;
    border: none;
    border-radius: 4px;
    flex-shrink: 0;
    padding: 10px;
    background: #79d82b;
  }
  & > button:hover {
    background: #64b91e;
  }
`;

const Footer = styled.div`
  width: 100%;
  height: 100px;
  background-color: #fff;
`;

export function convertDate(time) {
  //time should be server timestamp seconds only
  let dateInMillis = time * 1000;
  let date = new Date(dateInMillis);
  let myDate = date.toLocaleDateString();
  let myTime = date.toLocaleTimeString();
  myDate = myDate.replaceAll('/', '-');
  return myDate + ' ' + myTime;
}

const ChatRoom = ({
  chatRoomInfo,
  setIsStartChat,
  setIsStartGroupChat,
}: {
  chatRoomInfo: { displayName: string; chatRoomUid: string };
  setIsStartChat: React.Dispatch<React.SetStateAction<boolean>>;
  setIsStartGroupChat: React.Dispatch<React.SetStateAction<boolean>>;
}) => {
  const [chatList, setChatList] = useState([]);
  const messageInputRef = useRef<HTMLInputElement>();
  const messageContainerScrollHandler = useRef<HTMLDivElement>();
  const messageSendRef = useRef<HTMLButtonElement>();
  const [isOnlySpaceInputValue, setIsOnlySpaceInputValue] = useState(true);

  const [inputValue, setInputValue] = useState('');

  const blank_pattern = /^\s+\s+$/g;
  const SendMessage = async () => {
    const message = messageInputRef.current.value;

    // if (
    //   message === '' ||
    //   message.length === 0 ||
    //   message === undefined ||
    //   message === null ||
    //   blank_pattern.test(message)
    // ) {
    //   return;
    // }

    //저장할 경로
    const 채팅저장경로 = ref(
      realtimeDbService,
      `oneToOneChatRooms/${chatRoomInfo.chatRoomUid}/chat`,
    );

    await push(채팅저장경로, {
      displayName: authService.currentUser.displayName,
      uid: authService.currentUser.uid,
      message: message,

      createdAt: convertDate(Timestamp.fromDate(new Date()).seconds),
    });

    //메시지 작성 후 비워주기
    messageInputRef.current.focus();
    setInputValue('');
    setIsOnlySpaceInputValue(true);
    //메시지 작성 후 스크롤 맨 아래로
    messageContainerScrollHandler.current.scrollTop =
      messageContainerScrollHandler.current.scrollHeight;
  };

  //useEffect onValue로 채팅을 계속 가져와야함
  useEffect(() => {
    console.log(`현재 채팅방 : ${chatRoomInfo.chatRoomUid}`);

    const 채팅경로 = ref(
      realtimeDbService,
      `oneToOneChatRooms/${chatRoomInfo.chatRoomUid}/chat`,
    );

    onValue(채팅경로, (snapshot) => {
      console.log(`채팅이 갱신되었습니다`);
      let messageList = Object.values(snapshot.val());
      setChatList(messageList);
    });

    return () => {
      //언마운트시 해당 경로에 대한 관찰자를 off해주면 왔다갔다해도 onValue가 한번씩만 호출됨 (onValue가 쌓이는걸 방지)
      off(채팅경로);
      console.log('채팅방을 나갔습니다.');
    };
  }, [chatRoomInfo.chatRoomUid]);

  return (
    <>
      <ChatTitle>
        {chatRoomInfo.displayName}와의 대화{' '}
        <span
          title='닫기'
          className='closeBtn'
          onClick={() => {
            setIsStartChat(false);
          }}
        >
          X
        </span>
      </ChatTitle>
      <MessageContainer ref={messageContainerScrollHandler}>
        {chatList.map((i, index) => {
          return (
            <MessageWrap
              createdAt={i.createdAt}
              key={index}
              className={
                i.displayName === authService.currentUser.displayName &&
                'myMessage'
              }
            >
              <span className='messageWrite'>{i.displayName}</span>
              <Message

              //본인 메시지일 경우에 대한 스타일링용 className
              >
                {i.message}
              </Message>
              {/* <span className='sendDate'>{i.createdAt}</span> */}
            </MessageWrap>
          );
        })}
      </MessageContainer>

      <MessageInput>
        <input
          ref={messageInputRef}
          placeholder='메시지를 입력해주세요'
          // defaultValue={''}
          value={inputValue}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
            setInputValue(e.currentTarget.value);
            if (
              e.currentTarget.value === ' ' ||
              e.currentTarget.value.length === 0 ||
              blank_pattern.test(e.currentTarget.value)
            ) {
              setIsOnlySpaceInputValue(true);
              // return;
            } else {
              setIsOnlySpaceInputValue(false);
            }
          }}
          onKeyDown={(e: React.KeyboardEvent) => {
            // if (e.key === 'Enter') SendMessage();
            if (e.key === 'Enter') messageSendRef.current.click();
          }}
        ></input>
        <button
          ref={messageSendRef}
          disabled={isOnlySpaceInputValue}
          // disabled={messageInputRef.current.value ? true : false}
          onClick={SendMessage}
        >
          전송
        </button>
      </MessageInput>
      <Footer />
      {/* <button onClick={SendMessage}>메시지 전송</button> */}
      {/* <button
        onClick={() => {
          console.log(chatList);
          console.log(convertDate(chatList[0].createdAt.seconds));
        }}
      >
        채팅 로그 확인
      </button> */}
      {/* <button
        onClick={() => {
          setIsStartChat(false);
        }}
      >
        나가기
      </button> */}
    </>
  );
};

export default ChatRoom;
