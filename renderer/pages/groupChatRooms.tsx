import { get, off, onValue, ref } from 'firebase/database';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import CreateGroupChatModal from '../components/createGroupChatModal';
import LoadingSpinner from '../components/LoadingSpinner';
import AddSvg from '../components/svg/addSvg';
import PeopleSvg from '../components/svg/peopleSvg';
import {
  authService,
  getChatRoomLastMessage,
  realtimeDbService,
} from '../firebaseConfig';
import { convertDate } from '../utils/convertDate';
import {
  ChatDataNew,
  ChatRoomType,
  createGroupChatRooms,
  getNotReadMessageCount,
  groupChatRoomUidArr,
  ResultGroupRoom,
} from '../utils/makeChatRooms';
import {
  ChatIcon,
  ChatListHeader,
  ChatRoomInfo,
  ChatRoomLastMessage,
  ChatRoomList,
  ChatRoomNotReadCount,
  ChatRoomTitleAndTime,
  CreateGroupChatButton,
  PageTitle,
  Wrap,
  ZeroChatRoom,
} from './oneToOneChatRooms';

function ChatList() {
  const [isLoading, setIsLoading] = useState(false);
  const [groupChatList2, setGroupChatList2] = useState<ResultGroupRoom[]>([]);
  const [combineChatList, setCombineChatList] = useState<ResultGroupRoom[]>([]);
  const [sortChatList, setSortChatList] = useState<ResultGroupRoom[]>([]);
  const [showAddGroupChat, setShowAddGroupChat] = useState(false);
  const router = useRouter();
  const uid = authService.currentUser?.uid;

  const startGroupChatRoomsObserver = async (uid: string) => {
    await groupChatRoomUidArr(uid).then((res) => {
      if (!res) return;
      res.forEach((chatUid) => {
        console.log(`${chatUid}방 옵저버 실행`);
        const refs = ref(realtimeDbService, `groupChatRooms/${chatUid}/chat`);
        onValue(refs, async (snapshot) => {
          console.log('snapshot.val()');
          console.log(snapshot.val());
          const lastMessage = await getChatRoomLastMessage(chatUid, 'group');
          //마지막 메시지가 false일 경우에만 notReadCount++ 해주기
          if (lastMessage.readUsers[authService.currentUser?.uid] === false) {
            //안읽음 카운트 넣기 - 이건 메시지가 존재하는 경우에만 실행되는 if문 안에 있다.
            const 메시지들: ChatDataNew[] = Object.values(snapshot.val());
            const notReadCount = getNotReadMessageCount(메시지들, uid);
            setCombineChatList((prev) => {
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

  useEffect(() => {
    createGroupChatRooms(uid).then((res) => {
      // console.log('채팅리스트');
      // console.log(res);
      if (res) {
        setGroupChatList2(res);
        setCombineChatList(res);
        setIsLoading(true);
      } else {
        setIsLoading(true);
      }
    });
    //현재 유저의 새로운 그룹채팅이 생김을 감지하는 옵저버
    //새로 감지가 되면 방을 다시 렌더링하여 순차정렬해준다.
    onValue(
      ref(realtimeDbService, `userList/${uid}/group_chat_rooms`),
      (snap) => {
        // console.log('새로운 그룹 채팅 수신');
        // console.log(snap.val()); // ['pqscrrx072', '5z39xf31v7']
        setTimeout(() => {
          createGroupChatRooms(uid).then((res) => {
            console.log('그룹 수신 후res');
            console.log(res);
            if (res) {
              setGroupChatList2(res);
              setCombineChatList(res);
            }
          });
        }, 50);
      },
    );
    return () => {
      off(ref(realtimeDbService, `userList/${uid}/group_chat_rooms`));
    };
  }, []);

  useEffect(() => {
    startGroupChatRoomsObserver(uid);
    return () => {
      exitGroupChatRoomsObserver(uid);
    };
  }, [groupChatList2]);

  //통합배열을 정렬시켜주어 정렬된 채팅방을 렌더링시켜준다.
  useEffect(() => {
    if (combineChatList.length === 0) {
      return;
    } else {
      let count = 0;
      let sortChatList2 = combineChatList
        .filter((i) => {
          count += i.notReadCount;
          return i.createdSecondsAt !== undefined && i;
        })
        .sort((a, b) => b.createdSecondsAt - a.createdSecondsAt);
      setSortChatList([...sortChatList2]);
    }
  }, [combineChatList]);

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
        sortChatList.length === 0 ? (
          <ZeroChatRoom>대화가 존재하지않아요!</ZeroChatRoom>
        ) : (
          <>
            {sortChatList.map((item) => {
              return (
                <ChatRoomList
                  key={item.chatRoomUid}
                  onClick={() => {
                    router.push(
                      `/groupChatRooms/group?chatRoomsTitle=${item.displayName}&chatRoomUid=${item.chatRoomUid}`,
                    );
                  }}
                >
                  <ChatIcon>
                    <PeopleSvg />
                  </ChatIcon>
                  <ChatRoomInfo>
                    <ChatRoomTitleAndTime>
                      <span className='title'>{item?.displayName}</span>
                      {item.createdSecondsAt !== 0 &&
                        item.createdSecondsAt !== undefined && (
                          <span className='timeStamp'>
                            {convertDate(item.createdSecondsAt)}
                          </span>
                        )}
                    </ChatRoomTitleAndTime>
                    <ChatRoomLastMessage>
                      <div>{item.lastMessage}</div>
                      {item.notReadCount !== 0 && (
                        <ChatRoomNotReadCount>
                          {item.notReadCount}
                        </ChatRoomNotReadCount>
                      )}
                    </ChatRoomLastMessage>
                  </ChatRoomInfo>
                </ChatRoomList>
              );
            })}
          </>
        )
      ) : (
        <LoadingSpinner />
      )}
      {showAddGroupChat && (
        <CreateGroupChatModal setShowAddGroupChat={setShowAddGroupChat} />
      )}
    </Wrap>
  );
}

export default ChatList;
