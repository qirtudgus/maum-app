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

//특정 유저의 채팅방 리스트를 반환해주는 함수.
// const getUserChatRoomList = async (
//   userUid: string,
//   chatRoomType: 'oneToOne' | 'group',
// ) => {
//   const chatRef =
//     chatRoomType === 'oneToOne'
//       ? ref(realtimeDbService, `oneToOneChatRooms/${userUid}`)
//       : ref(realtimeDbService, `userList/${userUid}/myGroupChatList`);

//   // group일 경우 결과값
//   interface GroupTypeResult {
//     groupChatUid: string[];
//   }

//   interface OneToOneTypeResult {
//     [key: string]: {
//       chatRoomUid: {
//         chatRoomUid: string;
//         opponentName: string;
//         opponentUid: string;
//       };
//     };
//   }

//   let result: OneToOneTypeResult | GroupTypeResult | null = null;

//   if (chatRoomType === 'oneToOne') {
//     const 채팅방있는지체크: OneToOneTypeResult | null = await (
//       await get(chatRef)
//     ).val();
//     result = 채팅방있는지체크;
//   } else {
//     const 채팅방있는지체크: GroupTypeResult | null = await (
//       await get(chatRef)
//     ).val();
//     result = 채팅방있는지체크;
//   }

//   return result;
// };

type ChatRoomType = 'group' | 'oneToOne';

