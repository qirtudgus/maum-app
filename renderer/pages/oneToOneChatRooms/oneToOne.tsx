import styled from 'styled-components';
import OneToOneChatRoom from '../../components/oneToOneChatRoom';

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
        <OneToOneChatRoom />
      </ChatWrap>
    </>
  );
};

export default User;
