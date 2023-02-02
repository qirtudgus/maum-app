import { get, ref } from 'firebase/database';
import { getChatRoomLastMessage, realtimeDbService } from '../firebaseConfig';

/**
 * 대화를 이루는 각 하나의 대화 요소에 대한 타입입니다.
 * @param createdAt 대화 생성 시간을 convert한 값 ex) 23. 02. 02. 오전 09:41
 * @param createdSecondsAt 대화 생성 시간을 초단위로 환산한 값 ex) 1675298518
 * @param displayName 대화를 작성한 사용자 닉네임
 * @param message 대화 내용
 * @param readUsers [사용자의 uid]:booelan의 객체배열 읽음 유무를 판단한다.
 * @param uid 대화를 작성한 사용자 uid
 */
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

interface pureMessage {
  chatRoomUid: {
    chatRoomUid: string;
    opponentName: string;
    opponentUid: string;
  };
  lastMessage?: string;
  notReadCount?: number;
}

export interface ResultOneToOneRoom {
  chatRoomUid: string;
  displayName?: string;
  opponentName?: string;
  opponentUid: string;
  lastMessage: string;
  notReadCount: number;
  createdSecondsAt: number;
}

export interface ResultGroupRoom {
  chatRoomUid: string;
  displayName: string;
  lastMessage: string;
  notReadCount: number;
  createdSecondsAt: number;
}

/**
 * 특정 함수에서 대화방의 타입을 구분하기 위함
 */
export type ChatRoomType = 'group' | 'oneToOne';

/**
 * oneToOneChatRooms에 렌더링할 배열을
 * 만들어 반환해주는 비동기 함수입니다.
 * 채팅방이 존재하지않으면 null을 반환합니다.
 * @param uid 대화목록을 만들 사용자의 uid
 * @returns ResultMessage[] | null
 */
export const createOneToOneChatRooms = async (uid: string) => {
  //   const listObj = await getMyGroupChatRoomsRef(uid);
  const listObj = await getMyChatRoomsRef(uid, 'oneToOne');
  console.log('listObj');
  console.log(listObj);
  if (!listObj) return null; //채팅방이 존재할 때 함수 진행
  // console.log('listValues');
  // console.log(listValues);
  const getMyChatListArray: pureMessage[] = Object.values(listObj);
  console.log('getMyChatListArray');
  console.log(getMyChatListArray);
  const resultGroupChatRooms: Promise<ResultOneToOneRoom>[] =
    getMyChatListArray.map(async (i) => {
      const lastMessage = await getChatRoomLastMessage(
        i.chatRoomUid.chatRoomUid,
        'oneToOne',
      );
      const chatList = await getMyGroupChatRoomChatList(
        i.chatRoomUid.chatRoomUid,
      );
      const notReadCount = getNotReadMessageCount(chatList, uid);

      console.log('lastMessage');
      console.log(lastMessage);

      let result2 = Object.values(i)[0];
      result2['displayName'] = i.chatRoomUid.opponentName;
      result2['lastMessage'] = lastMessage.message;
      result2['notReadCount'] = notReadCount;
      result2['createdSecondsAt'] = lastMessage.createdSecondsAt;
      delete result2['opponentName'];

      console.log('result2의 객체값 ');
      console.log(result2);
      return result2;
    });
  return await Promise.all(resultGroupChatRooms);
};

//특정 그룹채팅uid의 제목을 리턴
const getMyGroupChatRoomTitle = async (chatRoomUid: string) => {
  const titleList = (
    await get(
      ref(realtimeDbService, `groupChatRooms/${chatRoomUid}/chatRoomsTitle`),
    )
  ).val();
  return titleList;
};

//특정 유저의 그룹채팅 배열을 반환
export const groupChatRoomUidArr = async (uid: string) => {
  const 그룹채팅배열 = await getMyChatRoomsRef(uid, 'group');
  console.log(그룹채팅배열);

  if (그룹채팅배열) return Object.values(그룹채팅배열) as string[];
  else return null;
};

export const getMyChatRoomsRef = async (
  uid: string,
  chatRoomType: ChatRoomType,
) => {
  if (chatRoomType === 'group') {
    return await (
      await get(ref(realtimeDbService, `userList/${uid}/group_chat_rooms`))
    ).val();
  } else {
    return await (
      await get(ref(realtimeDbService, `oneToOneChatRooms/${uid}`))
    ).val();
  }
};

/**
 * groupChatRooms에 렌더링할 배열을
 * 만들어 반환해주는 비동기 함수입니다.
 * 채팅방이 존재하지않으면 null을 반환합니다.
 * @param uid 대화목록을 만들 사용자의 uid
 * @returns ResultMessage[] | null
 */
