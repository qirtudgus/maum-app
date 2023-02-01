import { pushNotifications } from 'electron';
import {
  get,
  off,
  onDisconnect,
  onValue,
  push,
  ref,
  set,
  update,
} from 'firebase/database';
import { Timestamp } from 'firebase/firestore';
import Head from 'next/head';
import { useRouter } from 'next/router';
import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import {
  authService,
  getChatRoomLastMessage,
  getOneToOneChatListPath,
  realtimeDbService,
} from '../firebaseConfig';
import { ChatDataNew } from '../pages/chatRooms';
import ChatRoomHeaderTitle from './ChatRoomHeaderTitle';
import LoadingSpinner from './LoadingSpinner';
import MessageContainerGroup from './messageContainerGroup';
import MessageContainerOneToOne from './messageContainerOneToOne';
import SendMessageInput from './SendMessageInput';

const ChatRoom = () => {
  const router = useRouter();
  const displayName2 = router.query.displayName as string;
  const chatRoomUid2 = router.query.chatRoomUid as string;
  const opponentUid2 = router.query.opponentUid as string;
  const [chatList, setChatList] = useState([]);
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [ConnectedUsers, setConnectedUsers] = useState([]);
  const getChatListPath = getOneToOneChatListPath(chatRoomUid2);
  // const 레이아웃 = localStorage.getItem('oneToOneChatLayout');
  const [레이아웃, 레이아웃설정] = useState('');

  //첫 입장 시, 퇴장 시  접속시간 기록
  //잘 기록된다.
  //각 ui에 isOn값도 추가해주자 이는 SendInput에서 쓰기위함이다.
  useEffect(() => {
    const 경로 = ref(
      realtimeDbService,
      `oneToOneChatRooms/${chatRoomUid2}/connectedUser/${authService.currentUser?.uid}`,
    );
    update(경로, {
      displayName: authService.currentUser.displayName,
      uid: authService.currentUser.uid,
      lastConnectTimeStamp: Timestamp.fromDate(new Date()).seconds,
      isOn: true,
    });
    //앱 강종시에도 채팅접속상태 Off 해주기
    onDisconnect(경로).update({
      isOn: false,
      lastConnectTimeStamp: Timestamp.fromDate(new Date()).seconds,
    });
    //채팅방 나갈 시에 접속상태 off해주기
    return () => {
      update(경로, {
        lastConnectTimeStamp: Timestamp.fromDate(new Date()).seconds,
        isOn: false,
      });
    };
  }, []);

  //메시지 처음 세팅
  useEffect(() => {
    레이아웃설정(localStorage.getItem('oneToOneChatLayout'));
    const 채팅목록세팅 = async () => {
      let messageObj = await (await get(getChatListPath)).val();
      //채팅이 있을경우
      if (messageObj) {
        console.log('채팅목록');
        console.log(messageObj);
        const messageArr = Object.values(messageObj);
        //요소를 반복하며 ?..
        for (let property in messageObj) {
          let 내가읽었는지결과 =
            messageObj[property].readUsers[authService.currentUser.uid];
          if (내가읽었는지결과 === false) {
            const 업데이트할메시지 = ref(
              realtimeDbService,
              `oneToOneChatRooms/${chatRoomUid2}/chat/${property}/readUsers`,
            );
            update(업데이트할메시지, { [authService.currentUser.uid]: true });
          }
        }
        return messageArr;
      }
      //채팅이 없을경우 null 반환
      else {
        return null;
      }
    };

    채팅목록세팅().then((res) => {
      console.log('res');
      console.log(res);
      if (res) {
        setChatList(res);
        setIsChatLoading(true);
      } else {
        setIsChatLoading(true);
      }
    });
  }, []);

  //마지막 메세지 붙혀오기
  useEffect(() => {
    onValue(getChatListPath, async (snapshot) => {
      if (snapshot.val()) {
        let b = await getChatRoomLastMessage(chatRoomUid2, 'oneToOne');
        console.log('마지막메시지');
        console.log(b);

        setChatList((prev) => [...prev, b]);
      }
    });

    return () => {
      off(getChatListPath);
    };
  }, [chatRoomUid2]);

  //현재 채팅 connectedUser를 onValue하면서 그 결과를 SendInput에 전달해준다.
  //SendInput은 그 값에 따라서 전송 시 메시지에 true처리할 사람을 결정한다.
  useEffect(() => {
    const 접속유저경로 = ref(
      realtimeDbService,
      `oneToOneChatRooms/${chatRoomUid2}/connectedUser`,
    );

    onValue(접속유저경로, (snapshot) => {
      console.log('방에 접속했다');
      const 밸류스 = Object.values(snapshot.val());
      setConnectedUsers(밸류스);
      //메시지를 가져와서 갱신 시켜주자
      get(getChatListPath).then((res) => {
        if (res.val()) {
          const 메시지배열: ChatDataNew[] = Object.values(res.val());
          console.log(메시지배열);
          setChatList(메시지배열);
        }
      });
    });

    return () => {
      off(접속유저경로);
    };
  }, []);

  return (
    <>
      <Head>
        <title>maumTalk - {displayName2}</title>
      </Head>
      <ChatRoomHeaderTitle title={displayName2} />
      {isChatLoading ? (
        레이아웃 === 'oneToOne' ? (
          <MessageContainerOneToOne chatList={chatList} />
        ) : (
          <MessageContainerGroup chatList={chatList} />
        )
      ) : (
        <LoadingSpinner />
      )}
      <SendMessageInput
        connectedUsers={ConnectedUsers}
        chatRoomUid={chatRoomUid2}
        isOneToOneOrGroup='oneToOne'
      />
    </>
  );
};

export default React.memo(ChatRoom);
