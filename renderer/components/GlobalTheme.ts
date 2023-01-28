// 자주 사용하는 색을 객체로 만들자.
const colors = {
  // main: '#79d82b',
  main: '#006cc5',
  sub: '#fff',
  sub2: '#f1f1f1',
  mainHoverColor: '#64b91e',
  borderColor: '#bebebe',
};

const boxShadow = '0 0 3px 3px rgb(0 0 0 / 10%)';

interface ThemeInterface {
  colors: {
    main: string;
    sub: string;
    sub2: string;
    mainHoverColor: string;
    borderColor: string;
  };
  boxShadow: '0 0 3px 3px rgb(0 0 0 / 10%)';
}

// theme 객체에 감싸서 반환한다.
const theme: ThemeInterface = {
  colors,
  boxShadow,
};

export default theme;
