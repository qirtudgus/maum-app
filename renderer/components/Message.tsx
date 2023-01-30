import styled from 'styled-components';
import { ChatDataNew } from '../pages/chatList';

const MessageComponent = styled.li`
  width: fit-content;
  position: relative;
  max-width: 60%;
  /* height: 30px; */
  min-height: 30px;
  max-height: fit-content;
  /* padding: 13px 10px; */
  display: flex;
  align-items: center;
  /* border-radius: 7px; */
  /* box-shadow: 0px 0px 3px 1px rgba(0, 0, 0, 0.2); */
  /* background: #fff; */
  color: #000;
`;

const Message = ({ message }: { message: ChatDataNew }) => {
  return <MessageComponent>{message.message}</MessageComponent>;
};

export default Message;
