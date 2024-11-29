const express = require('express');
const app = express();
const session = require('express-session');
const nodemailer = require ( "nodemailer" );
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const bodyParser = require('body-parser');
const cors = require('cors');
const kakaoinfo = require('./config');
const util = require('util');
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');
const mime = require('mime-types');
//로컬설정
// let corsOption = {
//   origin: 'http://localhost:8080', // 허락하는 요청 주소
//   credentials: true, // true로 하면 설정한 내용을 response 헤더에 추가 해줍니다.
//   optionsSuccessStatus: 200
// }
 //파일 저장 설정
 const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'fileDownload/');
  },
  filename:(req, file, cb) => {
    const sysfile = `${uuidv4()}${path.extname(file.originalname)}`;
    cb(null, sysfile);
  }
});
const upload = multer({storage});

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
  
  app.get('/download/:productId/:fileName', (request, res) => {
    const {
      productId,
      type,
      fileName
    } = request.params;
    console.log("filename",fileName)
    const filepath = `${__dirname}/uploads/${productId}/${fileName}`;
    res.header('Content-Type', `image/${fileName.substring(fileName.lastIndexOf("."))}`);
    if (!fs.existsSync(filepath)) res.send(404, {
      error: 'Can not found file.'
    });
    else fs.createReadStream(filepath).pipe(res);
  });


//   //코드 개선
//   app.get('/download/:productId/:fileName', (request, res) => {
//     const { productId, fileName } = request.params;
//     console.log("filename:", fileName);

//     // 파일 경로 생성
//     const filepath = path.join(__dirname, 'uploads', productId, fileName);
//     console.log("filepath", filepath);
//     // 파일 존재 여부 확인
//     if (!fs.existsSync(filepath)) {
//         return res.status(404).json({
//             error: 'Cannot find file.'
//         });
//     }
//     // 캐싱 비활성화 헤더 추가
//     res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
//     res.setHeader('Pragma', 'no-cache');
//     res.setHeader('Expires', '0');
//     res.setHeader('Surrogate-Control', 'no-store');        
//     // 파일 확장자로 MIME 타입 설정
//     const fileExt = path.extname(fileName).substring(1); // 확장자 추출
//     const mimeType = `image/${fileExt}`;

//     // 적절한 Content-Type 설정
//     res.setHeader('Content-Type', mimeType);

//     // 파일 스트리밍으로 응답
//     fs.createReadStream(filepath).pipe(res);
// });


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
           // 데이터 유효성 검증
           const param = request.body.param;
           if (!Array.isArray(param) || param.length !== 2) {
               console.error("Invalid parameters for imageDelete");
               return;
           }
          const[
            productId,
            fileName
           ] = param;
          console.log("productId",productId);
          console.log("fileName",fileName);
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

//gmail로 메일보내기
app.post('/send-email', async(req,res)=>{

  
  let param = req.body.param;
  let [name, email, title, content] = param;
  //확인
  console.log('name', name);
  console.log('email', email);
  console.log('title', title);
  console.log('content', content);
  if (!email || !title || !content) {
    return res.status(400).send('Missing required fields');
  }
  const transporter = nodemailer.createTransport({
    service: "Gmail",
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    auth: {
      user: "m97161@gmail.com",
      pass: "vplnnhtzuavweknx",
    },
  });
  const mailOptions = { 
    from : email , 
    to : "m9716@naver.com" , 
    subject : title , 
    text :content , 
  };
  await transporter.sendMail ( mailOptions , ( error , info ) => { 
    if (error){ 
      console.error ( "이메일 전송 오류: " , error );
      res.send(error);   
    } else {
       console.log ( "이메일 전송: " , info.response );
      res.send("ok");   } 
    } );
      
});

// 카카오페이결제
app.post('/kakaopay', async(req, res) => {
  param = req.body.param;
  let [user,id, name, price, deliver_price, total, total_price] = param;
  
  try{
    const response = await axios.post('https://open-api.kakaopay.com/online/v1/payment/ready', {

          cid: 'TC0ONETIME', // 테스트용 CID
          partner_order_id: id,
          partner_user_id: user,
          item_name:name,
          quantity:total,
          
          total_amount:(total_price + deliver_price),
          deliver_price:deliver_price,
          vat_amount: Math.floor((total_price + deliver_price) / 10),
          tax_free_amount: 0,
          approval_url: 'https://web-vuedepoytest-m3cudz5w505940d1.sel4.cloudtype.app/kakaosuccess', // Vue 앱의 성공 URL
          cancel_url: 'https://web-vuedepoytest-m3cudz5w505940d1.sel4.cloudtype.app/payment-cancel',
          fail_url: 'https://web-vuedepoytest-m3cudz5w505940d1.sel4.cloudtype.app/payment-fail',
      }, {
          headers: {
              'Authorization' : 'SECRET_KEY DEV42B8A4C24E846AA7693A8CE5BE5E9A098CA2A', // REST API 키
              'Content-Type': 'application/json;charset=UTF-8',
          },
      });
        // 응답 데이터 전송
        kakaoinfo.tid = response.data.tid;
        kakaoinfo.partner_order_id = id;
        kakaoinfo.partner_user_id = user;
        console.log(response.data);
        console.log(kakaoinfo.tid);
        res.json(response.data);
  }catch (error) {
    console.error('KakaoPay Error:', error);
    res.status(500).json({ message: 'Payment preparation failed' });
}
});

