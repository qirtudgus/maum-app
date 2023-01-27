import { off, onValue, push, ref } from 'firebase/database';
import { Timestamp } from 'firebase/firestore';
import Head from 'next/head';
import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import styled from 'styled-components';
import { authService, realtimeDbService } from '../firebaseConfig';
import LoadingSpinner from './LoadingSpinner';
import MessageContainerFront from './messageContainer';

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
    background: ${({ theme }) => theme.colors.main};
  }
  & > button:hover {
    background: ${({ theme }) => theme.colors.mainHoverColor};
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
  const messageSendRef = useRef<HTMLButtonElement>();
  const [isOnlySpaceInputValue, setIsOnlySpaceInputValue] = useState(true);
  const [isChatLoading, setIsChatLoading] = useState(false);

  const [inputValue, setInputValue] = useState('');

  const blank_pattern = /^\s+\s+$/g;
  const SendMessage = async () => {
    //저장할 경로
    const 채팅저장경로 = ref(
      realtimeDbService,
      `oneToOneChatRooms/${chatRoomInfo.chatRoomUid}/chat`,
    );

    await push(채팅저장경로, {
      displayName: authService.currentUser.displayName,
      uid: authService.currentUser.uid,
      message: messageInputRef.current.value,

      createdAt: convertDate(Timestamp.fromDate(new Date()).seconds),
    });

    //메시지 작성 후 비워주기
    messageInputRef.current.focus();
    setInputValue('');
    setIsOnlySpaceInputValue(true);
  };

  //useEffect onValue로 채팅을 계속 가져와야함
  useEffect(() => {
    console.log(`현재 채팅방 : ${chatRoomInfo.chatRoomUid}`);

    const 채팅경로 = ref(
      realtimeDbService,
      `oneToOneChatRooms/${chatRoomInfo.chatRoomUid}/chat`,
    );
    onValue(채팅경로, async (snapshot) => {
      console.log(`채팅이 갱신되었습니다`);
      //최신메시지 하나만 가져와서 이어붙이면 좋을거같은데...
      let messageList = Object.values(await snapshot.val());
      console.log(messageList);
      console.log('로딩완료');
      setIsChatLoading(true);
      setChatList(messageList);
    });

    return () => {
      //언마운트시 해당 경로에 대한 관찰자를 off해주면 왔다갔다해도 onValue가 한번씩만 호출됨 (onValue가 쌓이는걸 방지)
      off(채팅경로);
      setIsChatLoading(false);

      console.log('채팅방을 나갔습니다.');
    };
  }, [chatRoomInfo.chatRoomUid]);

  //언마운트 시 현재 활성화된 메뉴의 액티브돔을 찾아서 제거한다.
  useLayoutEffect(() => {
    return () => {
      if (document.getElementById('chatUserActive')) {
        document.getElementById('chatUserActive').removeAttribute('id');
      }
    };
  }, []);

  return (
    <>
      <Head>
        <title>maumTalk - {chatRoomInfo.displayName}와의 대화</title>
      </Head>
      <ChatTitle>
        {chatRoomInfo.displayName}와의 대화
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
      {isChatLoading ? (
        <MessageContainerFront chatList={chatList} />
      ) : (
        <LoadingSpinner />
      )}

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
            if (e.key === 'Enter') messageSendRef.current.click();
          }}
        ></input>
        <button
          ref={messageSendRef}
          disabled={isOnlySpaceInputValue}
          onClick={SendMessage}
        >
          전송
        </button>
      </MessageInput>
      <Footer />
    </>
  );
};

export default React.memo(ChatRoom);
