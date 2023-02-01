import React, { useEffect, useState } from 'react';
import Head from 'next/head';
import styled from 'styled-components';
import {
  authService,
  realtimeDbService,
  getChatRoomLastMessage,
} from '../firebaseConfig';
import { get, ref, off, onValue } from 'firebase/database';
import { useRouter } from 'next/router';
import LoadingSpinner from '../components/LoadingSpinner';
import PeopleSvg from '../components/svg/peopleSvg';

import AddSvg from '../components/svg/addSvg';
import { convertDate } from '../utils/convertDate';
import {
  ChatDataNew,
  createOneToOneChatRooms,
  getMyChatRoomsRef,
  getNotReadMessageCount,
} from '../utils/makeChatRooms';

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

export const ChatListHeader = styled.div`
  width: 100%;
  display: flex;

  align-items: center;
`;

export const PageTitle = styled.div`
  font-size: 20px;
  font-weight: bold;
  color: #444;
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

export const ChatRoomLastMessage = styled.div`
  display: flex;
  justify-content: space-between;
  color: #444;
`;
export const ChatRoomNotReadCount = styled.div`
  padding: 3px 5px;
  text-align: center;
  color: #fff;
  font-size: 15px;
  font-weight: bold;
  border-radius: 10px;
  background: #d61818;
`;
export const ChatRoomTitleAndTime = styled.div`
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

export const ZeroChatRoom = styled.div`
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

export const CreateGroupChatButton = styled.div`
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

function ChatList() {
  const [isLoading, setIsLoading] = useState(false);
  const [groupChatList2, setGroupChatList2] = useState([]);
  const [combineChatList, setCombineChatList] = useState([]);
  const [sortChatList, setSortChatList] = useState([]);
  const router = useRouter();
  const uid = authService.currentUser?.uid;

  const startOneToOneChatObserver = async (chatUid: string) => {
    console.log(`${chatUid}방 옵저버 실행`);
    const refs = ref(realtimeDbService, `oneToOneChatRooms/${chatUid}/chat`);
    onValue(refs, async (snapshot) => {
      //라스트인덱스오브를 통해 뒤에서부터 true를 찾은 뒤 그 인덱스 = 마지막으로 읽은 메시지 index
      //스냅샷의 사이즈를 가져와서, 스냅샷 - index = 안읽은 메시지 갯수
      //마지막 메시지넣기 시작
      const newLastMessage = await getChatRoomLastMessage(chatUid, 'oneToOne');
      // console.log('newLastMessage');

      // console.log(newLastMessage);
      const isLastMessageLead =
        newLastMessage.readUsers[authService.currentUser?.uid];
      // console.log('chatUid');
      // console.log(chatUid);
      //마지막 메시지가 false일 경우에만 notReadCount++ 해주기
      if (!isLastMessageLead) {
        //안읽음 카운트 넣기 - 이건 메시지가 존재하는 경우에만 실행되는 if문 안에 있다.
        const 메시지들: ChatDataNew[] = Object.values((await get(refs)).val());
        const notReadCount = await getNotReadMessageCount(메시지들, uid);
        setSortChatList((prev) => {
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
  useEffect(() => {
    createOneToOneChatRooms(uid).then((res) => {
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
      console.log('새로운 채팅 수신');
      console.log(snap.val()); // ['pqscrrx072', '5z39xf31v7']
      setTimeout(() => {
        createOneToOneChatRooms(uid).then((res) => {
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
    const 옵저버채팅배열 = async () => {
      const 그룹채팅배열 = await getMyChatRoomsRef(uid, 'oneToOne');
      console.log(그룹채팅배열);
      return 그룹채팅배열;
    };
    const quitOneToOneChatObserver = (chatUid: string) => {
      const refs = ref(realtimeDbService, `oneToOneChatRooms/${chatUid}/chat`);
      console.log(`${chatUid}의 안읽은메시지 갯수 옵저버가 종료`);
      off(refs);
    };

    옵저버채팅배열().then((res) => {
      console.log('ref');
      let ref: any[] = Object.values(res);
      console.log(ref);
      ref.forEach((i) => {
        startOneToOneChatObserver(i.chatRoomUid.chatRoomUid);
      });
    });

    return () => {
      옵저버채팅배열().then((res) => {
        let ref: any[] = Object.values(res);
        ref.forEach((i) => {
          quitOneToOneChatObserver(i.chatRoomUid.chatRoomUid);
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
          onClick={() => router.push('/userList')}
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
                      //   `/chatRooms/oneToOne?displayName=${item?.opponentName}&chatRoomUid=${item?.chatRoomUid}`,
                      `/oneToOneChatRooms/oneToOne?displayName=${item.opponentName}&chatRoomUid=${item.chatRoomUid}`,
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
    </Wrap>
  );
}

export default ChatList;