export const createGroupChatRooms = async (
  uid: string,
): Promise<ResultGroupRoom[] | null> => {
  //   const listObj = await getMyGroupChatRoomsRef(uid);
  const listObj = await getMyChatRoomsRef(uid, 'group');
  console.log('listObj');
  console.log(listObj);
  if (!listObj) return null; //채팅방이 존재할 때 함수 진행
  const listValues: string[] = Object.values(listObj); // 그룹채팅 uid가 들어있다
  console.log('listValues');
  console.log(listValues);

  const resultGroupChatRooms = listValues.map(async (i) => {
    const title = await getMyGroupChatRoomTitle(i);
    const lastMessage = await getChatRoomLastMessage(i, 'group');
    const chatList = await getMyGroupChatRoomChatList(i);
    const notReadCount = await getNotReadMessageCount(chatList, uid);
    let 결과객체: ResultGroupRoom = {
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

//유저의 채팅타입중 하나의 채팅db 데이터를 읽어오는것
// export const getMyChatRoomsRef = async (
//   uid: string,
//   chatRoomType: ChatRoomType,
// ) => {
//   if (chatRoomType === 'group') {
//     return await (
//       await get(ref(realtimeDbService, `userList/${uid}/group_chat_rooms`))
//     ).val();
//   } else {
//     return await (
//       await get(ref(realtimeDbService, `oneToOneChatRooms/${uid}`))
//     ).val();
//   }
// };

//유저의 채팅타입중 하나의 채팅db 데이터를 읽어오는것
// export const getMyChatRoomsArr = async (
//   uid: string,
//   chatRoomType: ChatRoomType,
// ) => {
//   if (chatRoomType === 'group') {
//     return await (
//       await get(ref(realtimeDbService, `userList/${uid}/group_chat_rooms`))
//     ).val();
//   } else {
//     return await (
//       await get(ref(realtimeDbService, `userList/${uid}/onetoone_chat_rooms`))
//     ).val();
//   }
// };

/**
 * 그룹채팅의 uid를 받아와 해당 채팅방의 대화내용을
 * 배열로 가공하여 반환해주는 함수입니다.
 * @param chatRoomUid 그룹 채팅방 고유 uid입니다.
 * @returns
 */
export const getMyGroupChatRoomChatList = async (
  chatRoomUid: string,
): Promise<ChatDataNew[] | null> => {
  const chatList = (
    await get(ref(realtimeDbService, `groupChatRooms/${chatRoomUid}/chat`))
  ).val();

  if (!chatList) return null;
  return chatList ? (Object.values(chatList) as ChatDataNew[]) : null;
};

/**
 *  readUsers가 들어있는 대화목록을 순회하며
 *  매개변수로 받은 uid를 이용해 읽지않은 메시지 갯수가
 *  총 몇개인지 반환해주는 함수입니다.
 * @param chatList readUsers가 들어야하는 대화목록입니다.
 * @param uid 사용자의 uid입니다.
 * @returns number: 0 또는 n(안읽은 메시지 갯수)를 반환합니다.
 */
export const getNotReadMessageCount = (
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

// export const groupChatRoomUidArr = async () => {
//   const 그룹채팅배열 = await getMyChatRoomsRef(uid, 'group');
//   console.log(그룹채팅배열);
//   return Object.values(그룹채팅배열) as string[];
// };

//일대일채팅과 그룹채팅을 합친 배열 리턴해주기
//제작중...
// export const 일대일그룹 = async (uid: string) => {
//   const 일대일대화리스트 = await (
//     await get(ref(realtimeDbService, `userList/${uid}/myOneToOneChatList`))
//   ).val();

//   const 그룹대화리스트 = await (
//     await get(
//       ref(realtimeDbService, `userList/${uid}/group_chat_rooms/groupChatUid`),
//     )
//   ).val();

//   console.log('일대일대화리스트');
//   console.log(일대일대화리스트);
//   console.log('그룹대화리스트');
//   console.log(그룹대화리스트);
//   let 일대일대화uid배열 = [];
//   let 그룹대화uid배열 = [];
//   if (일대일대화리스트) {
//     일대일대화uid배열 = Object.keys(일대일대화리스트);
//   }
//   if (그룹대화리스트) {
//     그룹대화uid배열 = 그룹대화리스트;
//   }
//   console.log('일대일대화uid배열');
//   console.log(일대일대화uid배열);
//   console.log('그룹대화uid배열');
//   console.log(그룹대화uid배열);

//   let 일대일채팅 = 일대일대화uid배열.map(async (i) => {
//     const lastMessage = await getChatRoomLastMessage(i, 'oneToOne');
//     const chatList = await getMyGroupChatRoomChatList(i);
//     const notReadCount = await getNotReadMessageCount(chatList, uid);
//     let result2 = Object.values(i);
//     console.log('lastMessage');
//     console.log(lastMessage);
//     console.log('result2');
//     console.log(result2);
//     result2['lastMessage'] = lastMessage.message;
//     result2['notReadCount'] = notReadCount;
//     result2['createdSecondsAt'] = lastMessage.createdSecondsAt;
//     return result2;
//   });
//   console.log('일대일채팅');
//   console.log(일대일채팅);
// };
