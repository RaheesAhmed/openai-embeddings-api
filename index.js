import express from "express";
import bodyParser from "body-parser";
import cors from "cors";
import runEmbeddings from "./openai_embedings.js";

const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(express.static("public"));
app.use(express.urlencoded({ extended: true }));

app.get("/", (req, res) => {
  res.sendFile(__dirname + "/public/index.html");
});

app.post("/chat", async (req, res) => {
  try {
    let { userInput } = req.body;

    console.log("User Data", userInput);

    // Convert user data to a format suitable for the prompt template

    const response = await runEmbeddings(userInput);
    res.json({ response: response });
    console.log("Response Received", response);
  } catch (error) {
    console.error(error);
    res.status(500).send("An error occurred");
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
