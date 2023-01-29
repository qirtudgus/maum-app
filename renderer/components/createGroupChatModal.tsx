import { get, push, ref, set } from 'firebase/database';
import { Timestamp } from 'firebase/firestore';
import { useEffect, useRef, useState } from 'react';
import styled, { keyframes } from 'styled-components';
import {
  authService,
  createChatUid,
  getUserList,
  realtimeDbService,
  UserList,
} from '../firebaseConfig';
import { convertDate } from '../utils/convertDate';
import { BasicButton, SolidButton } from './ButtonGroup';
import CloseSvg from './svg/closeSvg';

const Ani = keyframes`
    from {opacity:0; transform:translateY(-20px)}
    to {opacity:1;transform:translateY(0px)}
`;

const AddGroupChatModal = styled.div`
  top: 0;
  left: 0;
  right: 0;
  position: relative;
  width: 350px;
  height: fit-content;
  padding: 20px 0;
  border-radius: 10px;
  box-shadow: ${({ theme }) => theme.boxShadow};
  background: #fff;
  z-index: 10;
  display: flex;
  flex-direction: column;
  justify-content: center;
  animation: ${Ani} 0.2s;
`;

const GroupChatModalUserList = styled.li`
  cursor: pointer;
  width: 100%;
  height: 50px;

  display: flex;
  margin: 0 auto;

  padding-left: 20px;
  align-items: center;
  justify-content: space-between;
  position: relative;
  &.active {
    /* background: #eee; */
  }
  &:hover {
    background: #eee;
  }

  & .isActive::after {
    content: '';
    top: 10px;
    right: 0;
    position: absolute;
    cursor: pointer;
    width: 30px;
    height: 30px;
    border-radius: 30px;
    /* background: #fff; */
    border: 1px solid ${({ theme }) => theme.colors.borderColor};
  }
  &.active .isActive::after {
    content: '√';
    display: flex;
    align-items: flex-start;
    justify-content: center;
    font-size: 25px;
    /* cursor: pointer;
    width: 30px;
    height: 30px; */
    color: #fff;
    background: ${({ theme }) => theme.colors.main};
  }
`;

const AddUserListWrap = styled.div`
  width: 100%;
  min-height: 40px;
  margin: 10px auto 15px auto;
  display: flex;
  flex-wrap: wrap;
  max-height: 100px;
  overflow-y: auto;
`;

const AddUserList = styled.li`
  width: fit-content;
  height: 30px;
  padding: 1px 2px 1px 10px;
  background: #fff;
  border-radius: 5px;
  margin-right: 10px;
  margin-bottom: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid ${({ theme }) => theme.colors.borderColor};
  & .cancelUser {
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
  }

  & .cancelUser:hover svg {
    opacity: 0.5;
  }
  & svg {
    width: 18px;
    height: 18px;
  }
`;

const PossibleInviteUserListWrap = styled.div`
  height: 250px;
  overflow-y: auto;
`;

const ModalTitle = styled.div`
  font-weight: bold;
  font-size: 20px;
  color: #1f1f1f;
  margin: 10px 0;
  display: flex;
  align-items: center;
  & .userCount {
    margin-left: 5px;
    width: 27px;
    height: 27px;
    font-size: 17px;
    text-align: center;
    line-height: 27px;
    border-radius: 20px;
    background: #eee;
  }
`;

const HeaderWrap = styled.div`
  padding: 0 20px;
`;

const ChatTitleInput = styled.input`
  width: 100%;
  padding: 5px 10px;
  margin-top: 10px;
`;

const ButtonWrap = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
`;

const FixedModalBg = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  bottom: 0;
  right: 0;
  z-index: 11;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
`;

