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
  const [chatList, setChatList] = useState([]);
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [ConnectedUsers, setConnectedUsers] = useState([]);
  const getChatListPath = getOneToOneChatListPath(chatRoomUid2);
  // const 레이아웃 = localStorage.getItem('oneToOneChatLayout');
  const [레이아웃, 레이아웃설정] = useState('');

  console.log(router.query);
  console.log(router);

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
  }, [chatRoomUid2]);

  //메시지 처음 세팅
  // useEffect(() => {
  //   레이아웃설정(localStorage.getItem('oneToOneChatLayout'));
  //   const 채팅목록세팅 = async () => {
  //     let messageObj = await (await get(getChatListPath)).val();
  //     //채팅이 있을경우
  //     if (messageObj) {
  //       console.log('채팅목록');
  //       console.log(messageObj);
  //       const messageArr = Object.values(messageObj);
  //       //요소를 반복하며 ?..
  //       for (let property in messageObj) {
  //         let 내가읽었는지결과 =
  //           messageObj[property].readUsers[authService.currentUser.uid];
  //         if (내가읽었는지결과 === false) {
  //           const 업데이트할메시지 = ref(
  //             realtimeDbService,
  //             `oneToOneChatRooms/${chatRoomUid2}/chat/${property}/readUsers`,
  //           );
  //           update(업데이트할메시지, { [authService.currentUser.uid]: true });
  //         }
  //       }
  //       return messageArr;
  //     }
  //     //채팅이 없을경우 null 반환
  //     else {
  //       return null;
  //     }
  //   };

  //   채팅목록세팅().then((res) => {
  //     console.log('res');
  //     console.log(res);
  //     if (res) {
  //       setChatList(res);
  //       setIsChatLoading(true);
  //     } else {
  //       setIsChatLoading(true);
  //     }
  //   });
  // }, []);

  // //마지막 메세지 붙혀오기
  // useEffect(() => {
  //   onValue(getChatListPath, async (snapshot) => {
  //     if (snapshot.val()) {
  //       let b = await getChatRoomLastMessage(chatRoomUid2, 'oneToOne');
  //       console.log('마지막메시지');
  //       console.log(b);

  //       setChatList((prev) => [...prev, b]);
  //     }
  //   });

  //   return () => {
  //     off(getChatListPath);
  //   };
  // }, [chatRoomUid2]);

  useEffect(() => {
    레이아웃설정(localStorage.getItem('oneToOneChatLayout'));
    onValue(
      ref(realtimeDbService, `oneToOneChatRooms/${chatRoomUid2}`),
      async (snap) => {
        console.log('채팅갱신');
        console.log(snap.val().chat);

        let messageList: ChatDataNew[] = Object.values(await snap.val().chat);
        let messageObj = snap.val().chat;
        //요소를 반복하며 ?..
        for (let property in messageObj) {
          let 내가읽었는지결과 =
            messageObj[property].readUsers[authService.currentUser.uid];
          //값이 true면 패스, false면 true로 업데이트하는 함수 호출
          // console.log(내가읽었는지결과);
          if (내가읽었는지결과 === false) {
            const 업데이트할메시지 = ref(
              realtimeDbService,
              `oneToOneChatRooms/${chatRoomUid2}/chat/${property}/readUsers`,
            );

            update(업데이트할메시지, { [authService.currentUser.uid]: true });
          }
        }

        console.log('로딩완료');
        setChatList(messageList);
        setIsChatLoading(true);
      },
    );

    return () => {
      off(ref(realtimeDbService, `oneToOneChatRooms/${chatRoomUid2}`));
      setIsChatLoading(false);
    };
  }, [chatRoomUid2]);

  //useEffect onValue로 채팅을 계속 가져와야함
  // useEffect(() => {
  //   레이아웃설정(localStorage.getItem('oneToOneChatLayout'));
  //   onValue(
  //     ref(realtimeDbService, `oneToOneChatRooms/${chatRoomUid2}/chat`),
  //     async (snapshot) => {
  //       console.log(`채팅이 갱신되었습니다`);
  //       // console.log(snapshot.val());
  //       //최신메시지 하나만 가져와서 이어붙이면 좋을거같은데...
  //       //메시지가 0개일때 예외처리
  //       if (snapshot.val()) {
  //         let messageList: ChatDataNew[] = Object.values(await snapshot.val());
  //         let messageObj = snapshot.val();
  //         //요소를 반복하며 ?..
  //         for (let property in messageObj) {
  //           let 내가읽었는지결과 =
  //             messageObj[property].readUsers[authService.currentUser.uid];
  //           //값이 true면 패스, false면 true로 업데이트하는 함수 호출
  //           // console.log(내가읽었는지결과);
  //           if (내가읽었는지결과 === false) {
  //             const 업데이트할메시지 = ref(
  //               realtimeDbService,
  //               `oneToOneChatRooms/${chatRoomUid2}/chat/${property}/readUsers`,
  //             );

  //             update(업데이트할메시지, { [authService.currentUser.uid]: true });
  //           }
  //         }

  //         console.log('로딩완료');
  //         setChatList(messageList);
  //         setIsChatLoading(true);
  //       } else {
  //         setIsChatLoading(true);
  //       }
  //     },
  //   );

  //   return () => {
  //     //언마운트시 해당 경로에 대한 관찰자를 off해주면 왔다갔다해도 onValue가 한번씩만 호출됨 (onValue가 쌓이는걸 방지)
  //     off(getChatListPath);
  //     setIsChatLoading(false);
  //     console.log('채팅방을 나갔습니다.');
  //   };
  // }, []);

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
  }, [chatRoomUid2]);

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
      {/* {ConnectedUsers.map((i) => {
        // console.log(i);
        // 채팅방에 접속한 유저들만 렌더링 시켜줄 수 있다.
        return <div key={i.uid}>{i.isOn ? i.displayName : null}</div>;
      })} */}
    </>
  );
};

export default React.memo(ChatRoom);