function ChatList() {
  const [isLoading, setIsLoading] = useState(false);
  const [myChatList, setMyChatList] = useState<oneToOneChatList[]>([]);
  const [groupChatList, setGroupChatList] = useState<GroupChatList[]>([]);
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
  const getMyGroupChatRoomChatList = async (chatRoomUid: string) => {
    const chatList = (
      await get(ref(realtimeDbService, `groupChatRooms/${chatRoomUid}/chat`))
    ).val();

    if (!chatList) return null;
    return chatList ? Object.values(chatList) : null;
  };

  //chatList와 uid를 넘기면 안읽은 메시지 개수를 반환
  const getNotReadMessageCount = async (chatList: any[], uid: string) => {
    if (!chatList) return 0;
    let chatListLength = chatList.length;
    console.log(chatList);
    let 안읽은메시지인덱스 = chatList.findIndex((i) => {
      console.log('i');
      console.log(i);
      return i!.readUsers[uid] === false;
    });
    let 안읽은메시지갯수 = chatListLength - 안읽은메시지인덱스;
    return 안읽은메시지인덱스 === -1 ? 0 : 안읽은메시지갯수;
  };

  //그룹채팅리스트를 적절히 렌더링할 배열로 변환
  const createGroupChatRooms = async (uid: string) => {
    //   const listObj = await getMyGroupChatRoomsRef(uid);
    const listObj = await getMyChatRoomsRef(uid, 'group');
    // console.log('listObj');
    // console.log(listObj);
    if (!listObj) return; //채팅방이 존재할 때 함수 진행
    const listValues: string[] = Object.values(listObj); // 그룹채팅 uid가 들어있다
    // console.log('listValues');
    // console.log(listValues);
    const resultGroupChatRooms = listValues.map(async (i) => {
      const title = await getMyGroupChatRoomsTitle(i);
      const lastMessage = await getChatRoomLastMessage(i, 'group');
      const chatList = await getMyGroupChatRoomChatList(i);
      const notReadCount = await getNotReadMessageCount(
        chatList,

        uid,
      );
      let 결과객체 = {
        chatRoomUid: i,
        displayName: title,
        lastMessage: lastMessage.message,
        notReadCount: notReadCount,
        createdSecondsAt: lastMessage.createdSecondsAt,
      };
      return 결과객체;
    });
    return await Promise.all(resultGroupChatRooms);
  };

  useEffect(() => {
    createGroupChatRooms(uid).then((res) => {
      console.log('채팅리스트');
      console.log(res);
      setSortChatList(res);
      setIsLoading(true);
    });

    //현재 유저의 새로운 그룹채팅이 생김을 감지하는 옵저버
    onValue(
      ref(realtimeDbService, `userList/${uid}/myGroupChatList/groupChatUid`),
      (snap) => {
        console.log('새로운 그룹 채팅 수신');
        console.log(snap.val()); // ['pqscrrx072', '5z39xf31v7']
        createGroupChatRooms(uid).then((res) => {
          console.log('채팅리스트');
          console.log(res);
          setSortChatList(res);
        });
      },
    );

    //새로 채팅이 생기면 새페이지에 들어오듯 모든 과정을 반복하기?

    return () => {
      off(
        ref(realtimeDbService, `userList/${uid}/myGroupChatList/groupChatUid`),
      );
      off(ref(realtimeDbService, `oneToOneChatList/${uid}`));
    };
  }, []);

  //   //이제 그룹 채팅 리스트에 각 마지막 메세지와, 안읽은 메세지 갯수를 만들어주자.
  //   //렌더링할 때 필요한것 그룹채팅uid, 채팅마지막메시지, 안읽음갯수, 그룹채팅title
  //   useEffect(() => {
  //     const myGroupChatListPath = ref(
  //       realtimeDbService,
  //       `userList/${authService.currentUser?.uid}/myGroupChatList`,
  //     );
  //     const 그룹채팅리스트가져오기 = async () => {
  //       let hasUserGroupChatRooms = await (await get(myGroupChatListPath)).val();
  //       //아직 채팅방이 0개일 때 예외처리 이러면 res에 null이 할당된다.
  //       if (!hasUserGroupChatRooms) return;
  //       //이 배열들에 uid를 순회하면서 가져올거다
  //       const 그룹채팅목록배열: string[][] = Object.values(hasUserGroupChatRooms);
  //       const 결과 = 그룹채팅목록배열[0].map(async (i, index) => {
  //         let 결과객체 = {
  //           chatRoomUid: i,
  //           chatRoomsTitle: '',
  //           lastMessage: '',
  //           notReadCount: 0,
  //           createdSecondsAt: 0,
  //         };

  //         const groupChatRoomTitle = ref(
  //           realtimeDbService,
  //           `groupChatRooms/${i}/chatRoomsTitle`,
  //         );
  //         const 제목들 = (await get(groupChatRoomTitle)).val();
  //         if (제목들) {
  //           결과객체['chatRoomsTitle'] = 제목들;
  //         }

  //         const groupChatRoomPath = ref(
  //           realtimeDbService,
  //           `groupChatRooms/${i}/chat`,
  //         );
  //         const newLastMessage = await getChatRoomLastMessage(i, 'group');
  //         if (newLastMessage) {
  //           결과객체['lastMessage'] = newLastMessage.message;
  //           결과객체['createdSecondsAt'] = newLastMessage.createdSecondsAt;

  //           //안읽음 카운트 넣기 - 이건 메시지가 존재하는 경우에만 실행되는 if문 안에 있다.
  //           const 메시지들: ChatDataNew[] = Object.values(
  //             (await get(groupChatRoomPath)).val(),
  //           );
  //           let 메시지길이 = 메시지들.length;
  //           let 안읽은메시지인덱스 = 메시지들.findIndex((i) => {
  //             return i?.readUsers[authService.currentUser?.uid] === false;
  //           });
  //           if (안읽은메시지인덱스 !== -1) {
  //             let 안읽은메시지갯수 = 메시지길이 - 안읽은메시지인덱스;
  //             결과객체['notReadCount'] = 안읽은메시지갯수;
  //           }
  //           //안읽음 카운트 넣기 끝
  //         }
  //         return 결과객체;
  //       });
  //       return await Promise.all(결과);
  //     };
  //     그룹채팅리스트가져오기().then((res: GroupChatList[]) => {
  //       console.log('그룹채팅 리스트 가져오기 결과');
  //       //끝! res를 렌더링해줄 state에 할당하고 렌더링 시켜주자.
  //       console.log(res);
  //       //res 결과값 undifined 예외처리
  //       if (res) {
  //         setGroupChatList(res);
  //         // setGroupChatList2(res);
  //         setCombineChatList((prev) => [...prev, ...res]);
  //       }
  //     });
  //   }, []);

  //   //useEffect 일대일채팅목록 초기 세팅
  //   useEffect(() => {
  //     const getMyChatListRef = ref(
  //       realtimeDbService,
  //       `oneToOneChatRooms/${authService.currentUser?.uid}`,
  //     );
  //     const 채팅리스트가져오기2 = async () => {
  //       let hasUserGroupChatRooms = await (await get(getMyChatListRef)).val();
  //       //아직 채팅방이 0개일 때 예외처리 이러면 res에 undifined가 할당된다.
  //       if (!hasUserGroupChatRooms) return;
  //       const getMyChatListArray: ResultMessage[] = Object.values(
  //         hasUserGroupChatRooms,
  //       );
  //       //맵에 async를 넣는순간 프로미스를 반환
  //       //각 일대일채팅의 메시지를 가공하여 마지막메세지와 안읽은 갯수를 추가해준다.
  //       let resultInsertMessageArray = getMyChatListArray.map(
  //         async (i, index) => {
  //           const oneToOneChatRoomPath = ref(
  //             realtimeDbService,
  //             `oneToOneChatRooms/${i.chatRoomUid.chatRoomUid}/chat`,
  //           );
  //           //이걸 쓰자!!!
  //           let result2 = Object.values(i)[0];
  //           result2['lastMessage'] = '';
  //           result2['notReadCount'] = 0;
  //           const newLastMessage = await getChatRoomLastMessage(
  //             i.chatRoomUid.chatRoomUid,
  //             'oneToOne',
  //           );
  //           if (newLastMessage) {
  //             console.log('newLastMessage');
  //             console.log(newLastMessage);

  //             //시간 잘들어간다 굿.
  //             const createdSecondsAt = newLastMessage.createdSecondsAt;
  //             result2['createdSecondsAt'] = createdSecondsAt;
  //             result2['lastMessage'] = newLastMessage.message;
  //             //안읽은 갯수 넣기 시작
  //             let 메시지들: ChatDataNew[] = Object.values(
  //               (await get(oneToOneChatRoomPath)).val(),
  //             );

  //             let 메시지길이 = 메시지들.length;
  //             let 안읽은메시지인덱스 = 메시지들.findIndex((i) => {
  //               return i.readUsers[authService.currentUser?.uid] === false;
  //             });
  //             if (안읽은메시지인덱스 !== -1) {
  //               let 안읽은메시지갯수 = 메시지길이 - 안읽은메시지인덱스;
  //               result2['notReadCount'] = 안읽은메시지갯수;
  //             }
  //             //안읽은 갯수 넣기 끝
  //           }
  //           return result2;
  //         },
  //       );
  //       //함수가 반환할 배열 map이 비동기함수기때문에 promise.all 사용해준다.
  //       return await Promise.all(resultInsertMessageArray);
  //     };

  //     채팅리스트가져오기2().then((res) => {
  //       //결과가 언디파인드일때의 분기처리
  //       if (res) {
  //         // console.log('일대일 결과');
  //         // console.log(res);
  //         setMyChatList(res);
  //         setCombineChatList((prev) => [...prev.flat(), ...res]);
  //         setIsLoading(true);
  //       } else {
  //         setIsLoading(true);
  //       }
  //     });
  //   }, []);

  //   //각 채팅이 변경될때마다 카운트 추가해는 옵저버, 동시에 마지막 쿼리를 가져와서 lastMessage에 할당해주면 굿
  //   useEffect(() => {
  //     const 채팅갯수옵저버 = async (chatUid: string) => {
  //       console.log(`${chatUid}방 옵저버 실행`);
  //       const refs = ref(realtimeDbService, `oneToOneChatRooms/${chatUid}/chat`);
  //       onValue(refs, async (snapshot) => {
  //         //라스트인덱스오브를 통해 뒤에서부터 true를 찾은 뒤 그 인덱스 = 마지막으로 읽은 메시지 index
  //         //스냅샷의 사이즈를 가져와서, 스냅샷 - index = 안읽은 메시지 갯수
  //         const newLastMessage = await getChatRoomLastMessage(
  //           chatUid,
  //           'oneToOne',
  //         );
  //         //마지막 메시지넣기 시작
  //         if (newLastMessage) {
  //           const isLastMessageLead =
  //             newLastMessage.readUsers[authService.currentUser?.uid];
  //           //마지막 메시지가 false일 경우에만 notReadCount++ 해주기
  //           if (!isLastMessageLead) {
  //             //안읽음 카운트 넣기 - 이건 메시지가 존재하는 경우에만 실행되는 if문 안에 있다.
  //             const 메시지들: ChatDataNew[] = Object.values(
  //               (await get(refs)).val(),
  //             );
  //             let 안읽은메시지갯수 = 0;
  //             let 메시지길이 = 메시지들.length;
  //             let 안읽은메시지인덱스 = 메시지들.findIndex((i) => {
  //               console.log('안읽은메시디지인덱스');
  //               console.log(i);
  //               return i?.readUsers[authService.currentUser?.uid] === false;
  //             });
  //             if (안읽은메시지인덱스 !== -1) {
  //               안읽은메시지갯수 = 메시지길이 - 안읽은메시지인덱스;
  //             }
  //             setCombineChatList((prev) => {
  //               //같은 채팅방uid를 가진 스테이트에 notReadCount 추가하기
  //               let updateChatList = prev.map((i, index) => {
  //                 if (i.chatRoomUid === chatUid) {
  //                   i.lastMessage = newLastMessage.message;
  //                   i.createdSecondsAt = newLastMessage.createdSecondsAt;
  //                   i.notReadCount = 안읽은메시지갯수;
  //                   // i.notReadCount++;
  //                   //   if(i[0].readUsers[authService.currentUser?.uid]){}
  //                 }
  //                 return i;
  //               });
  //               return updateChatList;
  //             });
  //           }
  //         }
  //       });
  //     };
  //     const 채팅갯수옵저버끄기 = (chatUid: string) => {
  //       const refs = ref(realtimeDbService, `oneToOneChatRooms/${chatUid}/chat`);
  //       console.log(`${chatUid}의 안읽은메시지 갯수 옵저버가 종료`);
  //       off(refs);
  //     };
  //     if (myChatList) {
  //       myChatList.forEach((i, index) => {
  //         채팅갯수옵저버(i.chatRoomUid);
  //       });
  //     }

  //     return () => {
  //       myChatList.forEach((i) => {
  //         채팅갯수옵저버끄기(i.chatRoomUid);
  //       });
  //     };
  //   }, [myChatList]);

  //그룹챗 마지막메세지 옵저버 설정
  //   useEffect(() => {
  //     const 그룹채팅갯수옵저버 = async (chatUid: string) => {
  //       console.log(`${chatUid}방 옵저버 실행`);
  //       const refs = ref(realtimeDbService, `groupChatRooms/${chatUid}/chat`);
  //       onValue(refs, async (snapshot) => {
  //         //라스트인덱스오브를 통해 뒤에서부터 true를 찾은 뒤 그 인덱스 = 마지막으로 읽은 메시지 index
  //         //스냅샷의 사이즈를 가져와서, 스냅샷 - index = 안읽은 메시지 갯수
  //         console.log(typeof snapshot.val());
  //         if (typeof snapshot.val() === 'object') {
  //           //마지막 메시지넣기 시작
  //           const newLastMessage = await getChatRoomLastMessage(chatUid, 'group');
  //           if (newLastMessage) {
  //             const isLastMessageLead =
  //               newLastMessage.readUsers[authService.currentUser?.uid];
  //             //마지막 메시지가 false일 경우에만 notReadCount++ 해주기
  //             if (!isLastMessageLead) {
  //               let 안읽은메시지갯수 = 0;
  //               //안읽음 카운트 넣기 - 이건 메시지가 존재하는 경우에만 실행되는 if문 안에 있다.
  //               const 메시지들: ChatDataNew[] = Object.values(
  //                 (await get(refs)).val(),
  //               );
  //               let 메시지길이 = 메시지들.length;
  //               let 안읽은메시지인덱스 = 메시지들.findIndex((i) => {
  //                 // console.log('안읽은메시디지인덱스');
  //                 // console.log(i);
  //                 return i?.readUsers[authService.currentUser?.uid] === false;
  //               });
  //               if (안읽은메시지인덱스 !== -1) {
  //                 안읽은메시지갯수 = 메시지길이 - 안읽은메시지인덱스;
  //               }
  //               //안읽음 카운트 넣기 끝

  //               setCombineChatList((prev) => {
  //                 //같은 채팅방uid를 가진 스테이트에 notReadCount 추가하기
  //                 let updateChatList = prev.map((i, index) => {
  //                   if (i.chatRoomUid === chatUid) {
  //                     i.lastMessage = newLastMessage.message;
  //                     i.createdSecondsAt = newLastMessage.createdSecondsAt;
  //                     i.notReadCount = 안읽은메시지갯수;
  //                     // i.notReadCount++;
  //                   }
  //                   return i;
  //                 });
  //                 return updateChatList;
  //               });
  //             }
  //           }
  //         }
  //       });
  //     };

  //     const 그룹채팅갯수옵저버끄기 = (chatUid: string) => {
  //       const refs = ref(realtimeDbService, `groupChatRooms/${chatUid}/chat`);
  //       console.log(`${chatUid}의 안읽은메시지 갯수 옵저버가 종료`);
  //       off(refs);
  //     };

  //     if (groupChatList) {
  //       groupChatList.forEach((i) => {
  //         그룹채팅갯수옵저버(i.chatRoomUid);
  //       });
  //     }

  //     return () => {
  //       groupChatList.forEach((i) => {
  //         그룹채팅갯수옵저버끄기(i.chatRoomUid);
  //       });
  //     };
  //   }, [groupChatList]);

  //   //통합배열을 정렬시켜주어 정렬된 채팅방을 렌더링시켜준다.
  //   useEffect(() => {
  //     let sortChatList2 = combineChatList
  //       .filter((i) => {
  //         return i.createdSecondsAt !== undefined && i;
  //       })
  //       .sort((a, b) => b.createdSecondsAt - a.createdSecondsAt);
  //     setSortChatList([...sortChatList2]);
  //   }, [myChatList, groupChatList, combineChatList]);

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
        sortChatList.map((item) => {
          return (
            <ChatRoomList
              key={item.chatRoomUid}
              onClick={() => {
                router.push(
                  `/chatRooms/group?chatRoomsTitle=${item.chatRoomsTitle}&chatRoomUid=${item.chatRoomUid}`,
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
        })
      ) : (
        <LoadingSpinner />
      )}

      {/* {isLoading ? (
        <ChatListWrap>
          {sortChatList.length === 0 ? (
            <ZeroChatRoom>대화가 존재하지않아요!</ZeroChatRoom>
          ) : (
            sortChatList.map((item, index) => {
              return item && item.chatRoomsTitle
                ? item.lastMessage !== '' && (
                    <ChatRoomList
                      key={item.chatRoomUid}
                      onClick={() => {
                        router.push(
                          `/chatRooms/group?chatRoomsTitle=${item.chatRoomsTitle}&chatRoomUid=${item.chatRoomUid}`,
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
                  )
                : item.lastMessage !== '' && (
                    <ChatRoomList
                      key={item.chatRoomUid}
                      onClick={() => {
                        router.push(
                          `/chatRooms/oneToOne?displayName=${item?.opponentName}&chatRoomUid=${item?.chatRoomUid}&opponentUid=${item?.opponentUid}`,
                        );
                      }}
                    >
                      <ChatIcon>
                        <PersonSvg />
                      </ChatIcon>
                      <ChatRoomInfo>
                        <ChatRoomTitleAndTime>
                          <span className='title'> {item?.opponentName}</span>
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
            })
          )}
        </ChatListWrap>
      ) : (
        <LoadingSpinner />
      )} */}
      {showAddGroupChat && (
        <CreateGroupChatModal setShowAddGroupChat={setShowAddGroupChat} />
      )}
    </Wrap>
  );
}

export default ChatList;
