import React, { useEffect, useState } from 'react';
import Head from 'next/head';
import styled from 'styled-components';
import {
  authService,
  realtimeDbService,
  getChatRoomLastMessage,
} from '../firebaseConfig';
import {
  get,
  ref,
  off,
  onValue,
  onChildAdded,
  query,
  orderByChild,
} from 'firebase/database';
import { useRouter } from 'next/router';
import LoadingSpinner from '../components/LoadingSpinner';
import PeopleSvg from '../components/svg/peopleSvg';
import PersonSvg from '../components/svg/personSvg';
import CreateGroupChatModal from '../components/createGroupChatModal';
import AddSvg from '../components/svg/addSvg';
import { convertDate } from '../utils/convertDate';

export interface ChatDataNew {
  createdAt: string;
  createdSecondsAt: number;
  displayName: string;
  message: string;
  readUsers: {
    [key: string]: boolean;
  };
  uid: string;
}

interface ResultMessage {
  chatRoomUid: {
    chatRoomUid: string;
    opponentName: string;
    opponentUid: string;
  };
  lastMessage?: string;
  notReadCount?: number;
}

interface GroupChatList {
  chatRoomUid: string;
  chatRoomsTitle: string;
  lastMessage: string;
  notReadCount: number;
  createdSecondsAt: number;
}

interface oneToOneChatList {
  chatRoomUid: string;
  opponentName: string;
  opponentUid: string;
  lastMessage?: string;
  notReadCount?: number;
  createdSecondsAt: number;
}

export const Wrap = styled.div`
  width: 100%;
  height: 100%;
  padding: 10px 0 10px 10px;
  display: flex;
  justify-content: flex-start;
  flex-direction: column;
  align-items: flex-start;
  overflow-y: auto;
`;

const ChatListHeader = styled.div`
  width: 100%;
  display: flex;

  align-items: center;
`;

export const PageTitle = styled.div`
  font-size: 20px;
  font-weight: bold;
  color: #444;
`;

const ChatListWrap = styled.div`
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
`;

export const ChatRoomList = styled.li`
  cursor: pointer;
  width: 100%;
  background: #fff;
  padding: 10px;
  height: fit-content;
  display: flex;
  &:hover {
    background: #eee;
  }
`;
export const ChatRoomInfo = styled.div`
  width: 100%;
`;

const ChatRoomLastMessage = styled.div`
  display: flex;
  justify-content: space-between;
  color: #444;
`;
const ChatRoomNotReadCount = styled.div`
  padding: 3px 5px;
  text-align: center;
  color: #fff;
  font-size: 15px;
  font-weight: bold;
  border-radius: 10px;
  background: #d61818;
`;
const ChatRoomTitleAndTime = styled.div`
  display: flex;
  justify-content: space-between;
  margin-bottom: 10px;
  & .title {
    font-size: 15px;
    font-weight: bold;
  }

  & .timeStamp {
    font-size: 15px;
    color: #555;
  }
`;

export const ChatIcon = styled.div`
  position: relative;
  width: 45px;
  height: 45px;
  background: #d0ddff;
  border-radius: 10px;
  margin-right: 10px;
  display: flex;
  justify-content: center;
  align-items: center;
  & svg {
    width: 30px;
    height: 30px;
    fill: #fff;
  }
`;

const ZeroChatRoom = styled.div`
  width: 100%;
  height: 100%;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  font-weight: bold;
  color: #555;
`;

const CreateGroupChatButton = styled.div`
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: ${({ theme }) => theme.colors.main};
  display: flex;
  justify-content: center;
  align-items: center;
  margin-left: 10px;
  cursor: pointer;
  & svg {
    fill: white;
  }
  &:hover {
    background: ${({ theme }) => theme.colors.mainHoverColor};
  }
`;

type ChatRoomType = 'group' | 'oneToOne';

