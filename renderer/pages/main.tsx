import React, { useEffect, useRef, useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import {
  authService,
  createChatUid,
  getUserDataRef,
  getUserList,
  realtimeDbService,
} from '../firebaseConfig';
import { get, onDisconnect, push, ref, set, update } from 'firebase/database';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { useRouter } from 'next/router';
import OnUserList from '../components/onUserList';
import { Timestamp } from 'firebase/firestore';
import styled from 'styled-components';
import ChatRoom from '../components/chatRoom';
import GroupChatList from '../components/groupChatList';
import GroupChatRoom from '../components/groupChatRoom';

const Wrap = styled.div`
  width: 100%;
  height: 100vh;
  display: flex;
`;

const MenuWrap = styled.div`
  max-width: 300px;
  border-right: 1px solid #eee;
  display: flex;
  flex-direction: column;
`;

const ChatWrap = styled.div`
  width: 100%;
  position: relative;
  min-width: 400px;
  display: flex;
  flex-direction: column;
`;

const SideBarWrap = styled.div`
  width: 50px;
  flex-shrink: 0;
  height: 100%;
  background: #eee;
`;

function Home() {
  // 마음연구소 솔루션이라면 어떻게 생겼을지 상상하며..
  //채팅방 자료구조는?

  /*
  1. 채팅 고유 id = ${chatRommsUid}를 생성하여 각 유저의 id와 채팅 고유 id를 저장
  /oneToOneChatRooms/${uid}/${opponentUid}/${chatRoomsUid} = 내 일대일 채팅방중에 상대방과 채팅룸아이디 저장
  /oneToOneChatRooms/${opponentUid}/${uid}/${chatRoomsUid} =  상대방의 채팅방중에도 내이름과 채팅룸 아이디 저장
  /oneToOneChatRooms/${chatRoomsUid} = 랜덤한 룸아이디 저장 = 해당 경로의 chat에 대화내용을 저장
  2. 채팅할 상대방 클릭 시 
  채팅방 제목은 클릭 시 state로 관리
  채팅방 내용은 클릭 한 상대방의 uid가 내 uid에 들어있는지 확인.
  2-1.들어있다면 한 층 더 들어가서, chatRoomsUid를 습득하고
  /oneToOneChatRooms/${chatRoomsUid} 에서 데이터를 가져와서 나열시킨다.
  2-2. 들어있지않다면 chatRoomsUid를 생성 후 데이터를 가져와서 나열시킨다.   
  */

  const [isStartChat, setIsStartChat] = useState(false);
  const [isStartGroupChat, setIsStartGroupChat] = useState(false);
  const [chatRoomInfo, setChatRoomInfo] = useState({
    displayName: '',
    chatRoomUid: '',
  });

  const uid = authService.currentUser?.uid;
  const displayName = authService.currentUser?.displayName;
  const router = useRouter();
  const userSignOut = async () => {
    try {
      signOut(authService).then(() => {
        //로그아웃시 해당 유저의 상태를 false로 만들어 렌더링 시 회색(?)으로 뜨게 하자
        //fix:유저구조가 변경되어 안쓴다.
        // set(myConnectionsRef, false);
        //로그인 시 미리 할당되어있는 uid값을 사용해야함 여기서 새로 참조하면 이미 로그아웃 후라 값이 없음.
        if (uid) {
          const myConnectionsRef = ref(realtimeDbService, `userList/${uid}`);
          //유저구조중에 isOn값만 false로 만들기, 아래처럼 update 함수를 호출 // 정상작동
          update(myConnectionsRef, { isOn: false });
          router.push('/home');
        }
      });
    } catch (error) {
      console.log(error);
    }
  };

  interface groupChatListInterface {
    groupChatUid: string;
    // [key: number]: groupChatListInnerInterface;
  }
  interface groupChatListInnerInterface {
    groupChatUid: string;
  }

  return (
    <Wrap>
      <Head>
        <title>Home - Nextron (with-typescript)</title>
      </Head>
      <SideBarWrap>
        <div>메뉴</div>
      </SideBarWrap>
      <MenuWrap>
        {uid && <div>환영합니다 {displayName}님!</div>}
        {uid ? (
          <button onClick={userSignOut}>로그아웃</button>
        ) : (
          <>
            <Link href='/home'>로그인</Link>
            <Link href='/register'>회원가입</Link>
          </>
        )}

        {
          <>
            <OnUserList
              setIsStartChat={setIsStartChat}
              setIsStartGroupChat={setIsStartGroupChat}
              setChatRoomInfo={setChatRoomInfo}
            />
            <GroupChatList
              setIsStartChat={setIsStartChat}
              setIsStartGroupChat={setIsStartGroupChat}
              setChatRoomInfo={setChatRoomInfo}
            />
          </>
        }
      </MenuWrap>
      {isStartChat && (
        <ChatWrap>
          <ChatRoom
            chatRoomInfo={chatRoomInfo}
            setIsStartChat={setIsStartChat}
            setIsStartGroupChat={setIsStartGroupChat}
          />
        </ChatWrap>
      )}
      {isStartGroupChat && (
        <ChatWrap>
          <GroupChatRoom
            chatRoomInfo={chatRoomInfo}
            setIsStartChat={setIsStartChat}
            setIsStartGroupChat={setIsStartGroupChat}
          />
        </ChatWrap>
      )}
    </Wrap>
  );
}

export default Home;

{
  /* <button
onClick={() => {
  console.log('로그인 상태확인');
  const uid: string = authService.currentUser?.uid;
  console.log(authService.currentUser);
  // console.log(authService.currentUser.displayName);
  console.log(uid);
  // return uid;
}}
>
로그인 상태 확인
</button>
<button
onClick={() => {
  onAuthStateChanged(authService, (user) => {
    console.log(user);

    console.log(authService.currentUser);
    //로그인중이면 유저정보
    //로그아웃이면 null 반환
  });
}}
>
로그인 상태 확인
</button>
<button
onClick={async () => {
  const 내채팅방 = ref(
    realtimeDbService,
    `userList/${authService.currentUser.uid}/myGroupChatList/groupChatUid`,
  );

  //해당 유저의 채팅방 길이를 가져온다.
  const 데이터전 = (await get(내채팅방)).size;
  //길이에 고유값을 추가한다.
  update(내채팅방, { [데이터전]: 'test' });
}}
>
그룹채팅방 고유id 하나 업데이트
</button>
<button onClick={getUserList}>현재 접속 유저 확인</button>
<button
onClick={async () => {
  //push로 하면 고유키때문에 너무 번거로워진다.
  //get을 통해 배열화 시킨 후
  //해당 배열에 추가될 그룹코드를 push()해준 뒤에
  //set을 통해 새로운 배열로 덮어씌워준다.
  let 그룹채팅 = ref(
    realtimeDbService,
    `userList/${uid}/myGroupChatList`,
  );

  console.log('그룹챗에 id 넣기');
  if (authService.currentUser?.uid) {
    // let 현재그룹채팅 = await get(그룹채팅);
    let 현재그룹채팅배열: any[] = await (await get(그룹채팅)).val()
      ?.groupChatUid;
    if (현재그룹채팅배열) {
      let 고유번호 = createChatUid();
      console.log(현재그룹채팅배열);
      //추가마다 배열을 복사해와서 추가해준 뒤 set한다.
      let 갱신채팅배열 = [...현재그룹채팅배열, 고유번호];
      console.log(갱신채팅배열);
      set(그룹채팅, {
        groupChatUid: 갱신채팅배열,
      });
    } else {
      let 고유번호 = createChatUid();
      set(그룹채팅, {
        groupChatUid: [고유번호],
      });
    }
  } else {
    alert('로그인 후 이용해주세요.');
  }
}}
>
userList에 그룹챗id 넣기
</button>
<button
onClick={async () => {
  if (authService.currentUser?.uid) {
    let 그룹챗정보 = await get(
      ref(realtimeDbService, `userList/${uid}/myGroupChatList`),
    );
    //유저의 채팅리스트 코드가 들어있음.
    let 그룹챗리스트: groupChatListInterface[] = Object.values(
      그룹챗정보.val(),
    );
    //순회하면서 렌더링해주면 될듯

    console.log(그룹챗리스트[0]);
  }
}}
>
내 그룹챗 정보 불러오기
</button>
<button
onClick={async () => {
  //불러와서 고유키를 삭제한 배열을 가공하여 다시 집어넣어준다.
  if (authService.currentUser?.uid) {
    let 그룹챗정보 = await get(
      ref(
        realtimeDbService,
        `userList/${uid}/myGroupChatList/groupChatUid`,
      ),
    );

    let 그룹챗배열: string[] = [...그룹챗정보.val()];

    console.log(그룹챗배열);
    let 삭제인덱스 = 그룹챗배열.indexOf('0pjezkg9ij');
    //splice는 삭제된 배열을 반환하고 원본배열에서 변경된다.
    //배열에 없는 uid가 들어오면 인덱스에 -1이 반환되어 맨 뒤 배열이 삭제된다.
    //배열에 없는 경우에 대한 에러 처리를 하자
    if (삭제인덱스 !== -1) {
      if (confirm(`이 방에서 나가시겠습니까?`)) {
        그룹챗배열.splice(삭제인덱스, 1);
        let 그룹채팅 = ref(
          realtimeDbService,
          `userList/${uid}/myGroupChatList`,
        );

        set(그룹채팅, {
          groupChatUid: 그룹챗배열,
        });
      }
    } else {
      alert('존재하지않는 채팅방입니다.');
    }

    console.log(그룹챗배열);
  }
}}
>
내 특정 그룹챗 삭제하기
</button> */
}
