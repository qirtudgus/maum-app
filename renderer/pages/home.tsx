import { signInWithEmailAndPassword } from 'firebase/auth';
import { ref, update } from 'firebase/database';
import Head from 'next/head';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useLayoutEffect, useRef, useState } from 'react';
import styled from 'styled-components';
import BasicInput from '../components/BasicInput';
import { SolidButton } from '../components/ButtonGroup';
import { authService, realtimeDbService } from '../firebaseConfig';
import logo from '../image/maumTalkLogo.webp';

const Box = styled.div`
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  position: fixed;
  background: #b5d692;
  flex-direction: column;
`;

const Wrap = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  width: 400px;
  padding: 30px;
  border-radius: 10px;
  box-shadow: ${({ theme }) => theme.boxShadow};
  background: #fff;
`;

const RegisterLink = styled.p`
margin: 5px 0 15px 0;
font-size:14px;
width: 100%;
text-align: left;
& span {
  text-decoration: underline;
  color:${({ theme }) => theme.colors.main}}
}
`;

const Logo = styled.div`
  margin-bottom: 15px;

  & p {
    margin-top: 5px;
    text-align: center;
    font-size: 14px;
    color: #555;
  }
`;

const Login = () => {
  const router = useRouter();
  const emailRef = useRef<HTMLDivElement>();
  const passwordRef = useRef<HTMLDivElement>();
  const [isLoginError, setIsLoginError] = useState(false);
  const [isLoginText, setIsLoginText] = useState('');
  const [isPasswordError, setIsPasswordError] = useState(false);
  const [isPasswordText, setIsPasswordText] = useState('');

  const 방금가입한메일 = router.query.email as string;

  const signInWithEmail = async (email: string, password: string) => {
    try {
      await signInWithEmailAndPassword(authService, email, password);
    } catch (error) {
      return error;
    }
  };

  useLayoutEffect(() => {
    if (방금가입한메일) {
      const emailInput = emailRef.current.firstChild as HTMLInputElement;
      emailInput.focus();
    } else {
      const emailInput = emailRef.current.firstChild as HTMLInputElement;
      emailInput.focus();
    }
  }, []);

  const login = () => {
    const emailInput = emailRef.current.firstChild as HTMLInputElement;
    const passwordInput = passwordRef.current.firstChild as HTMLInputElement;
    signInWithEmail(emailInput.value, passwordInput.value).then(
      (loginResult) => {
        //로그인 결과가 성공적일경우와 에러일 경우 분기
        // 성공이면 loginResult에 undifined가, 실패면 error 객체가 들어있다
        if (loginResult !== undefined) {
          let errorCode = loginResult.code;
          console.log(errorCode);
          switch (errorCode) {
            case 'auth/user-not-found': {
              setIsLoginError(true);
              setIsLoginText('존재하지않는 사용자입니다.');
              emailInput.focus();
              break;
            }

            case 'auth/invalid-email': {
              setIsLoginError(true);
              setIsLoginText('이메일 양식을 확인해주세요!');
              emailInput.focus();
              break;
            }
            case 'auth/wrong-password': {
              setIsLoginError(false);
              setIsLoginText('');
              setIsPasswordError(true);
              setIsPasswordText('비밀번호를 확인해주세요!');
              passwordInput.focus();
              break;
            }
            case 'auth/internal-error': {
              setIsLoginError(false);
              setIsLoginText('');
              setIsPasswordError(true);
              setIsPasswordText('비밀번호를 확인해주세요!');
              passwordInput.focus();
              break;
            }
            default: {
              setIsLoginError(true);
              setIsPasswordError(false);
              setIsLoginText('이메일 혹은 비밀번호를 확인해주세요!');
              emailInput.focus();
              break;
            }
          }

          return;
        } else {
          const connectedRef = ref(
            realtimeDbService,
            `userList/${authService.currentUser.uid}`,
          );
          update(connectedRef, { isOn: true });
          router.push('/main');
        }
      },
    );
  };

  return (
    <>
      <Head>
        <title>maumTalk - 로그인</title>
      </Head>
      <Box>
        <Wrap>
          <Logo>
            <Image src={logo} />
            <p>마음톡에 오신걸 환영해요!</p>
          </Logo>
          <BasicInput
            ref={emailRef}
            placeholderValue='이메일'
            defaultValue={방금가입한메일}
            isError={isLoginError}
            statusText={isLoginText}
          ></BasicInput>
          <BasicInput
            type='password'
            ref={passwordRef}
            placeholderValue='비밀번호'
            isError={isPasswordError}
            statusText={isPasswordText}
          ></BasicInput>
          <RegisterLink>
            아직 회원이 아니시라면?...
            <span>
              <Link href={'/__register'}> 회원가입</Link>
            </span>
          </RegisterLink>
          <SolidButton
            BasicButtonValue='로그인'
            width={400}
            OnClick={login}
            marginTop={0}
          ></SolidButton>
        </Wrap>
      </Box>
    </>
  );
};

export default Login;
