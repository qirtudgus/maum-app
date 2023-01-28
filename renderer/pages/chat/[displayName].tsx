import { useRouter } from 'next/router';
import styled from 'styled-components';
import ChatRoom from '../../components/chatRoom';

const ChatWrap = styled.div`
  width: 100%;
  height: 100%;
  position: relative;
  /* flex-shrink: 0; */
  display: flex;
  flex-direction: column;
`;

const User = () => {
  const router = useRouter();
  return (
    <>
      <ChatWrap>
        <ChatRoom
          displayName={router.query.displayName as string}
          chatRoomUid={router.query.uid as string}
        />
      </ChatWrap>
    </>
  );
};

export default User;
