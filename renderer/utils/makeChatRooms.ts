import { get, ref } from 'firebase/database';
import { getChatRoomLastMessage, realtimeDbService } from '../firebaseConfig';

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

export type ChatRoomType = 'group' | 'oneToOne';

//일대일채팅리스트를 적절히 렌더링할 배열로 변환
//[
//     {
//         "chatRoomUid": "c01k3i48pv",
//         "opponentName": "qwer2",
//         "opponentUid": "C7UWImonLGcfDDj5f6Tq0LHdAdv2",
//         "lastMessage": "zzz",
//         "notReadCount": 0,
//         "createdSecondsAt": 1675282466
//     }
// ]
export const createOneToOneChatRooms = async (uid: string) => {
  //   const listObj = await getMyGroupChatRoomsRef(uid);
  const listObj = await getMyChatRoomsRef(uid, 'oneToOne');
  // console.log('listObj');
  // console.log(listObj);
  if (!listObj) return; //채팅방이 존재할 때 함수 진행
  // console.log('listValues');
  // console.log(listValues);
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
    return result2;
  });
  return await Promise.all(resultGroupChatRooms);
};

//유저의 채팅타입중 하나의 채팅db 데이터를 읽어오는것
export const getMyChatRoomsRef = async (
  uid: string,
  chatRoomType: ChatRoomType,
) => {
  if (chatRoomType === 'group') {
    return await (
      await get(
        ref(realtimeDbService, `userList/${uid}/myGroupChatList/groupChatUid`),
      )
    ).val();
  } else {
    return await (
      await get(ref(realtimeDbService, `oneToOneChatRooms/${uid}`))
    ).val();
  }
};

//유저의 채팅타입중 하나의 채팅db 데이터를 읽어오는것
export const getMyChatRoomsRef2 = async (
  uid: string,
  chatRoomType: ChatRoomType,
) => {
  if (chatRoomType === 'group') {
    return await (
      await get(
        ref(realtimeDbService, `userList/${uid}/myGroupChatList/groupChatUid`),
      )
    ).val();
  } else {
    return await (
      await get(ref(realtimeDbService, `userList/${uid}/myOneToOneChatList`))
    ).val();
  }
};

//특정 그룹채팅uid의 대화내용을 리턴
export const getMyGroupChatRoomChatList = async (
  chatRoomUid: string,
): Promise<ChatDataNew[] | null> => {
  const chatList = (
    await get(ref(realtimeDbService, `groupChatRooms/${chatRoomUid}/chat`))
  ).val();

  if (!chatList) return null;
  return chatList ? (Object.values(chatList) as ChatDataNew[]) : null;
};

//chatList와 uid를 넘기면  그 대화중에서 안읽은 메시지 개수를 반환
export const getNotReadMessageCount = async (
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

//일대일채팅과 그룹채팅을 합친 배열 리턴해주기
export const 일대일그룹 = async (uid: string) => {
  const 일대일대화리스트 = await (
    await get(ref(realtimeDbService, `userList/${uid}/myOneToOneChatList`))
  ).val();

  const 그룹대화리스트 = await (
    await get(
      ref(realtimeDbService, `userList/${uid}/myGroupChatList/groupChatUid`),
    )
  ).val();

  console.log('일대일대화리스트');
  console.log(일대일대화리스트);
  console.log('그룹대화리스트');
  console.log(그룹대화리스트);
  let 일대일대화uid배열 = [];
  let 그룹대화uid배열 = [];
  if (일대일대화리스트) {
    일대일대화uid배열 = Object.keys(일대일대화리스트);
  }
  if (그룹대화리스트) {
    그룹대화uid배열 = 그룹대화리스트;
  }
  console.log('일대일대화uid배열');
  console.log(일대일대화uid배열);
  console.log('그룹대화uid배열');
  console.log(그룹대화uid배열);

  let 일대일채팅 = 일대일대화uid배열.map(async (i) => {
    const lastMessage = await getChatRoomLastMessage(i, 'oneToOne');
    const chatList = await getMyGroupChatRoomChatList(i);
    const notReadCount = await getNotReadMessageCount(chatList, uid);
    let result2 = Object.values(i);
    console.log('lastMessage');
    console.log(lastMessage);
    console.log('result2');
    console.log(result2);
    result2['lastMessage'] = lastMessage.message;
    result2['notReadCount'] = notReadCount;
    result2['createdSecondsAt'] = lastMessage.createdSecondsAt;
    return result2;
  });
  console.log('일대일채팅');
  console.log(일대일채팅);
};
