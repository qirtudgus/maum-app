import { push, ref, set, get } from '@firebase/database';
import { onValue } from 'firebase/database';
import { Timestamp } from 'firebase/firestore';
import { useRouter } from 'next/router';
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
import { convertDate } from '../utils/convertDate';
import { GroupListTitle } from './newGroupChatList';

const UserListContainer = styled.div`
  width: 100%;
  height: 50%;
  position: relative;
  background: ${({ theme }) => theme.colors.sub};
  border-bottom: 1px solid ${({ theme }) => theme.colors.borderColor};
`;

const UserListWrap = styled.div`
  width: 100%;
  height: calc(100% - 40px);
  background: ${({ theme }) => theme.colors.sub2};
  overflow-y: auto;
`;

interface UserIsOnInterface {
  isOn: boolean;
}

const UserListli = styled.li<UserIsOnInterface>`
  cursor: pointer;
  width: 100%;
  margin: 0 auto;
  padding-left: 10px;
  font-size: 14px;
  /* max-width: 300px; */
  flex-shrink: 0;
  height: 30px;
  line-height: 30px;
  margin-bottom: 5px;
  user-select: none;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: #1a1a1a;
  /* border: 1px solid#eee; */
  &:hover {
    background: #eee;
  }
  & .isOn {
    margin-right: 5px;
    font-size: 12px;
    color: #6d6d6d;
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
      color: #fff;
      background: ${({ theme }) => theme.colors.main};
    }
    &#chatUserActive:hover {
      background: ${({ theme }) => theme.colors.main};
    }
  }
`;

const OnUserList = () => {
  const userListRef = ref(realtimeDbService, 'userList');

  const router = useRouter();
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
    if (isOpenChatRooms) {
      //존재하는 방에 대해서 바로 들어갔을 때 채팅창 내용을 수정하려면?..
      console.log(`이미 방이 존재 : ${isOpenChatRooms.chatRoomUid}`);
      router.push(`/chat/${i.displayName}?uid=${isOpenChatRooms.chatRoomUid}`);
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
      router.push(`/chat/${i.displayName}?uid=${chatRoomRandomString}`);
    }
  };

  return (
    <UserListContainer>
      <GroupListTitle>유저 목록</GroupListTitle>
      <UserListWrap>
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
    </UserListContainer>
  );
};

export default React.memo(OnUserList);
