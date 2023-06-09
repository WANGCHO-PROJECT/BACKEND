const express = require("express");
const multer = require("multer");
const path = require("path");
const router = express.Router();
const { Posts, Users, Likes, Comments, sequelize } = require("../models");
const auth = require("../middleware/auth");

// multer 설정
const fileStorage = multer.diskStorage({
  // 저장 방식
  destination: (req, file, cb) => {
    // 저장되는 곳 지정
    cb(null, path.join(__dirname, "../uploads/"));
  },
  filename: (req, file, cb) => {
    // 저장되는 이름 지정
    cb(
      null,
      file.fieldname + "-" + Date.now() + path.extname(file.originalname)
    );
  },
});

const fileFilter = (req, file, cb) => {
  // 확장자 필터링
  const allowedFileTypes = [
    "image/png",
    "image/jpg",
    "image/jpeg",
    "image/gif",
    "image/bmp",
  ];
  if (allowedFileTypes.includes(file.mimetype)) {
    cb(null, true); // 해당 mimetype만 받겠다는 의미
  } else {
    // 다른 mimetype은 저장되지 않음
    cb(null, false);
  }
};

const upload = multer({ storage: fileStorage, fileFilter: fileFilter }).single(
  "image"
);

// 1. 게시글 작성 API
//      @토큰을 검사하여, 유효한 토큰일 경우에만 게시글 작성 가능
//      @title, content, image 작성
router.post("/api/posts", auth, upload, async (req, res) => {
  try {
    // 토큰 - userId
    const { userId } = res.locals.user;
    // req.body로 작성 내용 받아오기
    const { title, content } = req.body;
    // image는 file로 받기
    const image = req.file;
    const imageFileName = image.filename;

    // title, content, image 입력 값이 없을 때 message 띄우기
    if (!title && content && image) {
      return res.status(400).json({ message: "제목을 작성해주세요." });
    } else if (title && !content && image) {
      return res.status(400).json({ message: "내용을 입력해주세요." });
    } else if (title && content && !image) {
      return res.status(400).json({ message: "사진을 넣어주세요." });
    }

    // 게시글 작성
    await Posts.create({
      userId: userId,
      title,
      content,
      image: imageFileName,
    });
    return res.status(200).json({ message: "게시글 작성에 성공했습니다." });
  } catch (e) {
    console.log(e);
    return res.status(400).json({ message: "게시글 작성에 실패했습니다." });
  }
});

// 2. 전체 게시글 조회 API
//      @title, nickname, 작성 날짜를 조회
//      @작성 날짜 기준으로 최근 글이 먼저 보이게 내림차순으로 정렬
router.get("/api/posts", async (req, res) => {
  try {
    // 게시글 목록 조회
    const posts = await Posts.findAll({
      attributes: [
        "postId",
        "userId",
        [sequelize.col("nickname"), "nickname"],
        "title",
        "content",
        "image",
        "postCreatedAt",
        "postUpdatedAt",
        [
          sequelize.literal(`(
            SELECT COUNT(*) FROM Likes WHERE Likes.postId = Posts.postId AND Likes.likecheck = 1
          )`),
          "likeNum",
        ],
        [
          sequelize.literal(`(
            SELECT COUNT(*) FROM Comments WHERE Comments.postId = Posts.postId
          )`),
          "commentNum",
        ],
      ],
      include: [
        {
          model: Users,
          attributes: [],
        },
        {
          model: Likes,
          attributes: [],
          require: true,
        },
        {
          model: Comments,
          attributes: [],
          require: true,
        },
      ],
      group: ["Posts.postId"],
      order: [["postCreatedAt", "DESC"]],
      raw: true,
    });

    // 작성된 게시글이 없을 경우
    if (posts.length === 0) {
      return res.status(400).json({ message: "작성된 게시글이 없습니다." });
    }
    // 게시글 목록 조회
    return res.status(200).json({ posts });
  } catch (e) {
    // 예외 처리
    console.log(e);
    return res.status(400).json({ message: "목록 조회에 실패했습니다." });
  }
});

