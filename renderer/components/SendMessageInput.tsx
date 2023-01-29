import { ref, push } from 'firebase/database';
import { Timestamp } from 'firebase/firestore';
import { useRef, useState } from 'react';
import styled from 'styled-components';
import { realtimeDbService, authService } from '../firebaseConfig';
import { checkBlankValue } from '../utils/checkBlankValue';
import { convertDate } from '../utils/convertDate';

const MessageInput = styled.div`
  width: 100%;
  border: 1px solid#eee;
  padding: 5px;
  display: flex;
  align-items: center;
  & > input {
    padding: 10px 10px;
    width: 100%;
    border: none;
  }

  & > input:focus {
    outline: none;
  }
  & > button {
    cursor: pointer;
    border: none;
    border-radius: 4px;
    flex-shrink: 0;
    padding: 10px;
    background: ${({ theme }) => theme.colors.main};
  }
  & > button:disabled {
    background-color: #eee;
  }

  & > button:enabled {
    color: #fff;
  }

  & > button:enabled:hover {
    background: ${({ theme }) => theme.colors.mainHoverColor};
  }
`;

const Footer = styled.div`
  width: 100%;
  height: 100px;
  background-color: #fff;
`;

const SendMessageInput = ({
  displayName,
  chatRoomUid,
  isOneToOneOrGroup,
}: {
  displayName: string;
  chatRoomUid: string;
  isOneToOneOrGroup: 'oneToOne' | 'group';
}) => {
  const [inputValue, setInputValue] = useState('');
  const [isOnlySpaceInputValue, setIsOnlySpaceInputValue] = useState(true);
  const messageInputRef = useRef<HTMLInputElement>();
  const messageSendRef = useRef<HTMLButtonElement>();

  const SendMessage = async () => {
    //저장할 경로 - props로 일대일, 그룹일 경우로 분기
    const 채팅저장경로분기 =
      isOneToOneOrGroup === 'oneToOne'
        ? ref(realtimeDbService, `oneToOneChatRooms/${chatRoomUid}/chat`)
        : ref(realtimeDbService, `groupChatRooms/${chatRoomUid}/chat`);

    await push(채팅저장경로분기, {
      displayName: authService.currentUser.displayName,
      uid: authService.currentUser.uid,
      message: messageInputRef.current.value,

      createdAt: convertDate(Timestamp.fromDate(new Date()).seconds),
    });

    //메시지 작성 후 비워주기
    messageInputRef.current.focus();
    setInputValue('');
    setIsOnlySpaceInputValue(true);
  };

  return (
    <>
      <MessageInput>
        <input
          ref={messageInputRef}
          placeholder='메시지를 입력해주세요'
          value={inputValue}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
            setInputValue(e.currentTarget.value);
            if (checkBlankValue(e.currentTarget.value)) {
              setIsOnlySpaceInputValue(true);
            } else {
              setIsOnlySpaceInputValue(false);
            }
          }}
          onKeyDown={(e: React.KeyboardEvent) => {
            if (e.key === 'Enter') messageSendRef.current.click();
          }}
        ></input>
        <button
          ref={messageSendRef}
          disabled={isOnlySpaceInputValue}
          onClick={SendMessage}
        >
          전송
        </button>
      </MessageInput>
      <Footer />
    </>
  );
};

export default SendMessageInput;
