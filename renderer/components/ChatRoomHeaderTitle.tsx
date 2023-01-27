import styled from 'styled-components';

const ChatTitle = styled.div`
  width: 100%;
  margin: 0 auto;
  height: 40px;
  line-height: 40px;
  text-align: center;
  font-size: 20px;
  font-weight: bold;
  border-bottom: 1px solid#eee;
  position: relative;
  & .closeBtn {
    cursor: pointer;
    position: absolute;
    right: 10px;
  }
`;

const ChatRoomHeaderTitle = ({
  title,
  ChatStatesetState,
}: {
  title: string;
  ChatStatesetState: React.Dispatch<React.SetStateAction<boolean>>;
}) => {
  return (
    <ChatTitle>
      {title}와의 대화
      <span
        title='닫기'
        className='closeBtn'
        onClick={() => {
          ChatStatesetState(false);
        }}
      >
        X
      </span>
    </ChatTitle>
  );
};

export default ChatRoomHeaderTitle;
