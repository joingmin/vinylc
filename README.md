# node version
 - 14.17.1 이상

# npm version
 - 6.7.0

# gulp version
 - 4.0.2

# setting
### 1. nodejs 설치
 - https://nodejs.org/en/
 - 좌측 LTS 버젼으로 설치.
 - 이미 설치 되어 있다면 패스.
 
### 2. gulp 설치
 - npm install -g gulp

### 3. 소스 내려받기
 - git 설치가 안되어 있다면, https://git-scm.com/ git 설치.
 - http://gitlab.vinylc.net/ppark8/vinylc.git 깃 레지스러리 복사.
 - 각 개인 PC 및 Editor 환경에 맞춰서 소스 내려 받기.

### 4. 내려받은 폴더로 이동 후, 터미널 열기
 - 작업 폴더에 gulp 재설치. 이유는 구글링. gulp 실행 전까지 아래 커맨드 실행.
 - npm install --save-dev gulp
 - npm install
 - npm audit fix
 - gulp build

### 5. gulp 실행
 - gulp

### 6. 완료
 - 위 작업까지 이상없이 진행되면 브라우져 열리고 localhost:8888 로 많이 보던 퍼블진행표 페이지가 열릴 것임.
 - 이 후 새로고침 필요없이 각자 editor에서 작업하면 됨. 끝!!!


### 디렉터리 정보 ###
 - /about, /careers, /crews, /goods, /news, /request, /works
   각 페이지 html 파일.

 - /gr
   메인 및 공통 html 파일.

 - /include
   메뉴, 푸터, 모달 등 인쿠루드 되는 html 파일.
   
 - /playv
   오픈 후 추가 개발 된 페이지.
   메인에만 진입 버튼이 있으며, 바이널 비메오페이지에 있는 영상들 보여주는 컨텐츠임.
   비메오 API는 백앤드에서 관리자 등록시 연동.
   js는 다른 페이지와 동일하게 json연동으로 데이터 가져옴.

 - /template
   js에서 로드하는 html 템픞릿 html.
   주로 works, news에서 사용하는 각 리스트 모듈관련 템플릿.

 - /guide, /wsg
   코딩 진행표 및 가이드 html 파일.

 - /css, /font, /images, /movie
   css 파일 및 static한 이미지/영상 파일

 - /html, /src
   테스트를 위한 파일들.
   불필요한 파일들 일 수 있으나 이전 작업자가 생성하고 난 후, 손대지 않고 일단 남겨둔 상황.

 - /js
   각 페이지마다 해당 페이지명으로 js파일 존재.
   vcui 모듈방식으로 제작.

 - /json
   로컬상 각 데이터 연동 json 파일 모음.
   html상에서 각 모듈 element의 data-ajax속성에 연결 json을 넣어둠.

### 개발 시 유의사항 ###
 - 기존은 svn연결해서 관리를 하였으나 서버가 삭제되고, 기존 파일 그대로 gulp로 구성하게 되었음.
   gulp는 서버만 실행하고 빌드 시에는 모든 파일 그대로 옮기기만 할뿐임.

 - html상에서 인클루드 하는 방식이 gulp로 옮기며 사용할 수가 없는 상태라
   npm용 gulp-file-include 플러그인으로 바꾼 상태.
   단, 전체 모든 파일을 바꾼 상태는 아니며 수정사항에 해당되는 파일만 수정한 상태.

 - 수정한 파일은 git에 푸시하고, 개발서버나 실서버 업로드는 백앤드팀(현 담당 김남규)에 알려주어야 함.
   html은 주석처리로 수정부분 표기해야 백앤드팀에서 수월하게 작업이 가능함.

 - 예전 코딩진행표만 작업하던 방식이라 작업 후 개발서버에서라도 따로 확인을 할 수 없으며,
   진행표에서만 페이지 단위로 확인 가능함.

### 현재(2021.11.30)기준 작업현황 ###
 - 회사 주소 업데이트.
   퍼블완료. 개발서버까지만 적용.

 - 브런치 메뉴 추가.
   퍼블완료. 개발서버까지만 적용.

 - /news/insught 폰트사이즈 수정.
   퍼블완료. 개발서버까지만 적용.

 - 굿즈 => 라이프 메뉴변경.
   퍼블완료. 개발서버까지만 적용.

 - /playv
   js/퍼블완료. 개발서버까지만 적용.
   