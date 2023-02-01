import { ref, set, get, update } from '@firebase/database';
import { onValue } from 'firebase/database';
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
} from '../firebaseConfig';
import { convertDate } from '../utils/convertDate';
import {
  ChatIcon,
  PageTitle,
  Wrap,
  ChatRoomList,
  ChatRoomInfo,
} from './chatList';
import PersonSvg from '../components/svg/personSvg';

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

const UserList = () => {
  const userListRef = ref(realtimeDbService, 'userList');
  const router = useRouter();
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
      router.push(
        `/chatRooms/oneToOne?displayName=${i.displayName}&chatRoomUid=${isOpenChatRooms.chatRoomUid}&opponentUid=${opponentUid}`,
      );
    } else {
      //채팅이 처음인 상대인 경우 채팅방을 생성해준다.
      console.log('새로운 채팅방이 생성');
      set(일대일채팅방, {
        chatRoomUid: chatRoomRandomString,
        opponentName: opponentDisplayName,
        opponentUid: opponentUid,
      });
      set(상대채팅방, {
        chatRoomUid: chatRoomRandomString,
        opponentName: currentUserDisplayName,
        opponentUid: currentUserUid,
      });

      const 채팅방에uid기록 = ref(
        realtimeDbService,
        `oneToOneChatRooms/${chatRoomRandomString}/connectedUser`,
      );
      update(채팅방에uid기록, {
        [currentUserUid]: {
          uid: currentUserUid,
          displayName: currentUserDisplayName,
          isOn: true,
          lastConnectTimeStamp: 0,
        },
      });
      update(채팅방에uid기록, {
        [opponentUid]: {
          uid: opponentUid,
          displayName: opponentDisplayName,
          isOn: false,
          lastConnectTimeStamp: 0,
        },
      });
      router.push(
        `/chatRooms/oneToOne?displayName=${i.displayName}&chatRoomUid=${chatRoomRandomString}&opponentUid=${opponentUid}`,
      );
    }
  };

  return (
    <Wrap>
      <PageTitle>유저 목록</PageTitle>
      {userList.map((item, index) => {
        return (
          item.uid === authService.currentUser?.uid && (
            <MyselfLi>
              <ChatRoomInfoWithUserList
                key={item.uid}
                onClick={() => {
                  enterOneToOneChatRooms(item);
                }}
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
              onClick={() => {
                enterOneToOneChatRooms(item);
              }}
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
    </Wrap>
  );
};

export default React.memo(UserList);
