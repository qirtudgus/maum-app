import { off, onValue, ref } from 'firebase/database';
import React, { useEffect, useState } from 'react';
import ChatRoom from '../components/ChatRoom';
import CreateGroupChatModal from '../components/createGroupChatModal';
import LoadingSpinner from '../components/LoadingSpinner';
import AddSvg from '../components/svg/addSvg';
import { authService, realtimeDbService } from '../firebaseConfig';
import {
  ChatDataNew,
  createGroupChatRoomsTest,
  createOneToOneChatRoomsTest,
  getChatRoomLastMessage,
  getMyChatRoomsRef,
  getNotReadMessageCount,
  groupChatRoomUidArr,
  pureMessage,
} from '../utils/makeChatRooms';
import { ChatListHeader, CreateGroupChatButton, PageTitle, Wrap, ZeroChatRoom } from './oneToOneChatRooms';

const CombineCahtRooms = () => {
  console.log('몇번 렌더링되나~~');
  const uid = authService.currentUser?.uid;

  const [chat, setChat] = useState([]);
  const [groupChat, setGroupChat] = useState([]);
  //chat groupChat을 의존성으로 가지며, 채팅방 순서가 정렬되어있다.
  const [sortChat, setSortChat] = useState([]);
  //옵저버생성 함수에 의존성배열에 아래값을 넣고, 채팅생성감지시마다 토글하여 옵저버를 새로 갱신해줍니다.
  const [isNewChat, setIsNewChat] = useState(false);
  //채팅방 로딩 스피너
  const [isLoading, setIsLoading] = useState(false);
  //초대모달창
  const [showAddGroupChat, setShowAddGroupChat] = useState(false);

  // const FirstRenderer = async () => {
  //   //대화가 없을경우 null이 아닌 []를 반환해주도록 변경하여 스프레드문법에 오류가 없게 하였다.
  //   const chat1 = await createGroupChatRoomsTest(uid);
  //   const chat2 = await createOneToOneChatRoomsTest(uid);
  //   setGroupChat([...chat1]);
  //   setChat([...chat2]);
  // };

  // //초기에 chat에 각 채팅을 set해준다.
  // useEffect(() => {
  //   FirstRenderer();
  // }, []);

  //chat 변화감지가 되면 sortChat의 값을 정렬해준다.
  useEffect(() => {
    let sortbefore = [...chat, ...groupChat];
    setSortChat((chat) => {
      let sort = sortbefore.sort((a, b) => b.createdSecondsAt - a.createdSecondsAt);
      return sort;
    });
    setTimeout(() => {
      setIsLoading(true);
    }, 500);
  }, [chat, groupChat]);

  //각 채팅은 옵저버를 만들어준다. 먼저 그룹채팅
  const startGroupChatRoomsObserver = async (uid: string) => {
    await groupChatRoomUidArr(uid).then((res) => {
      //그룹채팅이 하나도 없을경우 함수 멈춤
      if (!res) return;
      res.forEach((chatUid) => {
        console.log(`${chatUid}방 옵저버 실행`);
        const refs = ref(realtimeDbService, `groupChatRooms/${chatUid}/chat`);
        onValue(refs, async (snapshot) => {
          const lastMessage = await getChatRoomLastMessage(chatUid, 'group');
          //마지막 메시지가 false일 경우에만 notReadCount++ 해주기
          if (lastMessage.readUsers[authService.currentUser?.uid] === false) {
            const 메시지들: ChatDataNew[] = Object.values(snapshot.val());
            const notReadCount = getNotReadMessageCount(메시지들, uid);
            setGroupChat((prev) => {
              //같은 채팅방uid를 가진 스테이트에 마지막메시지값 갱신하기
              let updateChatList = prev.map((i, index) => {
                if (i.chatRoomUid === chatUid) {
                  i.lastMessage = lastMessage.message;
                  i.createdSecondsAt = lastMessage.createdSecondsAt;
                  i.notReadCount = notReadCount;
                }
                return i;
              });
              return updateChatList;
            });
          }
        });
      });
    });
  };
  const exitGroupChatRoomsObserver = async (uid: string) => {
    await groupChatRoomUidArr(uid).then((chatUid) => {
      const refs = ref(realtimeDbService, `groupChatRooms/${chatUid}/chat`);
      console.log(`${chatUid}의 안읽은메시지 갯수 옵저버가 종료`);
      off(refs);
    });
  };

  //채팅방이 새로 생성됐을 때 옵저버를 갱신해줘야한다. 디펜던시 필요
  useEffect(() => {
    startGroupChatRoomsObserver(uid);
    return () => {
      exitGroupChatRoomsObserver(uid);
    };
  }, [isNewChat]);

  //일대일채팅 옵저버
  const startOneToOneChatObserver = async (chatUid: string) => {
    console.log(`${chatUid}방 옵저버 실행`);
    const refs = ref(realtimeDbService, `oneToOneChatRooms/${chatUid}/chat`);
    onValue(refs, async (snapshot) => {
      const lastMessage = await getChatRoomLastMessage(chatUid, 'oneToOne');
      //굳이 마지막 메시지를 읽어오지말고 스냅샷으로도 처리가 가능하다..
      // const 스냅샷메시지: ChatDataNew[] = Object.values(snapshot.val());
      // const 스냅샷사이즈 = snapshot.size;
      // const 스냅샷마지막메시지 = 스냅샷메시지[스냅샷사이즈 - 1];
      // const 스냅샷마지막 = 스냅샷마지막메시지.readUsers[authService.currentUser?.uid];
      // console.log('snapshot 일대일채팅');
      // console.log(스냅샷마지막메시지);
      // console.log(스냅샷사이즈);
      // console.log(스냅샷마지막);

      //마지막 메시지가 false일 경우에만 notReadCount++ 해주기
      if (!lastMessage.readUsers[uid]) {
        const 메시지들: ChatDataNew[] = Object.values(snapshot.val());
        const notReadCount = getNotReadMessageCount(메시지들, uid);
        setChat((prev) => {
          //같은 채팅방uid를 가진 스테이트에 notReadCount 추가하기
          let updateChatList = prev.map((i, index) => {
            if (i.chatRoomUid === chatUid) {
              i.lastMessage = lastMessage.message;
              i.createdSecondsAt = lastMessage.createdSecondsAt;
              i.notReadCount = notReadCount;
              // i.notReadCount++;
            }
            return i;
          });
          return updateChatList;
        });
      }
    });
  };
  const exitOneToOneChatObserver = (chatUid: string) => {
    const refs = ref(realtimeDbService, `oneToOneChatRooms/${chatUid}/chat`);
    console.log(`${chatUid}의 안읽은메시지 갯수 옵저버가 종료`);
    off(refs);
  };
  useEffect(() => {
    const 옵저버채팅배열 = async () => {
      const 그룹채팅배열 = await getMyChatRoomsRef(uid, 'oneToOne');
      console.log(그룹채팅배열);
      return 그룹채팅배열;
    };

    옵저버채팅배열().then((res) => {
      console.log('ref');
      if (!res) return;

      let ref: pureMessage[] = Object.values(res);
      console.log(ref);
      ref.forEach((i) => {
        startOneToOneChatObserver(i.chatRoomUid.chatRoomUid);
      });
    });

    return () => {
      옵저버채팅배열().then((res) => {
        if (!res) return;
        let ref: pureMessage[] = Object.values(res);
        ref.forEach((i) => {
          exitOneToOneChatObserver(i.chatRoomUid.chatRoomUid);
        });
      });
    };
  }, [isNewChat]);

  //각 채팅생성에 대한 옵저버 추가 일대일채팅 생성 감지
  useEffect(() => {
    onValue(ref(realtimeDbService, `oneToOneChatRooms/${uid}`), (snap) => {
      console.log('새로운 일대일 채팅 수신');
      console.log(snap.val()); // ['pqscrrx072', '5z39xf31v7']
      setTimeout(() => {
        //전체 채팅객체를 만드는건 비효율적이다. 하나의 채팅방객체를 만드는 함수를 모듈화하여
        //객체하나만 이어붙인다면 더 아낄 수 있을것이다.
        createOneToOneChatRoomsTest(uid).then((res) => {
          if (res) {
            setChat([...res]);
            setIsNewChat((prev) => !prev);
          }
        });
      }, 0);
    });
    return () => {
      off(ref(realtimeDbService, `oneToOneChatList/${uid}`));
    };
  }, []);
  //그룹채팅 생성감지
  useEffect(() => {
    //현재 유저의 새로운 그룹채팅이 생김을 감지하는 옵저버
    //새로 감지가 되면 방을 다시 렌더링하여 순차정렬해준다.
    onValue(ref(realtimeDbService, `userList/${uid}/group_chat_rooms`), (snap) => {
      // console.log('새로운 그룹 채팅 수신');
      // console.log(snap.val()); // ['pqscrrx072', '5z39xf31v7']
      setTimeout(() => {
        createGroupChatRoomsTest(uid).then((res) => {
          console.log('그룹 수신 후res');
          console.log(res);
          if (res) {
            setGroupChat([...res]);
            setIsNewChat((prev) => !prev);
          }
        });
      }, 0);
    });
    return () => {
      off(ref(realtimeDbService, `userList/${uid}/group_chat_rooms`));
    };
  }, []);

  return (
    <Wrap>
      <ChatListHeader>
        <PageTitle>대화 목록</PageTitle>
        <CreateGroupChatButton
          className='addGroupChatButton'
          onClick={() => setShowAddGroupChat((prev) => !prev)}
        >
          <AddSvg />
        </CreateGroupChatButton>
      </ChatListHeader>
      {isLoading ? (
        sortChat.length === 0 ? (
          <ZeroChatRoom>아직 만들어진 대화가 없어요!</ZeroChatRoom>
        ) : (
          sortChat.map((item) => {
            if (item.opponentUid) {
              return (
                <ChatRoom
                  key={item.chatRoomUid}
                  chatRoom={item}
                  chatRoomType='oneToOne'
                />
              );
            } else {
              return (
                <ChatRoom
                  key={item.chatRoomUid}
                  chatRoom={item}
                  chatRoomType='group'
                />
              );
            }
          })
        )
      ) : (
        <LoadingSpinner wrapColor='#fff' />
      )}
      {showAddGroupChat && <CreateGroupChatModal setShowAddGroupChat={setShowAddGroupChat} />}
    </Wrap>
  );
};

export default React.memo(CombineCahtRooms);
