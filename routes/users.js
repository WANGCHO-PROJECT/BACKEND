const express = require("express");
const { Op } = require("sequelize");
const router = express.Router();
const { Users, Tokens } = require("../models");
const ACCESS_KEY = "nodeprac1";
const REFRESH_KEY = "nodeprac2";
const crypto = require("crypto");
const jwt = require("jsonwebtoken");

router.post("/api/signup", async (req, res) => {
  const { email, nickname, passwordCheck } = req.body;
  let { password } = req.body;
  //이메일 체크
  const emailcheck = await Users.findOne({
    where: { email },
  });
  if (emailcheck) {
    return res.status(400).json({ message: "중복된 이메일입니다" });
  }
  //닉네임 체크
  const nickCheck = await Users.findOne({
    where: { nickname },
  });
  if (nickCheck) {
    return res.status(400).json({ message: "중복된 닉네임입니다" });
  }
  //비밀번호 체크
  if (password !== passwordCheck) {
    return res.status(400).json({ message: "비밀번호가 다릅니다" });
  }
  //비밀번호 암호화
  password = crypto.createHash("sha512").update(password).digest("base64");
  //회원 가입
  await Users.create({
    email,
    password,
    nickname,
  });
  return res.status(200).json({ message: "회원가입 완료" });
});

router.post("/api/login", async (req, res) => {
  try {
    //이메일 패스워드 받아오기
    let { email, password } = req.body;
    //패스워드 암호화
    password = crypto.createHash("sha512").update(password).digest("base64");
    //db 확인
    const userId = await Users.findOne({
      attributes: ["userId"],
      where: { [Op.and]: [{ email }, { password }] },
      raw: true,
    });
    if (!userId) {
      return res.status(400).json({ message: "회원 정보가 일치하지 않습니다" });
    }
    //토큰 발행
    const refreshToken = jwt.sign({}, REFRESH_KEY, { expiresIn: "1d" });
    const accessToken = jwt.sign({ userId }, ACCESS_KEY, { expiresIn: "1h" });
    await Tokens.create({
      refreshToken,
      accessToken,
    });
    res.cookie("refresh", `Bearer ${refreshToken}`);
    res.cookie("access", `Bearer ${accessToken}`);

    return res
      .status(200)
      .json({ message: "Token이 정상적으로 발급되었습니다." });
  } catch (e) {
    //try
    return res.status(400).json({ message: "일치하지 않습니다" });
  } //catch
}); //end

router.delete("/api/logout", async (req, res) => {
  try {
    const { refresh } = req.cookies;
    const [refreshType, refreshToken] = refresh.split(" ");
    await Tokens.destroy({
      where: { refreshToken },
    });
    res.clearCookie("access");
    res.clearCookie("refresh");
    res.status(200).json({ message: "로그아웃이 완료됐습니다" });
  } catch (e) {
    //try
    res.status(400).json({ message: "로그아웃이 실패하였습니다" });
  } //catch
});

module.exports = router;
