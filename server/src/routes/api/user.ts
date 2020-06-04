import bcrypt from "bcryptjs";
import config from "config";
import { Router, Response } from "express";
import { validationResult } from "express-validator/check";
import HttpStatusCodes from "http-status-codes";
import jwt from "jsonwebtoken";
import auth from "../../middleware/auth";

import Payload from "../../types/Payload";
import Request from "../../types/Request";
import User, { IUser } from "../../models/User";

const router: Router = Router();

// @route   POST api/user
// @desc    Register user given their email and password, returns the token upon successful registration
// @access  Public
router.post(
  "/",
  async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res
        .status(HttpStatusCodes.BAD_REQUEST)
        .json({ errors: errors.array() });
    }
    const { username, password, firstName, lastName } = req.body;
    try {
      let user: IUser = await User.findOne({ username });

      if (user) {
        return res.status(HttpStatusCodes.BAD_REQUEST).json({
          errors: [
            {
              msg: "User already exists"
            }
          ]
        });
      }

      const salt = await bcrypt.genSalt(10);
      const hashed = await bcrypt.hash(password, salt);

      // Build user object based on IUser
      const userFields = {
        username,
        firstName,
        lastName,
        password: hashed,
      };

      user = new User(userFields);

      await user.save();

      const payload: Payload = {
        userId: user.id
      };

      jwt.sign(
        payload,
        config.get("jwtSecret"),
        { expiresIn: config.get("jwtExpiration") },
        (err, token) => {
          if (err) throw err;
          res.json({ success: true, token: token });
        }
      );
    } catch (err) {
      console.error(err.message);
      res.status(HttpStatusCodes.INTERNAL_SERVER_ERROR).send("Server Error");
    }
  }
);

router.get(
  "/getId",
  auth,
  async (req: Request, res: Response) => {
    res.send(req.userId);
  }
);

router.post(
  "/avatar",
  auth,
  async (req: Request, res: Response) => {
    try {
      const { avatar } = req.body;
      const user = await User.findByIdAndUpdate(req.userId, {
        $set: {
          imageSrc: avatar
        }
      });
  
      res.send({success: true, message: "Successfully set avatar"});
    }
    catch(err) {
      console.error(err.message);
      res.status(HttpStatusCodes.INTERNAL_SERVER_ERROR).send("Server Error");
    }
  }
);

router.get(
  "/profile",
  auth,
  async (req: Request, res: Response) => {
    try {
      const userInfo = await User.findById(req.userId)
      .populate({
        path: "completedOrders",
        populate: {
          path: "requestor",
          model: "User"
        }
      })
      .populate("accepetedOrder");
      res.send({success: true, userInfo});
    }
    catch(err) {
      console.error(err.message);
      res.status(HttpStatusCodes.INTERNAL_SERVER_ERROR).send("Server Error");
    }
  }
);

export default router;
