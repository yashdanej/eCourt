const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid');
const util = require('util');
const db = require("../db");
const jwt = require("jsonwebtoken");
// const { verifyToken } = require('../../middleware/verifyToken');

const query = util.promisify(db.query).bind(db);

exports.Signup = async (req, res) => {
  const { name, email, password } = req.body;

  try {
    // Check if email already exists
    const emailCheckQuery = 'SELECT id FROM users WHERE email = ?';
    const emailCheckResult = await query(emailCheckQuery, [email]);

    if (emailCheckResult.length > 0) {
      return res.status(400).json({ error: 'Email already exists' });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Generate secret key and referral code
    const secretKey = uuidv4().replace(/-/g, '').slice(0, 16); // UUID v4 is more secure than random strings
    const generatedReferralCode = uuidv4().replace(/-/g, '').slice(0, 6);

    // Create the user
    let userQuery;
    let userResult;
    console.log("reffer_code", reffer_code);
    if (reffer_code && reffer_code.trim() !== "") {
      console.log(reffer_code);
      userQuery = 'INSERT INTO users (name, email, password, secret_key, reffer_code, reffer_by, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)';
      userResult = await query(userQuery, [name, email, hashedPassword, secretKey, generatedReferralCode, reffer_code, new Date()]);
    } else {
      console.log(reffer_code);
      userQuery = 'INSERT INTO users (name, email, password, secret_key, reffer_code, created_at) VALUES (?, ?, ?, ?, ?, ?)';
      userResult = await query(userQuery, [name, email, hashedPassword, secretKey, generatedReferralCode, new Date()]);
    }

    const userId = userResult.insertId;

    // Check if referral code is provided
    if (reffer_code && reffer_code.trim() !== "") {
      const referrerQuery = 'SELECT id FROM users WHERE reffer_code = ?';
      const referrerRows = await query(referrerQuery, [reffer_code]);

      if (referrerRows.length > 0) {
        const referrerId = referrerRows[0].id;

        const referralQuery = 'INSERT INTO referrals (referrer_id, referred_id, created_at) VALUES (?, ?, ?)';
        await query(referralQuery, [referrerId, userId, new Date()]);

        // Optionally, update the referrer's commission balance
        // const commissionUpdateQuery = 'UPDATE users SET commission_balance = commission_balance + ? WHERE id = ?';
        // await query(commissionUpdateQuery, [commissionAmount, referrerId]);
      } else {
        await query("delete from users where email = ?", [email]);
        return res.status(400).json({ success: false, message: 'Invalid referral code' });
      }
    }

    return res.status(201).json({ success: true, data: {id: userId, name, email, secretKey, referral_code: generatedReferralCode} });
  } catch (error) {
    console.error('Error creating user:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

exports.Login = async (req, res) => {
    const { email, password } = req.body;
  
    try {
      // Retrieve the user by email
      const userQuery = 'SELECT * FROM users WHERE email = ?';
      const userRows = await query(userQuery, [email]);
  
      if (userRows.length === 0) {
        return res.status(400).json({ success: false, message: 'Invalid email or password' });
      }
  
      const user = userRows[0];
  
      // Verify the password
      const isPasswordValid = await bcrypt.compare(password, user.password);
  
      if (!isPasswordValid) {
        return res.status(400).json({ success: false, message: 'Invalid email or password' });
      }
  
      // Generate JWT token using the user's secret key
      const token = jwt.sign({ id: user.id, email: user.email }, process.env.SECRET_KEY);
  
      // Capture IP address and device information
      const ipAddress = req.headers['x-forwarded-for'] || req.ip || req.connection.remoteAddress;
      const userAgent = req.headers['user-agent'];
  
      // Insert data into stored_ip table
      const insertIpQuery = 'INSERT INTO stored_ip (user_id, ip_address, device) VALUES (?, ?, ?)';
      await query(insertIpQuery, [user.id, ipAddress, userAgent]);
  
      return res.status(200).json({ success: true, token, data: { id: user.id, name: user.name, email: user.email, reffer_code: user.reffer_code, secretKey: user.secret_key } });
    } catch (error) {
      console.error('Error during login:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
};