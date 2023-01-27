import { get, onValue, push, ref, set, update } from 'firebase/database';
import { Timestamp } from 'firebase/firestore';
import Head from 'next/head';
import React, { useEffect, useRef, useState } from 'react';
import styled from 'styled-components';
import {
  authService,
  getUserList,
  realtimeDbService,
  UserList,
} from '../firebaseConfig';
import { convertDate } from './chatRoom';
import LoadingSpinner from './LoadingSpinner';
import MessageContainerFront from './messageContainer';

const Message = styled.li`
  &.myMessage {
    color: red;
    text-align: right;
  }
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

const GroupChatRoom = ({
  chatRoomInfo,
  setIsStartChat,
  setIsStartGroupChat,
}: {
  chatRoomInfo: { displayName: string; chatRoomUid: string };
  setIsStartChat: React.Dispatch<React.SetStateAction<boolean>>;
  setIsStartGroupChat: React.Dispatch<React.SetStateAction<boolean>>;
}) => {
  const [chatList, setChatList] = useState([]);
  const [connectedUserList, setConnectedUserList] = useState<UserList[]>([]);
  const [showAddGroupChat, setShowAddGroupChat] = useState(false);
  const [groupChatUserList, setGroupChatUserList] = useState<UserList[]>([]);
  const [addUserList, setAddUserList] = useState<UserList[]>([]);

  const [isChatLoading, setIsChatLoading] = useState(false);

  const messageInputRef = useRef<HTMLInputElement>();

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

  const SendMessage = async () => {
    //저장할 경로
    const 채팅저장경로 = ref(
      realtimeDbService,
      `groupChatRooms/${chatRoomInfo.chatRoomUid}/chat`,
    );
    let message = messageInputRef.current.value;

    await push(채팅저장경로, {
      displayName: authService.currentUser.displayName,
      uid: authService.currentUser.uid,
      message: message,
      createdAt: convertDate(Timestamp.fromDate(new Date()).seconds),
    });
    messageInputRef.current.focus();
    messageInputRef.current.value = '';

    //메시지 작성 후 비워주기
  };

  //useEffect onValue로 채팅을 계속 가져와야함
  useEffect(() => {
    console.log(`현재 채팅방 : ${chatRoomInfo.chatRoomUid}`);
    //채팅 onValue
    const 채팅경로 = ref(
      realtimeDbService,
      `groupChatRooms/${chatRoomInfo.chatRoomUid}/chat`,
    );
    onValue(채팅경로, (snapshot) => {
      console.log('채팅이 갱신되었습니다');
      //   console.log(snapshot.val());
      //   let a = snapshot.val();
      let a = snapshot.val();

      console.log(a);
      let messageList = Object.values(a);
      setChatList(messageList);
    });
    //현재채팅방 사용유저 onValue
    let 고유채팅인원경로 = ref(
      realtimeDbService,
      `groupChatRooms/${chatRoomInfo.chatRoomUid}/connectedUser`,
    );
    onValue(고유채팅인원경로, async (snapshot) => {
      console.log('사용자가 갱신되었습니다.');
      let 갱신배열 = await snapshot.val();
      console.log('그룹채팅 사용자목록에서 불러온 온밸류 배열');
      console.log(갱신배열);
      setConnectedUserList(갱신배열);
    });

    setIsChatLoading(true);

    return () => {
      //로그아웃시에도 채팅창이 닫히도록..
      //지금은 채팅창 컴포넌트를 띄운채로 로그아웃 시
      //계정데이터를 못읽어와서 오류가 난다.

      // 해당코드를 넣으면 로그아웃시 오류는 없지만 채팅방을 옮길 때 두번 눌러줘야한다.
      //   setIsStartChat(false);
      console.log('채팅방을 나갔습니다.');
    };
  }, [chatRoomInfo.chatRoomUid]);

  useEffect(() => {
    //참여자 불러오기
    const 고유인원배열리턴 = async () => {
      let 고유채팅인원경로 = ref(
        realtimeDbService,
        `groupChatRooms/${chatRoomInfo.chatRoomUid}/connectedUser`,
      );
      let 고유채팅인원리스트 = await (await get(고유채팅인원경로)).val();
      return 고유채팅인원리스트;
    };

    console.log('유즈이펙트로 불러온 리스트');

    고유인원배열리턴().then((res) => {
      console.log(res);
      setConnectedUserList(res);
    });
  }, []);

  return (
    <>
      <Head>
        <title>maumTalk - {chatRoomInfo.displayName} 그룹채팅</title>
      </Head>
      <div>{chatRoomInfo.displayName} 채팅방</div>
      <div>
        참여자:{' '}
        {connectedUserList.map((i, index) => {
          return <li key={index}>{i.displayName}</li>;
        })}
      </div>
      {isChatLoading ? (
        <MessageContainerFront chatList={chatList} />
      ) : (
        <LoadingSpinner />
      )}
      <input
        ref={messageInputRef}
        placeholder='메시지를 입력해주세요'
        onKeyDown={(e: React.KeyboardEvent) => {
          if (e.key === 'Enter') SendMessage();
        }}
      ></input>
      <button onClick={SendMessage}>메시지 전송</button>
      <button
        onClick={() => {
          console.log(chatList);
          console.log(convertDate(chatList[0].createdAt.seconds));
        }}
      >
        채팅 로그 확인
      </button>
      <button
        onClick={() => {
          setIsStartGroupChat(false);
        }}
      >
        나가기
      </button>
      <button
        onClick={async () => {
          if (confirm(`${chatRoomInfo.chatRoomUid} 방에서 나가시겠습니까?`)) {
            //퇴장했다는 메시지를 생성하고,
            const 채팅저장경로 = ref(
              realtimeDbService,
              `groupChatRooms/${chatRoomInfo.chatRoomUid}/chat`,
            );

            await push(채팅저장경로, {
              displayName: authService.currentUser.displayName,
              uid: authService.currentUser.uid,
              message: `${authService.currentUser.displayName}님이 채팅방에서 나가셨습니다..`,
              createdAt: convertDate(Timestamp.fromDate(new Date()).seconds),
            });

            // 내 채팅리스트에서 삭제하고,
            let 내채팅리스트경로 = ref(
              realtimeDbService,
              `userList/${authService.currentUser.uid}/myGroupChatList/groupChatUid`,
            );
            let 내그룹채팅리스트 = [
              ...(await (await get(내채팅리스트경로)).val()),
            ];

            let 삭제인덱스 = 내그룹채팅리스트.indexOf(chatRoomInfo.chatRoomUid);
            if (삭제인덱스 !== -1) {
              내그룹채팅리스트.splice(삭제인덱스, 1);
              let 그룹채팅 = ref(
                realtimeDbService,
                `userList/${authService.currentUser.uid}/myGroupChatList`,
              );

              console.log(내그룹채팅리스트);
              set(그룹채팅, {
                groupChatUid: 내그룹채팅리스트,
              });
            } else {
              alert('존재하지않는 채팅방입니다.');
            }

            //고유 채팅리스트에서 유저정보 삭제하고.
            let 고유채팅인원경로 = ref(
              realtimeDbService,
              `groupChatRooms/${chatRoomInfo.chatRoomUid}/connectedUser`,
            );
            let 고유채팅인원리스트 = [
              ...(await (await get(고유채팅인원경로)).val()),
            ];
            let 고유채팅인원세팅경로 = ref(
              realtimeDbService,
              `groupChatRooms/${chatRoomInfo.chatRoomUid}/connectedUser`,
            );

            //같은 uid를 가진 인덱스요소를 제거
            //삭제 후 채팅방의 남은인원이 0명이 될 경우 채팅방도 삭제하면 좋을듯..
            //고유채팅에서 유저정보를 삭제하기전에 사이즈가 1이라면 삭제하면 되겠다.
            //해당값이 1일때 분기하자, 1명 남았으면 그냥 채팅방을 삭제하면됨
            //그럼 채팅 db가 남질않는다. 그냥 채팅방을 남겨두는게 좋을것같다.
            // let 삭제전인원 = (await get(고유채팅인원세팅경로)).size;

            고유채팅인원리스트.forEach((i, index) => {
              if (i.uid === authService.currentUser.uid) {
                고유채팅인원리스트.splice(index, 1);
              }
            });

            set(고유채팅인원세팅경로, 고유채팅인원리스트);

            //삭제 후 퇴장
            setIsStartGroupChat(false);
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
            <button
              onClick={async () => {
                //1.선택된 사용자들의 채팅리스트와, 고유채팅방에 유저목록을 업데이트해주어야한다.
                console.log('초대시도');
                console.log(addUserList); //초대목록이 들어있다...

                //사용자 uid를 순회하면서 /groupChatList/값 update해야한다.
                const 유저채팅리스트업데이트 = async (uid: string) => {
                  const 내채팅방 = ref(
                    realtimeDbService,
                    `userList/${uid}/myGroupChatList/groupChatUid`,
                  );
                  const 데이터사이즈 = (await get(내채팅방)).size;
                  update(내채팅방, {
                    [데이터사이즈]: chatRoomInfo.chatRoomUid,
                  });
                };

                //2. 고유채팅방에 유저목록 업데이트하기
                const 고유채팅방 = ref(
                  realtimeDbService,
                  `groupChatRooms/${chatRoomInfo.chatRoomUid}/connectedUser`,
                );

                //순회하면서 동시에 요청하면 길이 갱신이 안되고 마지막껄로 덮혀쓰이ㅝ진다.
                //배열을 매개변수로 전달하여 한번에 넣어야겠다.
                const 채팅방유저리스트업데이트 = async (item: UserList[]) => {
                  const 데이터사이즈 = (await get(고유채팅방)).size; //두명이면 2겠지
                  //들어온 배열을 순회하며, 채팅방에 유저 업데이트.
                  item.forEach(async (i, index) => {
                    await update(고유채팅방, {
                      [데이터사이즈 + index]: item[index],
                    });
                  });
                };

                //여기서 업데이트를 시켜주고..
                addUserList.forEach(async (i, index) => {
                  await 유저채팅리스트업데이트(i.uid);
                });
                // const 선택배열 = [...addUserList];
                await 채팅방유저리스트업데이트(addUserList);
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

export default GroupChatRoom;
