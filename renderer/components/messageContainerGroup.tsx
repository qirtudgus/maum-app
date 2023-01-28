import React from 'react';
import { useEffect, useLayoutEffect, useRef } from 'react';
import styled from 'styled-components';
import { authService } from '../firebaseConfig';

const MessageContainers = styled.div`
  position: relative;
  width: 100%;
  height: 100%;
  overflow-y: auto;
  background: #fff;
  padding-top: 25px;
  /* overflow-x: hidden; */
`;

interface MessageSendData {
  createdAt: string;
}

const MessageWrap = styled.div<MessageSendData>`
  width: 95%;
  margin: 0 auto;
  position: relative;
  display: flex;
  align-items: flex-start;
  /* justify-content: flex-start; */
  flex-direction: column;

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
    left: 50px;
    font-size: 12px;
    color: #494949;
  }
  /* &.myMessage > li::after {
    content: '';
  }

  &.myMessage > li::before {
    content: '${(props) => props.createdAt}';
    position: absolute;
    left: -140px;
    font-size: 12px;
  } */

  & .messageWrite {
    font-weight: bold;
    margin-bottom: 5px;
  }
`;

const Message = styled.li`
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

const MessageContainerGroup = ({
  chatList,
}: {
  chatList: { displayName: string; createdAt: string; message: string }[];
}) => {
  const messageContainerScrollHandler = useRef<HTMLDivElement>();

  //메시지dom이 그려진 후 스크롤 맨 아래로 이동
  useLayoutEffect(() => {
    messageContainerScrollHandler.current.scrollTop =
      messageContainerScrollHandler.current.scrollHeight;
  }, [chatList]);

  return (
    <MessageContainers id='msgWrap' ref={messageContainerScrollHandler}>
      {chatList.map((i, index, mine) => {
        return (
          <>
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
              <Message>{i.message}</Message>
            </MessageWrap>
          </>
        );
      })}
    </MessageContainers>
  );
};

export default React.memo(MessageContainerGroup);