import { signOut } from 'firebase/auth';
import { ref, update } from 'firebase/database';
import router from 'next/router';
import styled from 'styled-components';
import LogoutSvg from '../components/svg/logoutSvg';
import SettingSvg from '../components/svg/settingSvg';
import { authService, realtimeDbService } from '../firebaseConfig';

const SideBarWrap = styled.div`
  width: 60px;
  flex-shrink: 0;
  height: 100%;
  background: #006cc5;
  border-right: 1px solid ${({ theme }) => theme.colors.borderColor};
  position: relative;
`;

const ButtonWrap = styled.div`
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

const SideBar = () => {
  const uid = authService.currentUser?.uid;
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

  return (
    <>
      <SideBarWrap>
        <ButtonWrap>
          <SettingButton>
            <SettingSvg />
          </SettingButton>
          <LogoutButton title='로그아웃' onClick={userSignOut}>
            <LogoutSvg />
          </LogoutButton>
        </ButtonWrap>
      </SideBarWrap>
    </>
  );
};

export default SideBar;