import { ref, push, update } from 'firebase/database';
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

export interface ConnectedUser {
  displayName: string;
  isOn: boolean;
  lastConnectTimeStamp: number;
  uid: string;
}

//읽음표시해야하는 유저의 uid를 받아와야할듯하다.
const SendMessageInput = ({
  chatRoomUid,
  isOneToOneOrGroup,
  connectedUsers,
}: {
  chatRoomUid: string;
  isOneToOneOrGroup: 'oneToOne' | 'group';
  connectedUsers: ConnectedUser[];
}) => {
  const [inputValue, setInputValue] = useState('');
  const [isOnlySpaceInputValue, setIsOnlySpaceInputValue] = useState(true);
  const messageInputRef = useRef<HTMLInputElement>();
  const messageSendRef = useRef<HTMLButtonElement>();

  const SendMessage = async () => {
    console.log('chatRoom에서 받아온 연결유저목록');
    console.log(connectedUsers);
    //메시지 전송 시 이미 접속중인 유저는 바로 읽음표시로 전달해줄 객체
    let onUserObj = new Object();
    connectedUsers.forEach((i) => {
      // isOn true일때만
      if (i.isOn === true) {
        onUserObj[`${i.uid}`] = true;
      } else {
        onUserObj[`${i.uid}`] = false;
      }
    });

    //저장할 경로 - props로 일대일, 그룹일 경우로 분기
    const 채팅저장경로분기 =
      isOneToOneOrGroup === 'oneToOne'
        ? ref(realtimeDbService, `oneToOneChatRooms/${chatRoomUid}/chat`)
        : ref(realtimeDbService, `groupChatRooms/${chatRoomUid}/chat`);

    // const 라스트메시지 = ref(
    //   realtimeDbService,
    //   `oneToOneChatRooms/${chatRoomUid}`,
    // );

    await push(채팅저장경로분기, {
      displayName: authService.currentUser.displayName,
      uid: authService.currentUser.uid,
      message: messageInputRef.current.value,
      createdSecondsAt: Timestamp.fromDate(new Date()).seconds,
      createdAt: convertDate(Timestamp.fromDate(new Date()).seconds),
      readUsers: onUserObj,
      //이러면 일대일만 되고 그룹채팅에서 사용할 수가 없다...
      // [authService.currentUser.uid]: true,
      // [opponentUid]: false,
    });

    //마지막메시지 따로 저장해주기 이는 채팅목록의 메시지에 뜬다.
    //로직변경으로 인해 update해줄 필요 없어졌다.
    // const 라스트메시지분기 =
    // isOneToOneOrGroup === 'oneToOne'
    //   ? ref(realtimeDbService, `oneToOneChatRooms/${chatRoomUid}`)
    //   : ref(realtimeDbService, `groupChatRooms/${chatRoomUid}`);
    // update(라스트메시지분기, { lastMessage: messageInputRef.current.value });

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