// 3. 게시글 상세 조회 API
//      @title, nickname, content, image, 작성 날짜, 댓글 내용을 조회
router.get("/api/posts/:postId", async (req, res) => {
  try {
    // params로 postId 받기
    const { postId } = req.params;
    // 게시글 상세 조회
    const post = await Posts.findOne({
      attributes: [
        "postId",
        "userId",
        [sequelize.col("nickname"), "nickname"],
        "title",
        "content",
        "image",
        "postCreatedAt",
        "postUpdatedAt",
      ],
      where: { postId },
      include: [
        {
          model: Users,
          attributes: [],
        },
      ],
      group: ["Posts.postId"],
      raw: true,
    });

    // 게시글에 해당하는 댓글
    const comments = await Comments.findAll({
      attributes: [
        "commentId",
        "userId",
        [sequelize.col("nickname"), "nickname"],
        "comment",
        "commentCreatedAt",
      ],
      where: { postId },
      include: [
        {
          model: Users,
          attributes: [],
        },
      ],
      raw: true,
    });

    // 게시글이 없을 경우
    if (!post) {
      return res.status(400).json({ message: "존재하지 않는 게시글입니다." });
    }
    // 게시글 상세 조회
    // (comments X)
    if (!comments) {
      return res.status(200).json({ post });
    }
    // (comments O)
    else {
      return res.status(200).json({ post, comments });
    }
  } catch {
    return res.status(400).json({ message: "게시글 조회에 실패했습니다." });
  }
});

// 4. 게시글 수정 API
//      @토큰을 검사하여, 해당 사용자가 작성한 게시글만 수정 가능
//      @title, content, image부분 수정 가능
router.put("/api/post/:postId", auth, upload, async (req, res) => {
  try {
    // userId
    const { userId } = res.locals.user;
    // params로 postId
    const { postId } = req.params;
    // post 조회
    const post = await Posts.findOne({ where: { postId } });
    // 입력 받은 title, content, image body로
    const { title, content } = req.body;
    const image = req.file;
    const imageFileName = image.filename;

    // 게시글이 없을 경우
    if (!post) {
      return res.status(400).json({ message: "존재하지 않는 게시글입니다." });
    }
    // 권한이 없을 경우
    if (userId !== post.userId) {
      return res.status(403).json({ message: "게시글 수정 권한이 없습니다." });
    }

    // 수정할 내용에 따라 수정해주기
    if (title) {
      post.title = title;
    }
    if (content) {
      post.content = content;
    }
    // image는 file로 받는다
    if (image) {
      post.image = imageFileName;
    }

    // 수정할 부분이 모두 없을 경우 / 수정할 내용이 있다면 해당 부분만 수정
    if (!(title && content && image)) {
      return res.status(400).json({ message: "수정할 내용이 없습니다." });
    }

    const updateCount = await post.save();

    // 수정한 게시글이 없을 경우
    if (updateCount < 1) {
      return res
        .status(401)
        .json({ message: "게시글이 정상적으로 수정되지 않았습니다." });
    }
    return res.status(200).json({ message: "게시글을 수정하였습니다." });
  } catch {
    return res.status(400).json({ message: "게시글 수정에 실패했습니다." });
  }
});

// 5. 게시글 삭제 API
//      @토큰을 검사하여, 해당 사용자가 작성한 게시글만 삭제 가능
router.delete("/api/posts/:postId", async (req, res) => {
  try {
    // userId
    // const { userId } = res.locals.user;
    // params로 postId
    const { postId } = req.params;
    // post 조회하기
    const post = await Posts.findByPk(postId);
    console.log(post);

    // 게시글이 없을 경우
    if (!post) {
      return res.status(400).json({ message: "존재하지 않는 게시글입니다." });
    }
    // 게시글 권한 확인
    // if (userId !== post.userId) {
    //   return res.status(403).json({ message: "게시글 삭제 권한이 없습니다." });
    // }

    // 게시글 삭제
    const deleteCount = await Posts.destroy({ where: { postId } });
    if (deleteCount < 1) {
      return res
        .status(400)
        .json({ message: "게시글이 정상적으로 삭제되지 않았습니다." });
    }
    return res.status(200).json({ message: "게시글을 삭제하였습니다." });
  } catch {
    return res
      .status(400)
      .json({ message: "게시글이 정상적으로 삭제되지 않았습니다." });
  }
});

module.exports = router;
