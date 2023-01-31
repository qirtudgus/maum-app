import React, { useEffect, useState } from 'react';
import Head from 'next/head';
import styled from 'styled-components';
import {
  authService,
  getGroupChatRoomsUidToTitleFunc,
  realtimeDbService,
} from '../firebaseConfig';
import {
  get,
  query,
  ref,
  limitToLast,
  onChildAdded,
  off,
  onValue,
} from 'firebase/database';
import { useRouter } from 'next/router';
import LoadingSpinner from '../components/LoadingSpinner';

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
interface groupChatList {
  chatUid: string;
  chatTitle: string;
}
interface GroupChatListSnapshot {
  groupChatUid: string[];
}

interface OneMessage {
  [key: string]: {
    createdAt: string;
    displayName: string;
    message: string;
    uid: string;
  };
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

const Wrap = styled.div`
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: flex-start;
  flex-direction: column;
  align-items: flex-start;
`;

const ChatListWrap = styled.div`
  display: flex;
  flex-direction: column;
  padding: 50px;

  & > li {
    width: 100%;
    height: 40px;
    border-left: 2px solid#eee;
    display: flex;
    flex-direction: column;
  }
`;

function ChatList() {
  const [myChatList, setMyChatList] = useState<ResultMessage[]>([]);
  const [myChatLastMessage, setMyChatLastMessage] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [groupChatAllList, setGroupChatAllList] = useState<groupChatList[]>([]);

  const router = useRouter();
  const enterGroupChatRoom = (item: groupChatList) => {
    router.push(`/groupchat/${item.chatTitle}?chatRoomUid=${item.chatUid}`);
  };

  //유저의 그룹채팅 리스트를 가져와 state에 넣어주는 함수
  useEffect(() => {
    //그룹채팅 리스트의 uid와 그룹채팅방의 uid가 같은 title을 가져와서 list에 넣어주자
    if (authService.currentUser) {
      const myGroupChatListPath = ref(
        realtimeDbService,
        `userList/${authService.currentUser.uid}/myGroupChatList`,
      );
      console.log('그룹채팅 온밸류 호출');
      onValue(myGroupChatListPath, async (snapshot) => {
        //그룹생성이 아예 처음이라면 해당 값이 null이다. 이에 대한 예외 처리를 했다.
        if (snapshot.val()) {
          let groupChatListSnapshot: GroupChatListSnapshot = snapshot.val();
          let groupChatUidList = groupChatListSnapshot.groupChatUid;
          getGroupChatRoomsUidToTitleFunc(groupChatUidList).then(
            (groupChatTitleList) => {
              // console.log(groupChatTitleList);
              let mergeGroupChatList = groupChatUidList.map((item, index) => {
                return { chatUid: item, chatTitle: groupChatTitleList[index] };
              });
              //   console.log('그룹채팅배열');
              //   console.log(mergeGroupChatList);
              setGroupChatAllList(mergeGroupChatList);
            },
          );
        }
      });
    }
  }, []);

  //useEffect 초기 세팅
  useEffect(() => {
    const getMyChatListRef = ref(
      realtimeDbService,
      `oneToOneChatRooms/${authService.currentUser?.uid}`,
    );

    const 채팅리스트가져오기2 = async () => {
      let 채팅방있는지체크 = await (await get(getMyChatListRef)).val();
      //아직 채팅방이 0개일 때 예외처리 이러면 res에 undifined가 할당된다.
      if (!채팅방있는지체크) {
        return;
      }
      const getMyChatListArray = Object.values(
        await (await get(getMyChatListRef)).val(),
      ) as ResultMessage[];

      //맵에 async를 넣는순간 프로미스를 반환
      //각 일대일채팅의 메시지를 가공하여 마지막메세지와 안읽은 갯수를 추가해준다.
      let resultInsertMessageArray = getMyChatListArray.map(
        async (i, index) => {
          const oneToOneChatRoomPath = ref(
            realtimeDbService,
            `oneToOneChatRooms/${i.chatRoomUid.chatRoomUid}/chat`,
          );
          //마지막 메시지넣기 시작
          let resultMessage: ResultMessage = {
            ...i,
            lastMessage: '',
            notReadCount: 0,
          };
          const queryLastMessage = await get(
            query(oneToOneChatRoomPath, limitToLast(1)),
          );
          const lastMessageBefore: OneMessage = queryLastMessage.val();
          if (lastMessageBefore) {
            const lastMessageAfter = Object.values(lastMessageBefore);
            const lastMessage = lastMessageAfter[0].message;
            resultMessage = { ...i, lastMessage };
            //안읽은 갯수 넣기 시작
            let 메시지들: ChatDataNew[] = Object.values(
              (await get(oneToOneChatRoomPath)).val(),
            );
            let 메시지길이 = 메시지들.length;
            let 안읽은메시지인덱스 = 메시지들.findIndex((i) => {
              return i?.readUsers[authService.currentUser?.uid] === false;
            });
            if (안읽은메시지인덱스 === -1) {
              resultMessage['notReadCount'] = 0;
            } else {
              let 안읽은메시지갯수 = 메시지길이 - 안읽은메시지인덱스;
              resultMessage['notReadCount'] = 안읽은메시지갯수;
            }
            //안읽은 갯수 넣기 끝
          }
          return resultMessage;
        },
      );
      //함수가 반환할 배열 map이 비동기함수기때문에 promise.all 사용해준다.
      return await Promise.all(resultInsertMessageArray);
    };

    채팅리스트가져오기2().then((res) => {
      //결과가 언디파인드일때의 분기처리
      if (res) {
        setMyChatList(res);
        setMyChatLastMessage(res);
        setIsLoading(true);
      } else {
        setIsLoading(true);
      }
    });
  }, []);

  //각 채팅이 변경될때마다 카운트 추가해는 옵저버, 동시에 마지막 쿼리를 가져와서 lastMessage에 할당해주면 굿
  useEffect(() => {
    const 채팅갯수옵저버 = async (chatUid: string) => {
      console.log(`${chatUid}방 옵저버 실행`);
      const refs = ref(realtimeDbService, `oneToOneChatRooms/${chatUid}/chat`);
      onValue(refs, async (snapshot) => {
        //라스트인덱스오브를 통해 뒤에서부터 true를 찾은 뒤 그 인덱스 = 마지막으로 읽은 메시지 index
        //스냅샷의 사이즈를 가져와서, 스냅샷 - index = 안읽은 메시지 갯수
        console.log(typeof snapshot.val());
        if (typeof snapshot.val() === 'object') {
          //마지막 메시지넣기 시작
          const queryLastMessage = await get(query(refs, limitToLast(1)));
          const lastMessageBefore: ChatDataNew = queryLastMessage.val();
          //메시지가 있을때 작동
          if (lastMessageBefore) {
            const lastMessageAfter = Object.values(lastMessageBefore);

            console.log('메시지 벨류');
            console.log(lastMessageAfter);

            const lastMessage = lastMessageAfter[0].message;
            const isLastMessageLead =
              lastMessageAfter[0].readUsers[authService.currentUser?.uid];

            //마지막 메시지가 false일 경우에만 notReadCount++ 해주기

            if (!isLastMessageLead) {
              setMyChatLastMessage((prev) => {
                //같은 채팅방uid를 가진 스테이트에 notReadCount 추가하기
                let updateChatList = prev.map((i, index) => {
                  if (i.chatRoomUid.chatRoomUid === chatUid) {
                    i.lastMessage = lastMessage;
                    i.notReadCount++;
                    //   if(i[0].readUsers[authService.currentUser?.uid]){}
                  }
                  return i;
                });
                return updateChatList;
              });
            }
          }
        }
      });
    };

    const 채팅갯수옵저버끄기 = (chatUid: string) => {
      const refs = ref(realtimeDbService, `oneToOneChatRooms/${chatUid}/chat`);
      console.log(`${chatUid}의 안읽은메시지 갯수 옵저버가 종료`);
      off(refs);
    };

    if (myChatList) {
      myChatList.forEach((i, index) => {
        채팅갯수옵저버(i.chatRoomUid.chatRoomUid);
      });
    }

    return () => {
      myChatList.forEach((i) => {
        채팅갯수옵저버끄기(i.chatRoomUid.chatRoomUid);
      });
    };
  }, [myChatList]);

  return (
    <Wrap>
      <Head>
        <title>maumTalk</title>
      </Head>

      <>
        <>대화 목록</>
        {isLoading ? (
          <ChatListWrap>
            <div>일대일채팅 목록</div>
            {myChatLastMessage.length === 0
              ? null
              : myChatLastMessage.map((i, index) => {
                  return (
                    <li
                      key={index}
                      onClick={() => {
                        router.push(
                          `/chat/${i.chatRoomUid.opponentName}?chatRoomUid=${i.chatRoomUid.chatRoomUid}&opponentUid=${i.chatRoomUid.opponentUid}`,
                        );
                      }}
                    >
                      <span> {i.chatRoomUid.opponentName}</span>
                      <div>{i?.lastMessage}</div>
                      <div>안읽은갯수:{i?.notReadCount}</div>
                    </li>
                  );
                })}
          </ChatListWrap>
        ) : (
          <LoadingSpinner />
        )}
        {groupChatAllList.map((item, index) => {
          return item.chatTitle !== null ? (
            <li
              key={index}
              onDoubleClick={() => {
                // setCurrentGroupChat(item);
                enterGroupChatRoom(item);
              }}
            >
              {item.chatTitle}
            </li>
          ) : null;
        })}
      </>
    </Wrap>
  );
}

export default ChatList;
