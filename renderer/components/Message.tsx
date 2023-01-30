import { useEffect, useState } from 'react';
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
  const [readCount, setReadCount] = useState(null);

  //각 메시지에 readUserCount를 넣어서
  //채팅방에 입장할때마다 읽어온 메시지들의 readUserCount를 깎아주는것도 나쁘지않을거같다.

  useEffect(() => {
    //여기서 안읽은 사람의 갯수를 계산해서 state에 설정해주고 렌더링시키자
    // console.log(message);
    let count = 0;
    for (let property in message.readUsers) {
      //   console.log(`${property}: ${message.readUsers[property]}`);

      if (message.readUsers[property] === false) {
        count++;
      }
    }
    setReadCount(count);
  }, [message]);

  return (
    <MessageComponent>
      {message.message}
      <span>안읽은사람 : {readCount}</span>
    </MessageComponent>
  );
};

export default Message;
