import { pushNotifications } from 'electron';
import { off, onValue, push, ref, set, update } from 'firebase/database';
import { Timestamp } from 'firebase/firestore';
import Head from 'next/head';
import { useRouter } from 'next/router';
import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import {
  authService,
  getOneToOneChatListPath,
  realtimeDbService,
} from '../firebaseConfig';
import ChatRoomHeaderTitle from './ChatRoomHeaderTitle';
import LoadingSpinner from './LoadingSpinner';
import MessageContainerGroup from './messageContainerGroup';
import MessageContainerOneToOne from './messageContainerOneToOne';
import SendMessageInput from './SendMessageInput';

const ChatRoom = () =>
  //   {
  //   displayName,
  //   chatRoomUid,
  //   opponentUid,
  // }: {
  //   displayName: string;
  //   chatRoomUid: string;
  //   opponentUid: string;
  // }
  {
    const router = useRouter();
    const displayName2 = router.query.displayName as string;
    const chatRoomUid2 = router.query.chatRoomUid as string;
    const opponentUid2 = router.query.opponentUid as string;
    const [chatList, setChatList] = useState([]);
    const [isChatLoading, setIsChatLoading] = useState(false);
    const getChatListPath = getOneToOneChatListPath(chatRoomUid2);
    // const 레이아웃 = localStorage.getItem('oneToOneChatLayout');
    const [레이아웃, 레이아웃설정] = useState('');

    console.log('프롭스확인');

    interface ChatData {
      createdAt: string;
      displayName: string;
      message: string;
      uid: string;
    }

    //첫 입장 시, 퇴장 시  접속시간 기록
    //잘 기록된다.

    useEffect(() => {
      const 경로 = ref(
        realtimeDbService,
        `oneToOneChatRooms/${chatRoomUid2}/connectedUser/${authService.currentUser?.uid}`,
      );
      update(경로, {
        lastConnectTimeStamp: Timestamp.fromDate(new Date()).seconds,
      });

      // update(경로, {
      //   [authService.currentUser?.displayName]: Timestamp.fromDate(new Date())
      //     .seconds,
      // });
      return () => {
        update(경로, {
          lastConnectTimeStamp: Timestamp.fromDate(new Date()).seconds,
        });

        // update(경로, {
        //   [authService.currentUser?.displayName]: Timestamp.fromDate(new Date())
        //     .seconds,
        // });
      };
    }, []);

    //useEffect onValue로 채팅을 계속 가져와야함
    useEffect(() => {
      레이아웃설정(localStorage.getItem('oneToOneChatLayout'));
      onValue(getChatListPath, async (snapshot) => {
        console.log(`채팅이 갱신되었습니다`);
        console.log(snapshot.val());
        //최신메시지 하나만 가져와서 이어붙이면 좋을거같은데...
        let messageList: ChatData[] = Object.values(await snapshot.val());
        console.log(messageList);
        //메시지...가능..아래처럼 분기하면 마지막 메시지가
        // 내가 보낸게 아닐때만 알람이 뜬다.
        // if (
        //   messageList[messageList.length - 1].displayName !==
        //   authService.currentUser.displayName
        // ) {
        //   const notification = new Notification(`${displayName}`, {
        //     body: messageList[messageList.length - 1].message,
        //   });
        // }

        console.log('로딩완료');
        setIsChatLoading(true);
        setChatList(messageList);
      });

      return () => {
        //언마운트시 해당 경로에 대한 관찰자를 off해주면 왔다갔다해도 onValue가 한번씩만 호출됨 (onValue가 쌓이는걸 방지)
        off(getChatListPath);
        setIsChatLoading(false);
        console.log('채팅방을 나갔습니다.');
      };
    }, [chatRoomUid2]);

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
          displayName={displayName2}
          chatRoomUid={chatRoomUid2}
          opponentUid={opponentUid2}
          isOneToOneOrGroup='oneToOne'
        />
      </>
    );
  };

export default React.memo(ChatRoom);
