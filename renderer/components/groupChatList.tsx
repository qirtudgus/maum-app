import { get, onValue, push, ref, set } from 'firebase/database';
import { Timestamp } from 'firebase/firestore';
import React, { useEffect, useRef, useState } from 'react';
import styled from 'styled-components';
import {
  authService,
  createChatUid,
  getUserList,
  getGroupChatRoomsUidToTitle2,
  realtimeDbService,
  UserList,
} from '../firebaseConfig';
import { convertDate } from './chatRoom';

const GroupListTitle = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 95%;
  margin: 0 auto;
  & .addGroupChatButton {
    cursor: pointer;
    font-size: 22px;
  }
  & .addGroupChatButton:hover {
    font-weight: bold;
  }
`;

const GroupListWrap = styled.div`
  width: 95%;
  margin: 0 auto;
`;

const GroupListLi = styled.li`
  cursor: pointer;
  margin: 0 auto;
  /* max-width: 300px; */
  flex-shrink: 0;
  height: 50px;
  margin-bottom: 5px;
  list-style: none;
  user-select: none;
  border: 1px solid#eee;
  &:hover {
    background: #eee;
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
  /* display: flex; */
  /* flex-direction: column; */
`;

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

const GroupChatList = ({
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
  const [showAddGroupChat, setShowAddGroupChat] = useState(false);
  const [groupChatUserList, setGroupChatUserList] = useState<[] | UserList[]>(
    [],
  );
  const [addUserList, setAddUserList] = useState<UserList[]>([]);

  interface groupChatList {
    chatUid: string;
    chatTitle: string;
  }
  const [groupChatAllList, setGroupChatAllList] = useState<groupChatList[]>([]);

  const chatRoomsTitleInputRef = useRef<HTMLInputElement>();

  interface GroupChatListSnapshot {
    groupChatUid: string[];
  }

  useEffect(() => {
    //그룹채팅 리스트의 uid와 그룹채팅방의 uid가 같은 title을 가져와서 list에 넣어주자
    if (authService.currentUser) {
      const myGroupChatListPath = ref(
        realtimeDbService,
        `userList/${authService.currentUser.uid}/myGroupChatList`,
      );
      console.log('그룹채팅 온밸류 호출');
      onValue(myGroupChatListPath, async (snapshot) => {
        //그룹생성이 아예 처음이라면 해당 값이 null이다. 이에 대한 예외 처리를 했다.
        if (snapshot.val()) {
          let groupChatListSnapshot: GroupChatListSnapshot = snapshot.val();
          let groupChatUidList = groupChatListSnapshot.groupChatUid;
          getGroupChatRoomsUidToTitle2(groupChatUidList).then(
            (groupChatTitleList) => {
              console.log(groupChatTitleList);
              let mergeGroupChatList = groupChatUidList.map((item, index) => {
                return { chatUid: item, chatTitle: groupChatTitleList[index] };
              });
              //   console.log('그룹채팅배열');
              //   console.log(mergeGroupChatList);
              setGroupChatAllList(mergeGroupChatList);
            },
          );
        }
      });
    }
  }, []);

  const showUserList = () => {
    getUserList().then((userList) => {
      setShowAddGroupChat(true);
      setGroupChatUserList(userList);
    });
  };

  const enterGroupChatRoom = (item: groupChatList) => {
    setIsStartChat(false);
    setIsStartGroupChat(true);
    setChatRoomInfo({
      displayName: item.chatTitle,
      chatRoomUid: item.chatUid,
    });
  };
  //uid배열과 chatRoomUid를 받아와 uid들의 그룹채팅리스트에 그룹채팅uid를 추가해준다.
  const updateUsersChatRoomUid = async (uid: string, chatRoomUid: string) => {
    let myGroupChatListPath = ref(
      realtimeDbService,
      `userList/${uid}/myGroupChatList`,
    );
    const checkCurrentGroupChatRoomsArr: string[] | null = await (
      await get(myGroupChatListPath)
    ).val()?.groupChatUid;
    //checkCurrentGroupChatRooms이 true일때 false일때(참여한 채팅방이 없는상태)로 분기된다.
    if (checkCurrentGroupChatRoomsArr) {
      //기존에 가지고있던 채팅리스트에 새로 생성된 채팅방을 추가하여 set해준다.
      const updateCurrentGroupChatRoomsArr = [
        ...checkCurrentGroupChatRoomsArr,
        chatRoomUid,
      ];
      set(myGroupChatListPath, {
        groupChatUid: updateCurrentGroupChatRoomsArr,
      });
    } else {
      //그룹채팅이 아예 처음 초대됐기때문에 바로 채팅방을 set해준다.
      set(myGroupChatListPath, {
        groupChatUid: [chatRoomUid],
      });
    }
  };

  const createGroupChatRoom = () => {
    //1.한번의 호출로 같은 고유번호를 넣어야하기때문에 미리 선언
    let chatRoomUid = createChatUid();
    //2.초대된 유저를 순회하며, 각 유저들의 채팅리스트를 업데이트해준다.
    addUserList.forEach(async (i) => {
      updateUsersChatRoomUid(i.uid, chatRoomUid);
    });
    //2. 고유 그룹채팅방 생성하고, 시작메시지 push하기
    let groupChatPath = ref(realtimeDbService, `groupChatRooms/${chatRoomUid}`);
    let groupChatMessagePath = ref(
      realtimeDbService,
      `groupChatRooms/${chatRoomUid}/chat`,
    );
    //3.채팅방제목을 적으면 그걸로 사용, 안적었을 시 고유번호로 사용
    let chatRoomTitle =
      chatRoomsTitleInputRef.current.value !== ''
        ? chatRoomsTitleInputRef.current.value
        : chatRoomUid;

    set(groupChatPath, {
      chatRoomsTitle: chatRoomTitle,
      connectedUser: addUserList,
    });
    push(groupChatMessagePath, {
      displayName: authService.currentUser.displayName,
      uid: authService.currentUser.uid,
      message: `그룹채팅이 시작되었습니다.`,
      createdAt: convertDate(Timestamp.fromDate(new Date()).seconds),
    });
    setShowAddGroupChat(false);
  };

  return (
    <>
      <GroupListTitle>
        <span>그룹 채팅 목록</span>
        <span className='addGroupChatButton' onClick={showUserList}>
          +
        </span>
      </GroupListTitle>
      <GroupListWrap>
        {groupChatAllList.map((item, index) => {
          return (
            <GroupListLi
              key={index}
              onDoubleClick={() => enterGroupChatRoom(item)}
            >
              {item.chatTitle}
            </GroupListLi>
          );
        })}
      </GroupListWrap>
      {showAddGroupChat && (
        <AddGroupChatModal>
          <>
            채팅방의 이름을 지어주세요.(기본은 랜덤 12자리이며, 언제든지 변경
            가능해요!)
            <input
              ref={chatRoomsTitleInputRef}
              placeholder='채팅방 이름'
              //   defaultValue={''}
            ></input>
            초대할 사용자를 선택해주세요!
            <AddUserListWrap>
              {addUserList.map((i, index) => {
                return (
                  <AddUserList key={index}>
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
            {groupChatUserList.map((i: UserList, index: number) => {
              return (
                <GroupChatModalUserList
                  key={index}
                  className={i.uid}
                  //   선택 시 클래스를 넣고, 다시 눌렀을 때 클래스가 있는지 확인 후 있으면 삭제, 없으면 추가
                  onClick={(e: React.MouseEvent) => {
                    // console.log(e.currentTarget.classList.add('active'));

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
            <button onClick={createGroupChatRoom}>완료</button>
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

export default React.memo(GroupChatList);
