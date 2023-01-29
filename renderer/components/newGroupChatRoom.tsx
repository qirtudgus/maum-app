import { off, onValue, push } from 'firebase/database';
import { Timestamp } from 'firebase/firestore';
import Head from 'next/head';
import React, { useEffect, useLayoutEffect, useState } from 'react';
import styled from 'styled-components';
import {
  authService,
  getGroupChatListPath,
  getGroupUserListPath,
  getUserList,
  UserList,
  exitUserCleanUpMyGroupChatList,
  exitUserCleanUpThisGroupChatList,
} from '../firebaseConfig';
import { convertDate } from '../utils/convertDate';
import ChatRoomHeaderTitle from '../components/ChatRoomHeaderTitle';
import MessageContainerGroup from './messageContainerGroup';
import LoadingSpinner from '../components/LoadingSpinner';
import SendMessageInput from '../components/SendMessageInput';
import { useRouter } from 'next/router';
import MessageContainerOneToOne from './messageContainerOneToOne';
import InviteGroupChatModal from './inviteGroupChatModal';

const GroupChatModalUserList = styled.li`
  width: 90%;
  height: 40px;
  display: flex;
  margin: 0 auto;
  align-items: center;
  justify-content: space-between;

  &.active {
    background: #964545;
  }
  &:hover {
    background: red;
  }

  & .isActive::after {
    content: '추가';
    cursor: pointer;
  }
  &.active .isActive::after {
    content: '해제';
    cursor: pointer;
  }
`;

const AddGroupChatModal = styled.div`
  top: 300px;
  left: 400px;
  right: 0;
  position: fixed;
  margin: 0 auto;
  width: 300px;
  height: 300px;
  background: #eee;
`;

const AddUserListWrap = styled.div`
  width: 95%;
  min-height: 40px;
  margin: 10px auto;
  display: flex;
  flex-wrap: wrap;
`;

const AddUserList = styled.li`
  width: fit-content;
  height: 30px;
  padding: 1px 10px;
  background: #fff;
  border-radius: 5px;
  margin-right: 10px;
  margin-bottom: 10px;
  display: flex;
  align-items: center;
  justify-content: center;

  & .cancelUser {
  }

  & .cancelUser:hover {
    cursor: pointer;
    font-weight: bold;
  }
`;

const InviteUserList = styled.div`
  height: 300px;
  overflow-y: auto;
`;

const NewGroupChatRoom = ({
  displayName,
  chatRoomUid,
}: {
  displayName: string;
  chatRoomUid: string;
}) => {
  const [chatList, setChatList] = useState([]);
  const [connectedUserList, setConnectedUserList] = useState<UserList[]>([]);
  const [showAddGroupChat, setShowAddGroupChat] = useState(false);
  const [groupChatUserList, setGroupChatUserList] = useState<UserList[]>([]);
  const [addUserList, setAddUserList] = useState<UserList[]>([]);
  const [isChatLoading, setIsChatLoading] = useState(false);
  const router = useRouter();
  const groupChatListPath = getGroupChatListPath(chatRoomUid);
  const groupUserListPath = getGroupUserListPath(chatRoomUid);

  const [레이아웃, 레이아웃설정] = useState('');

  const showUserList = () => {
    getUserList().then((userList) => {
      setShowAddGroupChat(true);
      //이미 방에 연결된 유저는 제외한 리스트를 보여준다.
      const duplicateDeleteArr = userList.filter((dataItem) => {
        return !connectedUserList.some(
          (paramsItem) => paramsItem.uid === dataItem.uid,
        );
      });
      console.log(duplicateDeleteArr);
      setGroupChatUserList(duplicateDeleteArr);
    });
  };

  //useEffect onValue로 채팅을 계속 가져와야함
  useEffect(() => {
    레이아웃설정(localStorage.getItem('groupChatLayout'));
    //채팅 onValue
    onValue(groupChatListPath, (snapshot) => {
      console.log('채팅이 갱신되었습니다');
      let messageList = Object.values(snapshot.val());
      setChatList(messageList);
    });
    setIsChatLoading(true);
    return () => {
      off(groupChatListPath);
      console.log('채팅방을 나갔습니다.');
    };
  }, [chatRoomUid]);

  //채팅방 인원 옵저버
  useEffect(() => {
    //현재채팅방 사용유저 onValue
    onValue(groupUserListPath, async (snapshot) => {
      console.log('사용자가 갱신되었습니다.');
      let inviteUserList = await snapshot.val();
      setConnectedUserList(inviteUserList);
    });
    return () => {
      off(groupUserListPath);
    };
  }, [chatRoomUid]);

  //화면에 들어오면 기존

  useLayoutEffect(() => {
    return () => {
      if (document.getElementById('groupChatActive')) {
        document.getElementById('groupChatActive').id = '';
      }
    };
  }, []);

  return (
    <>
      <Head>
        <title>maumTalk - {displayName}</title>
      </Head>
      <ChatRoomHeaderTitle title={displayName} userList={connectedUserList} />
      {isChatLoading ? (
        레이아웃 === 'group' ? (
          <MessageContainerGroup chatList={chatList} />
        ) : (
          <MessageContainerOneToOne chatList={chatList} />
        )
      ) : (
        <LoadingSpinner />
      )}

      <SendMessageInput
        displayName={displayName}
        chatRoomUid={chatRoomUid}
        isOneToOneOrGroup='group'
      />
      <button
        onClick={async () => {
          if (confirm(`${chatRoomUid} 방에서 나가시겠습니까?`)) {
            //퇴장했다는 메시지를 생성하고,

            await push(groupChatListPath, {
              displayName: authService.currentUser.displayName,
              uid: authService.currentUser.uid,
              message: `${authService.currentUser.displayName}님이 채팅방에서 나가셨습니다..`,
              createdAt: convertDate(Timestamp.fromDate(new Date()).seconds),
            });

            //내 채팅리스트에서 삭제
            await exitUserCleanUpMyGroupChatList(
              authService.currentUser.uid,
              chatRoomUid,
            );
            //채팅리스트에서 나를 삭제
            await exitUserCleanUpThisGroupChatList(
              authService.currentUser.uid,
              chatRoomUid,
            );

            //삭제 후 퇴장
            router.push('/main');
          }
        }}
      >
        채팅방 나가기
      </button>
      <button
        onClick={() => {
          console.log('누굴 초대하시겠습니까');
          showUserList();
        }}
      >
        초대하기
      </button>
      {showAddGroupChat && (
        <InviteGroupChatModal
          chatRoomUid={chatRoomUid}
          connectedUserList={connectedUserList}
          setShowAddGroupChat={setShowAddGroupChat}
        />
      )}
    </>
  );
};

export default NewGroupChatRoom;
