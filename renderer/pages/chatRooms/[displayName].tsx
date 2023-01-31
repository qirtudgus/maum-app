import { useRouter } from 'next/router';
import styled from 'styled-components';
import ChatRoom from '../../components/newChatRoom';

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
        //해당 컴포넌트에서 쿼리를 직접 사용한다.
        // displayName={router.query.displayName as string}
        // chatRoomUid={router.query.chatRoomUid as string}
        // opponentUid={router.query.opponentUid as string}
        />
      </ChatWrap>
    </>
  );
};

export default User;
