import { off, onValue, push, ref } from 'firebase/database';
import Head from 'next/head';
import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { realtimeDbService } from '../firebaseConfig';
import ChatRoomHeaderTitle from './ChatRoomHeaderTitle';
import LoadingSpinner from './LoadingSpinner';
import MessageContainerFront from './messageContainer';
import SendMessageInput from './SendMessageInput';

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
  displayName,
  chatRoomUid,
}: {
  displayName: string;
  chatRoomUid: string;
}) => {
  const [chatList, setChatList] = useState([]);
  const [isChatLoading, setIsChatLoading] = useState(false);

  //useEffect onValue로 채팅을 계속 가져와야함
  useEffect(() => {
    console.log(`현재 채팅방 : ${chatRoomUid}`);

    const 채팅경로 = ref(
      realtimeDbService,
      `oneToOneChatRooms/${chatRoomUid}/chat`,
    );
    onValue(채팅경로, async (snapshot) => {
      console.log(`채팅이 갱신되었습니다`);
      console.log(snapshot.val());
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
  }, [chatRoomUid]);

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
        <title>maumTalk - {displayName}와의 대화</title>
      </Head>
      <ChatRoomHeaderTitle title={displayName} />
      {isChatLoading ? (
        <MessageContainerFront chatList={chatList} />
      ) : (
        <LoadingSpinner />
      )}
      <SendMessageInput
        displayName={displayName}
        chatRoomUid={chatRoomUid}
        isOneToOneOrGroup='oneToOne'
      />
    </>
  );
};

export default React.memo(ChatRoom);
