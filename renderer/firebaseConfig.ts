// Import the functions you need from the SDKs you need
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { get, getDatabase, limitToLast, push, query, ref, set, update } from 'firebase/database';
import { getFirestore, Timestamp } from 'firebase/firestore';
import { convertDate } from './utils/convertDate';
import { ChatDataNew } from './utils/makeChatRooms';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_apiKey,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_authDomain,
  databaseURL: process.env.NEXT_PUBLIC_FIREBASE_databaseURL,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_projectId,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_storageBucket,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_messagingSenderId,
  appId: process.env.NEXT_PUBLIC_FIREBASE_appId,
};

export const apps = initializeApp(firebaseConfig);
export const authService = getAuth(apps);
export const dbService = getFirestore(apps);
export const realtimeDbService = getDatabase(apps);
//현재 유저목록을 가져온다.
export const userListRef = ref(realtimeDbService, 'userList');
//uid로 식별한 유저의 데이터를 가져온다.
export const getUserDataRef = (uid: string) => {
  return ref(realtimeDbService, `userList/${uid}`);
};
export interface UserList {
  displayName: string;
  uid: string;
}
/**
 *
 * @returns 유저목록을 배열로 반환시켜준다
 * ex) [{displayName:'1',uid:'1',},{displayName:'2',uid:'2',}]
 */
export const getUserList = async () => {
  const userList: UserList[] = Object.values(await (await get(userListRef)).val());
  return userList;
};

//내 채팅방 db경로 설정
export const createOneToOneChatRoomsRef = (uid: string, opponentUid: string) => {
  return ref(realtimeDbService, `oneToOneChatRooms/${uid}/${opponentUid}/chatRoomUid`);
};
//상대 채팅방 db경로 설정
export const createOneToOneChatRoomsRefForOpponent = (opponentUid: string, uid: string) => {
  return ref(realtimeDbService, `oneToOneChatRooms/${opponentUid}/${uid}/chatRoomUid`);
};
//새로운 채팅방 db경로 설정
export const createOneToOneChatRoom = (chatUid: string) => {
  return ref(realtimeDbService, `oneToOneChatRooms/${chatUid}/chat`);
};

//그룹채팅의 uid배열을 매개변수로 넣으면 그룹채팅의 title배열을 반환해준다.
export const getGroupChatRoomsUidToTitleFunc = async (roomUid: string[]) => {
  //roomUid를 배열로 받아와 내부에서 순회시킨다.

  const getGroupChatRoomsUidToTitle = async () => {
    let titleArr = [];

    let groupChatTitleArr = Promise.all(
      roomUid.map(async (i, index) => {
        let result = (await get(ref(realtimeDbService, `groupChatRooms/${i}/chatRoomsTitle`))).val();

        return result;
      }),
    );
    return groupChatTitleArr;
  };
  return getGroupChatRoomsUidToTitle().then((groupChatTitleArr) => groupChatTitleArr);
};

//채팅방 고유번호용 랜덤 스트링 생성
export const createChatUid = () => {
  return Math.random().toString(36).substring(2, 12);
};

//일대일 채팅룸에서 채팅리스트를 불러오기 위한 경로
export const getOneToOneChatListPath = (chatRoomUid: string) => {
  return ref(realtimeDbService, `oneToOneChatRooms/${chatRoomUid}/chat`);
};

//그룹 채팅룸에서 채팅리스트를 불러오기 위한 경로
export const getGroupChatListPath = (chatRoomUid: string) => {
  return ref(realtimeDbService, `groupChatRooms/${chatRoomUid}/chat`);
};

//그룹내 채팅인원 리스트를 불러오기 위한 경로
export const getGroupUserListPath = (chatRoomUid: string) => {
  return ref(realtimeDbService, `groupChatRooms/${chatRoomUid}/connectedUser`);
};

//특정 유저가 참여중인 그룹채팅 리스트를 불러오기 위한 경로
export const getUserConnectedGroupChatList = (uid: string) => {
  return ref(realtimeDbService, `userList/${uid}/group_chat_rooms`);
};

