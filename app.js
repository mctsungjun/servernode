const express = require('express');
const app = express();
const session = require('express-session');
const fs = require('fs');
const path = require('path');

const cors = require('cors');
//로컬설정
// let corsOption = {
//   origin: 'http://localhost:8080', // 허락하는 요청 주소
//   credentials: true, // true로 하면 설정한 내용을 response 헤더에 추가 해줍니다.
//   optionsSuccessStatus: 200
// }

// 배포시
let corsOption = {
    origin: '*', // Vue 앱이 배포된 주소
    credentials: true, // 쿠키 등을 포함하려면 true로 설정
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'], // 허용할 HTTP 메서드
    allowedHeaders: ['Content-Type', 'Authorization'], // 허용할 요청 헤더
    optionsSuccessStatus: 200
  };
  const allowedOrigins = [
    'https://web-vuedepoytest-m3cudz5w505940d1.sel4.cloudtype.app', // 현재 프론트엔드 도메인
    
  ];
  
  app.use(cors({
    origin: function (origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    }
  }));
  // app.use((req, res, next) => {
  //   res.header('Access-Control-Allow-Origin', 'https://web-vuenode-m3cudz5w505940d1.sel4.cloudtype.app');  // 허용할 출처
  //   res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');  // 허용할 헤더
  //   res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');  // 허용할 메서드
  //   res.header('Access-Control-Allow-Credentials', 'true');  // 세션 쿠키 등 인증 정보 허용
  //   next();
  // });

app.use(cors(corsOption)); // CORS 미들웨어 추가
// app.use(express.json())
app.use(session({
    secret: 'secret code',
    resave: false,
    saveUninitialized: false,
    //로컬설정
    cookie: {
        secure: false,
        maxAge: 1000 * 60 * 60 //쿠키 유효시간 1시간
    }
    //배포시
//     cookie: {
//         secure: process.env.NODE_ENV === 'production', // 환경에 따라 secure 설정 (배포 시 HTTPS 사용)
//         maxAge: 1000 * 60 * 60 // 1시간
//       }
}));
//이미지를 서버에서 제공하려면 Express에서 정적 파일 경로를 설정해야 합니다
app.use('/uploads', express.static(path.join(__dirname, 'uploads'))); 
// 바디로 요청할때 웹서버에서 받을려면 
app.use(express.json({
    limit: '5mb'
}));


const db = {
    database: "vueuser",
    connectionLimit: 10,
    host: "svc.sel4.cloudtype.app",
    port:31929,
    user: 'root',
    password: "dla2318"
};

const dbPool = require('mysql').createPool(db);


//로컬에서
// const server = app.listen(3000, () => {
//     console.log('Server started. port 3000.');
// });

const server = app.listen(3000, () => {
    console.log('Server started. port 3000.');
});

let sql = require('./sql.js');
const { error } = require('console');
fs.watchFile(__dirname + '/sql.js', (curr, prev) => {
    console.log('sql변경시 재시작 없이 반영');
    delete require.cache[require.resolve('./sql.js')];
    sql = require('./sql.js');
})

app.post('/api/login', async (request, res) =>{
    try{
        const param = request.body.param;
        //res.send(await req.db('signUp', request.body.param)); // alias: sql.js에서 키값 , post방식의 파라미터 전달받는형식  request.body.param
        for (var info in param) {

            request.session[info] = param[info];
        }
        console.log("Session data",request.session);
        res.send('ok');
    } catch(err) {
        res.status(500).send({
            error:err
        })
    }
    
});

app.post('/upload/:productId/:type/:fileName', async (request, res) => {

    let {
      productId,
      type,
      fileName
    } = request.params;
    const dir = `${__dirname}/uploads/${productId}`;
    const file = `${dir}/${fileName}`;
    if (!request.body.data) return fs.unlink(file, async (err) => res.send({
      err
    }));
    const data = request.body.data.slice(request.body.data.indexOf(';base64,') + 8);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir);
    fs.writeFile(file, data, 'base64', async (error) => {
      await req.db('productImageInsert', [{
        product_id: productId,
        p_type: type,
        path: fileName
      }]);
  
      if (error) {
        res.send({
          error
        });
      } else {
        res.send("ok");
      }
    });
  });
  
  // app.get('/download/:productId/:fileName', (request, res) => {
  //   const {
  //     productId,
  //     type,
  //     fileName
  //   } = request.params;
  //   console.log("filename",fileName)
  //   const filepath = `${__dirname}/uploads/${productId}/${fileName}`;
  //   res.header('Content-Type', `image/${fileName.substring(fileName.lastIndexOf("."))}`);
  //   if (!fs.existsSync(filepath)) res.send(404, {
  //     error: 'Can not found file.'
  //   });
  //   else fs.createReadStream(filepath).pipe(res);
  // });


  //코드 개선
  app.get('/download/:productId/:fileName', (request, res) => {
    const { productId, fileName } = request.params;
    console.log("filename:", fileName);

    // 파일 경로 생성
    const filepath = path.join(__dirname, 'uploads', productId, fileName);
    console.log("filepath", filepath);
    // 파일 존재 여부 확인
    if (!fs.existsSync(filepath)) {
        return res.status(404).json({
            error: 'Cannot find file.'
        });
    }
    // 캐싱 비활성화 헤더 추가
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.setHeader('Surrogate-Control', 'no-store');        
    // 파일 확장자로 MIME 타입 설정
    const fileExt = path.extname(fileName).substring(1); // 확장자 추출
    const mimeType = `image/${fileExt}`;

    // 적절한 Content-Type 설정
    res.setHeader('Content-Type', mimeType);

    // 파일 스트리밍으로 응답
    fs.createReadStream(filepath).pipe(res);
});


app.post('/api/logout', (request, res) =>{
    request.session.destroy((err) =>{
        if(err){
            return request.status(500).send({error: 'Failed to log out'});
        }
        res.send('ok');
    });
});


app.post('/api/:alias', async (request, res) => {
    try{
        res.send(await req.db(request.params.alias, request.body.param)); // alias: sql.js에서 키값 , post방식의 파라미터 전달받는형식  request.body.param
        if (request.params.alias === "imageDelete") {
          let{
            productId,
            fileName
          } = request.body.param;
          const dir = `${__dirname}/uploads/${productId}`;
          const file = `${dir}/${fileName}`;
         fs.unlink(file, (err) => {
          if (err){
            console.error(`파일 삭제 중 오류 발생:${err.message}`);
          }
          console.log('파일이 성공적으로 삭제되었습니다.');
         });
        }
    } catch(err) {
        res.status(500).send({
            error:err
        })
    }
});

app.post('/apirole/:alias', async (request, res) => {
    if(!request.session.email) {
        return res.status(401).send({error:'You need to login'})
    }
    try{
        res.send(await req.db(request.params.alias));

    } catch(err) {
        res.status(500).send({
            error:err
        })
    }
});

const req = {
    async db(alias, param = [], where = '') {
      return new Promise((resolve, reject) => dbPool.query(sql[alias].query + where, param, (error, rows) => {
        if (error) {
          if (error.code != 'ER_DUP_ENTRY')
            console.log(error);
          resolve({
            error
          });
        } else resolve(rows);
      }));
    }
  };