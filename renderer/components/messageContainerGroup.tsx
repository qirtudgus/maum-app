import React, { useLayoutEffect, useRef } from 'react';
import styled from 'styled-components';
import { ChatDataNew } from '../utils/makeChatRooms';
import Message from './GroupMessage';
import PersonSvg from './svg/personSvg';

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
  /* margin-bottom: 10px; */
  flex-direction: column;
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

  & > li::after {
    content: '${(props) => props.createdAt}';
    position: absolute;
    /* width: 100%; */
    display: none;
    right: 0px;
    font-size: 12px;
    color: #494949;
  }
  & > li:hover::after {
    display: block;
  }

  & .sameWrite {
    margin: 10px 0px 5px 0;
    font-weight: bold;
    font-size: 15px;
    & > span {
      display: block;
      width: 15px;
      height: 15px;
      background: #eee;
      border-radius: 3px;
      margin-right: 3px;
    }
    & svg {
      width: 15px;
      height: 15px;
      fill: #555;
    }
  }
`;

const MessageContainerGroup = ({ chatList }: { chatList: ChatDataNew[] }) => {
  const messageContainerScrollHandler = useRef<HTMLDivElement>();

  //메시지dom이 그려진 후 스크롤 맨 아래로 이동
  useLayoutEffect(() => {
    messageContainerScrollHandler.current.scrollTop = messageContainerScrollHandler.current.scrollHeight;
  }, [chatList]);

  return (
    <MessageContainers
      id='msgWrap'
      ref={messageContainerScrollHandler}
    >
      {chatList.map((i, index: number) => {
        return (
          <MessageWrap
            key={index}
            createdAt={i.createdAt}
          >
            {index !== 0 ? (
              chatList[index - 1].displayName === i.displayName ? null : (
                <span className='sameWrite'>
                  <span>
                    <PersonSvg />
                  </span>
                  {i.displayName}
                </span>
              )
            ) : (
              <span className='sameWrite'>
                <span>
                  <PersonSvg />
                </span>
                {i.displayName}
              </span>
            )}
            <Message message={i} />
          </MessageWrap>
        );
      })}
    </MessageContainers>
  );
};

export default React.memo(MessageContainerGroup);
