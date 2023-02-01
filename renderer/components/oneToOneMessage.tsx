import { useEffect, useState } from 'react';
import styled from 'styled-components';
import { ChatDataNew } from '../pages/chatList';
import { convertDate } from '../utils/convertDate';

const MessageWrap = styled.div`
  min-height: 30px;
  display: flex;
  justify-content: center;
  align-items: center;
  flex-direction: row-reverse;
  background: #fff;
`;

const MessageComponent = styled.li`
  width: fit-content;
  position: relative;
  padding: 7px 10px;
  max-width: 100%;
  color: #000;
  background: #fff;
  max-height: fit-content;

  /* padding: 13px 10px; */
  border-radius: 7px;
  box-shadow: 0px 0px 1px 1px rgba(0, 0, 0, 0.2);
  /* background: #fff; */
`;

const ReadCount = styled.div`
  font-size: 14px;
  padding: 0px 5px;
  font-weight: bold;
  color: ${({ theme }) => theme.colors.main};
`;

const TimeStamp = styled.span`
  font-size: 12px;
  padding: 0px 5px;
  color: #494949;
`;

const OneToOneMessage = ({ message }: { message: ChatDataNew }) => {
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
    <MessageWrap>
      <TimeStamp>{convertDate(message.createdSecondsAt)}</TimeStamp>
      {readCount !== 0 && <ReadCount>{readCount}</ReadCount>}
      <MessageComponent>{message.message}</MessageComponent>
    </MessageWrap>
  );
};

export default OneToOneMessage;
