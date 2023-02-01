import { useRouter } from 'next/router';
import { useEffect } from 'react';
import styled from 'styled-components';
import { authService } from '../firebaseConfig';
import SideBar from './sideBar';

const LayoutDiv = styled.div`
  position: relative;
  width: 100%;
  height: 100vh;
  display: flex;
  border-top: 1px solid ${({ theme }) => theme.colors.borderColor};
`;

const Main = styled.div`
  width: 100%;
  position: relative;
`;

export default function Layout({ children }) {
  const router = useRouter();
  const checkNotLayoutPathname = (): boolean => {
    let isLayoutRendering = false;
    const notLayout = ['/login', '/register'];
    if (notLayout.includes(router.pathname)) {
      isLayoutRendering = true;
    }
    return isLayoutRendering;
  };

  useEffect(() => {
    //로그인정보가 없을경우 로그인창으로 이동
    if (authService.currentUser === null) router.push('/login');
  }, []);

  return (
    <>
      {!checkNotLayoutPathname() ? (
        <LayoutDiv>
          <SideBar />
          <Main>{children}</Main>
        </LayoutDiv>
      ) : (
        <Main>{children}</Main>
      )}
    </>
  );
}
