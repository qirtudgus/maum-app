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
      onValue(myGroupChatListPath, async (snapshot) => {
        console.log('그룹채팅 온밸류 호출');
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
              console.log('그룹채팅배열');
              console.log(mergeGroupChatList);
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
            <button
              onClick={() => {
                console.log(addUserList);

                //1.완료 시 추가된 사람들의 식별자를 이용하여 uid와,닉네임과,채팅uid 그룹 채팅방을 만든다.
                //2. 그룹 채팅리스트에 넣어준다.
                //새로 초대된 사람들도 그룹 채팅 리스트에 들어가있다면 화면에 렌더링해준다.
                //그룹 채팅 리스트는...채팅식별번호와 유저리스트로 이루어져있게?
                //그러면 그룹채팅리스트를 db에서 필터링해서 가져오거나,
                //클라이언트에서 가져와 순회하면서 내 uid가 들어있는 채팅식별번호만

                //필요한 자료구조

                //고유 그룹채팅방
                //그룹채팅방의 인원정보
                //그룹채팅을 저장할 공간

                //내 정보에 고유그룹채팅 리스트를 추가해서 렌더링 or 고유그룹채팅방의 인원정보를 순회해서 내가 있으면 렌더링

                //한번의 호출로 같은 고유번호를 넣어야하기때문에 미리 선언
                let 고유번호 = createChatUid();
                // setChatRoomTitleDefaultValue(고유번호);

                //1. 선택된 uid들을 순회하며 각 db경로에 uid 추가해주기
                addUserList.forEach(async (i, index) => {
                  let uid = i.uid;
                  let 그룹채팅 = ref(
                    realtimeDbService,
                    `userList/${uid}/myGroupChatList`,
                  );
                  let 현재그룹채팅배열: any[] = await (
                    await get(그룹채팅)
                  ).val()?.groupChatUid;
                  console.log(현재그룹채팅배열);

                  //현재그룹채팅배열이 true일때 false일때(참여한 채팅방이 없는상태)로 분기된다.
                  if (현재그룹채팅배열) {
                    let 갱신채팅배열 = [...현재그룹채팅배열, 고유번호];
                    console.log(갱신채팅배열);
                    set(그룹채팅, {
                      groupChatUid: 갱신채팅배열,
                    });
                  } else {
                    set(그룹채팅, {
                      groupChatUid: [고유번호],
                    });
                  }
                });
                //2. 고유 그룹채팅방 생성하기
                // 인원 정보 쭉 넣고
                // chat 추가하고...
                let 고유채팅방경로 = ref(
                  realtimeDbService,
                  `groupChatRooms/${고유번호}`,
                );
                let 고유채팅방채팅 = ref(
                  realtimeDbService,
                  `groupChatRooms/${고유번호}/chat`,
                );
                //인원 정보 추가

                let 제목은 =
                  chatRoomsTitleInputRef.current.value !== ''
                    ? chatRoomsTitleInputRef.current.value
                    : 고유번호;

                set(고유채팅방경로, {
                  chatRoomsTitle: 제목은,
                  connectedUser: addUserList,
                });
                push(고유채팅방채팅, {
                  displayName: authService.currentUser.displayName,
                  uid: authService.currentUser.uid,
                  message: `그룹채팅이 시작되었습니다.`,
                  // message: `${opponentDisplayName}님과 채팅이 시작되었습니다.`,
                  createdAt: convertDate(
                    Timestamp.fromDate(new Date()).seconds,
                  ),
                });
                setShowAddGroupChat(false);
              }}
            >
              완료
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

export default GroupChatList;
