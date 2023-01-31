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
  const [myChatList, setMyChatList] = useState<oneToOneChatList[]>([]);
  const [myChatLastMessage, setMyChatLastMessage] = useState<
    oneToOneChatList[]
  >([]);
  const [isLoading, setIsLoading] = useState(false);
  // const [groupChatAllList, setGroupChatAllList] = useState<groupChatList[]>([]);

  const [groupChatList, setGroupChatList] = useState<GroupChatList[]>([]);
  const [groupChatList2, setGroupChatList2] = useState<GroupChatList[]>([]);

  const [통합배열, set통합배열] = useState([]);

  const router = useRouter();
  const enterGroupChatRoom = (item: GroupChatList) => {
    router.push(
      `/groupchat/${item.chatRoomsTitle}?chatRoomUid=${item.chatRoomUid}`,
    );
  };

  // //유저의 그룹채팅 리스트를 가져와 state에 넣어주는 함수
  // useEffect(() => {
  //   //그룹채팅 리스트의 uid와 그룹채팅방의 uid가 같은 title을 가져와서 list에 넣어주자
  //   if (authService.currentUser) {
  //     const myGroupChatListPath = ref(
  //       realtimeDbService,
  //       `userList/${authService.currentUser.uid}/myGroupChatList`,
  //     );
  //     console.log('그룹채팅 온밸류 호출');
  //     onValue(myGroupChatListPath, async (snapshot) => {
  //       //그룹생성이 아예 처음이라면 해당 값이 null이다. 이에 대한 예외 처리를 했다.
  //       if (snapshot.val()) {
  //         let groupChatListSnapshot: GroupChatListSnapshot = snapshot.val();
  //         let groupChatUidList = groupChatListSnapshot.groupChatUid;
  //         getGroupChatRoomsUidToTitleFunc(groupChatUidList).then(
  //           (groupChatTitleList) => {
  //             // console.log(groupChatTitleList);
  //             // let mergeGroupChatList = groupChatUidList.map((item, index) => {
  //             //   return { chatUid: item, chatTitle: groupChatTitleList[index] };
  //             // });
  //             //   console.log('그룹채팅배열');
  //             //   console.log(mergeGroupChatList);
  //             // setGroupChatAllList(mergeGroupChatList);
  //           },
  //         );
  //       }
  //     });
  //   }
  // }, []);

  //이제 그룹 채팅 리스트에 각 마지막 메세지와, 안읽은 메세지 갯수를 만들어주자.
  //렌더링할 때 필요한것 그룹채팅uid, 채팅마지막메시지, 안읽음갯수, 그룹채팅title
  useEffect(() => {
    const myGroupChatListPath = ref(
      realtimeDbService,
      `userList/${authService.currentUser?.uid}/myGroupChatList`,
    );

    const 그룹채팅리스트가져오기 = async () => {
      let 채팅방있는지체크 = await (await get(myGroupChatListPath)).val();
      //아직 채팅방이 0개일 때 예외처리 이러면 res에 undifined가 할당된다.
      if (!채팅방있는지체크) return;

      //이 배열들에 uid를 순회하면서 가져올거다
      const 그룹채팅목록배열: string[][] = Object.values(
        await (await get(myGroupChatListPath)).val(),
      );
      // console.log('그룹채팅목록배열');
      // console.log(그룹채팅목록배열);

      const 결과 = 그룹채팅목록배열[0].map(async (i, index) => {
        // console.log(i);
        let 결과객체 = {
          chatRoomUid: i,
          chatRoomsTitle: '',
          lastMessage: '',
          notReadCount: 0,
          createdSecondsAt: 0,
          readUsers: {},
        };

        const groupChatRoomTitle = ref(
          realtimeDbService,
          `groupChatRooms/${i}/chatRoomsTitle`,
        );
        const 제목들 = (await get(groupChatRoomTitle)).val();
        // console.log('제목들');
        // console.log(제목들);
        if (제목들) {
          // 결과객체 = { ...결과객체, chatRoomsTitle: 제목들 };
          결과객체['chatRoomsTitle'] = 제목들;
        }

        const groupChatRoomPath = ref(
          realtimeDbService,
          `groupChatRooms/${i}/chat`,
        );

        const queryLastMessage = await get(
          query(groupChatRoomPath, limitToLast(1)),
        );
        if (queryLastMessage.val()) {
          const 마지막메시지: ChatDataNew[] = Object.values(
            await queryLastMessage.val(),
          );
          // console.log(마지막메시지);
          // console.log(마지막메시지[0].message);
          // 결과객체 = {
          //   ...결과객체,
          //   lastMessage: 마지막메시지[0].message,
          //   createdSecondsAt: 마지막메시지[0].createdSecondsAt,
          // };
          결과객체['lastMessage'] = 마지막메시지[0].message;
          결과객체['createdSecondsAt'] = 마지막메시지[0].createdSecondsAt;

          //안읽음 카운트 넣기 - 이건 메시지가 존재하는 경우에만 실행되는 if문 안에 있다.
          const 메시지들: ChatDataNew[] = Object.values(
            (await get(groupChatRoomPath)).val(),
          );
          let 메시지길이 = 메시지들.length;
          let 안읽은메시지인덱스 = 메시지들.findIndex((i) => {
            console.log('안읽은메시디지인덱스');
            console.log(i);

            return i?.readUsers[authService.currentUser?.uid] === false;
          });
          if (안읽은메시지인덱스 !== -1) {
            let 안읽은메시지갯수 = 메시지길이 - 안읽은메시지인덱스;
            결과객체['notReadCount'] = 안읽은메시지갯수;
          }

          //안읽음 카운트 넣기 끝
        } else {
        }
        // 마지막메시지들 = { lastMessage: queryLastMessage.val() };

        return 결과객체;
      });
      return await Promise.all(결과);
    };
    그룹채팅리스트가져오기().then((res: GroupChatList[]) => {
      console.log('그룹채팅 리스트 가져오기 결과');
      //끝! res를 렌더링해줄 state에 할당하고 렌더링 시켜주자.
      console.log(res);
      setGroupChatList(res);
      setGroupChatList2(res);
    });
  }, []);

  //useEffect 일대일채팅목록 초기 세팅
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
          // let resultMessage: ResultMessage = {
          //   ...i,
          //   lastMessage: '',
          //   notReadCount: 0,
          // };

          // console.log(resultMessage);
          // console.log('밸류스 한것');

          //이걸 쓰자!!!
          let result2 = Object.values(i)[0];
          result2['lastMessage'] = '';
          result2['notReadCount'] = 0;
          // result2['timeStamp'] = 0;
          // console.log(result2);

          const queryLastMessage = await get(
            query(oneToOneChatRoomPath, limitToLast(1)),
          );
          const lastMessageBefore = queryLastMessage.val();
          if (lastMessageBefore) {
            const lastMessageAfter: ChatDataNew[] =
              Object.values(lastMessageBefore);
            const lastMessage = lastMessageAfter[0].message;
            // resultMessage = { ...i, lastMessage };

            console.log('lastMessageAfter');
            console.log(lastMessageAfter);

            //시간 잘들어간다 굿.
            const createdSecondsAt = lastMessageAfter[0].createdSecondsAt;
            result2['createdSecondsAt'] = createdSecondsAt;
            result2['lastMessage'] = lastMessage;
            console.log('시간 넣은것');
            console.log(result2);
            //   {
            //     "chatRoomUid": "zq0mlhjvh",
            //     "opponentName": "박성현",
            //     "opponentUid": "Z05znci6ZvceevU8qeCjzOA3i5d2",
            //     "lastMessage": "",
            //     "notReadCount": 0,
            //     "timeStamp": 1675135908
            // }

            //안읽은 갯수 넣기 시작
            let 메시지들: ChatDataNew[] = Object.values(
              (await get(oneToOneChatRoomPath)).val(),
            );
            let 메시지길이 = 메시지들.length;
            let 안읽은메시지인덱스 = 메시지들.findIndex((i) => {
              return i?.readUsers[authService.currentUser?.uid] === false;
            });
            if (안읽은메시지인덱스 === -1) {
              // resultMessage['notReadCount'] = 0;
            } else {
              let 안읽은메시지갯수 = 메시지길이 - 안읽은메시지인덱스;
              // resultMessage['notReadCount'] = 안읽은메시지갯수;
              result2['notReadCount'] = 안읽은메시지갯수;
            }
            //안읽은 갯수 넣기 끝
          }
          return result2;
        },
      );
      //함수가 반환할 배열 map이 비동기함수기때문에 promise.all 사용해준다.
      return await Promise.all(resultInsertMessageArray);
    };

    채팅리스트가져오기2().then((res) => {
      //결과가 언디파인드일때의 분기처리
      if (res) {
        console.log('일대일 결과');
        console.log(res);
        // console.log(res.flat());
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
          const lastMessageBefore = queryLastMessage.val();
          // console.log('ChatdataNew');
          // console.log(lastMessageBefore);
          // console.log(lastMessageBefore.createdAt);
          //메시지가 있을때 작동
          if (lastMessageBefore) {
            const lastMessageAfter: ChatDataNew[] =
              Object.values(lastMessageBefore);

            console.log('메시지 벨류');
            console.log(lastMessageAfter);

            const lastMessage = lastMessageAfter[0].message;
            const createdSecondsAt = lastMessageAfter[0].createdSecondsAt;
            const isLastMessageLead =
              lastMessageAfter[0].readUsers[authService.currentUser?.uid];

            //마지막 메시지가 false일 경우에만 notReadCount++ 해주기

            if (!isLastMessageLead) {
              setMyChatLastMessage((prev) => {
                //같은 채팅방uid를 가진 스테이트에 notReadCount 추가하기
                let updateChatList = prev.map((i, index) => {
                  if (i.chatRoomUid === chatUid) {
                    i.lastMessage = lastMessage;
                    i.createdSecondsAt = createdSecondsAt;
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
        채팅갯수옵저버(i.chatRoomUid);
      });
    }

    return () => {
      myChatList.forEach((i) => {
        채팅갯수옵저버끄기(i.chatRoomUid);
      });
    };
  }, [myChatList]);

  //그룹챗 마지막메세지 옵저버 설정
  useEffect(() => {
    const 그룹채팅갯수옵저버 = async (chatUid: string) => {
      console.log(`${chatUid}방 옵저버 실행`);
      const refs = ref(realtimeDbService, `groupChatRooms/${chatUid}/chat`);
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

            // console.log('메시지 벨류');
            // console.log(lastMessageAfter);

            const lastMessage = lastMessageAfter[0].message;
            const createdSecondsAt = lastMessageAfter[0].createdSecondsAt;
            const isLastMessageLead =
              lastMessageAfter[0].readUsers[authService.currentUser?.uid];

            //마지막 메시지가 false일 경우에만 notReadCount++ 해주기

            if (!isLastMessageLead) {
              setGroupChatList((prev) => {
                //같은 채팅방uid를 가진 스테이트에 notReadCount 추가하기
                let updateChatList = prev.map((i, index) => {
                  if (i.chatRoomUid === chatUid) {
                    i.lastMessage = lastMessage;
                    i.createdSecondsAt = createdSecondsAt;
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

    const 그룹채팅갯수옵저버끄기 = (chatUid: string) => {
      const refs = ref(realtimeDbService, `groupChatRooms/${chatUid}/chat`);
      console.log(`${chatUid}의 안읽은메시지 갯수 옵저버가 종료`);
      off(refs);
    };

    if (groupChatList) {
      groupChatList.forEach((i) => {
        그룹채팅갯수옵저버(i.chatRoomUid);
      });
    }

    return () => {
      groupChatList.forEach((i) => {
        그룹채팅갯수옵저버끄기(i.chatRoomUid);
      });
    };
  }, [groupChatList2]);

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
                          `/chat/${i.opponentName}?chatRoomUid=${i.chatRoomUid}&opponentUid=${i.opponentUid}`,
                        );
                      }}
                    >
                      <span> {i.opponentName}</span>
                      <div>{i?.lastMessage}</div>
                      <div>안읽은갯수:{i?.notReadCount}</div>
                      <div>마지막시간:{i?.createdSecondsAt}</div>
                    </li>
                  );
                })}
          </ChatListWrap>
        ) : (
          <LoadingSpinner />
        )}
        {/* {groupChatAllList.map((item, index) => {
          return item.chatTitle !== null ? (
            <li
              key={index}
              onDoubleClick={() => {
                // setCurrentGroupChat(item);
                              ]
                                              enterGroupChatRoom(item);
              }}
            >
              {item.chatTitle}
            </li>
          ) : null;
        })} */}

        {groupChatList.map((item, index) => {
          return item.chatRoomsTitle !== '' ? (
            <li
              key={index}
              onDoubleClick={() => {
                // setCurrentGroupChat(item);
                enterGroupChatRoom(item);
              }}
            >
              {item.chatRoomsTitle}
              안읽은갯수 : {item.notReadCount}
              <div>마지막시간:{item.createdSecondsAt}</div>
            </li>
          ) : null;
        })}
      </>
    </Wrap>
  );
}

export default ChatList;
