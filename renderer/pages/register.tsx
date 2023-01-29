import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { ref, set } from 'firebase/database';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useRef } from 'react';
import styled from 'styled-components';
import { authService, realtimeDbService } from '../firebaseConfig';

const Input = styled.input``;

export const signUpWithEmail = async (email, password, nickname) => {
  try {
    const response = await createUserWithEmailAndPassword(
      authService,
      email,
      password,
    ).then(async (res) => {
      console.log('회원가입 결과값을 실시간 db에 바로 저장해주자');
      updateProfile(authService.currentUser, {
        displayName: nickname,
      });
      const connectedRef = ref(
        realtimeDbService,
        `userList/${authService.currentUser.uid}`,
      );
      //바로 로그인되는 상태라 우선 isOn을 true로 초기화해준다.
      await set(connectedRef, {
        uid: authService.currentUser.uid,
        displayName: nickname,
        isOn: true,
      });
    });
    return response;
  } catch (error) {
    console.log(error.code);
    if (error.code === 'auth/email-already-in-use')
      alert('사용중인 이메일입니다!');
    return error;
  }
};
const Register = () => {
  const router = useRouter();
  let join = () => {
    let id = idRef.current.value;
    let password = passwordRef.current.value;
    let nickname = nicknameRef.current.value;
    console.log(id, password);
    signUpWithEmail(id, password, nickname).then((res) => {
      router.push('/home');
    });
  };

  const idRef = useRef<HTMLInputElement>();
  const passwordRef = useRef<HTMLInputElement>();
  const nicknameRef = useRef<HTMLInputElement>();

  return (
    <>
      <Link href={'/home'}>홈</Link>
      닉네임
      <Input ref={nicknameRef}></Input>
      아이디
      <Input ref={idRef}></Input>
      비밀번호
      <Input ref={passwordRef}></Input>
      <button onClick={join}>회원가입</button>
    </>
  );
};

export default Register;
