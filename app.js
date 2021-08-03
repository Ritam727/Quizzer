const express = require("express");
const mongoose = require("mongoose");

const app = express();
app.use(express.urlencoded({extended: true}));
app.use(express.static("public"));
app.set("view engine", "ejs");
const mongodbOptions = {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useCreateIndex: true,
    useFindAndModify: false
};
mongoose.connect("mongodb://localhost:27017/quizDB", mongodbOptions);

const optionSchema = new mongoose.Schema({
    text: String,
    correct: String
});
const Option = new mongoose.model("option", optionSchema);

const questionSchema = new mongoose.Schema({
    question: String,
    qType: String,
    options: [optionSchema]
});
const Question = new mongoose.model("question", questionSchema);

const quizSchema = new mongoose.Schema({
    name: String,
    quizDate: String,
    quizStart: String,
    quizEnd: String,
    questions: [questionSchema]
});
const Quiz = new mongoose.model("quiz", quizSchema);

var isLoggedIn = false;
var newQuesVal = "false";

function makeDateString(date) {
    var month = "", dates = "", year = date.getFullYear();
    if(date.getMonth().toString().length == 1) {
        month = "0"+(date.getMonth()+1);
    }
    if(date.getDate().toString().length == 1) {
        dates = "0"+date.getDate();
    }
    return date.getFullYear()+"-"+month+"-"+dates;
}

app.get("/", (req, res) => {
    newQuesVal = "false";
    Quiz.find({}, (err, quizzes) => {
        if(!err) {
            if(!(quizzes.length)) {
                quizzes = [{id :"No quizzes to take"}];
            }
            res.render("home", {
                isLoggedIn: isLoggedIn,
                allQuizzes: quizzes
            });
        } else {
            res.send(err);
        }
    });
});

app.get("/quiz/:quizID", (req, res) => {
    Quiz.findById(req.params.quizID, (err, quiz) => {
        if(!err) {
            if(quiz) {
                res.render("createquiz", {
                    isLoggedIn: isLoggedIn,
                    newQues: newQuesVal,
                    allQuestions: quiz.questions,
                    quizId: quiz.id
                });
            } else {
                res.send("Quiz not found!")
            }
        } else {
            res.send(err);
        }
    });
});

app.get("/create", (req, res) => {
    res.render("create", {
        isLoggedIn: isLoggedIn
    });
});

app.post("/create", (req, res) => {
    const quiz = new Quiz({
        name: req.body.quizName,
        quizDate: req.body.quizDate,
        quizStart: req.body.quizStart,
        quizEnd: req.body.quizEnd,
        questions: []
    });
    Quiz.create(quiz, (err) => {
        if(!err) {
            res.redirect("/quiz/"+quiz.id);
        } else {
            res.redirect("/create");
        }
    });
});

app.post("/quiz/:quizID", (req, res) => {
    if(req.body.new === "true") {
        newQuesVal = "true";
        res.redirect("/quiz/"+req.params.quizID);
    } else {
        newQuesVal = "false";
        let optionA = "", optionB = "", optionC = "", optionD = "";
        if(req.body.qType !== "Subjective") {
            optionA = new Option({
                text: req.body.optA,
                correct: (req.body.optACheck ? "on" : "off")
            });
            optionB = new Option({
                text: req.body.optB,
                correct: (req.body.optBCheck ? "on" : "off")
            });
            optionC = new Option({
                text: req.body.optC,
                correct: (req.body.optDCheck ? "on" : "off")
            });
            optionD = new Option({
                text: req.body.optD,
                correct: (req.body.optDCheck ? "on" : "off")
            });
        }
        const question = new Question({
            question: req.body.question,
            qType: req.body.qType,
            options: [optionA, optionB, optionC, optionD]
        });
        Quiz.findById(req.params.quizID, (err, quiz) => {
            if(!err) {
                if(quiz) {
                    quiz.questions.push(question);
                    quiz.save();
                } else {
                    res.send("Not found");
                }
            } else {
                res.send(err);
            }
        })
        res.redirect("/quiz/"+req.params.quizID);
    }
});

app.listen(process.env.PORT || 3000, () => {
    console.log("Server set up at port 3000");
    console.log("http://localhost:3000");
});