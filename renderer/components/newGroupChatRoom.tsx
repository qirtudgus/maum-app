import {
  get,
  off,
  onDisconnect,
  onValue,
  push,
  ref,
  update,
} from 'firebase/database';
import { Timestamp } from 'firebase/firestore';
import Head from 'next/head';
import React, { useEffect, useState } from 'react';
import {
  authService,
  getGroupChatListPath,
  getGroupUserListPath,
  UserList,
  exitUserCleanUpMyGroupChatList,
  exitUserCleanUpThisGroupChatList,
  realtimeDbService,
  getChatRoomLastMessage,
} from '../firebaseConfig';
import { convertDate } from '../utils/convertDate';
import ChatRoomHeaderTitle from '../components/ChatRoomHeaderTitle';
import MessageContainerGroup from './messageContainerGroup';
import LoadingSpinner from '../components/LoadingSpinner';
import SendMessageInput, {
  ConnectedUser,
} from '../components/SendMessageInput';
import { useRouter } from 'next/router';
import MessageContainerOneToOne from './messageContainerOneToOne';
import { ChatDataNew } from '../pages/chatRooms';
import styled from 'styled-components';
import LogoutSvg from './svg/logoutSvg';
import PersonAddSvg from './svg/personAddSvg';
import InviteGroupChatModal from './inviteGroupChatModal';

const LeftButtonGroup = styled.div`
  height: 30px;
  display: flex;
  align-items: center;
  position: absolute;
  top: 5px;
  left: 10px;
`;
const LeftButton = styled.div`
  cursor: pointer;
  margin-right: 10px;
  & svg {
    fill: #000;
    width: 20px;
    height: 20px;
  }
  &:hover svg {
    fill: ${({ theme }) => theme.colors.main};
  }
`;

