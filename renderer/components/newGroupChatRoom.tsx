import { get, off, onValue, push, ref, set, update } from 'firebase/database';
import { Timestamp } from 'firebase/firestore';
import Head from 'next/head';
import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import styled from 'styled-components';
import {
  authService,
  getGroupChatListPath,
  getGroupUserListPath,
  getUserConnectedGroupChatList,
  getUserList,
  realtimeDbService,
  UserList,
  updateGroupChatConnectedUsers,
  updateUsersGroupChatList,
  exitUserCleanUpMyGroupChatList,
  exitUserCleanUpThisGroupChatList,
} from '../firebaseConfig';
import { convertDate } from '../utils/convertDate';
import ChatRoomHeaderTitle from '../components/ChatRoomHeaderTitle';
import MessageContainerGroup from './messageContainerGroup';
import LoadingSpinner from '../components/LoadingSpinner';
import SendMessageInput from '../components/SendMessageInput';
import { useRouter } from 'next/router';

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
  const userConnectedGroupChatListPath = getUserConnectedGroupChatList(
    authService.currentUser.uid,
  );

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
      let 갱신배열 = await snapshot.val();
      console.log('그룹채팅 사용자목록에서 불러온 온밸류 배열');
      console.log(갱신배열);
      setConnectedUserList(갱신배열);
    });
    return () => {
      off(groupUserListPath);
    };
  }, [chatRoomUid]);

  useLayoutEffect(() => {
    return () => {
      if (document.getElementById('groupChatActive')) {
        document.getElementById('groupChatActive').removeAttribute('id');
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
        <MessageContainerGroup chatList={chatList} />
      ) : (
        <LoadingSpinner />
      )}

      <SendMessageInput
        displayName={displayName}
        chatRoomUid={chatRoomUid}
        isOneToOneOrGroup='group'
      />
      <button
        onClick={() => {
          console.log(chatList);
          console.log(convertDate(chatList[0].createdAt.seconds));
        }}
      >
        채팅 로그 확인
      </button>
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
        <AddGroupChatModal>
          <>
            초대할 사용자를 선택해주세요!
            <AddUserListWrap>
              {addUserList.map((i, index) => {
                return (
                  <AddUserList key={i.uid}>
                    <span>{i.displayName}</span>
                    <span
                      onClick={() => {
                        console.log('취소할 이름');
                        console.log(i.displayName);
                        setAddUserList((prev) =>
                          prev.filter((todo) => todo.uid !== i.uid),
                        );
                        //className이 i.displayName인 아이를 찾아서 active 제거
                        const removeDom = document.querySelector(`.${i.uid}`);
                        removeDom.classList.remove('active');
                        console.log(document.querySelector(`.${i.uid}`));
                      }}
                      className='cancelUser'
                    >
                      X
                    </span>
                  </AddUserList>
                );
              })}
            </AddUserListWrap>
            <InviteUserList>
              {groupChatUserList.map((i: UserList, index: number) => {
                // 현재 이용유저는 렌더링하지않는다.
                return i.uid === authService.currentUser?.uid ? null : (
                  // return i.uid === connectedUserList[index] ? null : (
                  <GroupChatModalUserList
                    key={index}
                    className={i.uid}
                    //   선택 시 클래스를 넣고, 다시 눌렀을 때 클래스가 있는지 확인 후 있으면 삭제, 없으면 추가
                    onClick={(e: React.MouseEvent) => {
                      //액티브가 있는 경우에는 state에서 삭제 후, active 제거
                      if (e.currentTarget.classList.contains('active')) {
                        setAddUserList((prev) =>
                          prev.filter((todo) => todo.uid !== i.uid),
                        );
                        e.currentTarget.classList.remove('active');
                      }
                      //액티브가 없는 경우에는 추가
                      else {
                        e.currentTarget.classList.add('active');
                        setAddUserList((prev) => [
                          ...prev,
                          { displayName: i.displayName, uid: i.uid },
                        ]);
                      }
                    }}
                  >
                    {i.displayName}
                    {/* 버튼을 active 시킬 때 가상선택자로 추가 해제를 알려준다 */}
                    <div className='isActive'></div>
                  </GroupChatModalUserList>
                );
              })}
            </InviteUserList>
            <button
              onClick={async () => {
                //1.선택된 사용자들의 채팅리스트와, 고유채팅방에 유저목록을 업데이트해주어야한다.
                console.log('초대시도');
                console.log(addUserList); //초대목록이 들어있다...
                //초대할 유저들의 그룹목록에 추가
                await updateUsersGroupChatList(addUserList, chatRoomUid);
                //초대할 그룹에 유저들 추가
                await updateGroupChatConnectedUsers(addUserList, chatRoomUid);
                //초대 기능은 완료되긴함 추후 리팩토링하자, 초대 후 초대리스트 초기화
                setAddUserList([]);
                setShowAddGroupChat(false);
              }}
            >
              초대
            </button>
            <button
              onClick={() => {
                setShowAddGroupChat(false);
                setAddUserList([]);
              }}
            >
              취소
            </button>
          </>
        </AddGroupChatModal>
      )}
    </>
  );
};

export default NewGroupChatRoom;
