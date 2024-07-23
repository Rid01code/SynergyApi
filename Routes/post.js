const express = require('express')
const router = express.Router()
const mongoose = require('mongoose')
const postModel = require('../Models/postModel')
const userModel = require('../Models/userModel')
const authenticateToken = require('../Auth/auth')

router.use(express.json())

//Upload Post
router.post('/upload-post', authenticateToken, async (req, res) => {
  try {
    const { title, photoUrl, hashtags, textContent, theme } = req.body
    const { id } = req.headers
    const user = await userModel.findById(id)

    if (!user) {
      return res.status(404).json({ message: "User not found" })
    }

    const newPost = new postModel({
      userId: id,
      name: user.name,
      profilePic: user.profilePic,
      title: title,
      photoUrl: photoUrl,
      textContent: textContent,
      theme: theme,
      hashtags: hashtags
    })
    const savePost = await newPost.save()
    const postId = savePost._id
    await userModel.findByIdAndUpdate(id, {
      $push: {
        posts: postId
      }
    })
    return res.status(200).json({ message: "Post Uploaded Successfully" })
  } catch (error) {
    console.log(error)
    return res.status(500).json({ message: "Internal Server Error" })
  }
})

//Get All Post
router.get('/get-post', authenticateToken, async(req , res) => {
  try {
    const posts = await postModel.find().populate('userId', 'name').sort({ date: -1 }).exec()
    res.status(200).json({ posts: posts })
  } catch (error) {
    console.log(error)
    return res.status(500).json({ message: "Internal Server Error" })
  }
})

//Add Likes
router.put('/add-likes/:postId', authenticateToken, async (req, res) => {
  const { postId } = req.params;
  if (!mongoose.Types .ObjectId.isValid(postId)) {
    return res.status(400).json({ message: "Invalid Post Id" })
  }

  try {
    const post = await postModel.findById(postId);
    if (!post) {
      return res.status(404).json({ message: "Post Not Found" })
    }

    const { id } = req.headers;
    const user = await userModel.findById(id)
    if (!user) {
      return res.status(404).json({ message: "User Not Found" })
    }

    if (post.likes.some((like) => like.userId.equals(user._id))) {
      return res.status(400).json({ message: "You already liked this post" });
    }

    post.likes.push({
      userId: user._id,
      name : user.name
    })
    await post.save()
    return res.status(200).json({message : "Like Added SuccessFully"})
  } catch (error) {
    console.log(error)
    return res.status(500).json({message : "Internal Server Error"})
  }
})

//Get How Many Likes And Who likes
router.get('/get-likes/:postId' ,authenticateToken, async(req, res) => {
  const { postId } = req.params;
  if (!mongoose.Types .ObjectId.isValid(postId)) {
    return res.status(400).json({ message: "Invalid Post Id" })
  }

  try {
    const post = await postModel.findById(postId).populate('likes.userId' , 'name')
    if (!post) {
      return res.status(404).json({message : "Post Not Found"})
    }

    const likesCount = post.likes.length
    const usersWhoLike = post.likes.map((like) => ({
      userId: like.userId,
    }))

    const { id } = req.headers;
    const user = await userModel.findById(id)
    if (!user) { 
      return res.status(404).json({message : "User Not Found"})
    }

    const hasLiked = post.likes.some((like)=>like.userId.equals(user._id))

    return res.status(200).json({likesCount , usersWhoLike , hasLiked})
  } catch (error) {
    console.log(error)
    return res.status(500).json({message : "Internal Server Error"})
  }
})

// Add Comments
router.put('/add-comments/:postId', authenticateToken, async(req, res) => {
  const { postId } = req.params;
  if (!mongoose.Types .ObjectId.isValid(postId)) {
    return res.status(400).json({ message: "Invalid Post Id" })
  }

  try {
    const post = await postModel.findById(postId)
    if (!post) {
      return res.status(404).json({message : "Post Not Found"})
    }

    const { id } = req.headers
    const user = await userModel.findById(id)
    if (!user) {
      return res.status(404).json({message : "User Not Found"})
    }

    const { comment } = req.body
    if (!comment) {
      return res.status(404).json({message: "Comment is required"})
    }

    post.comments.push({
      userId: user._id,
      text: comment
    })
    await post.save()
    return res.status(200).json({message : "Comment Added Successfully"})
  } catch (error) {
    console.log(error)
    return res.status(500).json({message : "Internal Server Error"})
  }
})

//Get Comments
router.get('/get-comments/:postId', authenticateToken, async (req, res) => {
  const { postId } = req.params;
  if (!mongoose.Types .ObjectId.isValid(postId)) {
    return res.status(400).json({ message: "Invalid Post Id" })
  }

  try {
    const post = await postModel.findById(postId).populate('comments.userId', 'name')
    if (!post) {
      return res.status(404).json({message : "Post Not Found"})
    }

    const numberOfComments = post.comments.length
    // const whoComments = post.comments.map((comment) => ({ userId: comment.userId }))
    const comments = post.comments.map((comment) => ({ comment: comment.text , userId: comment.userId }))
    
    return res.status(200).json({ numberOfComments, comments })
  } catch (error) {
    console.log(error)
    return res.status(500).json({message : "Internal Server Error"})
  }
})

module.exports = router