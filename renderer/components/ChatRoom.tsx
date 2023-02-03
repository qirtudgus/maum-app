import { useRouter } from 'next/router';
import styled from 'styled-components';
import { convertDate } from '../utils/convertDate';
import { ChatRoomType, ResultGroupRoom, ResultOneToOneRoom } from '../utils/makeChatRooms';
import PeopleSvg from './svg/peopleSvg';
import PersonSvg from './svg/personSvg';
export const ChatRoomList = styled.li`
  cursor: pointer;
  width: 100%;
  background: #fff;
  padding: 10px;
  height: fit-content;
  display: flex;
  &:hover {
    background: #eee;
  }
`;
export const ChatRoomInfo = styled.div`
  width: 100%;
`;

const ChatRoomLastMessage = styled.div`
  display: flex;
  justify-content: space-between;
  color: #444;
  width: 100%;
  word-break: break-all;
`;
const ChatRoomNotReadCount = styled.div`
  padding: 3px 5px;
  text-align: center;
  color: #fff;
  font-size: 15px;
  font-weight: bold;
  border-radius: 10px;
  background: #d61818;
  width: fit-content;
  height: fit-content;
  flex-shrink: 0;
`;
const ChatRoomTitleAndTime = styled.div`
  display: flex;
  justify-content: space-between;
  margin-bottom: 10px;
  & .title {
    font-size: 15px;
    font-weight: bold;
  }

  & .timeStamp {
    font-size: 15px;
    color: #555;
  }
`;

export const ChatIcon = styled.div`
  position: relative;
  width: 45px;
  height: 45px;
  flex-shrink: 0;
  background: #d0ddff;
  border-radius: 10px;
  margin-right: 10px;
  display: flex;
  justify-content: center;
  align-items: center;
  & svg {
    width: 30px;
    height: 30px;
    fill: #fff;
  }
`;

const ChatRoom = ({
  chatRoom,
  chatRoomType,
}: {
  chatRoom: ResultOneToOneRoom | ResultGroupRoom;
  chatRoomType: ChatRoomType;
}) => {
  const router = useRouter();

  return (
    <>
      <ChatRoomList
        key={chatRoom.chatRoomUid}
        onClick={() => {
          router.push(
            chatRoomType === 'oneToOne'
              ? `/oneToOneChatRooms/oneToOne?displayName=${chatRoom.displayName}&chatRoomUid=${chatRoom.chatRoomUid}`
              : `/groupChatRooms/group?chatRoomsTitle=${chatRoom.displayName}&chatRoomUid=${chatRoom.chatRoomUid}`,
          );
        }}
      >
        <ChatIcon>{chatRoomType === 'oneToOne' ? <PersonSvg /> : <PeopleSvg />}</ChatIcon>
        <ChatRoomInfo>
          <ChatRoomTitleAndTime>
            <span className='title'>{chatRoom?.displayName}</span>
            <span className='timeStamp'>{convertDate(chatRoom.createdSecondsAt)}</span>
          </ChatRoomTitleAndTime>
          <ChatRoomLastMessage>
            <div className='message'>{chatRoom.lastMessage}</div>
            {chatRoom.notReadCount !== 0 && <ChatRoomNotReadCount>{chatRoom.notReadCount}</ChatRoomNotReadCount>}
          </ChatRoomLastMessage>
        </ChatRoomInfo>
      </ChatRoomList>
    </>
  );
};

export default ChatRoom;
