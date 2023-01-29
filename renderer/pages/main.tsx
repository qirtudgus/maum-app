import React, { useEffect, useRef, useState } from 'react';
import Head from 'next/head';

import styled from 'styled-components';

const Wrap = styled.div`
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
`;

const Title = styled.div`
  font-size: 40px;
`;

function Home() {
  return (
    <Wrap>
      <Head>
        <title>maumTalk</title>
      </Head>
      <Title>마음톡</Title>
    </Wrap>
  );
}

export default Home;
