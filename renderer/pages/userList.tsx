import { ref, set, get, update } from '@firebase/database';
import { off, onValue, push } from 'firebase/database';
import { useRouter } from 'next/router';
import React from 'react';
import { useEffect, useState } from 'react';
import styled from 'styled-components';
import {
  authService,
  createChatUid,
  createOneToOneChatRoom,
  createOneToOneChatRoomsRef,
  createOneToOneChatRoomsRefForOpponent,
  realtimeDbService,
  UserList,
} from '../firebaseConfig';

import PersonSvg from '../components/svg/personSvg';
import { convertDate } from '../utils/convertDate';
import { Timestamp } from 'firebase/firestore';
import { Wrap, PageTitle } from './oneToOneChatRooms';
import { ChatRoomList, ChatIcon, ChatRoomInfo } from '../components/ChatRoom';
import { enterOneToOneChatRoom } from '../utils/makeChatRooms';
const ChatRoomInfoWithUserList = styled(ChatRoomList)`
  align-items: center;
  font-weight: bold;
`;

const MyselfLi = styled.div`
  display: block;
  width: 100%;
  border-bottom: 1px solid ${({ theme }) => theme.colors.borderColor};
`;

const OnUserLight = styled.div`
  position: absolute;
  bottom: 0px;
  right: 0px;
  width: 17px;
  height: 17px;
  border-radius: 50%;
  border: 3px solid#fff;
  background: #3ead3e;
`;
const OffUserLight = styled(OnUserLight)`
  background: #8b8b8b;
`;

const ZeroChatUser = styled.div`
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

const UserListComponent = () => {
  const userListRef = ref(realtimeDbService, 'userList');
  const router = useRouter();
  interface UserListUserInfoInterface {
    displayName: string;
    isOn: boolean;
    uid: string;
  }
  let myUid = authService.currentUser?.uid;
  let myDisplayName = authService.currentUser?.displayName;
  //해당 페이지로 왔을 때 db에서 가져와서 추가
  //로그인했을 때 해당 state에 추가,
  //로그아웃 시 db에서 uid 제거
  const [userList, setUserList] = useState<UserListUserInfoInterface[]>([]);

  useEffect(() => {
    // 온밸류를 안쓰니 접속중인 유저를 실시간표시할수가 없다...
    onValue(userListRef, (snapshot) => {
      console.log('온밸류 호출');
      //   console.log(snapshot.val());
      const userList = snapshot.val();
      //회원이 한명도 없는 경우에 대한 타입가드
      if (userList !== null) {
        const userListObj = Object.values(userList) as UserListUserInfoInterface[];

        console.log(userListObj);
        setUserList(userListObj);
      }
    });

    return () => {
      off(userListRef);
    };
  }, []);

  const joinOneToOneChatRoom = (
    myUid: string,
    myDisplayName: string,
    opponentUid: string,
    opponentDisplayName: string,
  ) => {
    enterOneToOneChatRoom(myUid, myDisplayName, opponentUid, opponentDisplayName).then((res) => {
      console.log(res);
      if (res.code === 'already-has-chat') {
        router.push(
          `/oneToOneChatRooms/oneToOne?displayName=${res.opponentDisplayName}&chatRoomUid=${res.chatRoomUid}`,
        );
      } else {
        router.push(`/combineChatRooms/oneToOne?displayName=${res.opponentDisplayName}&chatRoomUid=${res.chatRoomUid}`);
      }
    });
  };

  return (
    <Wrap>
      <PageTitle>유저 목록</PageTitle>
      {userList.map((item, index) => {
        return (
          item.uid === authService.currentUser?.uid && (
            <MyselfLi key={item.uid}>
              <ChatRoomInfoWithUserList
                key={item.uid}
                onClick={() => joinOneToOneChatRoom(myUid, myDisplayName, item.uid, item.displayName)}
              >
                <ChatIcon>
                  <PersonSvg />
                  {item.isOn ? <OnUserLight /> : <OffUserLight />}
                </ChatIcon>
                <ChatRoomInfo>
                  <span className='displayName'>{item?.displayName}</span>
                </ChatRoomInfo>
              </ChatRoomInfoWithUserList>
            </MyselfLi>
          )
        );
      })}
      {userList.map((item, index) => {
        return (
          item.uid !== authService.currentUser?.uid && (
            <ChatRoomInfoWithUserList
              key={item.uid}
              onClick={() => joinOneToOneChatRoom(myUid, myDisplayName, item.uid, item.displayName)}
            >
              <ChatIcon>
                <PersonSvg />
                {item.isOn ? <OnUserLight /> : <OffUserLight />}
              </ChatIcon>
              <ChatRoomInfo>
                <span className='displayName'> {item?.displayName}</span>
              </ChatRoomInfo>
            </ChatRoomInfoWithUserList>
          )
        );
      })}
      {userList.length === 1 && <ZeroChatUser>우리말고 가입한 사람이 없네요...</ZeroChatUser>}
    </Wrap>
  );
};

export default React.memo(UserListComponent);
