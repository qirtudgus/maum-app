import React, { useEffect, useState } from 'react';
import Head from 'next/head';

import styled from 'styled-components';
import { authService, realtimeDbService } from '../firebaseConfig';
import { get, query, ref, limitToLast } from 'firebase/database';
import { useRouter } from 'next/router';
import LoadingSpinner from '../components/LoadingSpinner';

type ChatInfoArray = ChatInfo[];

interface ChatInfo {
  chatRoomUid: {
    chatRoomUid: string;
    opponentName: string;
  };
}

interface ResultMessage extends ChatInfo {
  lastMessage: string;
}

interface OneMessage {
  [key: string]: {
    createdAt: string;
    displayName: string;
    message: string;
    uid: string;
  };
}

const Wrap = styled.div`
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
`;

const Title = styled.div`
  font-size: 40px;
`;

const ChatListWrap = styled.div`
  display: flex;
  flex-direction: column;

  & > li {
    width: 100px;
    height: 40px;
    border-left: 2px solid#eee;
    display: flex;
    flex-direction: column;
  }
`;

function Home() {
  const [myChatList, setMyChatList] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const router = useRouter();
  useEffect(() => {
    const getMyChatListRef = ref(
      realtimeDbService,
      `oneToOneChatRooms/${authService.currentUser?.uid}`,
    );

    const 채팅리스트가져오기2 = async () => {
      const getMyChatListArray = Object.values(
        await (await get(getMyChatListRef)).val(),
      ) as ChatInfoArray;
      //맵에 async를 넣는순간 프로미스를 반환
      let resultInsertMessageArray = getMyChatListArray.map(
        async (i, index) => {
          const oneToOneChatRoomPath = ref(
            realtimeDbService,
            `oneToOneChatRooms/${i.chatRoomUid.chatRoomUid}/chat`,
          );

          const queryLastMessage = await get(
            query(oneToOneChatRoomPath, limitToLast(1)),
          );
          const lastMessageBefore: OneMessage = queryLastMessage.val();
          const lastMessageAfter = Object.values(lastMessageBefore);
          const lastMessage = lastMessageAfter[0].message;
          const resultInsertMessage: ResultMessage = { ...i, lastMessage };
          return resultInsertMessage;
        },
      );

      //함수가 반환할 배열 map이 비동기함수기때문에 promise.all 사용해준다.
      return await Promise.all(resultInsertMessageArray);
    };

    채팅리스트가져오기2().then((res) => {
      setMyChatList(res);
      setIsLoading(true);
    });
  }, []);

  return (
    <Wrap>
      <Head>
        <title>maumTalk</title>
      </Head>
      <Title>마음톡</Title>
      <>
        {isLoading ? (
          <ChatListWrap>
            {myChatList.map((i, index) => {
              return (
                <li
                  key={index}
                  onClick={() => {
                    router.push(
                      `/chat/${i.chatRoomUid.displayName}?uid=${i.chatRoomUid.chatRoomUid}`,
                    );
                  }}
                >
                  <span> {i.chatRoomUid.opponentName}</span>
                  <div>{i.lastMessage}</div>
                </li>
              );
            })}
          </ChatListWrap>
        ) : (
          <LoadingSpinner />
        )}
      </>
    </Wrap>
  );
}

export default Home;
