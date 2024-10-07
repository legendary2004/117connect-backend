import express from "express";
import cors from 'cors';
import mysql from 'mysql2';
import dotenv from "dotenv";
import bodyParser from "body-parser";
import { profileUpload } from "./profileUpload.js";
import nodemailer from "nodemailer"
import { serviceUpload } from "./serviceUpload.js";

dotenv.config({path: "./.env"})

const app = express();
const port = 5000;

app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.use(cors());
app.use(bodyParser.json());

const db = mysql.createConnection({
    host: process.env.db_host,
    user: process.env.db_user,
    password: process.env.db_pass,
    database: process.env.db_name,
    port: process.env.db_port
})

mysql.createPool({
    keepAliveInitialDelay: 10000, // 0 by default.
    enableKeepAlive: true, // false by default.
});

db.connect(err => {
    if (err) console.log(err)
        else console.log("Connected")
})

function sendEmail(from, to, subject, text, res) {
    let transporter = nodemailer.createTransport({
        host: process.env.host,
        port: process.env.port,
        secureConnection: process.env.secure, 
        auth: {
            user: process.env.email,
            pass: process.env.pass
        }
    });

    let mailOptions = {
        from,
        to,
        subject,
        text
    };

    transporter.sendMail(mailOptions, function(error, info){
        if (error) {
            console.log(error);
            res.send({
                message: error.message
            })
        } else {
            console.log('Email sent: ' + info.response);
            res.send({
                message: "Email sent."
            })
        }
    });
}

const getLocations = (req, res) => {
    db.query("SELECT * FROM locations", (err, result) => {
        if (err) console.log(err)
        else res.send({
            result
        })
    })
}

const getServices = (req, res) => {
    db.query("SELECT * FROM services", (err, result) => {
        if (err) console.log(err)
        else res.send({
            result
        })
    })
}

app.post("/login", (req, res) => {
    const {email, pass} = req.body

    db.query("SELECT * FROM admin WHERE email = ? and password = ?", [email, pass], (err, result) => {
        if (err) {
            res.send({
                message: err
            })
        }
        else if (result.length == 0) {
            res.send({
                message: "Incorrect email or password"
            })
        }
        else {
            res.send({
                message: "",
                user: result[0]
            })
        }
    })
})

app.post("/handleTextChange", (req, res) => {
    const {id, content} = req.body

    db.query("SELECT * FROM texts WHERE id = ?", [id], (err, result) => {
        if (err) {
            res.send({
                message: err.message
            })
        }
        else if (result.length == 0) {
            res.send({
                message: "Something went wrong. please try again"
            })
        }
        else {
            db.query("UPDATE texts SET ? WHERE id = ?", [{element: content}, id], (error, result) => {
                if (error) console.log(error)
                else res.send({
                    message: "Element updated.",
                })
            })
        }
    })
})

app.post("/handleImageChange", (req, res) => {
    profileUpload(req, res, (errr) => {
        if (errr) console.log(errr)   
        else {
            const id = req.body.id
            const file = req.file.filename
        
            db.query("UPDATE images SET ? WHERE id = ?", [{file}, id], (error, result) => {
                if (error) console.log(error)
                else res.send({
                    message: "Element updated.",
                })
            })
        }
    })
})

app.post("/getTexts", (req, res) => {
    db.query("SELECT * FROM texts", (err, result) => {
        if (err) console.log(err)
        else res.send({
            result
        })
    })
})

app.post("/getImages", (req, res) => {
    db.query("SELECT * FROM images", (err, result) => {
        if (err) console.log(err)
        else res.send({
            result
        })
    })
})

app.post("/contact", (req, res) => {
    const {firstName, lastName, company, email, phone, message} = req.body

    sendEmail(email, process.env.email, "Service needed", `
        ${message}
        Name - ${firstName} ${lastName}
        Company - ${company}
        Phone - ${phone}
        Email  - ${email}
    `, res)
    sendEmail(process.env.email, email, "Message recieved", "Hello user. Thank you for reaching us out. One of our team members will reach out to you soon.", res)
})

app.post("/addLocation", (req, res) => {
    const {location, lat, lng} = req.body

    db.query("INSERT INTO locations SET ?", {location, lat, lng}, (err, result) => {
        if (err) {
            res.send({
                message: err.message
            })
        }
        else {
            res.send({
                message: "Location added."
            })
        }
    })
})

app.post("/getLocations", (req, res) => {
    getLocations(req, res)
})

app.post("/removeLocation", (req, res) => {
    db.query("DELETE FROM locations WHERE id = ?", [req.body.id], (err, resu) => {
        if (err) console.log(err)
        else {
            getLocations(req, res)
        }   
    })
})

app.post("/addService", (req, res) => {
    serviceUpload(req, res, (errr) => {
        if (errr) console.log(errr)   
        else {
            const {name, description} = req.body
            const file = req.file.filename

        
            db.query("INSERT INTO services SET ? ", {name, description, file}, (error, result) => {
                if (error) {
                    res.send({
                        message: error.message
                    })
                }
                else res.send({
                    message: "Service added.",
                })
            })
        }
    })
})

app.post("/getServices", (req, res) => {
    getServices(req, res)
})

app.post("/removeService", (req, res) => {
    db.query("DELETE FROM services WHERE id = ?", [req.body.id], (err, resu) => {
        if (err) console.log(err)
        else {
            getServices(req, res)
        }   
    })
})

app.get('/message', (req, res) => {
    res.json({ message: "Hello from server!" });
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});