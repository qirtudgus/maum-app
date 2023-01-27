import React from 'react';
import Head from 'next/head';
import type { AppProps } from 'next/app';
import GlobalStyle from '../components/GlobalStyle';
import { ThemeProvider } from 'styled-components';
import theme from '../components/GlobalTheme';

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <ThemeProvider theme={theme}>
      <>
        <Head>
          <meta name='viewport' content='width=device-width, initial-scale=1' />
        </Head>
        <GlobalStyle />
        <Component {...pageProps} />
      </>
    </ThemeProvider>
  );
}

export default MyApp;
