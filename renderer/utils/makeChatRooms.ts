import { get, limitToLast, query, ref } from 'firebase/database';
import { realtimeDbService } from '../firebaseConfig';

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
  const getMyChatListArray: pureMessage[] = Object.values(listObj);
  const resultGroupChatRooms: Promise<ResultOneToOneRoom>[] = getMyChatListArray.map(async (i) => {
    const lastMessage = await getChatRoomLastMessage(i.chatRoomUid.chatRoomUid, 'oneToOne');
    const chatList = await getMyOneToOneChatRoomChatList(i.chatRoomUid.chatRoomUid);
    const notReadCount = getNotReadMessageCount(chatList, uid);
    let result2 = Object.values(i)[0];
    result2['displayName'] = i.chatRoomUid.opponentName;
    result2['lastMessage'] = lastMessage.message;
    result2['notReadCount'] = notReadCount;
    result2['createdSecondsAt'] = lastMessage.createdSecondsAt;
    delete result2['opponentName']; // 그룹채팅과 객체명을 통일하기위해 opponentName을 제거하고 displayName을 추가한다.
    return result2;
  });
  return await Promise.all(resultGroupChatRooms);
};

/**
 * oneToOneChatRooms에 렌더링할 배열을
 * 만들어 반환해주는 비동기 함수입니다.
 * 채팅방이 존재하지않으면 []을 반환합니다.
 * @param uid 대화목록을 만들 사용자의 uid
 * @returns ResultMessage[] | []
 */
export const createOneToOneChatRoomsTest = async (uid: string) => {
  //   const listObj = await getMyGroupChatRoomsRef(uid);
  const listObj = await getMyChatRoomsRef(uid, 'oneToOne');
  // console.log('listObj');
  // console.log(listObj);
  // if (!listObj) return null; //채팅방이 존재할 때 함수 진행
  if (!listObj) return []; //채팅방이 존재할 때 함수 진행
  const getMyChatListArray: pureMessage[] = Object.values(listObj);
  const resultGroupChatRooms: Promise<ResultOneToOneRoom>[] = getMyChatListArray.map(async (i) => {
    const lastMessage = await getChatRoomLastMessage(i.chatRoomUid.chatRoomUid, 'oneToOne');
    const chatList = await getMyOneToOneChatRoomChatList(i.chatRoomUid.chatRoomUid);
    const notReadCount = getNotReadMessageCount(chatList, uid);
    let result2 = Object.values(i)[0];
    result2['displayName'] = i.chatRoomUid.opponentName;
    result2['lastMessage'] = lastMessage.message;
    result2['notReadCount'] = notReadCount;
    result2['createdSecondsAt'] = lastMessage.createdSecondsAt;
    delete result2['opponentName']; // 그룹채팅과 객체명을 통일하기위해 opponentName을 제거하고 displayName을 추가한다.
    return result2;
  });
  return await Promise.all(resultGroupChatRooms);
};

//특정 그룹채팅uid의 제목을 리턴
const getMyGroupChatRoomTitle = async (chatRoomUid: string) => {
  const titleList = (await get(ref(realtimeDbService, `groupChatRooms/${chatRoomUid}/chatRoomsTitle`))).val();
  return titleList;
};

//특정 유저의 그룹채팅 배열을 반환
export const groupChatRoomUidArr = async (uid: string) => {
  const 그룹채팅배열 = await getMyChatRoomsRef(uid, 'group');
  if (그룹채팅배열) return Object.values(그룹채팅배열) as string[];
  else return null;
};
export const getMyChatRoomsRef = async (uid: string, chatRoomType: ChatRoomType) => {
  if (chatRoomType === 'group') {
    return await (await get(ref(realtimeDbService, `userList/${uid}/group_chat_rooms`))).val();
  } else {
    return await (await get(ref(realtimeDbService, `oneToOneChatRooms/${uid}`))).val();
  }
};

/**
 * groupChatRooms에 렌더링할 배열을
 * 만들어 반환해주는 비동기 함수입니다.
 * 채팅방이 존재하지않으면 null을 반환합니다.
 * @param uid 대화목록을 만들 사용자의 uid
 * @returns ResultMessage[] | null
 */
