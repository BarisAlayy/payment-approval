const express = require("express");
const router = express.Router();

const {
  getBranding,
  updateBranding,
  uploadLogo,
  uploadFavicon,
} = require("../controllers/brandingController");
const { verifyToken, checkRole } = require("../middlewares/authMiddleware");
const logoUpload = require("../middlewares/logoUpload");

router.get("/", getBranding);
router.put("/", verifyToken, checkRole(["admin"]), updateBranding);
router.post("/logo", verifyToken, checkRole(["admin"]), logoUpload.single("logo"), uploadLogo);
router.post("/favicon", verifyToken, checkRole(["admin"]), logoUpload.single("favicon"), uploadFavicon);

module.exports = router;
