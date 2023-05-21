const { Op } = require("sequelize");
const express = require("express");
const router = express.Router();
const { Likes } = require("../models");
const jwt = require("jsonwebtoken");
const auth = require("../middleware/auth");

router.post(
  "/api/posts/like",
  auth,
  async (req, res) => {
    try {
      const { userId } = res.locals.user;
      const { postId } = req.body;
      console.log(userId, postId);
      const like = await Likes.findOne({
        attributes: ["likeCheck"],
        where: { [Op.and]: [{ userId }, { postId }] },
        raw: true,
      }); //findOne
      if (!like) {
        await Likes.create({
          userId,
          postId,
        });
        return res.status(200).json({ message: "좋아요 완료!" });
      }

      if (like.likeCheck === 1) {
        await Likes.update(
          { likeCheck: 0 },
          { where: { [Op.and]: [{ userId }, { postId }] } }
        );
        return res.status(200).json({ message: "좋아요 취소!" });
      } else {
        await Likes.update(
          { likeCheck: 1 },
          { where: { [Op.and]: [{ userId }, { postId }] } }
        );
        return res.status(200).json({ message: "좋아요 다시 완료!" });
      }
    } catch (e) {
      console.log(e);
      return res.status(400).json({ message: "좋아요를 못했습니다." });
    } //catch
  } //callback
);

module.exports = router;
