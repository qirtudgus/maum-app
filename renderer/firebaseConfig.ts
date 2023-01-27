// Import the functions you need from the SDKs you need
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { get, getDatabase, ref } from 'firebase/database';

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
  const userList: UserList[] = Object.values(
    await (await get(userListRef)).val(),
  );
  return userList;
};

//내 채팅방 db경로 설정
export const createOneToOneChatRoomsRef = (
  uid: string,
  opponentUid: string,
) => {
  return ref(
    realtimeDbService,
    `oneToOneChatRooms/${uid}/${opponentUid}/chatRoomUid`,
  );
};
//상대 채팅방 db경로 설정
export const createOneToOneChatRoomsRefForOpponent = (
  opponentUid: string,
  uid: string,
) => {
  return ref(
    realtimeDbService,
    `oneToOneChatRooms/${opponentUid}/${uid}/chatRoomUid`,
  );
};
//새로운 채팅방 db경로 설정
export const createOneToOneChatRoom = (chatUid: string) => {
  return ref(realtimeDbService, `oneToOneChatRooms/${chatUid}/chat`);
};

//그룹채팅의 uid배열을 매개변수로 넣으면 그룹채팅의 title배열을 반환해준다.
export const getGroupChatRoomsUidToTitleFunc = async (roomUid: string[]) => {
  //roomUid를 배열로 받아와 내부에서 순회시킨다.
  const getGroupChatRoomsUidToTitle = async () => {
    let groupChatTitleArr = Promise.all(
      roomUid.map(async (i, index) => {
        return (
          await get(
            ref(realtimeDbService, `groupChatRooms/${i}/chatRoomsTitle`),
          )
        ).val();
      }),
    );
    return groupChatTitleArr;
  };
  return getGroupChatRoomsUidToTitle().then(
    (groupChatTitleArr) => groupChatTitleArr,
  );
};

//채팅방 고유번호용 랜덤 스트링 생성
export const createChatUid = () => {
  return Math.random().toString(36).substring(2, 12);
};
