const { faker } = require('@faker-js/faker');
const mysql = require('mysql2');
const express = require('express');
const path = require('path');
const methodOverride = require('method-override');
const {v4:uuidv4} = require('uuid');
require('dotenv').config();

const app = express();
const port = 3000;

app.use(methodOverride("_method"));
app.use(express.urlencoded({extended:true}));
app.set("view engine","ejs");
app.set("views",path.join(__dirname,"/views"));

const connection = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    database: process.env.DB_DATABASE,
    password: process.env.DB_PASSWORD,
});


const queryAsync = async (q, values) => {
    return new Promise((resolve, reject) => {
        connection.query(q, values, (err, result) => {
            if (err) {
                reject(err);
            } else {
                resolve(result);
            }
        });
    });
};


const wrapAsync = (fn) => {
    return (req, res, next) => {
        fn(req, res, next).catch(next);
    };
};

/* ******* Uncomment and execute the below code to initilaze data for the first time ******** */
// let getRandomUser = () => {
//     return [
//         faker.string.uuid(),
//         faker.internet.userName(),
//         faker.internet.email(),
//         faker.internet.password(),
//     ];
// }

// let data = [];
// for(let i=1; i<=100;i++)
// {
//         data.push(getRandomUser()); // 100 fake users.
//     }
    
// let q = "INSERT INTO user (id, username, email, password) VALUES ? ";

// try {
//     connection.query( q,[data], (err, result) => {
//         if (err) throw err;
//         console.log(result); // RESULT will be an array
//     })
// } catch (err) {
//     console.log(err);
// }
// connection.end();



app.get("/", wrapAsync(async (req, res) => {
    let q = `SELECT count(*) FROM user`;
    const result = await queryAsync(q);
    let count = result[0]["count(*)"];
    res.render("home.ejs", { count });
}));


    // Fetch and shows the info about users from DB
    app.get("/user", wrapAsync(async (req, res) => {
        let q = `SELECT email, id, username FROM user`;
        const result = await queryAsync(q);
        let users = result;
        res.render("showUsers.ejs", { users });
    }));
    

    
    // Opens a Edit page for users
    app.get("/user/:id/edit", wrapAsync(async (req, res) => {
        let { id } = req.params;
        let q = `SELECT * FROM user WHERE id='${id}'`;
        const result = await queryAsync(q);
        
        let user = result[0];
        res.render("edit.ejs", { user });
    }));
    


    app.patch("/user/:id", wrapAsync(async (req, res) => {
        let { id } = req.params;
        let { password: formPass, username: newUsername } = req.body;
        let q = `SELECT * FROM user WHERE id='${id}'`;
    
        const result = await queryAsync(q);
        let user = result[0];
    
        if (formPass !== user.password) {
            res.send("Incorrect password");
        } else {
            let q2 = `UPDATE user SET username='${newUsername}' WHERE id='${id}'`;
            await queryAsync(q2);
            res.redirect("/user");
        }
    }));
    


    // Opens a Delete page for users
    app.get("/user/:id/delete", wrapAsync(async (req, res) => {
        let { id } = req.params;
        let q = `SELECT * FROM user WHERE id='${id}'`;
    
        const result = await queryAsync(q);
        let user = result[0];
    
        console.log(user);
        res.render("delete.ejs", { user });
    }));
    

    app.delete("/user/:id", wrapAsync(async (req, res) => {
        let { id } = req.params;
        let { email: formEmail, password: formPass } = req.body;
        let q = `SELECT * FROM user WHERE id='${id}'`;
    
        const result = await queryAsync(q);
        let user = result[0];
    
        if (formEmail !== user.email || formPass !== user.password) {
            res.send("Incorrect password Or email");
        } else {
            let q2 = `DELETE FROM user WHERE id='${id}'`;
            await queryAsync(q2);
            res.redirect("/user");
        }
    }));
    


    // Open a Add new User page 
    app.get("/newUser",(req,res)=>{
        res.render("newUser.ejs");
    });


    app.post("/newUser", wrapAsync(async (req, res) => {
        let id = uuidv4();
        let { username, email, password } = req.body;
        let q = "INSERT INTO user (id, username, email, password) VALUES (?, ?, ?, ?)";
        let newUserData = [id, username, email, password];
        await queryAsync(q, newUserData);
        res.redirect("/user");
    }));



// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err);
    res.status(500).send(err.message);
});


app.listen(port,()=>{
    console.log(`App is listening on port ${port}`);
});


/*  ********** Handling asynchronus routes without wrapAsync **************  */ 


