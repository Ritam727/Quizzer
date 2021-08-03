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
const questionSchema = new mongoose.Schema({
    question: String,
    qType: String,
    options: [String]
});
const Question = new mongoose.model("question", questionSchema);

const quizSchema = new mongoose.Schema({
    questions: [questionSchema]
});
const Quiz = new mongoose.model("quiz", quizSchema);

var isLoggedIn = false;
var newQuesVal = "false";

app.get("/", (req, res) => {
    newQuesVal = "false";
    console.log(__dirname);
    Quiz.find({}, (err, quizzes) => {
        if(!err) {
            if(!quizzes) {
                quizzes = [{questions:"No quizzes to take"}];
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

app.get("/quizzes/:ID", (req, res) => {
    Quiz.findById(req.params.ID, (err, quiz) => {
        if(!err) {
            if(quiz) {
                res.render("quiz", {
                    isLoggedIn: isLoggedIn,
                    ques: quiz.questions
                })
            } else {
                res.render("quiz", {
                    isLoggedIn: isLoggedIn,
                    ques: [{question: "No questions yet", options: []}]
                })
            }
        } else {
            res.send(err);
        }
    })
});

app.get("/quiz/:quizID", (req, res) => {
    console.log(__dirname);
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
                const quiz = new Quiz({
                    _id: req.params.quizID,
                    questions: []
                })
                Quiz.create(quiz);
                res.redirect("/quiz/"+req.params.quizID);
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
        questions: []
    });
    Quiz.create(quiz);
    res.redirect("/quiz/"+quiz.id);
});

app.post("/quiz/:quizID", (req, res) => {
    if(req.body.new === "true") {
        newQuesVal = "true";
        res.redirect("/quiz/"+req.params.quizID);
    } else {
        newQuesVal = "false";
        const question = new Question({
            question: req.body.question,
            qType: req.body.qType,
            options: [req.body.optA, req.body.optB, req.body.optC, req.body.optD]
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