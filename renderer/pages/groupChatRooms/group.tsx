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
        <NewGroupChatRoom />
      </ChatWrap>
    </>
  );
};

export default User;
