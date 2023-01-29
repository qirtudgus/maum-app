import React, { useEffect, useRef, useState } from 'react';
import Head from 'next/head';

import styled from 'styled-components';

const Wrap = styled.div`
  width: 100%;
  height: 100%;
`;

function Home() {
  return (
    <Wrap>
      <Head>
        <title>maumTalk</title>
      </Head>
      <div>메인페이지</div>
    </Wrap>
  );
}

export default Home;
