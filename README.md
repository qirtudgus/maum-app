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
#### 1. clone한 프로젝트의 /maum-app/renderer 경로로 가서 .env 파일을 생성하고 아래 내용을 복사 해놓습니다.
````
//.env
NEXT_PUBLIC_FIREBASE_apiKey = ""
NEXT_PUBLIC_FIREBASE_authDomain =""
NEXT_PUBLIC_FIREBASE_databaseURL = ""
NEXT_PUBLIC_FIREBASE_projectId = ""
NEXT_PUBLIC_FIREBASE_storageBucket = ""
NEXT_PUBLIC_FIREBASE_messagingSenderId =""
NEXT_PUBLIC_FIREBASE_appId =""
````
#### 0. Firebase에서 새 프로젝트를 생성합니다.
#### 1. 아래 웹 버튼을 눌러 앱을 추가합니다.
![image](https://user-images.githubusercontent.com/70016257/216794897-b65e21cb-8ed4-4ae3-9acd-878eb7e0d520.png)
#### 2. 앱의 이름을 지정해주고 '다음'을 눌러줍니다.
![image](https://user-images.githubusercontent.com/70016257/216794937-71adccbc-e05f-4444-a0b5-3aa19147bb80.png)
#### 3. 그럼 아래와 같이 기본 SDK를 발급받을 수 있습니다. databaseURL을 제외한 키에 적절하게 .env를 작성해준 뒤 하단 '콘솔로 이동'을 눌러줍니다.
![image](https://user-images.githubusercontent.com/70016257/216794975-3515e292-9655-4c63-846a-9f29da19b065.png)
#### 4. 두개의 빌드를 추가할 것입니다. 좌측의 빌드메뉴를 클릭하여 'Authentication'를 들어가 시작하기를 눌러줍니다.
![image](https://user-images.githubusercontent.com/70016257/216795069-c8be2074-5c44-4085-aeb4-372790f2833a.png)
![image](https://user-images.githubusercontent.com/70016257/216795080-f8e85fce-a617-4d90-bb47-98059c78ab0b.png)
#### 5. 로그인 제공업체중 '이메일/비밀번호'를 눌러주고, 사용 설정를 켜준 뒤 저장해줍니다.
![image](https://user-images.githubusercontent.com/70016257/216795128-74392527-fc2e-4ccf-ace6-afa9516f0dbf.png)
![image](https://user-images.githubusercontent.com/70016257/216795135-790438b7-1a13-4ddc-9765-836e545c48fb.png)
#### 6. 좌측의 빌드 메뉴를 클릭하여 Realtime Database로 들어가 '데이터베이스 만들기'를 눌러줍니다.
![image](https://user-images.githubusercontent.com/70016257/216795171-e77fce5e-31a1-44e5-8eda-86997cf5f344.png)
#### 7. 실시간 데이터베이스 위치를 싱가포르로 변경해주고 다음으로 넘어갑니다.
![image](https://user-images.githubusercontent.com/70016257/216795212-b38fff34-3abb-43d1-9054-83a259fceb1c.png)
#### 8. '테스트 모드에서 시작'에 체크하여 '사용 설정'을 눌러줍니다.(현재는 30일의 기간을 설정했지만 필요에따라 .read와 .write를 true로 바꾸면 지속적으로 데이터를 관리할 수 있습니다.)
![image](https://user-images.githubusercontent.com/70016257/216795262-aa814f9a-b513-4fc0-9fa7-6d6d88134524.png)
#### 9. Database URL을 복사하여 .env에 남아있는 'NEXT_PUBLIC_FIREBASE_databaseURL'에 할당해줍니다.
![image](https://user-images.githubusercontent.com/70016257/216795300-0620b071-6526-42fc-88cf-8cb1efe14a34.png)
#### 10. Firebase 설정이 완료되었고, 앱을 실행할 차례입니다.
#### 11. npm install을 명령하여 패키지 설치 후 앱을 실행 및 빌드합니다, 사용 가능한 명령어는 아래와 같습니다.
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
#### 현재 개발 환경에서는 테스트를 위해 클라이언트가 두개 켜지도록 설정되어있습니다. (프로덕션 환경에선 정상 작동)


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





