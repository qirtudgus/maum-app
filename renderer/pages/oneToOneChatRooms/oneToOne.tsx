import styled from 'styled-components';
import ChatRoom from '../../components/newChatRoom';

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
        <ChatRoom />
      </ChatWrap>
    </>
  );
};

export default User;
