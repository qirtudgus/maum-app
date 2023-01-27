import { onValue, push, ref } from 'firebase/database';
import { Timestamp } from 'firebase/firestore';
import React, { useEffect, useRef, useState } from 'react';
import styled from 'styled-components';
import { authService, realtimeDbService } from '../firebaseConfig';

const MessageContainer = styled.div`
  position: relative;
  width: 100%;
  overflow-y: scroll;
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
  width: 90%;
  margin: 0px auto 20px auto;
  height: 40px;
  line-height: 40px;
  text-align: center;
  font-size: 20px;
  font-weight: bold;
  border-bottom: 1px solid#eee;
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

  const SendMessage = async () => {
    //저장할 경로
    const 채팅저장경로 = ref(
      realtimeDbService,
      `oneToOneChatRooms/${chatRoomInfo.chatRoomUid}/chat`,
    );
    let message = messageInputRef.current.value;

    await push(채팅저장경로, {
      displayName: authService.currentUser.displayName,
      uid: authService.currentUser.uid,
      message: message,

      createdAt: convertDate(Timestamp.fromDate(new Date()).seconds),
    });
    messageInputRef.current.focus();
    messageInputRef.current.value = '';

    //메시지 작성 후 비워주기
  };

  //useEffect onValue로 채팅을 계속 가져와야함
  useEffect(() => {
    console.log(`현재 채팅방 : ${chatRoomInfo.chatRoomUid}`);

    const 채팅경로 = ref(
      realtimeDbService,
      `oneToOneChatRooms/${chatRoomInfo.chatRoomUid}/chat`,
    );
    onValue(채팅경로, (snapshot) => {
      console.log('채팅이 갱신되었습니다');
      let messageList = Object.values(snapshot.val());
      setChatList(messageList);
    });

    return () => {
      console.log('채팅방을 나갔습니다.');
    };
  }, [chatRoomInfo.chatRoomUid]);

  return (
    <>
      <ChatTitle>{chatRoomInfo.displayName}와의 대화</ChatTitle>
      <MessageContainer>
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

      <input
        ref={messageInputRef}
        placeholder='메시지를 입력해주세요'
        onKeyDown={(e: React.KeyboardEvent) => {
          if (e.key === 'Enter') SendMessage();
        }}
      ></input>
      <button onClick={SendMessage}>메시지 전송</button>
      <button
        onClick={() => {
          console.log(chatList);
          console.log(convertDate(chatList[0].createdAt.seconds));
        }}
      >
        채팅 로그 확인
      </button>
      <button
        onClick={() => {
          setIsStartChat(false);
        }}
      >
        나가기
      </button>
    </>
  );
};

export default ChatRoom;