function ChatList() {
  const [isLoading, setIsLoading] = useState(false);
  const [groupChatList2, setGroupChatList2] = useState([]);
  const [combineChatList, setCombineChatList] = useState([]);
  const [sortChatList, setSortChatList] = useState([]);
  const [showAddGroupChat, setShowAddGroupChat] = useState(false);
  const router = useRouter();
  const uid = authService.currentUser?.uid;

  const getMyChatRoomsRef = async (uid: string, chatRoomType: ChatRoomType) => {
    if (chatRoomType === 'group') {
      return await (
        await get(
          ref(
            realtimeDbService,
            `userList/${uid}/myGroupChatList/groupChatUid`,
          ),
        )
      ).val();
    } else {
      return await (
        await get(ref(realtimeDbService, `oneToOneChatRooms/${uid}`))
      ).val();
    }
  };

  //특정 그룹채팅uid의 제목을 리턴
  const getMyGroupChatRoomsTitle = async (chatRoomUid: string) => {
    const titleList = (
      await get(
        ref(realtimeDbService, `groupChatRooms/${chatRoomUid}/chatRoomsTitle`),
      )
    ).val();

    return titleList;
  };

  //특정 그룹채팅uid의 chatList을 리턴
  const getMyGroupChatRoomChatList = async (
    chatRoomUid: string,
  ): Promise<ChatDataNew[] | null> => {
    const chatList = (
      await get(ref(realtimeDbService, `groupChatRooms/${chatRoomUid}/chat`))
    ).val();

    if (!chatList) return null;
    return chatList ? (Object.values(chatList) as ChatDataNew[]) : null;
  };

  //chatList와 uid를 넘기면 안읽은 메시지 개수를 반환
  const getNotReadMessageCount = async (
    chatList: ChatDataNew[],
    uid: string,
  ) => {
    if (!chatList) return 0;
    let chatListLength = chatList.length;
    // console.log(chatList);
    let 안읽은메시지인덱스 = chatList.findIndex((i) => {
      //   console.log('i');
      //   console.log(i);
      return i!.readUsers[uid] === false;
    });
    let 안읽은메시지갯수 = chatListLength - 안읽은메시지인덱스;
    return 안읽은메시지인덱스 === -1 ? 0 : 안읽은메시지갯수;
  };

  const 일대일채팅옵저버 = async (chatUid: string) => {
    console.log(`${chatUid}방 옵저버 실행`);
    const refs = ref(realtimeDbService, `oneToOneChatRooms/${chatUid}/chat`);
    onValue(refs, async (snapshot) => {
      //라스트인덱스오브를 통해 뒤에서부터 true를 찾은 뒤 그 인덱스 = 마지막으로 읽은 메시지 index
      //스냅샷의 사이즈를 가져와서, 스냅샷 - index = 안읽은 메시지 갯수
      //마지막 메시지넣기 시작
      const newLastMessage = await getChatRoomLastMessage(chatUid, 'oneToOne');
      console.log('newLastMessage');

      console.log(newLastMessage);
      const isLastMessageLead =
        newLastMessage.readUsers[authService.currentUser?.uid];

      console.log('chatUid');
      console.log(chatUid);
      //마지막 메시지가 false일 경우에만 notReadCount++ 해주기
      if (!isLastMessageLead) {
        //안읽음 카운트 넣기 - 이건 메시지가 존재하는 경우에만 실행되는 if문 안에 있다.
        const 메시지들: ChatDataNew[] = Object.values((await get(refs)).val());
        const notReadCount = await getNotReadMessageCount(메시지들, uid);
        setCombineChatList((prev) => {
          //같은 채팅방uid를 가진 스테이트에 notReadCount 추가하기
          let updateChatList = prev.map((i, index) => {
            if (i.chatRoomUid === chatUid) {
              i.lastMessage = newLastMessage.message;
              i.createdSecondsAt = newLastMessage.createdSecondsAt;
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

  //그룹채팅리스트를 적절히 렌더링할 배열로 변환
  const createGroupChatRooms = async (uid: string) => {
    //   const listObj = await getMyGroupChatRoomsRef(uid);
    const listObj = await getMyChatRoomsRef(uid, 'oneToOne');
    // console.log('listObj');
    // console.log(listObj);
    if (!listObj) return; //채팅방이 존재할 때 함수 진행
    const listValues: string[] = Object.values(listObj); // 그룹채팅 uid가 들어있다
    // console.log('listValues');
    // console.log(listValues);
    // setGroupChatList2(listValues);

    const getMyChatListArray: ResultMessage[] = Object.values(listObj);

    console.log('getMyChatListArray');
    console.log(getMyChatListArray);

    const resultGroupChatRooms = getMyChatListArray.map(async (i) => {
      const lastMessage = await getChatRoomLastMessage(
        i.chatRoomUid.chatRoomUid,
        'oneToOne',
      );
      const chatList = await getMyGroupChatRoomChatList(
        i.chatRoomUid.chatRoomUid,
      );
      const notReadCount = await getNotReadMessageCount(chatList, uid);

      console.log('lastMessage');
      console.log(lastMessage);

      let result2 = Object.values(i)[0];
      result2['lastMessage'] = lastMessage.message;
      result2['notReadCount'] = notReadCount;
      result2['createdSecondsAt'] = lastMessage.createdSecondsAt;
      //   let 결과객체 = {
      //     chatRoomUid: i,
      //     displayName: title,
      //     lastMessage: lastMessage.message,
      //     notReadCount: notReadCount,
      //     createdSecondsAt: lastMessage.createdSecondsAt,
      //   };
      return result2;
    });
    return await Promise.all(resultGroupChatRooms);
  };

  useEffect(() => {
    createGroupChatRooms(uid).then((res) => {
      console.log('채팅리스트');
      console.log(res);
      if (res) {
        setGroupChatList2(res);
        setCombineChatList(res);
        setIsLoading(true);
      } else {
        setIsLoading(true);
      }
    });
    //현재 유저의 새로운 그룹채팅이 생김을 감지하는 옵저버
    onValue(ref(realtimeDbService, `oneToOneChatRooms/${uid}`), (snap) => {
      console.log('새로운 그룹 채팅 수신');
      console.log(snap.val()); // ['pqscrrx072', '5z39xf31v7']
      setTimeout(() => {
        createGroupChatRooms(uid).then((res) => {
          if (res) {
            setGroupChatList2(res);
            setCombineChatList(res);
          }
        });
      }, 50);
    });
    return () => {
      off(ref(realtimeDbService, `oneToOneChatList/${uid}`));
    };
  }, []);

  useEffect(() => {
    if (groupChatList2.length === 0) return;
    const 옵저버켜기 = async () => {
      const 그룹채팅배열 = await getMyChatRoomsRef(uid, 'oneToOne');
      console.log(그룹채팅배열);
      return 그룹채팅배열;
    };
    const 그룹채팅옵저버종료 = (chatUid: string) => {
      const refs = ref(realtimeDbService, `oneToOneChatRooms/${chatUid}/chat`);
      console.log(`${chatUid}의 안읽은메시지 갯수 옵저버가 종료`);
      off(refs);
    };

    옵저버켜기().then((res) => {
      console.log('ref');
      let ref: any[] = Object.values(res);
      console.log(ref);
      ref.forEach((i) => {
        일대일채팅옵저버(i.chatRoomUid.chatRoomUid);
      });
    });

    return () => {
      옵저버켜기().then((res) => {
        let ref: any[] = Object.values(res);
        console.log(ref);
        ref.forEach((i) => {
          그룹채팅옵저버종료(i.chatRoomUid.chatRoomUid);
        });
      });
    };
  }, [groupChatList2]);

  //통합배열을 정렬시켜주어 정렬된 채팅방을 렌더링시켜준다.
  useEffect(() => {
    if (combineChatList.length === 0) {
      return;
    } else {
      let sortChatList2 = combineChatList
        .filter((i) => {
          return i.createdSecondsAt !== undefined && i;
        })
        .sort((a, b) => b.createdSecondsAt - a.createdSecondsAt);
      setSortChatList([...sortChatList2]);
    }
  }, [combineChatList]);

  return (
    <Wrap>
      <Head>
        <title>maumTalk</title>
      </Head>
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
                      `/chatRooms/oneToOne?displayName=${item?.opponentName}&chatRoomUid=${item?.chatRoomUid}&opponentUid=${item?.opponentUid}`,
                    );
                  }}
                >
                  <ChatIcon>
                    <PeopleSvg />
                  </ChatIcon>
                  <ChatRoomInfo>
                    <ChatRoomTitleAndTime>
                      <span className='title'>{item?.opponentName}</span>
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
