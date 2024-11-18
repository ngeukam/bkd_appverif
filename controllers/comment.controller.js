const Comment = require("../models/comment.model")
const getComments = async (req, res) => {
    try {
      const { page = 1, limit = 10, search } = req.query;
  
      let filter = {};
  
      // Add search functionality
      if (search) {
        filter.$or = [
          { title: { $regex: new RegExp(search, "i") } },
          { comment: { $regex: new RegExp(search, "i") } },
          { author: { $regex: new RegExp(search, "i") } },
        ];
      }
  
      // Define the aggregation pipeline
      const pipeline = [
        { $match: filter }, // Filter the documents
        {
          $project: {
            title: 1,
            comment: 1,
            author: 1,
            link: 1,
            icon: 1,
            createdAt: 1,
            updatedAt: 1,
          },
        },
        { $sort: { createdAt: -1 } }, // Sort by created date (newest first)
      ];
  
      // Define pagination options
      const options = {
        page: parseInt(page),
        limit: parseInt(limit),
      };
  
      // Use aggregatePaginate to paginate the aggregation results
      const result = await Comment.aggregatePaginate(Comment.aggregate(pipeline), options);
  
      return res.status(200).json({
        error: false,
        data: result,
      });
    } catch (error) {
      return res.status(500).json({
        error: true,
        message: error.message,
      });
    }
  };
  
  const createComment = async (req, res) => {
    try {
      const { title, comment, author, link, icon } = req.body;
  
      const newComment = new Comment({ title, comment, author, link, icon });
      await newComment.save();
  
      return res.status(201).json({
        error: false,
        data: newComment,
        message: "Comment created successfully",
      });
    } catch (error) {
      return res.status(500).json({
        error: true,
        message: error.message,
      });
    }
  };

  const getCommentById = async (req, res) => {
    try {
      const { id } = req.params;
  
      const comment = await Comment.findById(id);
      if (!comment) {
        return res.status(404).json({ error: true, message: "Comment not found" });
      }
  
      return res.status(200).json({
        error: false,
        data: comment,
      });
    } catch (error) {
      return res.status(500).json({
        error: true,
        message: error.message,
      });
    }
  };

  const updateComment = async (req, res) => {
    try {
      const { id } = req.params;
      const { title, comment, author, link, icon } = req.body;
  
      const updatedComment = await Comment.findByIdAndUpdate(
        id,
        { title, comment, author, link, icon },
        { new: true } // Return the updated document
      );
  
      if (!updatedComment) {
        return res.status(404).json({ error: true, message: "Comment not found" });
      }
  
      return res.status(200).json({
        error: false,
        data: updatedComment,
        message: "Comment updated successfully",
      });
    } catch (error) {
      return res.status(500).json({
        error: true,
        message: error.message,
      });
    }
  };

  const deleteComment = async (req, res) => {
    try {
      const { commentId } = req.body;
  
      const deletedComment = await Comment.findByIdAndDelete(commentId);
  
      if (!deletedComment) {
        return res.status(404).json({ error: true, message: "Comment not found" });
      }
  
      return res.status(200).json({
        error: false,
        message: "Comment deleted successfully",
      });
    } catch (error) {
      return res.status(500).json({
        error: true,
        message: error.message,
      });
    }
  };
  module.exports = {
    createComment,
    getComments,
    getCommentById,
    updateComment,
    deleteComment,
  };
          