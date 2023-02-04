# 똑똑 - DDOKDDOK
똑똑은 사용자들과 실시간으로 대화할 수 있는 일렉트론 기반 데스크탑앱입니다.
상대방을 찾아가서 똑똑 노크를 한다는 의미에서 지은 이름입니다.


목차
1. [Firebase Server 구동 방법](#firebase-server-구동-방법)
2. [Stacks](#-stacks)
3. [프로젝트를 통해 경험한 것!](#-프로젝트를-통해-경험한-것)

## 🛠 Stacks
### Frontend
React@18.2.0 / Next.js@12.3.4 / TypeScript@4.9.4 / Styled-Components@5.3.6
### Backend
Firebase@9.16.0 / node.js@17.4.0
### deploy
Electron@21.3.3 / Electron-Builder@23.6.0

## Firebase Server 구동 방법
#### 0. Firebase에서 새 프로젝트를 생성하여 SDK를 발급 받습니다. 
프로젝트에 사용되는 기능은 총 2개입니다. 
- Authentication  
1.상단 메뉴중 Sign-in-method에 접속  
2.제공 업체 추가 클릭  
3.기본 제공 업체 중 '이메일/비밀번호' 사용  

- Realtime Database  
1.상단 메뉴중 규칙에 접속  
2.규칙 수정을 아래와 같이 수정  
````
{
  "rules": {
    ".read": true,
    ".write": true
  }
}
````
#### 1. /maum-app/renderer 경로에 .env 파일을 생성해줍니다.
#### 2. sample.env를 참고하여 .env 파일에 파이어베이스 SDK를 작성해줍니다.
````
//sample.env
NEXT_PUBLIC_FIREBASE_apiKey = ""
NEXT_PUBLIC_FIREBASE_authDomain =""
NEXT_PUBLIC_FIREBASE_databaseURL = ""
NEXT_PUBLIC_FIREBASE_projectId = ""
NEXT_PUBLIC_FIREBASE_storageBucket = ""
NEXT_PUBLIC_FIREBASE_messagingSenderId =""
NEXT_PUBLIC_FIREBASE_appId =""
````
#### 4..npm install을 명령하여 패키지 설치 후 앱을 실행 및 빌드합니다, 사용 가능한 명령어는 아래와 같습니다.
````
  "scripts": {
    "dev": "nextron",
    "build": "nextron build",
    "build:all": "nextron build --all",
    "build:win32": "nextron build --win --ia32",
    "build:win64": "nextron build --win --x64",
    "build:mac": "nextron build --mac --x64",
    "build:linux": "nextron build --linux",
    "postinstall": "electron-builder install-app-deps"
  },
````


## 🏆 프로젝트를 통해 경험한 것!
 
## 공통
- #### 일대일 대화와 그룹 대화를 각기 다른 페이지에서 구현
- #### Firebase Realtime Datebase를 통한 실시간 채팅 구현
- #### 유저 목록에서 앱에 접속중인 유저를 구분하여 보여준다.
- #### 대화별로 메시지를 감지하여 채팅방의 마지막 메시지와 안읽은 메시지가 몇개인지 보여준다.
- #### 각 대화 페이지는 마운트되어있는동안 채팅방 생성을 감지하여 사용자에게 새로고침없이도 새로운 채팅방을 보여준다.   
- #### 대화방내에 메시지 읽음, 안읽음 표시 구현
- #### 일대일,그룹중에 사용자가 원하는 대화창 레이아웃을 적용할 수 있는 설정 페이지 제작 (LocalStorage 이용)
- #### 회원가입 시 로그인창으로 이동하면서 가입할 때 작성한 이메일을 input에 넣어 UI/UX 개선 (LocalStorage 이용)
- #### 일렉트론 브라우저 설정을 통해 프로덕션 환경에서는 윈도우 메뉴바가 보이지 않도록 설정
- #### 앱의 최소 너비,높이 설정

## 그룹 대화
- #### 그룹 대화명을 따로 지정할 수 있도록 구현
- #### 그룹 대화를 생성한 뒤에도 유저를 초대할 수 있는 초대 기능 구현
- #### 그룹 대화중 나갈 수 있는 나가기 기능 구현





