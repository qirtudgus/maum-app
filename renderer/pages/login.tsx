import { setPersistence, signInWithEmailAndPassword } from 'firebase/auth';
import { push, ref, set, update } from 'firebase/database';
import { Timestamp } from 'firebase/firestore';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useRef } from 'react';
import styled from 'styled-components';
import {
  authService,
  //   connectedRef,
  realtimeDbService,
} from '../firebaseConfig';

const Input = styled.input``;

const signInWithEmail = async (id, password) => {
  try {
    await signInWithEmailAndPassword(authService, id, password).then((res) => {
      console.log(res);
    });
  } catch (error) {
    console.log(error);
    if (error.code === 'auth/user-not-found')
      alert('아이디 혹은 비밀번호를 확인해주세요');
    return error;
  }
};

const Login = () => {
  const router = useRouter();

  let login = () => {
    let id = idRef.current.value;
    let password = passwordRef.current.value;
    console.log(id, password);
    signInWithEmail(id, password).then((res) => {
      const connectedRef = ref(
        realtimeDbService,
        `userList/${authService.currentUser.uid}`,
      );

      update(connectedRef, { isOn: true });

      router.push('/home');
    });
  };

  const idRef = useRef<HTMLInputElement>();
  const passwordRef = useRef<HTMLInputElement>();

  return (
    <>
      <Link href={'/home'}>홈</Link>
      아이디
      <Input ref={idRef} defaultValue='qwer@naver.com'></Input>
      비밀번호
      <Input ref={passwordRef} defaultValue='qwer12'></Input>
      <button onClick={login}>로그인</button>
    </>
  );
};

export default Login;
