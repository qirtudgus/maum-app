import { signInWithEmailAndPassword } from 'firebase/auth';
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
    let email = emailRef.current.value;
    let password = passwordRef.current.value;
    console.log(email, password);
    signInWithEmail(email, password).then((res) => {
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
        router.push('/home');
      }
    });
  };

  const emailRef = useRef<HTMLInputElement>();
  const passwordRef = useRef<HTMLInputElement>();

  return (
    <>
      <Link href={'/home'}>홈</Link>
      아이디
      <Input ref={emailRef} defaultValue='qwer@naver.com'></Input>
      비밀번호
      <Input ref={passwordRef} type='password' defaultValue='qwer12'></Input>
      <button onClick={login}>로그인</button>
    </>
  );
};

export default Login;
