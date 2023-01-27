import { push, ref, set, get } from '@firebase/database';
import { onValue } from 'firebase/database';
import { Timestamp } from 'firebase/firestore';
import React from 'react';
import { useEffect, useState } from 'react';
import styled, { css } from 'styled-components';
import {
  authService,
  createChatUid,
  createOneToOneChatRoom,
  createOneToOneChatRoomsRef,
  createOneToOneChatRoomsRefForOpponent,
  realtimeDbService,
} from '../firebaseConfig';
import { convertDate } from './chatRoom';

interface UserList {
  uid: string;
  displayName: string;
}
const UserListWrap = styled.div`
  width: 100%;
`;

interface UserIsOnInterface {
  isOn: boolean;
}

const UserListli = styled.li<UserIsOnInterface>`
  cursor: pointer;
  width: 95%;
  margin: 0 auto;
  /* max-width: 300px; */
  flex-shrink: 0;
  height: 30px;
  line-height: 30px;
  margin-bottom: 5px;
  user-select: none;
  /* border: 1px solid#eee; */
  &:hover {
    background: #eee;
  }
  & .isOn {
    margin-right: 5px;
    font-size: 12px;
    color: red;
  }
  ${(props) =>
    props.isOn &&
    css`
      & .isOn {
        color: green;
      }
    `}
  &#chatUserActive {
    & {
      background: ${({ theme }) => theme.colors.main};
    }
    &#chatUserActive:hover {
      background: ${({ theme }) => theme.colors.main};
    }
  }
`;

const OnUserList = ({
  setIsStartChat,
  setIsStartGroupChat,
  setChatRoomInfo,
}: {
  setIsStartChat: React.Dispatch<React.SetStateAction<boolean>>;
  setIsStartGroupChat: React.Dispatch<React.SetStateAction<boolean>>;
  setChatRoomInfo: React.Dispatch<
    React.SetStateAction<{
      displayName: string;
      chatRoomUid: string;
    }>
  >;
}) => {
  const userListRef = ref(realtimeDbService, 'userList');

  const [currentChatUser, setCurrentChatUser] = useState({
    displayName: '',
    uid: '',
  });

  interface UserListUserInfoInterface {
    displayName: string;
    isOn: boolean;
    uid: string;
  }

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
        const userListObj = Object.values(
          userList,
        ) as UserListUserInfoInterface[];

        console.log(userListObj);
        setUserList(userListObj);
      }
    });
  }, []);

  const enterOneToOneChatRooms = async (i: {
    uid: string;
    displayName: string;
  }) => {
    console.log('더블클릭 시 상대방 uid와 내 uid로 데이터 삽입해보기');

    let currentUserUid = authService.currentUser.uid;
    let currentUserDisplayName = authService.currentUser.displayName;
    let opponentUid = i.uid;
    let opponentDisplayName = i.displayName;
    let chatRoomRandomString = createChatUid();
    const 일대일채팅방 = createOneToOneChatRoomsRef(
      currentUserUid,
      opponentUid,
    );
    //이 값은 상대방 계정에서도 채팅방에 들어갔을 때 정상적으로 조회되도록 채팅방을 동시에 생성하는것.
    const 상대채팅방 = createOneToOneChatRoomsRefForOpponent(
      opponentUid,
      currentUserUid,
    );
    const 채팅방 = createOneToOneChatRoom(chatRoomRandomString);

    //클릭시 이미 존재하는 채팅방인지 확인하기
    let isOpenChatRooms: {
      chatRoomUid: string;
      opponentName: string;
    } | null = (await get(일대일채팅방)).val();

    //   console.log(isOpenChatRooms);

    if (isOpenChatRooms) {
      //존재하는 방에 대해서 바로 들어갔을 때 채팅창 내용을 수정하려면?..
      console.log(`이미 방이 존재 : ${isOpenChatRooms.chatRoomUid}`);
      setChatRoomInfo({
        displayName: opponentDisplayName,
        chatRoomUid: isOpenChatRooms.chatRoomUid,
      });
      setIsStartGroupChat(false);
      setIsStartChat(true);
    } else {
      //채팅이 처음인 상대인 경우 채팅방을 생성해준다.
      console.log('새로운 채팅방이 생성');
      set(일대일채팅방, {
        chatRoomUid: chatRoomRandomString,
        opponentName: opponentDisplayName,
      });
      set(상대채팅방, {
        chatRoomUid: chatRoomRandomString,
        opponentName: currentUserDisplayName,
      });
      push(채팅방, {
        displayName: authService.currentUser.displayName,
        uid: authService.currentUser.uid,
        message: `${opponentDisplayName}님과 채팅이 시작되었습니다.`,
        createdAt: convertDate(Timestamp.fromDate(new Date()).seconds),
      });
      // ###이 후 채팅방으로 접속하는 코드를 이어주면 ui적으로 좋을거같다.
      setChatRoomInfo({
        displayName: opponentDisplayName,
        chatRoomUid: chatRoomRandomString,
      });
      setIsStartGroupChat(false);
      setIsStartChat(true);
    }
  };

  return (
    <UserListWrap>
      <div>유저 목록</div>
      {userList.map((i, index) => {
        return i.uid === authService.currentUser?.uid ? null : (
          <UserListli
            isOn={i.isOn}
            key={index}
            id={i.uid === currentChatUser.uid ? 'chatUserActive' : ''}
            onDoubleClick={() => {
              setCurrentChatUser(i);
              enterOneToOneChatRooms(i);
            }}
          >
            <span className='isOn'>{i.isOn === true ? '●' : '●'}</span>
            {i.displayName}
          </UserListli>
        );
      })}
    </UserListWrap>
  );
};

export default React.memo(OnUserList);
