import { Timestamp } from 'firebase/firestore';
import React from 'react';
import { useEffect, useLayoutEffect, useRef } from 'react';
import styled from 'styled-components';
import { ChatDataNew } from '../pages/chatRooms';
import Message from './GroupMessage';

const MessageContainers = styled.div`
  position: relative;
  width: 100%;
  height: 100%;
  overflow-y: auto;
  background: #fff;
  padding: 25px 10px 10px 10px;
`;

interface MessageSendData {
  createdAt: string;
}

const MessageWrap = styled.div<MessageSendData>`
  width: 100%;
  margin: 0 auto;
  position: relative;
  display: flex;
  align-items: flex-start;
  /* justify-content: flex-start; */
  flex-direction: column;
  &:hover {
    background: #eee;
  }
  margin-bottom: 10px;
  /* flex-direction: column; */
  &.myMessage {
    align-items: flex-end;
  }

  &.myMessage > li {
    background: ${({ theme }) => theme.colors.main};
  }

  & .sendDate {
    font-size: 12px;
    color: #494949;
  }

  & > span {
    display: flex;
    align-items: center;
    width: 100%;
    position: relative;
  }

  & > span::after {
    content: '${(props) => props.createdAt}';
    position: absolute;
    /* width: 100%; */
    right: 0px;
    font-size: 12px;
    color: #494949;
  }

  & .messageWrite {
    font-weight: bold;
    margin-bottom: 5px;
  }
`;

const MessageContainerGroup = ({ chatList }: { chatList: ChatDataNew[] }) => {
  const messageContainerScrollHandler = useRef<HTMLDivElement>();

  //메시지dom이 그려진 후 스크롤 맨 아래로 이동
  useLayoutEffect(() => {
    messageContainerScrollHandler.current.scrollTop =
      messageContainerScrollHandler.current.scrollHeight;
  }, [chatList]);

  return (
    <MessageContainers id='msgWrap' ref={messageContainerScrollHandler}>
      {chatList.map((i, index) => {
        return (
          <React.Fragment key={index}>
            <MessageWrap
              createdAt={i.createdAt}
              key={index}
              //본인 메시지일 경우에 대한 스타일링용 className
              // className={
              //   i.displayName === authService.currentUser.displayName &&
              //   'myMessage'
              // }
            >
              <span className='messageWrite'>{i.displayName}</span>

              <Message message={i} />
            </MessageWrap>
          </React.Fragment>
        );
      })}
    </MessageContainers>
  );
};

export default React.memo(MessageContainerGroup);