const CreateGroupChatModal = ({
  setShowAddGroupChat,
}: {
  setShowAddGroupChat: React.Dispatch<React.SetStateAction<boolean>>;
}) => {
  const [addUserList, setAddUserList] = useState<UserList[]>([]);
  const [groupChatUserList, setGroupChatUserList] = useState<UserList[]>([]);
  const chatRoomsTitleInputRef = useRef<HTMLInputElement>();
  const [inviteUserCount, setInviteUserCount] = useState(0);

  useEffect(() => {
    getUserList().then((userList) => {
      console.log(userList);
      setShowAddGroupChat(true);
      setGroupChatUserList(userList);
    });
  }, []);

  const createGroupChatRoom = () => {
    const blank_pattern = /^\s+\s+$/g;
    if (
      chatRoomsTitleInputRef.current.value === ' ' ||
      chatRoomsTitleInputRef.current.value.length === 0 ||
      blank_pattern.test(chatRoomsTitleInputRef.current.value)
    ) {
      chatRoomsTitleInputRef.current.focus();
      return;
    }

    //1.한번의 호출로 같은 고유번호를 넣어야하기때문에 미리 선언
    let chatRoomUid = createChatUid();

    //1-1. addUserList에는 아직 현재유저가 빠져있다.
    //본인이 만드는 방이기때문에 state에 본인을 추가한다.
    const addUserListUpdateMe = [...addUserList];
    addUserListUpdateMe.push({
      displayName: authService.currentUser.displayName,
      uid: authService.currentUser.uid,
    });

    //2.초대된 유저를 순회하며, 각 유저들의 채팅리스트를 업데이트해준다.
    addUserListUpdateMe.forEach(async (i) => {
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
      connectedUser: addUserListUpdateMe,
    });
    push(groupChatMessagePath, {
      displayName: authService.currentUser.displayName,
      uid: authService.currentUser.uid,
      message: `그룹채팅이 시작되었습니다.`,
      createdAt: convertDate(Timestamp.fromDate(new Date()).seconds),
    });
    setShowAddGroupChat(false);
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

  const 접두어 = [
    '용감한',
    '어리석은',
    '배고픈',
    '팔이 짧은',
    '꿈을 꾸는',
    '방금 달려온',
    '공부 잘하는',
    '향이 좋은',
    '유쾌한',
    '보고싶은',
  ];

  const 접미어 = [
    '오징어들',
    '호랑이들',
    '천재들',
    '바보들',
    '외계인들',
    '개발자들',
    '회사원들',
    '다람쥐들',
    '강아지들',
    '코끼리들',
  ];

  const RendomTitle = () => {
    return (
      접두어[Math.floor(Math.random() * 10)] +
      ' ' +
      접미어[Math.floor(Math.random() * 10)]
    );
  };

  return (
    <FixedModalBg>
      <AddGroupChatModal>
        <>
          <HeaderWrap>
            <ModalTitle>그룹 채팅 생성</ModalTitle>
            채팅방 이름을 지어주세요.
            <ChatTitleInput
              ref={chatRoomsTitleInputRef}
              placeholder={'채팅방 이름'}
              defaultValue={RendomTitle()}
            ></ChatTitleInput>
            <ModalTitle>
              대화 상대 선택<span className='userCount'>{inviteUserCount}</span>
            </ModalTitle>
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
                          prev.filter((list) => list.uid !== i.uid),
                        );
                        //className이 i.uid와 동일한 요소를 찾아서 active 제거
                        const removeDom = document.querySelector(
                          `.uid${i.uid}`,
                        );
                        removeDom.classList.remove('active');
                        console.log(document.querySelector(`.uid${i.uid}`));
                        setInviteUserCount((prev) => prev - 1);
                      }}
                      className='cancelUser'
                    >
                      <CloseSvg />
                    </span>
                  </AddUserList>
                );
              })}
            </AddUserListWrap>
          </HeaderWrap>
          <PossibleInviteUserListWrap>
            {groupChatUserList.map((i: UserList, index: number) => {
              //나를 제외하고 목록을 보여준다.
              return i.uid === authService.currentUser?.uid ? null : (
                <GroupChatModalUserList
                  key={index}
                  className={`uid${i.uid}`}
                  //   선택 시 클래스를 넣고, 다시 눌렀을 때 클래스가 있는지 확인 후 있으면 삭제, 없으면 추가
                  onClick={(e: React.MouseEvent) => {
                    //액티브가 있는 경우에는 state에서 삭제 후, active 제거
                    if (e.currentTarget.classList.contains('active')) {
                      setAddUserList((prev) =>
                        prev.filter((todo) => todo.uid !== i.uid),
                      );
                      e.currentTarget.classList.remove('active');
                      setInviteUserCount((prev) => prev - 1);
                    }

                    //액티브가 없는 경우에는 추가
                    else {
                      e.currentTarget.classList.add('active');
                      setAddUserList((prev) => [
                        ...prev,
                        { displayName: i.displayName, uid: i.uid },
                      ]);
                      setInviteUserCount((prev) => prev + 1);
                    }
                  }}
                >
                  {i.displayName}
                  {/* 버튼을 active 시킬 때 가상선택자로 추가 해제를 알려준다 */}
                  <div className='isActive'></div>
                </GroupChatModalUserList>
              );
            })}
          </PossibleInviteUserListWrap>
          <ButtonWrap>
            <SolidButton
              width={320}
              height={40}
              OnClick={createGroupChatRoom}
              BasicButtonValue='만들기'
              disabled={inviteUserCount > 0 ? false : true}
            ></SolidButton>
            <BasicButton
              width={320}
              height={40}
              OnClick={() => {
                setShowAddGroupChat(false);
                setAddUserList([]);
              }}
              BasicButtonValue='취소'
            ></BasicButton>
          </ButtonWrap>
        </>
      </AddGroupChatModal>
    </FixedModalBg>
  );
};

export default CreateGroupChatModal;
