import styled from 'styled-components';
import GroupChatRoom from '../../components/GroupChatRoom';

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
        <GroupChatRoom />
      </ChatWrap>
    </>
  );
};

export default User;
