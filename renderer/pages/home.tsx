import { signInWithEmailAndPassword } from 'firebase/auth';
import { ref, update } from 'firebase/database';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useRef } from 'react';
import styled from 'styled-components';
import BasicInput from '../components/BasicInput';
import { SolidButton } from '../components/ButtonGroup';
import { authService, realtimeDbService } from '../firebaseConfig';

const Box = styled.div`
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  position: fixed;
`;

const Wrap = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  width: 400px;
`;

const RegisterLink = styled.p`

width: 100%;
text-align: left;
& span {
  text-decoration: underline;
  color:${({ theme }) => theme.colors.main}}
}
`;

const signInWithEmail = async (email: string, password: string) => {
  try {
    // let auth = getAuth();
    // await setPersistence(authService, browserLocalPersistence).then((res) => {
    //   //   sessionStorage.setItem('ga', 'hah');
    //   console.log(res);
    //   return signInWithEmailAndPassword(authService, email, password);
    // });
    await signInWithEmailAndPassword(authService, email, password);
  } catch (error) {
    console.log(error);
    if (
      error.code === 'auth/user-not-found' &&
      error.code === 'auth/wrong-password'
    )
      alert('아이디 혹은 비밀번호를 확인해주세요');
    // if (error.code === 'auth/wrong-password') alert('비밀번호가 틀렸습니다.');
    return error;
  }
};

const Login = () => {
  const router = useRouter();

  let login = () => {
    // let email = emailRef.current.value;
    // let password = passwordRef.current.value;

    const emailInput = emailRef.current.lastChild as HTMLInputElement;
    const passwordInput = passwordRef.current.lastChild as HTMLInputElement;
    console.log(emailInput.value, passwordInput.value);
    signInWithEmail(emailInput.value, passwordInput.value).then((res) => {
      //로그인 결과가 성공적일경우와 에러일 경우 분기
      if (res) {
        alert('로그인에 실패하였습니다. 다시 시도해주세요!');
        return;
      } else {
        const connectedRef = ref(
          realtimeDbService,
          `userList/${authService.currentUser.uid}`,
        );
        update(connectedRef, { isOn: true });
        router.push('/main');
      }
    });
  };

  const emailRef = useRef<HTMLDivElement>();
  const passwordRef = useRef<HTMLDivElement>();

  return (
    <>
      <Head>
        <title>maumTalk - 로그인</title>
      </Head>
      <button onClick={login}>로그인</button>
      <Box>
        <Wrap>
          <BasicInput
            ref={emailRef}
            placeholderValue='이메일'
            // isError={loginResult.idValue}
            // statusText={loginResult.idStatusText}
          ></BasicInput>
          <BasicInput
            type='password'
            ref={passwordRef}
            placeholderValue='비밀번호'
            // isError={loginResult.passwordValue}
            // statusText={loginResult.passwordStatusText}
          ></BasicInput>
          <RegisterLink>
            아직 회원이 아니시라면?...
            <span>
              <Link href={'/register'}> 회원가입</Link>
            </span>
          </RegisterLink>
          <SolidButton
            BasicButtonValue='로그인'
            width={400}
            OnClick={login}
          ></SolidButton>
        </Wrap>
      </Box>
    </>
  );
};

export default Login;
