import { useEffect, useRef } from 'react';

const Settings = () => {
  const ref = useRef<HTMLInputElement>();
  const groupRef = useRef<HTMLInputElement>();

  const groupLayoutRef = useRef<HTMLInputElement>();
  const groupLayoutRef2 = useRef<HTMLInputElement>();

  useEffect(() => {
    if (localStorage.getItem('oneToOneChatLayout') === 'oneToOne') {
      ref.current.checked = true;
    } else if (localStorage.getItem('oneToOneChatLayout') === 'group') {
      groupRef.current.checked = true;
    }
    if (localStorage.getItem('groupChatLayout') === 'oneToOne') {
      groupLayoutRef.current.checked = true;
    } else if (localStorage.getItem('groupChatLayout') === 'group') {
      groupLayoutRef2.current.checked = true;
    }
  }, []);

  return (
    <>
      <div>세팅페이지</div>
      <div>
        일대일채팅 레이아웃 선택: 일대일 식
        <input
          name='oneToOneChatLayout'
          type='radio'
          ref={ref}
          value={'one'}
          onChange={(e) => {
            console.log(e.target.checked);
            console.log(e.target.value);
            if (e.target.checked) {
              localStorage.setItem('oneToOneChatLayout', 'oneToOne');
            }
          }}
        ></input>
        그룹식
        <input
          ref={groupRef}
          name='oneToOneChatLayout'
          type='radio'
          value={'group'}
          onChange={(e) => {
            console.log(e.target.checked);
            console.log(e.target.value);
            if (e.target.checked) {
              localStorage.setItem('oneToOneChatLayout', 'group');
            }
          }}
        ></input>
      </div>
      <div>
        그룹채팅 레이아웃 선택: 일대일 식
        <input
          name='groupChatLayout'
          type='radio'
          ref={groupLayoutRef}
          value={'one'}
          onChange={(e) => {
            console.log(e.target.checked);
            console.log(e.target.value);
            if (e.target.checked) {
              localStorage.setItem('groupChatLayout', 'oneToOne');
            }
          }}
        ></input>
        그룹식
        <input
          ref={groupLayoutRef2}
          name='groupChatLayout'
          type='radio'
          value={'group'}
          onChange={(e) => {
            console.log(e.target.checked);
            console.log(e.target.value);
            if (e.target.checked) {
              localStorage.setItem('groupChatLayout', 'group');
            }
          }}
        ></input>
      </div>
    </>
  );
};

export default Settings;
