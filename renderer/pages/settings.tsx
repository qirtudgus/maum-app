import React, { useEffect, useRef } from 'react';
import styled from 'styled-components';

const Wrap = styled.div`
  width: 100%;
  height: 100%;
  padding: 20px 20px 20px 40px;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  justify-content: center;
  overflow-y: scroll;
`;

const Title = styled.div`
  font-size: 24px;
  font-weight: bold;
  margin-bottom: 20px;
`;

const SubTitle = styled.div`
  font-size: 14px;
  font-weight: bold;
  text-align: center;
  color: #555;
  padding-bottom: 5px;
  border-bottom: 1px solid#eee;
`;

const CheckWrap = styled.div`
  width: 500px;
  height: 300px;

  background: #eee;

  margin-bottom: 50px;
  border-radius: 10px;
  display: flex;
  justify-content: space-evenly;
  align-items: center;
`;

const CheckZone = styled.div`
  cursor: pointer;
  width: 200px;
  height: 250px;
  background: #fff;
  border-radius: 10px;
  padding: 10px 10px;
  position: relative;
  box-shadow: ${({ theme }) => theme.boxShadow};
  &:hover {
    outline: 5px solid ${({ theme }) => theme.colors.main};
  }
  & > input {
    position: absolute;
    top: 3px;
    right: 3px;
    width: 20px;
    height: 20px;
  }
`;

const BarWrap = styled.div`
  /* margin: 0 auto; */
`;

const Bar = styled.div`
  width: 50%;
  height: 30px;
  border-radius: 10px;
  /* margin: 0 auto; */
  margin-top: 10px;
  position: relative;
  background: #888;
  &:nth-child(1) {
    left: 90px;
  }
  &:nth-child(2) {
    width: 60%;
  }
  &:nth-child(4) {
    left: 110px;
    width: 40%;
  }
  &:last-child {
    width: 100%;
    height: 25px;
    background: #eee;
  }
`;

const GroupBar = styled.div`
  width: 80%;
  height: 30px;
  border-radius: 10px;
  /* margin: 0 auto; */
  margin-top: 10px;
  position: relative;
  background: #888;

  &:nth-child(2) {
  }
  &:nth-child(4) {
    width: 60%;
  }
  &:last-child {
    width: 100%;
    height: 25px;
    background: #eee;
  }
`;

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

  const oneToOneSettings = (e: React.ChangeEvent<HTMLInputElement> | string) => {
    if (typeof e === 'string') {
      localStorage.setItem('oneToOneChatLayout', `${e}`);
    } else {
      const value = e.target.value as 'oneToOne' | 'group';
      localStorage.setItem('oneToOneChatLayout', `${value}`);
    }
  };

  const groupSettings = (e: React.ChangeEvent<HTMLInputElement> | string) => {
    if (typeof e === 'string') {
      localStorage.setItem('groupChatLayout', `${e}`);
    } else {
      const value = e.target.value as 'oneToOne' | 'group';
      localStorage.setItem('groupChatLayout', `${value}`);
    }
  };

  return (
    <Wrap>
      <Title>일대일 대화 레이아웃 선택</Title>
      <CheckWrap>
        <CheckZone
          onClick={() => {
            oneToOneSettings('oneToOne');
            ref.current.checked = true;
          }}
        >
          일대일식
          <input
            name='oneToOneChatLayout'
            type='radio'
            ref={ref}
            value={'oneToOne'}
            onChange={oneToOneSettings}
          ></input>
          <BarWrap>
            <SubTitle>OOO</SubTitle>
            <Bar />
            <Bar />
            <Bar />
            <Bar />
            <Bar />
          </BarWrap>
        </CheckZone>
        <CheckZone
          onClick={() => {
            oneToOneSettings('group');
            groupRef.current.checked = true;
          }}
        >
          그룹식
          <input
            ref={groupRef}
            name='oneToOneChatLayout'
            type='radio'
            value={'group'}
            onChange={oneToOneSettings}
          ></input>
          <BarWrap>
            <SubTitle>OOO</SubTitle>
            <GroupBar />
            <GroupBar />
            <GroupBar />
            <GroupBar />
            <GroupBar />
          </BarWrap>
        </CheckZone>
      </CheckWrap>
      <Title>그룹 대화 레이아웃 선택</Title>
      <CheckWrap>
        <CheckZone
          onClick={() => {
            groupSettings('oneToOne');
            groupLayoutRef.current.checked = true;
          }}
        >
          일대일식
          <input
            name='groupChatLayout'
            type='radio'
            ref={groupLayoutRef}
            value={'oneToOne'}
            onChange={groupSettings}
          ></input>
          <BarWrap>
            <SubTitle>OOO</SubTitle>
            <Bar />
            <Bar />
            <Bar />
            <Bar />
            <Bar />
          </BarWrap>
        </CheckZone>
        <CheckZone
          onClick={() => {
            groupSettings('group');
            groupLayoutRef2.current.checked = true;
          }}
        >
          그룹식
          <input
            ref={groupLayoutRef2}
            name='groupChatLayout'
            type='radio'
            value={'group'}
            onChange={groupSettings}
          ></input>
          <BarWrap>
            <SubTitle>OOO</SubTitle>
            <GroupBar />
            <GroupBar />
            <GroupBar />
            <GroupBar />
            <GroupBar />
          </BarWrap>
        </CheckZone>
      </CheckWrap>
    </Wrap>
  );
};

export default Settings;