export const createGroupChatRooms = async (uid: string): Promise<ResultGroupRoom[] | null> => {
  const listObj = await getMyChatRoomsRef(uid, 'group');
  if (!listObj) return null; //채팅방이 존재할 때 함수 진행
  // if (!listObj) return []; //채팅방이 존재할 때 함수 진행
  const listValues: string[] = Object.values(listObj); // 그룹채팅 uid가 들어있다
  const resultGroupChatRooms = listValues.map(async (i) => {
    const title = await getMyGroupChatRoomTitle(i);
    const lastMessage = await getChatRoomLastMessage(i, 'group');
    const chatList = await getMyGroupChatRoomChatList(i);
    const notReadCount = getNotReadMessageCount(chatList, uid);

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

/**
 * groupChatRooms에 렌더링할 배열을
 * 만들어 반환해주는 비동기 함수입니다.
 * 채팅방이 존재하지않으면 []을 반환합니다.
 * @param uid 대화목록을 만들 사용자의 uid
 * @returns ResultMessage[] | []
 */
export const createGroupChatRoomsTest = async (uid: string): Promise<ResultGroupRoom[] | []> => {
  const listObj = await getMyChatRoomsRef(uid, 'group');
  // if (!listObj) return null; //채팅방이 존재할 때 함수 진행
  if (!listObj) return []; //채팅방이 존재할 때 함수 진행
  const listValues: string[] = Object.values(listObj); // 그룹채팅 uid가 들어있다
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

/**
 * 그룹채팅의 uid를 받아와 해당 채팅방의 대화내용을
 * 배열로 가공하여 반환해주는 함수입니다.
 * @param chatRoomUid 그룹 채팅방 고유 uid입니다.
 * @returns
 */
export const getMyGroupChatRoomChatList = async (chatRoomUid: string): Promise<ChatDataNew[] | null> => {
  const chatList = (await get(ref(realtimeDbService, `groupChatRooms/${chatRoomUid}/chat`))).val();
  if (!chatList) return null;
  return chatList ? (Object.values(chatList) as ChatDataNew[]) : null;
};

/**
 * 일대일채팅의 의 uid를 받아와 해당 채팅방의 대화내용을
 * 배열로 가공하여 반환해주는 함수입니다.
 * @param chatRoomUid 그룹 채팅방 고유 uid입니다.
 * @returns
 */
export const getMyOneToOneChatRoomChatList = async (chatRoomUid: string): Promise<ChatDataNew[] | null> => {
  const chatList = (await get(ref(realtimeDbService, `oneToOneChatRooms/${chatRoomUid}/chat`))).val();
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
export const getNotReadMessageCount = (chatList: ChatDataNew[], uid: string) => {
  if (!chatList) return 0;
  let chatListLength = chatList.length;
  let 안읽은메시지인덱스 = chatList.findIndex((i) => {
    return i!.readUsers[uid] === false;
  });
  let 안읽은메시지갯수 = chatListLength - 안읽은메시지인덱스;
  return 안읽은메시지인덱스 === -1 ? 0 : 안읽은메시지갯수;
};

/**
 * 채팅의 uid와 종류를 넘겨주면 메시지가 있을때 마지막 메시지를, 없으면 null을 반환합니다.
 * @param chatRoomUid : 채팅방의 고유 uid
 * @param chatRoomType : 채팅방이 그룹인지 일대일인지 구분할 값
 * @returns Promise<ChatDataNew | null>
 */
export const getChatRoomLastMessage = async (
  chatRoomUid: string,
  chatRoomType: 'oneToOne' | 'group',
): Promise<ChatDataNew | null> => {
  let resultLastMessage = null;
  //들어온값에 따라서 적절한 ref를 할당시킨다.
  const chatRef =
    chatRoomType === 'oneToOne'
      ? ref(realtimeDbService, `oneToOneChatRooms/${chatRoomUid}/chat`)
      : ref(realtimeDbService, `groupChatRooms/${chatRoomUid}/chat`);

  //메시지를 가져온다. 해당 채팅방에 메시지가 없으면 null이 나온다.
  const queryLastMessage = await (await get(query(chatRef, limitToLast(1)))).val();

  if (queryLastMessage) {
    //메시지가 있으면 values로 풀어준다
    resultLastMessage = Object.values(queryLastMessage)[0];
  }
  return resultLastMessage;
};
