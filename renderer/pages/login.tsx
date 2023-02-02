import { signInWithEmailAndPassword } from 'firebase/auth';
import { onDisconnect, ref, update } from 'firebase/database';
import Head from 'next/head';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useEffect, useRef, useState } from 'react';
import styled from 'styled-components';
import BasicInput from '../components/BasicInput';
import { SolidButton } from '../components/ButtonGroup';
import { authService, realtimeDbService } from '../firebaseConfig';
import logo from '../image/ddokddok.webp';

const Box = styled.div`
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  position: fixed;
  background: ${({ theme }) => theme.colors.main}
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

export const Logo = styled.div`
  margin-bottom: 15px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
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
  const emailSaveRef = useRef<HTMLInputElement>();
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

  useEffect(() => {
    //로컬스토리지 mail 체크 후 input에 저장
    //저장은 해놨고, 방금 가입을 했으면 방금 가입한 메일을 인풋에
    //저장만 해놨으면 인풋에
    //저장 안해놨고 가입했으면 가입을 인풋에
    const isMailSave = window.localStorage.getItem('mail');
    const emailInput = emailRef.current.firstChild as HTMLInputElement;
    const passwordInput = passwordRef.current.firstChild as HTMLInputElement;
    if (isMailSave && 방금가입한메일) {
      emailInput.value = 방금가입한메일;
      emailSaveRef.current.checked = true;
      emailInput.focus();
      passwordInput.focus();
      // emailInput.placeholder = '';
    } else if (isMailSave && !방금가입한메일) {
      emailInput.value = isMailSave;
      emailSaveRef.current.checked = true;
      emailInput.focus();
      passwordInput.focus();
    } else if (!isMailSave && 방금가입한메일) {
      emailInput.value = 방금가입한메일;
      emailInput.focus();
      passwordInput.focus();
    } else {
      emailInput.focus();
    }
  }, []);

  const login = () => {
    const emailInput = emailRef.current.firstChild as HTMLInputElement;
    const passwordInput = passwordRef.current.firstChild as HTMLInputElement;
    const isEmailSave = emailSaveRef.current.checked;
    //로그인 시 check가 true면 로컬스토리지에 이메일을 저장시키고,
    //check가 false면 로컬스토리지에 이메일을 삭제시킨다.
    if (isEmailSave) {
      //로컬스토리지에 저장
      window.localStorage.setItem('mail', emailInput.value);
    } else {
      //로컬스토리지에서 삭제
      window.localStorage.removeItem('mail');
    }

    signInWithEmail(emailInput.value, passwordInput.value).then((loginResult) => {
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
        const connectedRef = ref(realtimeDbService, `userList/${authService.currentUser.uid}`);
        update(connectedRef, { isOn: true });
        //로컬스토리지에서 채팅방 레이아웃 확인 후 없으면 초기값 세팅
        if (!window.localStorage.getItem('oneToOneChatLayout')) {
          console.log('채팅레이아웃 설정값없어서 세팅!');
          window.localStorage.setItem('oneToOneChatLayout', 'oneToOne');
          window.localStorage.setItem('groupChatLayout', 'group');
        }
        //로그인 시점에 onDisconnect를 설정하여 앱을 바로 종료하여도 종료 업데이트가 되도록 오류 수정
        onDisconnect(connectedRef).update({ isOn: false });

        router.replace('/userList');
      }
    });
  };

  return (
    <>
      <Head>
        <title>똑똑 - 로그인</title>
      </Head>
      <Box>
        <Wrap>
          <Logo>
            <Image src={logo} />
            <p>똑똑에 오신걸 환영해요!</p>
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
              <Link href={'/register'}> 회원가입</Link>
            </span>
          </RegisterLink>
          <div>
            이메일 저장
            <input
              onChange={(e) => {
                console.log(emailSaveRef.current.checked);
              }}
              ref={emailSaveRef}
              type='checkbox'
            ></input>
          </div>

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