app.post('/payment/confirm', async (req, res) => {
const [pg_token]  = req.body.param;
console.log(pg_token);
if (!pg_token) {
    return res.status(400).send('pg_token이 없습니다.');
}

try {
    const response = await axios.post('https://open-api.kakaopay.com/online/v1/payment/approve', {
        tid: kakaoinfo.tid ,
        partner_order_id: kakaoinfo.partner_order_id,
        partner_user_id: kakaoinfo.partner_user_id,
        pg_token: pg_token,
        cid: 'TC0ONETIME',
      }, {
        headers: {
          Authorization: 'SECRET_KEY DEV42B8A4C24E846AA7693A8CE5BE5E9A098CA2A', // 환경 변수로 관리
          'Content-Type': 'application/json',
        },
      });
      
    console.log(kakaoinfo.tid);
    console.log('카카오페이 승인 응답:', response.data);
    res.status(200).json(response.data);
} catch (error) {
    console.error('카카오페이 승인 실패:', error);
    res.status(500).send('결제 승인 실패');
}
});


app.get('/fileDownload/:fileName', (request, res) => {
  const fName = request.params.fileName;
  console.log("fileName", fName);
  const fpath = `${__dirname}/fileDownload/${fName}`;
  const mimeType = mime.lookup(fpath) ||  'application/octet-stream';

  if (!fs.existsSync(fpath)) {
    return res.status(404).send('File not found');
  }
  res.header('Content-Type', mimeType); // 적정한 MIME 타입 설정
  // res.header('Content-Disposition', `attachment; filename="${fName}"`); // 다운로드 설정

  const fileStream = fs.createReadStream(fpath); // 파일 읽기 스트림 생성
  fileStream.pipe(res); // 클라이언트로 파일 스트림 전송

});

// promise와 async/await 방식
const queryAsync = util.promisify(dbPool.query).bind(dbPool);
const query = `insert into t_file(orifile,sysfile,psno) values(?,?,?)`;
const query2 = `select * from serial;`
app.post('/fileUpload', upload.array('files',3), async(req, res) => {
  try{
    let insertResult =''
    //Query : Serial 조회
    const serialResult = await queryAsync(query2);
    console.log('Serial result:', serialResult);

    // Query : 데이타 삽입
    for (let i = 0; i < req.files.length; i++) {
              let file = req.files[i];
        insertResult = await queryAsync(query,[file.originalname,file.filename,serialResult[0].sno]);
              
  }
  console.log('Insert result:', insertResult);
  res.status(200).send("ok")
  }catch (err){
    console.error('Database error:', err);
    res.status(500).send({ message: 'Error processing request' });
  }
});
app.post('/api/logout', (request, res) =>{
    request.session.destroy((err) =>{
        if(err){
            return request.status(500).send({error: 'Failed to log out'});
        }
        res.send('ok');
    });
});
// 게시판수정
const queryKey = '';
let psno = '';
app.post('/boardUpdate', async (req, res) =>{
  const param = req.body.param;
  const sno= param.sno;
  const subject = param.subject;
  const id = param.id;
  const doc = param.doc;
  psno = param.psno;
  console.log(psno);
  await req1.db("boardUpdate", [subject, doc, sno]); 
  
  

  res.send('ok');

});


// 게시판 파일 수정
app.post('/boardFileUpdate', upload.array('files',3), async (req,res) =>{
  
  const files = req.files;
  
  console.log(files);
  if(files.length>=1){
    for(var i=0; i<files.length;i++){
      await req1.db("UploadFileName",[psno,files[i].originalname,files[i].filename]);
  
    }
    console.log(files);
    res.send('ok');     

  }else{
    return res.send('nodata');
  }
});
// 게시판 파일 삭제
app.post('/boardDeleteFile', async (req, res) =>{
  try{

    let files =req.body.param.files;
    if (files.length <=0 ){
      return res.send('fail');
  
    }else{
      for (let i=0; i<files.length;i++){
        const directory = `${__dirname}/fileDownload`;
        const f = `${directory}/${files[i]}`;
       if (fs.existsSync(f)) {
        fs.unlink(f, (err) => {
          if (err) {
            console.error(`파일 삭제 중 오류 발생 : ${err.message}`)
          }else {
            console.log('파일이 성공적으로 삭제되었습니다.')
          }
        })
       }
        await req1.db("deleteFileName",[psno,files[i]]);
        res.send('ok');
      }
    }
  }catch (err){
    res.status(500).send({
      error:err
    });
  }
});
//게시판 글삭제
app.post('/boardDelete', async (req, res) => {
  let sno = req.body.param;
  await req1.db('boardDelete',[sno]);
  res.send('ok');
});

//게시판파일 모두삭제

// 게시판 파일 삭제
app.post('/deleteAllFile', async (req, res) =>{
  try{

    let info =req.body.param;
    console.log(info.psno);
    
    js = JSON.parse(info.files);
    console.log(js);
    if (info.psno != null) {
      for (let i=0; i<js.length;i++){
        const directory = `${__dirname}/fileDownload`;
        console.log(js[i].sysfile)
        const f = `${directory}/${js[i].sysfile}`;
       if (fs.existsSync(f)) {
        fs.unlink(f, (err) => {
          if (err) {
            console.error(`파일 삭제 중 오류 발생 : ${err.message}`)
          }else {
            console.log('파일이 성공적으로 삭제되었습니다.')
          }
        })
       }
      }
      await req1.db("deleteAllFile",[info.psno]);
      res.send('ok');
    }
  }catch (err){
    res.status(500).send({
      error:err
    });
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


  const req1 = {
    async db(queryKey, param = [], where = '') {
      return new Promise((resolve, reject) => dbPool.query(sql[queryKey].query + where, param, (error, rows) => {
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