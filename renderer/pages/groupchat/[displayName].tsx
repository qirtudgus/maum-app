import styled from 'styled-components';
import NewGroupChatRoom from '../../components/newGroupChatRoom';

const ChatWrap = styled.div`
  width: 100%;
  height: 100%;
  position: relative;
  display: flex;
  flex-direction: column;
`;

const User = () => {
  return (
    <>
      <ChatWrap>
        <NewGroupChatRoom
        // displayName={router.query.displayName as string}
        // chatRoomUid={router.query.uid as string}
        />
      </ChatWrap>
    </>
  );
};

export default User;
