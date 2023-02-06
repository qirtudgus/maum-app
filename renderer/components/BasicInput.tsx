import React, { forwardRef, RefObject, useRef, useState } from 'react';
import styled, { css } from 'styled-components';

interface BasicInputStyleInterface {
  isError?: boolean | null | undefined;
}

interface BasicInputInterface {
  placeholderValue: string;
  type?: string;
  isError?: boolean | null | undefined;
  PropsOnBlurFunc?: () => void;
  PropsOnFocusFunc?: () => void;
  statusText?: string;
  ref?: React.ForwardedRef<HTMLDivElement>;
  defaultValue?: string;
}

const InputWrap = styled.div`
  width: 100%;
`;

const WrapDiv = styled.div<BasicInputStyleInterface>`
  width: 100%;
  height: 48px;
  margin-top: 15px;
  margin-bottom: 22px;
  position: relative;
  font-size: 17px;
  & label {
    font-size: inherit;
    position: absolute;
    top: 50%;
    left: 15px;
    transform: translateY(-50%);
    color: #444;
    cursor: text;
    transition: 0.2s;
    font-weight: 500;
    user-select: none;
    pointer-events: none;
  }

  & label.active {
    font-size: 12px;
    top: -9px;
    /* color: ${({ theme }) => theme.colors.main}; */
  }

  ${(props) =>
    props.isError &&
    css`
      & label.active {
        font-size: 12px;
        top: -9px;
        /* color: red; */
      }

      /* & input {
        border: 2px solid ${({ theme }) => theme.colors.main};
        padding: 12px 14px;
      } */

      & input:focus {
        border: 2px solid ${({ theme }) => theme.colors.main};
        padding: 12px 14px;
      }
    `}
`;

const Input = styled.input`
  display: block;
  width: 100%;
  padding: 13px 15px;
  font-size: inherit;
  margin: 1px 1px 0 1px;
  border-radius: 4px;
  border: 1px solid#9c9c9c;
  outline: none;

  &:focus {
    border: 2px solid ${({ theme }) => theme.colors.main};
    padding: 12px 14px;
  }
`;

const StatusText = styled.p`
  font-size: 12px;
  word-break: keep-all;
  margin: 5px 0 0 9px;
  color: red;
`;

export const BasicInput = forwardRef<HTMLDivElement, BasicInputInterface>((props, ref) => {
  const [focus, setFocus] = useState(false);
  const inputRef = useRef() as RefObject<HTMLInputElement>;
  const setFocusFalse = () => {
    if (inputRef.current?.value) return props.PropsOnBlurFunc?.();
    setFocus(false);
  };

  const setFocusTrue = () => {
    //props로 OnBlur를 받았으면 실행
    if (props.PropsOnFocusFunc) {
      props.PropsOnFocusFunc();
    }
    setFocus(true);
  };

  return (
    <InputWrap>
      <WrapDiv
        ref={ref}
        isError={props.isError}
      >
        <Input
          className='basicInput'
          type={props.type}
          ref={inputRef}
          onFocus={setFocusTrue}
          onBlur={setFocusFalse}
          defaultValue={props.defaultValue}
        ></Input>
        {props.placeholderValue && <label className={focus ? 'active' : ''}>{props.placeholderValue}</label>}
        {props.isError && <StatusText>{props.statusText}</StatusText>}
      </WrapDiv>
    </InputWrap>
  );
});

export default BasicInput;
