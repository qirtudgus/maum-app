import React, { useEffect, useState } from 'react';
import Head from 'next/head';
import styled from 'styled-components';
import { authService, realtimeDbService } from '../firebaseConfig';
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
  const [myChatList, setMyChatList] = useState([]);

  const [myChatLastMessage, setMyChatLastMessage] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [start, setStart] = useState(false);
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
          //resultInsertMessage에 마지막 메시지까지는 넣었다. 이제 채팅창별로 false값을 구해와서 count해주자.
          // //안읽은 메시지 구하기 시작 준비물 : 채팅uid = i.chatRoomUid.chatRoomUid
          // let notReadCount = 0;
          // const refs = ref(
          //   realtimeDbService,
          //   `oneToOneChatRooms/${i.chatRoomUid.chatRoomUid}/chat`,
          // );
          // const gets = (await get(refs)).val();
          // const values = Object.values(gets);
          // // console.log(values);
          // values.forEach((i, index) => {
          //   if (i.readUsers) {
          //     // console.log(i.readUsers[authService.currentUser?.uid]);
          //     i.readUsers[authService.currentUser?.uid] ? null : notReadCount++;
          //   }
          // });
          // // console.log('안읽은 갯수');
          // // console.log(notReadCount);
          // //리절트에 안읽은 메시지 갯수 추가하기
          // const notReadCountMessage = { ...resultInsertMessage, notReadCount };
          // //안읽은 메시지 구하기 끝

          return resultInsertMessage;
        },
      );

      //함수가 반환할 배열 map이 비동기함수기때문에 promise.all 사용해준다.
      return await Promise.all(resultInsertMessageArray);
    };

    채팅리스트가져오기2().then((res) => {
      setMyChatList(res);
      setMyChatLastMessage(res);
      setIsLoading(true);

      //여기서 각 채팅방 리스너 달아주기
      // const getMyChatListRef = (chatRoomUid: string) => {
      //   let 각메시지리스너 = ref(
      //     realtimeDbService,
      //     `oneToOneChatRooms/${chatRoomUid}/chat`,
      //   );
      //   onChildAdded(각메시지리스너, (data) => {
      //     console.log('내 채팅방에서 메시지가 추가되었다.');
      //     let 변경 = data.val();
      //     //최근에 수신된 메시지
      //     console.log(변경.message);
      //     console.log(변경);

      //     //
      //     setMyChatList((prev) => {
      //       // let a = [...myChatList[0], (myChatList[0].lastMessage = 'zz')];
      //       // console.log('변경 후 배열');
      //       // console.log(a);

      //       let a = prev.map((i, index) => {
      //         console.log('돌고있는 맵 요소');
      //         console.log(i);
      //         if (
      //           i.chatRoomUid.chatRoomUid === res[index].chatRoomUid.chatRoomUid
      //         ) {
      //           i.lastMessage = 변경.message;
      //           i.notReadCount++;
      //         }
      //         return i;
      //       });
      //       console.log(a);
      //       return a;
      //     });
      //     // off()
      //   });

      //   return;
      // };
      // console.log('각채팅방결과');
      // console.log(res);

      // res.forEach((i) => {
      //   getMyChatListRef(i.chatRoomUid.chatRoomUid);
      //   console.log(i.chatRoomUid.chatRoomUid);
      // });
    });
  }, []);

  useEffect(() => {
    const 관찰할채팅방 = (chatUid: string) => {
      const refs = ref(
        realtimeDbService,
        `oneToOneChatRooms/${chatUid}/lastMessage`,
      );

      onValue(refs, (snapShot) => {
        console.log('관찰채팅방의 마지막 메세지');
        console.log(snapShot.val());
        let LM = snapShot.val();
        //이 메세지를  각채팅방의 lastMessagea에 바꿔줘야한다.

        setMyChatLastMessage((prev) => {
          let a = prev.map((i, index) => {
            if (i.chatRoomUid.chatRoomUid === chatUid) {
              i.lastMessage = LM;
            }
            return i;
          });

          return a;
        });
      });
    };

    const 관찰끄기 = async (chatUid: string) => {
      const refs = ref(
        realtimeDbService,
        `oneToOneChatRooms/${chatUid}/lastMessage`,
      );
      off(refs);
    };

    myChatList.forEach((i, index) => {
      console.log('내 채팅방');
      const 각채팅방uid = i.chatRoomUid.chatRoomUid;
      console.log(i.chatRoomUid.chatRoomUid);
      return 관찰할채팅방(각채팅방uid);
    });

    return () => {
      myChatList.forEach((i, index) => {
        console.log('아래 채팅방의 관찰이 종료');
        console.log(i.chatRoomUid.chatRoomUid);
        관찰끄기(i.chatRoomUid.chatRoomUid);
      });
    };
  }, [myChatList]);

  //각 채팅방 리스트의 false(안읽은메시지) 갯수를 가져오자
  //이건 onValue를 'oneToOneChatRooms/${채팅uid}/chat' 으로 리스너를 달아주자.
  //콜백함수는 chat이 감지될때마다, 스냅샷에는 각 chat의 데이터가 들어있다.
  //chat을 뒤집어서 최신순으로 정렬한 뒤에 readUsers.uid가 currentUesr.uid와 같은 값을 체크하면서
  //카운트에 ++해주고, 콜백함수를 중지시키고 카운트를 set
  useEffect(() => {}, []);

  return (
    <Wrap>
      <Head>
        <title>maumTalk</title>
      </Head>

      <>
        <>대화 목록</>
        <button
          onClick={async () => {
            let count = 0;
            // Create a query against the collection.
            //  내 uid랑 같은것으로 적용해서 쓰면 될듯
            // const q = query(citiesRef, where("state", "==", "CA"));

            // 채팅uid/chat/자식들모두/readUesrs/내uid 전부 가져오기
            const refs = ref(
              realtimeDbService,
              `oneToOneChatRooms/rn894bl5cl/chat`,
            );
            const gets = (await get(refs)).val();
            // console.log(gets);
            const values = Object.values(gets);
            console.log(values);

            values.forEach((i, index) => {
              if (i.readUsers) {
                console.log(i.readUsers[authService.currentUser?.uid]);
                i.readUsers[authService.currentUser?.uid] ? null : count++;
              }
            });

            console.log(count);
          }}
        >
          지금 채팅의 메시지읽음상태 확인
        </button>
        <button
          onClick={() => {
            setMyChatList((prev) => {
              // let a = [...myChatList[0], (myChatList[0].lastMessage = 'zz')];
              // console.log('변경 후 배열');
              // console.log(a);

              let a = prev.map((i, index) => {
                i.lastMessage = '변경';
                return i;
              });
              console.log(a);
              return a;
            });
          }}
        >
          채팅방가져오기 실행
        </button>

        {isLoading ? (
          <ChatListWrap>
            {myChatLastMessage.map((i, index) => {
              return (
                <li
                  key={index}
                  onClick={() => {
                    router.push(
                      `/chat/${i.chatRoomUid.displayName}?chatRoomUid=${i.chatRoomUid.chatRoomUid}&opponentUid=${i.chatRoomUid.opponentUid}`,
                    );
                  }}
                >
                  <span> {i.chatRoomUid.opponentName}</span>
                  <div>{i.lastMessage}</div>
                  {/* <div>{i.notReadCount !== 0 ? i.notReadCount : null}</div> */}
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

export default ChatList;
