import { get, onValue, push, ref, set } from 'firebase/database';
import { useRouter } from 'next/router';
import React, { useEffect, useRef, useState } from 'react';
import styled from 'styled-components';
import {
  authService,
  realtimeDbService,
  getGroupChatRoomsUidToTitleFunc,
} from '../firebaseConfig';
import InviteGroupChatModal from './inviteGroupChatModal';

export const GroupListTitle = styled.div`
  display: flex;
  height: 40px;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding: 5px;
  font-weight: bold;
  margin: 0 auto;
  color: #1a1a1a;
  border-bottom: 1px solid ${({ theme }) => theme.colors.borderColor};
  font-size: 15px;
  & .addGroupChatButton {
    cursor: pointer;
    font-size: 22px;
  }
  & .addGroupChatButton:hover {
    font-weight: bold;
  }
`;

const GroupChatContainer = styled.div`
  width: 100%;
  height: 50%;
  position: relative;
  background: ${({ theme }) => theme.colors.sub};
`;

const GroupListWrap = styled.div`
  width: 100%;
  height: calc(100% - 40px);
  background: ${({ theme }) => theme.colors.sub2};
  overflow-y: auto;
`;

const GroupListLi = styled.li`
  cursor: pointer;
  width: 95%;
  margin: 0 auto;
  /* max-width: 300px; */
  flex-shrink: 0;
  height: 30px;
  line-height: 30px;
  margin-bottom: 5px;
  user-select: none;
  border: 1px solid#eee;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  &:hover {
    background: #eee;
  }

  &#groupChatActive {
    background: ${({ theme }) => theme.colors.main};
  }
`;

const GroupChatList = () => {
  const [showAddGroupChat, setShowAddGroupChat] = useState(false);
  const [currentGroupChat, setCurrentGroupChat] = useState({
    chatUid: '',
    chatTitle: '',
  });

  interface groupChatList {
    chatUid: string;
    chatTitle: string;
  }
  const [groupChatAllList, setGroupChatAllList] = useState<groupChatList[]>([]);

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
          getGroupChatRoomsUidToTitleFunc(groupChatUidList).then(
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
    setShowAddGroupChat(true);
  };

  const router = useRouter();

  const enterGroupChatRoom = (item: groupChatList) => {
    router.push(`/groupchat/${item.chatTitle}?uid=${item.chatUid}`);
  };

  return (
    <GroupChatContainer>
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
              id={
                item.chatUid === currentGroupChat.chatUid
                  ? 'groupChatActive'
                  : ''
              }
              onDoubleClick={() => {
                console.log(item);
                setCurrentGroupChat(item);
                enterGroupChatRoom(item);
              }}
            >
              {item.chatTitle}
            </GroupListLi>
          );
        })}
      </GroupListWrap>
      {showAddGroupChat && (
        <InviteGroupChatModal setShowAddGroupChat={setShowAddGroupChat} />
      )}
    </GroupChatContainer>
  );
};

export default React.memo(GroupChatList);
