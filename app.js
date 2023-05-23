// @ts-check
const { postRoute, commentRoute, userRoute, likeRoute } = require("./routes");
const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");

const app = express();
const port = 3001;

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(cors({ origin: "*", credentials: true, }));
app.use("/", [postRoute, commentRoute, userRoute, likeRoute]);

app.listen(port, () => {
  console.log(port, "포트로 서버가 열렸어요!");
});
