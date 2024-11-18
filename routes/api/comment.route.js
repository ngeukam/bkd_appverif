const {
  createComment,
  getComments,
  getCommentById,
  updateComment,
  deleteComment,
} = require("../../controllers/comment.controller");
const { Router } = require("express");
const { userAuth } = require("../../auth");
const commentRoutes = Router();
commentRoutes.get("/all", getComments);
commentRoutes.get("/retrieve", userAuth({ isAdmin: true }), getCommentById);
commentRoutes.post("/create", userAuth({ isAdmin: true }), createComment);
commentRoutes.post(
  "/update-comment",
  userAuth({ isAdmin: true }),
  updateComment
);
commentRoutes.post("/delete", userAuth({ isAdmin: true }), deleteComment);
module.exports = commentRoutes;
