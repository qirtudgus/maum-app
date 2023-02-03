import { signOut } from 'firebase/auth';
import { ref, update } from 'firebase/database';
import { useRouter } from 'next/router';
import styled from 'styled-components';
import ChatListSvg from '../components/svg/chatListSvg';
import LogoutSvg from '../components/svg/logoutSvg';
import OneToOneSvg from '../components/svg/oneToOneSvg';
import PeopleSvg from '../components/svg/peopleSvg';
import SettingSvg from '../components/svg/settingSvg';
import { authService, realtimeDbService } from '../firebaseConfig';

const SideBarContainer = styled.div`
  display: flex;
  height: 100%;
  position: relative;
  z-index: 100;
`;

const SideBarWrap = styled.div`
  width: 120px;
  flex-shrink: 0;
  /* height: 100%; */
  background: #006cc5;
  border-right: 1px solid ${({ theme }) => theme.colors.borderColor};
  position: relative;
`;

const HeaderButtonWrap = styled.div`
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  height: fit-content;
`;

const SettingButton = styled.div`
  font-size: 13px;
  color: #fff;
  cursor: pointer;
  width: 120px;
  height: 40px;
  display: flex;
  margin: 5px 0;
  align-items: center;
  justify-content: flex-start;
  &:first-child {
    margin-top: 0px;
  }
  & svg {
    width: 30px;
    height: 30px;
    fill: white;
    margin: 0 5px 0 15px;
  }
  &:hover {
    color: #000;
  }
  &:hover svg {
    fill: #000;
  }
  &.active {
    color: ${({ theme }) => theme.colors.main};
    width: 120px;
    background: #fff;
  }
  &.active svg {
    fill: ${({ theme }) => theme.colors.main};
  }
`;

const UserDisplayName = styled.div`
  height: 40px;
  line-height: 40px;
  text-align: center;
  color: #fff;
  font-size: 14px;
`;

const SideBar = () => {
  const router = useRouter();
  const uid = authService.currentUser?.uid;
  const userSignOut = async () => {
    try {
      signOut(authService).then(() => {
        if (uid) {
          const myConnectionsRef = ref(realtimeDbService, `userList/${uid}`);
          //유저구조중에 isOn값만 false로 만들기, 아래처럼 update 함수를 호출 // 정상작동
          update(myConnectionsRef, { isOn: false });
          router.push('/login');
        }
      });
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <SideBarContainer>
      <SideBarWrap>
        <UserDisplayName>{authService.currentUser.displayName}</UserDisplayName>
        <HeaderButtonWrap>
          <SettingButton
            title='유저 목록'
            //중첩 경로에 대한 액티브 해결책
            //https://stackoverflow.com/questions/53262263/target-active-link-when-the-route-is-active-in-next-js
            className={router.pathname.startsWith('/userList') && 'active'}
            onClick={() => {
              router.push('/userList');
            }}
          >
            <PeopleSvg /> 유저목록
          </SettingButton>
          <SettingButton
            title='일대일 대화 목록'
            className={router.pathname.startsWith('/oneToOneChatRooms') && 'active'}
            onClick={() => {
              router.push('/oneToOneChatRooms');
            }}
          >
            <OneToOneSvg /> 일대일
          </SettingButton>{' '}
          <SettingButton
            title='단체 대화 목록'
            className={router.pathname.startsWith('/groupChatRooms') && 'active'}
            onClick={() => {
              router.push('/groupChatRooms');
            }}
          >
            <ChatListSvg /> 그룹
          </SettingButton>
          <SettingButton
            title='설정'
            className={router.pathname.startsWith('/settings') && 'active'}
            onClick={() => {
              router.push('/settings');
            }}
          >
            <SettingSvg /> 설정
          </SettingButton>
          <SettingButton
            title='로그아웃'
            onClick={userSignOut}
          >
            <LogoutSvg /> 로그아웃
          </SettingButton>
        </HeaderButtonWrap>
      </SideBarWrap>
    </SideBarContainer>
  );
};

export default SideBar;
