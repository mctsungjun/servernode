module.exports = {
    productList : {
        query: `select t1.*, t2.path, t3.category1, t3.category2, t3.category3 
                from t_product t1, t_image t2, t_category t3
                where t1.id = t2.product_id and t2.p_type = 1 and t1.category_id =t3.id;`
    },
    productList2: {
        query: `select t3.*, t4.path from (select t1.*, t2.category1, t2.category2, t2.category3 from t_product t1, t_category t2 where t1.category_id = t2.id) t3
                left join (select * from t_image where p_type=1) t4 on t3.id = t4.product_id;`
    },
    productDetail: {
        query: `select t1.*, t2.path, t3.category1, t3.category2, t3.category3 from t_product t1, t_image t2, t_category t3 where t1.id = ? and t1.id = t2.product_id and t2.p_type = 3 and t1.category_id = t3.id;`
    },
    productMainImages: {
        query: `select * from t_image where product_id = ? and p_type = 2;`
    },
    imageList: {
        query: `select * from t_image where product_id=?`
      },
    productInsert:{
        query: `insert into t_product set ?`
    },
    productImageInsert: {
        query: `insert into t_image set ?` 
    },
    sellerList : {
        query: `select * from t_seller`
    },
    userLogin: {
        query: `select * from t_user`
    },
    userSellerRegister: {
        query: `insert into t_seller(name,email,phone) 
        values(?,?,?);`
    },
    userRegister: {
        query: `insert into t_user(email,user_id,password,name,user_type)
        values(?,?,?,?,?);`
    },
    signUp: {
        query: `select user_id, email, name, user_type from t_user where ? and ?;` 
    },
    deleteProduct: {
        query: `delete from t_product where id = ?;`
    },
    categoryList: {
        query: `select * from t_category;`
    },
    boardList: {
        query: `SELECT sno, hit, nal, id, doc, psno, grp, seq, deep,  CONCAT(LPAD('└', deep * 3, '  '), ' ', subject) AS subject FROM t_board order by psno desc, grp asc;`
    },
    boardCount: {
        query: `SELECT COUNT(*) as count FROM t_board`
    },
    boardAdd: {
        query: `insert into t_board(id, subject, doc,psno) values(?,?,?,getSerial('i'))`
    },
    boardFileSno: {
        query: `select * from t_board where ?`
    },
    boardFile: {
        query: `select sysfile,orifile from t_file where ?`
    },
    searchWord: {
        query: `select * from t_board where subject like ? or doc like ?;`
    },
    boardUpdate: {
        query: `update t_board set subject = ?, doc = ? where sno=?`
    },
    deleteFileName: {
         query: `delete from t_file where psno = ? and sysfile= ?;`
    },
    UploadFileName: {
        query: `insert into t_file(psno,orifile, sysfile ) values(?,?,?)`
    },
    boardDelete:{
        query: `delete from t_board where sno =?`
    },
    deleteAllFile: {
        query: `delete from t_file where psno =?`
    },
    addHit: {
        query: `update t_board set hit=hit+1 where sno=?`
    },
    boardRep: {
        query:`insert into t_board(id, subject, doc,psno, seq,deep,grp) values(?,?,?,?,?,?,?)` 
    }

}

// insert into t_user set ? on duplicate key update ? 데이타베이스에 데이타가있으면 pass 없으면 update 