// Fetch and shows total number of  users from DB
// app.get("/",(req,res)=>{
//     let q = `SELECT count(*) FROM user`;
//     try {
//             connection.query( q, (err, result) => {
//             if (err) throw err;
//             let count = result[0]["count(*)"];
//             console.log(result[0]["count(*)"]);
//             // res.send("Users count:" + result[0]["count(*)"]);
//             res.render("home.ejs",{count});
//             })
//         } 
//         catch (err) {
//             console.log(err);
//             res.send("Some error occured in DB");
//         }
//         // connection.end(); // Don't have to write it. Connection ends automatically once the code block is executed.
//     });




    // // Fetch and shows the info about users from DB
    // app.get("/user",(req,res)=>{
    //     let q = `SELECT email ,id, username FROM user `;
    //     try {
    //         connection.query( q, (err, result) => {
    //         if (err) throw err;
    //         let users = result;
    //         res.render("showUsers.ejs",{users});
    //         })
    //     }
    //     catch (err) {
    //         console.log(err);
    //         res.send("Some error occured in DB");
    //     } 

    // });


    // // Opens a Edit page for users
    // app.get("/user/:id/edit",(req,res)=>{
    //     let {id} = req.params;
    //     let q = `SELECT * FROM user WHERE id='${id}'`;
    //     try {
    //         connection.query( q, (err, result) => {
    //         if (err) throw err;
    //         let user = result[0];
    //         res.render("edit.ejs",{user});
    //         })
    //     }
    //     catch (err) {
    //         console.log(err);
    //         res.send("Some error occured in DB");
    //     } 

    // })


    // app.patch("/user/:id",(req,res)=>{
    //     let {id} = req.params;
    //     let {password: formPass, username: newUsername} = req.body;
    //     let q = `SELECT * FROM user WHERE id='${id}'`;
    //     try {
    //         connection.query( q, (err, result) => {
    //         if (err) throw err;
    //         let user = result[0];
    //         if(formPass!=user.password){
    //             res.send("Incorrect password");
    //         }else{
    //             let q2 = `UPDATE user SET username='${newUsername}' WHERE id='${id}'`;
    //             connection.query(q2, (err, result)=>{
    //                 if(err) throw err;
    //                 // res.send(result);
    //                 res.redirect("/user")
    //             })
    //         }
    //         })
    //     }
    //     catch (err) {
    //         console.log(err);
    //         res.send("Some error occured in DB");
    //     } 
    // });


    
    // // Opens a Delete page for users
    // app.get("/user/:id/delete",(req,res)=>{
    //     let {id} = req.params;
    //     let q = `SELECT * FROM user WHERE id='${id}'`;
    //     try {
    //         connection.query( q, (err, result) => {
    //         if (err) throw err;
    //         let user = result[0];
    //         console.log(user);
    //         res.render("delete.ejs",{user});
    //         })
    //     }
    //     catch (err) {
    //         console.log(err);
    //         res.send("Some error occured in DB");
    //     } 
    // });


    
    // app.delete("/user/:id", (req,res)=>{
    //     let {id} = req.params;
    //     let {email: formEmail, password: formPass} = req.body;
    //     let q = `SELECT * FROM user WHERE id='${id}'`;

    //     try {
    //         connection.query( q, (err, result) => {
    //         if (err) throw err;
    //         let user = result[0];
    //         if(formEmail!=user.email ||formPass!=user.password ){
    //             res.send("Incorrect password Or email");
    //         }else{
    //             let q2 = `DELETE FROM user WHERE id='${id}'`;
    //             connection.query(q2, (err, result)=>{
    //                 if(err) throw err;
    //                 // res.send(result);
    //                 // res.send("Deleted sucessfully");
    //                 res.redirect("/user")
    //             })
    //         }
    //         })
    //     }
    //     catch (err) {
    //         console.log(err);
    //         res.send("Some error occured in DB");
    //     } 

    // });


    // app.post("/newUser",(req,res)=>{
    //     let id = uuidv4();
    //     let {username ,email , password} = req.body;
    //     let q = "INSERT INTO user (id, username, email, password) VALUES (?, ?, ?, ?) ";
    //     let newUserData = [id, username, email,password];
    //     try {
    //             connection.query( q, newUserData, (err, result) => {
    //                 if (err){
    //                     console.log(err);
    //                     res.send("Some error occurred in DB");
    //                 }else{
    //                     res.redirect("/user");
    //                 }
    //             })
    //         } catch (err) {
    //             console.log(err);
    //             res.send("Some error occured in DB");
    //         }
    // });