const NewGroupChatRoom = () => {
  const [chatList, setChatList] = useState([]);
  const [connectedUserList, setConnectedUserList] = useState<UserList[]>([]);
  const [showAddGroupChat, setShowAddGroupChat] = useState(false);
  // const [groupChatUserList, setGroupChatUserList] = useState<UserList[]>([]);

  //SendInput에 보낼 객체값
  const [ConnectedUsers, setConnectedUsers] = useState<ConnectedUser[]>([]);

  const [isChatLoading, setIsChatLoading] = useState(false);
  const router = useRouter();
  const displayName = router.query.chatRoomsTitle as string;
  const chatRoomUid = router.query.chatRoomUid as string;

  const groupChatListPath = getGroupChatListPath(chatRoomUid);
  const groupUserListPath = getGroupUserListPath(chatRoomUid);

  const [레이아웃, 레이아웃설정] = useState('');

  const 접속유저경로 = ref(
    realtimeDbService,
    `groupChatRooms/${chatRoomUid}/connectedUser`,
  );

  //첫 입장 시, 퇴장 시  접속시간 기록
  //잘 기록된다.
  //각 ui에 isOn값도 추가해주자 이는 SendInput에서 쓰기위함이다.
  useEffect(() => {
    const 경로 = ref(
      realtimeDbService,
      `groupChatRooms/${chatRoomUid}/connectedUser/${authService.currentUser?.uid}`,
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
  }, [chatRoomUid]);

  // //마지막 메세지 붙혀오기
  // useEffect(() => {
  //   onValue(groupChatListPath, async (snapshot) => {
  //     if (snapshot.val()) {
  //       let b = await getChatRoomLastMessage(chatRoomUid, 'group');
  //       console.log('마지막메시지');
  //       console.log(b);
  //       setChatList((prev) => [...prev, b]);
  //     }
  //   });

  //   return () => {
  //     off(groupChatListPath);
  //   };
  // }, [chatRoomUid]);

  // //메시지 처음 세팅
  // useEffect(() => {
  //   레이아웃설정(localStorage.getItem('groupChatLayout'));
  //   const 채팅목록세팅 = async () => {
  //     let messageObj = await (await get(groupChatListPath)).val();
  //     //채팅이 있을경우
  //     if (messageObj) {
  //       console.log('채팅목록');
  //       console.log(messageObj);
  //       const messageArr = Object.values(messageObj);
  //       //요소를 반복하며 ?..
  //       //읽음 처리해주기
  //       for (let property in messageObj) {
  //         let 내가읽었는지결과 =
  //           messageObj[property].readUsers[authService.currentUser?.uid];
  //         if (내가읽었는지결과 === false) {
  //           const 업데이트할메시지 = ref(
  //             realtimeDbService,
  //             `groupChatRooms/${chatRoomUid}/chat/${property}/readUsers`,
  //           );

  //           update(업데이트할메시지, { [authService.currentUser?.uid]: true });
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
  // }, [chatRoomUid]);

  useEffect(() => {
    레이아웃설정(localStorage.getItem('groupChatLayout'));
    onValue(ref(realtimeDbService, `groupChatRooms/${chatRoomUid}`), (snap) => {
      console.log('그룹채팅이 갱신');
      console.log(snap);
      let messageList = Object.values(snap.val().chat);
      let messageObj = snap.val().chat;
      for (let property in messageObj) {
        let 내가읽었는지결과 =
          messageObj[property].readUsers[authService.currentUser?.uid];
        if (내가읽었는지결과 === false) {
          const 업데이트할메시지 = ref(
            realtimeDbService,
            `groupChatRooms/${chatRoomUid}/chat/${property}/readUsers`,
          );
          update(업데이트할메시지, { [authService.currentUser?.uid]: true });
        }
      }

      console.log(messageList);
      setChatList(messageList);
      setIsChatLoading(true);
    });

    return () => {
      off(ref(realtimeDbService, `groupChatRooms/${chatRoomUid}`));
      setIsChatLoading(false);
    };
  }, [chatRoomUid]);

  // //useEffect onValue로 채팅을 계속 가져와야함
  // useEffect(() => {
  //   레이아웃설정(localStorage.getItem('groupChatLayout'));
  //   //채팅 onValue
  //   onValue(groupChatListPath, (snapshot) => {
  //     console.log('채팅이 갱신되었습니다');
  //     //0개일때 예외처리
  //     if (snapshot.val()) {
  //       let messageList = Object.values(snapshot.val());
  //       setChatList(messageList);
  //       let messageObj = snapshot.val();
  //       //읽음 처리해주기
  //       for (let property in messageObj) {
  //         let 내가읽었는지결과 =
  //           messageObj[property].readUsers[authService.currentUser?.uid];
  //         if (내가읽었는지결과 === false) {
  //           const 업데이트할메시지 = ref(
  //             realtimeDbService,
  //             `groupChatRooms/${chatRoomUid}/chat/${property}/readUsers`,
  //           );

  //           update(업데이트할메시지, { [authService.currentUser?.uid]: true });
  //         }
  //       }
  //     } else {
  //     }
  //   });
  //   setIsChatLoading(true);
  //   return () => {
  //     off(groupChatListPath);
  //     console.log('채팅방을 나갔습니다.');
  //   };
  // }, [chatRoomUid]);

  //채팅방 인원 옵저버
  useEffect(() => {
    //현재채팅방 사용유저 onValue
    onValue(groupUserListPath, async (snapshot) => {
      console.log('사용자가 갱신되었습니다.');
      let inviteUserList: ConnectedUser[] = await snapshot.val();
      console.log(inviteUserList);
      setConnectedUserList(Object.values(inviteUserList));
      setConnectedUsers(Object.values(inviteUserList));
      get(groupChatListPath).then((res) => {
        if (res.val()) {
          const 메시지배열: ChatDataNew[] = Object.values(res.val());
          console.log(메시지배열);
          setChatList([...메시지배열]);
        }
      });
    });
    return () => {
      off(groupUserListPath);
    };
  }, [chatRoomUid]);

  return (
    <>
      <Head>
        <title>maumTalk - {displayName}</title>
      </Head>
      <ChatRoomHeaderTitle title={displayName} userList={ConnectedUsers} />
      {isChatLoading ? (
        레이아웃 === 'group' ? (
          <MessageContainerGroup chatList={chatList} />
        ) : (
          <MessageContainerOneToOne chatList={chatList} />
        )
      ) : (
        <LoadingSpinner />
      )}

      <SendMessageInput
        connectedUsers={ConnectedUsers}
        chatRoomUid={chatRoomUid}
        isOneToOneOrGroup='group'
      />
      {/* <button
        onClick={async () => {
          if (confirm(`${chatRoomUid} 방에서 나가시겠습니까?`)) {
            //먼저 옵저버를 종료시킨다.
            off(접속유저경로);
            const 삭제및퇴장 = async () => {
              let onUserObj = new Object();

              ConnectedUsers.forEach((i) => {
                // isOn true일때만
                if (i.isOn === true) {
                  onUserObj[`${i.uid}`] = true;
                } else {
                  onUserObj[`${i.uid}`] = false;
                }
              });

              await router.push('/main');
              console.log('onUserObj');
              console.log(onUserObj);

              await push(groupChatListPath, {
                displayName: authService.currentUser?.displayName,
                uid: authService.currentUser?.uid,
                message: `${authService.currentUser?.displayName}님이 채팅방에서 나가셨습니다..`,
                createdAt: convertDate(Timestamp.fromDate(new Date()).seconds),
                createdAtSeconds: Timestamp.fromDate(new Date()).seconds,
                readUsers: onUserObj,
              });

              //내 채팅리스트에서 삭제
              await exitUserCleanUpMyGroupChatList(
                authService.currentUser?.uid,
                chatRoomUid,
              );
              //채팅리스트에서 나를 삭제
              await exitUserCleanUpThisGroupChatList(
                authService.currentUser?.uid,
                chatRoomUid,
              );
            };

            삭제및퇴장();
          }
        }}
      >
        채팅방 나가기
      </button>
      <button
        onClick={() => {
          setShowAddGroupChat(true);
        }}
      >
        초대하기
      </button>
      */}

      {router.pathname.startsWith('/chatRooms/group') && (
        <LeftButtonGroup>
          <LeftButton
            title='채팅방 나가기'
            onClick={async () => {
              if (confirm(`${chatRoomUid} 방에서 나가시겠습니까?`)) {
                //먼저 옵저버를 종료시킨다.
                off(접속유저경로);
                const 삭제및퇴장 = async () => {
                  let onUserObj = new Object();

                  ConnectedUsers.forEach((i) => {
                    // isOn true일때만
                    if (i.isOn === true) {
                      onUserObj[`${i.uid}`] = true;
                    } else {
                      onUserObj[`${i.uid}`] = false;
                    }
                  });

                  await router.push('/chatRooms');
                  console.log('onUserObj');
                  console.log(onUserObj);

                  await push(groupChatListPath, {
                    displayName: authService.currentUser?.displayName,
                    uid: authService.currentUser?.uid,
                    message: `${authService.currentUser?.displayName}님이 채팅방에서 나가셨습니다..`,
                    createdAt: convertDate(
                      Timestamp.fromDate(new Date()).seconds,
                    ),
                    createdAtSeconds: Timestamp.fromDate(new Date()).seconds,
                    readUsers: onUserObj,
                  });

                  //내 채팅리스트에서 삭제
                  await exitUserCleanUpMyGroupChatList(
                    authService.currentUser?.uid,
                    chatRoomUid,
                  );
                  //채팅리스트에서 나를 삭제
                  await exitUserCleanUpThisGroupChatList(
                    authService.currentUser?.uid,
                    chatRoomUid,
                  );
                };

                삭제및퇴장();
              }
            }}
          >
            <LogoutSvg />
          </LeftButton>
          <LeftButton
            title='초대하기'
            onClick={() => {
              setShowAddGroupChat(true);
            }}
          >
            <PersonAddSvg />
          </LeftButton>
        </LeftButtonGroup>
      )}

      {showAddGroupChat && (
        <InviteGroupChatModal
          chatRoomUid={chatRoomUid}
          connectedUserList={connectedUserList}
          setShowAddGroupChat={setShowAddGroupChat}
        />
      )}
    </>
  );
};

export default NewGroupChatRoom;
