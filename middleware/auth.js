const jwt = require("jsonwebtoken");
const { Users, Tokens } = require("../models");
const ACCESS_KEY = "nodeprac1";
const REFRESH_KEY = "nodeprac2";

module.exports = async (req, res, next) => {
  try {
    const { refresh, access } = req.headers;
    const [accessType, accessToken] = access.split(" ");
    //토큰타입 검증
    if (accessType !== "Bearer") {
      return res
        .status(401)
        .json({ message: "토큰 타입이 일치하지 않습니다." });
    }
    //토큰 유효성 검증
    const decodedAccess = jwt.verify(accessToken, ACCESS_KEY);
    const userId = decodedAccess.userId

    //액세스 토큰이 검증 됐을 시
    if (decodedAccess) {
      //locals 객체에 userId 삽입
      res.locals.user = userId;
      next();
    } //access Token success end
    //액세스 토큰 검증에 실패하였을 시
    if (!userId) {
      //refresh 토큰 검증 시작
      const [refreshType, refreshToken] = refresh.split(" ");

      //리프레시 토큰 타입 검증
      if (refreshType !== "Bearer") {
        return res
          .status(401)
          .json({ message: "토큰 타입이 일치하지 않습니다." });
      }

      //리프레시 토큰 유효성 검증
      const decodedRefresh = jwt.verify(refreshToken, REFRESH_KEY);
      if (!decodedRefresh) {
        res.clearCookie("access");
        res.clearCookie("refresh");
        return res.status(401).json({ message: "토큰이 유효하지 않습니다" });
      }

      //db자료와 대조
      const dbCheck = await Tokens.findOne(
        {},
        {
          where: { [Op.and]: [{ accessToken }, { refreshToken }] },
        }
      );

      //db자료가 있다면 access token db update 후 access 토큰 발급
      if (dbCheck) {
        const uid = decodedRefresh["userId"];
        const updateToken = jwt.sign({ uid }, ACCESS_KEY, { expiresIn: "1h" });
        await Tokens.update(
          {
            accessToken: updateToken,
          },
          {
            where: { refreshToken },
          }
        );
        res.json({"access": `Bearer ${updateToken}`});
        //locals 객체에 userId 삽입
        res.locals.user = userId;
        next();
      } //tokens db check success
      else {
        return res.status(400).json({ message: "로그인이 필요한 기능입니다." });
      }
    } //refresh Token success
  } catch (error) {
    //try
    console.log(error);
    return res.status(400).json({
      message: "로그인이 필요한 기능입니다.",
    });
    
  } //catch
};
