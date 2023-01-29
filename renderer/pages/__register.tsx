import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
} from 'firebase/auth';
import { ref, set, update } from 'firebase/database';
import Head from 'next/head';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useRef, useState } from 'react';
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
  & a {
    font-size: 14px;
    margin-top: 5px;
    display: block;
    text-align: center;
  }
`;

const Register = () => {
  const router = useRouter();
  const nicknameRef = useRef<HTMLDivElement>();
  const emailRef = useRef<HTMLDivElement>();
  const passwordRef = useRef<HTMLDivElement>();

  const [isNicknameError, setIsNicknameError] = useState(false);
  const [isNicknameText, setIsNicknameText] = useState('');

  const [isEmailError, setIsEmailError] = useState(false);
  const [isEmailText, setIsEmailText] = useState('');
  const [isPasswordError, setIsPasswordError] = useState(false);
  const [isPasswordText, setIsPasswordText] = useState('');

  const signUpWithEmail = async (email, password, nickname) => {
    try {
      await createUserWithEmailAndPassword(authService, email, password).then(
        async (res) => {
          console.log('회원가입 결과값을 실시간 db에 바로 저장해주자');
          updateProfile(authService.currentUser, {
            displayName: nickname,
          });
          const connectedRef = ref(
            realtimeDbService,
            `userList/${authService.currentUser.uid}`,
          );
          //바로 로그인되는 상태라 우선 isOn을 true로 초기화해준다.
          //회원가입 후 로그인창으로 이동하기때문에 false로 초기화하는것으로 수정
          await set(connectedRef, {
            uid: authService.currentUser.uid,
            displayName: nickname,
            isOn: false,
          });
        },
      );
    } catch (error) {
      return error;
    }
  };

  let join = () => {
    const nicknameInput = nicknameRef.current.firstChild as HTMLInputElement;
    const emailInput = emailRef.current.firstChild as HTMLInputElement;
    const passwordInput = passwordRef.current.firstChild as HTMLInputElement;
    let nickname = nicknameInput.value;
    let email = emailInput.value;
    let password = passwordInput.value;
    const blank_pattern = /^\s+\s+$/g;
    //닉네임을 우선 체크한다.
    if (
      nicknameInput.value === ' ' ||
      nicknameInput.value.length === 0 ||
      blank_pattern.test(nicknameInput.value)
    ) {
      setIsNicknameError(true);
      setIsNicknameText('닉네임을 확인해주세요!');
      nicknameInput.focus();
      return;
    } else {
      setIsNicknameError(false);
      setIsNicknameText('');
    }

    signUpWithEmail(email, password, nickname).then((res) => {
      console.log(res);
      if (res) {
        let errorCode = res.code;
        console.log(errorCode);

        switch (errorCode) {
          case 'auth/invalid-email': {
            setIsEmailError(true);
            setIsEmailText('이메일 양식을 확인해주세요!');
            emailInput.focus();
            break;
          }
          case 'auth/email-already-in-use': {
            setIsEmailError(true);
            setIsEmailText('이미 사용중인 이메일이에요!');
            setIsPasswordError(false);
            setIsPasswordText('');
            emailInput.focus();
            break;
          }
          case 'auth/weak-password': {
            setIsEmailError(false);
            setIsEmailText('');
            setIsPasswordError(true);
            setIsPasswordText('비밀번호는 6자 이상이여야 해요!');
            passwordInput.focus();
            break;
          }
          case 'auth/internal-error': {
            passwordInput.focus();
            break;
          }

          default: {
            break;
          }
        }
      } else {
        router.push(`/home?email=${email}`, { query: email });
      }
    });
  };

  return (
    <>
      <Head>
        <title>maumTalk - 회원가입</title>
      </Head>
      <Box>
        <Wrap>
          <Logo>
            <Image src={logo} />
            <p>마음톡에 오신걸 환영해요!</p>
            <Link href={'/home'}>로그인 창으로</Link>
          </Logo>
          <BasicInput
            ref={nicknameRef}
            placeholderValue='닉네임'
            isError={isNicknameError}
            statusText={isNicknameText}
          ></BasicInput>
          <BasicInput
            ref={emailRef}
            placeholderValue='이메일'
            isError={isEmailError}
            statusText={isEmailText}
          ></BasicInput>
          <BasicInput
            type='password'
            ref={passwordRef}
            placeholderValue='비밀번호'
            isError={isPasswordError}
            statusText={isPasswordText}
          ></BasicInput>
          <SolidButton
            BasicButtonValue='회원가입'
            width={400}
            OnClick={join}
            marginTop={15}
          ></SolidButton>
        </Wrap>
      </Box>
    </>
  );
};

export default Register;
