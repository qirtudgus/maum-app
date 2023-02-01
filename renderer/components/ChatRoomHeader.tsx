import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import styled from 'styled-components';
import { UserList } from '../firebaseConfig';
import CloseSvg from './svg/closeSvg';
import PeopleSvg from './svg/peopleSvg';

const ChatTitle = styled.div`
  width: 100%;
  margin: 0 auto;
  height: 40px;
  line-height: 40px;
  text-align: center;
  font-size: 20px;
  font-weight: bold;
  display: flex;
  justify-content: center;
  border-bottom: 1px solid ${({ theme }) => theme.colors.borderColor};
  position: relative;
  display: flex;

  justify-content: center;
  align-items: center;
  & .closeBtn {
    height: 100%;
    cursor: pointer;
    position: absolute;
    display: flex;
    justify-content: center;
    align-items: center;
    right: 10px;
  }
`;

const UserListWrap = styled.div`
  position: absolute;
  height: fit-content;
  top: 35px;
  z-index: 20;
  padding: 10px 15px;
  background: #fff;
  box-shadow: ${({ theme }) => theme.boxShadow};
  font-size: 15px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: flex-start;
  cursor: default;
  border-radius: 5px;
`;

const UserListli = styled.li`
  line-height: 20px;
  height: 20px;
  margin-bottom: 3px;
`;

const UserListButton = styled.div`
  height: 30px;
  cursor: pointer;
  display: flex;
  user-select: none;
  justify-content: center;
  align-items: center;
  border-radius: 5px;
  margin-left: 10px;
  & svg {
    width: 20px;
    height: 20px;
  }
  & .userListCount {
    font-size: 15px;
  }
`;

const ChatRoomHeader = ({
  title,
  userList,
}: {
  title: string;
  userList?: UserList[];
}) => {
  const router = useRouter();
  const [isOpenUserList, setIsOpenUserList] = useState(false);
  useEffect(() => {
    return () => {
      setIsOpenUserList(false);
    };
  }, []);

  return (
    <ChatTitle>
      {title}
      <span
        title='닫기'
        className='closeBtn'
        onClick={() => {
          // router.push('/chatRooms');
          router.back();
        }}
      >
        <CloseSvg />
      </span>
      {router.pathname.startsWith('/groupChatRooms') && (
        <UserListButton
          onClick={() => {
            setIsOpenUserList((prev) => !prev);
          }}
        >
          <PeopleSvg />
          {isOpenUserList && (
            <UserListWrap>
              {userList.map((i, index) => {
                return <UserListli key={index}>{i.displayName}</UserListli>;
              })}
            </UserListWrap>
          )}
          <span className='userListCount'>{userList.length}</span>
        </UserListButton>
      )}
    </ChatTitle>
  );
};

export default ChatRoomHeader;