//특정 유저의 그룹채팅리스트에 그룹채팅을 추가하는 함수
export const updateUserGroupChatList = async (uid: string, chatRoomUid: string) => {
  const group_chat_roomsPath = getUserConnectedGroupChatList(uid);
  const 데이터사이즈 = (await get(group_chat_roomsPath)).size;
  update(group_chat_roomsPath, {
    [데이터사이즈]: chatRoomUid,
  });
};

//유저배열과 그룹채팅uid를 받아와 받아와 각 유저들의 그룹채팅리스트에 그룹채팅을 추가하는 함수
export const updateUsersGroupChatList = async (userList: UserList[], chatRoomUid: string) => {
  userList.forEach(async (i, index) => {
    // // const group_chat_roomsPath = getUserConnectedGroupChatList(i.uid);
    // const 데이터사이즈 = (await get(그룹채팅ref)).size;
    update(ref(realtimeDbService, `userList/${i.uid}/group_chat_rooms`), {
      [chatRoomUid]: chatRoomUid,
    });
  });
};

//유저배열과 그룹채팅uid를 받아와 그룹채팅의 유저리스트에 추가해준다. (초대 시 사용)
export const updateGroupChatConnectedUsers = async (userList: UserList[], groupChatRoomUid: string) => {
  const 데이터사이즈 = (await get(getGroupUserListPath(groupChatRoomUid))).size; //두명이면 2겠지
  //들어온 배열을 순회하며, 채팅방에 유저 업데이트.
  userList.forEach(async (i, index) => {
    await update(getGroupUserListPath(groupChatRoomUid), {
      [데이터사이즈 + index]: userList[index],
    });
  });
};

//특정유저가 그룹채팅방에서 퇴장 시 자신의 채팅리스트에서 삭제해주는 함수
export const exitUserCleanUpGroupChatRooms = async (uid: string, chatRoomUid: string) => {
  await update(ref(realtimeDbService, `userList/${uid}/group_chat_rooms`), { [chatRoomUid]: null });
};

//그룹채팅에서 connectedUser중에서 특정 유저를 삭제하는 것
export const exitUserCleanUpThisGroupChatList = async (uid: string, chatRoomUid: string) => {
  //공식 문서에 안내대로, 객체의 값을 null로 update하여 값을 삭제한다.
  await update(ref(realtimeDbService, `groupChatRooms/${chatRoomUid}/connectedUser`), { [uid]: null });
};

//그룹 채팅 생성 시 방을 생성하고, 유저목록 set 후, 시작메시지를 작성해주는 함수
export const createGroupChat = (inviteUserList: UserList[], chatRoomUid: string, chatRoomTitle: string) => {
  let groupChatPath = ref(realtimeDbService, `groupChatRooms/${chatRoomUid}`);
  let groupChatMessagePath = getGroupChatListPath(chatRoomUid);
  console.log(inviteUserList);
  let 초대할유저접속상태객체 = {};
  let readUserCounts = {};
  inviteUserList.forEach((i, index) => {
    // 초대할유저접속상태객체[i.uid] = {  };
    // 초대할유저접속상태객체[i.uid] = {};
    // 초대할유저접속상태객체[i.uid] = {
    readUserCounts[i.uid] = false;
    // };
    초대할유저접속상태객체[i.uid] = {
      displayName: i.displayName,
      isOn: false,
      lastConnectTimeStamp: 0,
      uid: i.uid,
    };
  });

  console.log(초대할유저접속상태객체);

  set(groupChatPath, {
    chatRoomsTitle: chatRoomTitle,
    //여기서 객체로 잘 넣어줘야한다.
    connectedUser: 초대할유저접속상태객체,
  });
  // 초기 메시지 삭제
  push(groupChatMessagePath, {
    displayName: authService.currentUser.displayName,
    uid: authService.currentUser.uid,
    message: `그룹채팅이 시작되었습니다.`,
    createdAt: convertDate(Timestamp.fromDate(new Date()).seconds),
    createdSecondsAt: Timestamp.fromDate(new Date()).seconds,
    readUsers: readUserCounts,
  });
};
