import { signOut } from 'firebase/auth';
import { ref, update } from 'firebase/database';
import router from 'next/router';
import { useState } from 'react';
import styled from 'styled-components';
import GroupChatList from '../components/newGroupChatList';
import OnUserList from '../components/onUserList';
import HomeSvg from '../components/svg/homeSvg';
import LogoutSvg from '../components/svg/logoutSvg';
import SettingSvg from '../components/svg/settingSvg';
import { authService, realtimeDbService } from '../firebaseConfig';

const SideBarContainer = styled.div`
  display: flex;
  height: 100%;
  position: relative;
  z-index: 100;
`;

const SideBarWrap = styled.div`
  width: 60px;
  flex-shrink: 0;
  /* height: 100%; */
  background: #006cc5;
  border-right: 1px solid ${({ theme }) => theme.colors.borderColor};
  position: relative;
`;

const HeaderButtonWrap = styled.div`
  width: 100%;
  position: absolute;
  display: flex;
  flex-direction: column;
  align-items: center;
  top: 5px;
  height: fit-content;

  & > div {
    margin: 5px 0;
  }
`;

const LogoutButton = styled.div`
  cursor: pointer;
  /* position: absolute; */

  width: fit-content;
  height: 35px;
  display: flex;
  justify-content: center;
  align-items: center;
  & svg {
    width: 30px;
    height: 30px;
  }
  &:hover svg {
    fill: #000;
  }
`;

const FooterButtonWrap = styled.div`
  width: 100%;
  position: absolute;
  display: flex;
  flex-direction: column;
  align-items: center;
  bottom: 5px;
  height: fit-content;

  & > div {
    margin: 5px 0;
  }
`;

const SettingButton = styled.div`
  cursor: pointer;
  /* position: absolute; */

  width: fit-content;
  height: 35px;
  display: flex;
  justify-content: center;
  align-items: center;
  & svg {
    width: 30px;
    height: 30px;
  }
  &:hover svg {
    fill: #000;
  }
`;

const MenuWrap = styled.div`
  max-width: 300px;
  min-width: 150px;
  position: relative;
  height: 100%;
  border-right: 1px solid ${({ theme }) => theme.colors.borderColor};
  display: flex;
  flex-direction: column;
`;

const MyDisplayName = styled.div`
  font-size: 15px;
  font-weight: bold;
  height: 40px;
  text-align: center;
  line-height: 40px;
  border-bottom: 1px solid ${({ theme }) => theme.colors.borderColor};
`;

const SideBar = () => {
  const uid = authService.currentUser?.uid;
  const userSignOut = async () => {
    try {
      signOut(authService).then(() => {
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

  return (
    <SideBarContainer>
      <SideBarWrap>
        <HeaderButtonWrap>
          <SettingButton
            title='홈으로'
            onClick={() => {
              router.push('/main');
            }}
          >
            <HomeSvg />
          </SettingButton>
        </HeaderButtonWrap>
        <FooterButtonWrap>
          <SettingButton
            title='설정'
            onClick={() => {
              router.push('/settings');
            }}
          >
            <SettingSvg />
          </SettingButton>
          <LogoutButton title='로그아웃' onClick={userSignOut}>
            <LogoutSvg />
          </LogoutButton>
        </FooterButtonWrap>
      </SideBarWrap>
      <MenuWrap>
        <>
          <MyDisplayName>{authService.currentUser?.displayName}</MyDisplayName>
          <OnUserList />
          <GroupChatList />
        </>
      </MenuWrap>
    </SideBarContainer>
  );
};

export default SideBar;
