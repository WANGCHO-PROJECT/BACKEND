const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const { Posts, Comments } = require("../models");

// 댓글 등록 API
router.post("/api/comments/:postId", auth, async (req, res) => {
  const { comment } = req.body;
  const { postId } = req.params;
  const { userId } = res.locals.user;

  //댓글 내용 입력됐는지 확인
  if (!comment) {
    return res.status(400).json({ message: "댓글 내용이 없습니다." });
  }

  //해당 게시글이 존재하는지 확인
  const targetPost = await Posts.findOne({ where: { postId } });
  if (!targetPost) {
    return res.status(400).json({ message: "유효하지 않은 게시글입니다." });
  }

  //댓글 생성
  try {
    await Comments.create({ comment, postId, userId });
    return res.status(200).json({ message: "댓글 등록에 성공하였습니다." });
  } catch (error) {
    return res.status(400).json({ message: "댓글 등록에 실패하였습니다." });
  }
});

// 댓글 삭제 API
router.delete("/api/comments/:postId/:commentId", auth, async (req, res) => {
  const { postId, commentId } = req.params;
  const { userId } = res.locals.user;

  //해당 게시글이 존재하는지 확인
  const targetPost = await Posts.findOne({ where: { postId } });
  if (!targetPost) {
    return res.status(400).json({ message: "유효하지 않은 게시글입니다." });
  }

  //해당 댓글이 존재하는지 확인
  const targetComment = await Comments.findOne({ where: { commentId } });
  if (!targetComment) {
    return res.status(400).json({ message: "유효하지 않은 댓글입니다." });
  }

  //권한 확인
  if (targetComment.userId !== userId) {
    return res.status(400).json({ errorMessage: "권한이 없습니다." });
  }

  //댓글 삭제
  try {
    await Comments.destroy({ where: { postId } });
    return res.status(200).json({ message: "댓글 삭제에 성공하였습니다." });
  } catch (error) {
    return res.status(400).json({ message: "댓글 삭제에 실패하였습니다." });
  }
});

module.exports = router;
