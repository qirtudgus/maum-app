import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import { authService, realtimeDbService } from '../firebaseConfig';
import { get, ref, off, onValue } from 'firebase/database';
import { useRouter } from 'next/router';
import LoadingSpinner from '../components/LoadingSpinner';
import AddSvg from '../components/svg/addSvg';
import {
  ChatDataNew,
  createOneToOneChatRooms,
  getMyChatRoomsRef,
  getNotReadMessageCount,
  ResultOneToOneRoom,
  getChatRoomLastMessage,
} from '../utils/makeChatRooms';
import ChatRoom from '../components/ChatRoom';

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
  const [groupChatList2, setGroupChatList2] = useState<ResultOneToOneRoom[]>([]);
  const [combineChatList, setCombineChatList] = useState<ResultOneToOneRoom[]>([]);
  const [sortChatList, setSortChatList] = useState<ResultOneToOneRoom[]>([]);
  const router = useRouter();
  const uid = authService.currentUser?.uid;

  const startOneToOneChatObserver = async (chatUid: string) => {
    console.log(`${chatUid}??? ????????? ??????`);
    const refs = ref(realtimeDbService, `oneToOneChatRooms/${chatUid}/chat`);
    onValue(refs, async (snapshot) => {
      const lastMessage = await getChatRoomLastMessage(chatUid, 'oneToOne');
      //????????? ???????????? false??? ???????????? notReadCount++ ?????????
      if (!lastMessage.readUsers[authService.currentUser?.uid]) {
        const ????????????: ChatDataNew[] = Object.values(snapshot.val());
        const notReadCount = getNotReadMessageCount(????????????, uid);
        setSortChatList((prev) => {
          //?????? ?????????uid??? ?????? ??????????????? notReadCount ????????????
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
    console.log(`${chatUid}??? ?????????????????? ?????? ???????????? ??????`);
    off(refs);
  };
  useEffect(() => {
    createOneToOneChatRooms(uid).then((res) => {
      console.log('???????????????');
      console.log(res);
      if (res) {
        setGroupChatList2(res);
        setCombineChatList(res);
        setIsLoading(true);
      } else {
        setIsLoading(true);
      }
    });
    //?????? ????????? ????????? ??????????????? ????????? ???????????? ?????????
    //?????? ????????? ?????? ?????? ?????? ??????????????? ?????????????????????.
    onValue(ref(realtimeDbService, `oneToOneChatRooms/${uid}`), (snap) => {
      console.log('????????? ?????? ??????');
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
    const ????????????????????? = async () => {
      const ?????????????????? = await getMyChatRoomsRef(uid, 'oneToOne');
      console.log(??????????????????);
      return ??????????????????;
    };

    ?????????????????????().then((res) => {
      console.log('ref');
      let ref: any[] = Object.values(res);
      console.log(ref);
      ref.forEach((i) => {
        startOneToOneChatObserver(i.chatRoomUid.chatRoomUid);
      });
    });

    return () => {
      ?????????????????????().then((res) => {
        let ref: any[] = Object.values(res);
        ref.forEach((i) => {
          exitOneToOneChatObserver(i.chatRoomUid.chatRoomUid);
        });
      });
    };
  }, [groupChatList2]);

  //??????????????? ?????????????????? ????????? ???????????? ?????????????????????.
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
      <ChatListHeader>
        <PageTitle>?????? ??????</PageTitle>
        <CreateGroupChatButton
          className='addGroupChatButton'
          onClick={() => router.push('/userList')}
        >
          <AddSvg />
        </CreateGroupChatButton>
      </ChatListHeader>

      {isLoading ? (
        sortChatList.length === 0 ? (
          <ZeroChatRoom>????????? ?????????????????????!</ZeroChatRoom>
        ) : (
          <>
            {sortChatList.map((item) => {
              return (
                <ChatRoom
                  key={item.chatRoomUid}
                  chatRoom={item}
                  chatRoomType='oneToOne'
                />
              );
            })}
          </>
        )
      ) : (
        <LoadingSpinner wrapColor='#fff' />
      )}
    </Wrap>
  );
}

export default ChatList;
