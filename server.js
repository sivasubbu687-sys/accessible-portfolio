require('dotenv').config();
const express = require('express');
const path = require('path');
const fs = require('fs');
const nodemailer = require('nodemailer');

const app = express();
const PORT = process.env.PORT || 3000;
const SUBMISSIONS_FILE = path.join(__dirname, 'submissions.json');

// Configure Nodemailer transporter with Gmail
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'sivasubbu687@gmail.com', // Your email
    pass: process.env.EMAIL_PASS // The app password you must generate
  }
});

// Middleware for parsing form inputs and JSON payloads
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static assets from the current directory
app.use(express.static(__dirname));

// Custom Logging Middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} request to ${req.url}`);
  next();
});

// Serve frontend home
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// API Endpoint for form validation and submission
app.post('/api/contact', (req, res) => {
  const { name, email, message } = req.body;
  const errors = [];

  // Server-side validation (matching our frontend accessibility goals)
  if (!name || !name.trim()) {
    errors.push({ field: 'name', message: 'Name is required on the server.' });
  }

  if (!email || !email.trim()) {
    errors.push({ field: 'email', message: 'Email is required on the server.' });
  } else {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      errors.push({ field: 'email', message: 'Please provide a valid email format.' });
    }
  }

  if (!message || !message.trim()) {
    errors.push({ field: 'message', message: 'Message content is required on the server.' });
  }

  // If there are errors, return them
  if (errors.length > 0) {
    console.warn(`[VALIDATION FAILED] Submissions request rejected with ${errors.length} errors.`);
    return res.status(400).json({
      success: false,
      message: 'Validation failed.',
      errors
    });
  }

  // Append data to submissions.json
  const submissionData = {
    id: Date.now(),
    name: name.trim(),
    email: email.trim().toLowerCase(),
    message: message.trim(),
    timestamp: new Date().toISOString()
  };

  try {
    let submissionsList = [];
    if (fs.existsSync(SUBMISSIONS_FILE)) {
      const fileData = fs.readFileSync(SUBMISSIONS_FILE, 'utf8');
      if (fileData.trim()) {
        submissionsList = JSON.parse(fileData);
      }
    }
    submissionsList.push(submissionData);
    fs.writeFileSync(SUBMISSIONS_FILE, JSON.stringify(submissionsList, null, 2), 'utf8');
    console.log(`[DATABASE] Saved new message from ${submissionData.email} to submissions.json`);
  } catch (err) {
    console.error('[DATABASE ERROR] Failed to save submission details:', err);
  }

  // Send Email Notification using Nodemailer
  const mailOptions = {
    from: 'sivasubbu687@gmail.com',
    to: 'sivasubbu687@gmail.com', // Recipient email address
    subject: `New Portfolio Contact from: ${submissionData.name}`,
    text: `You have received a new message from your portfolio website!\n\nName: ${submissionData.name}\nEmail: ${submissionData.email}\nTimestamp: ${submissionData.timestamp}\n\nMessage:\n${submissionData.message}`
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.error('[EMAIL ERROR] Failed to send email. Ensure you have added the App Password to .env.', error);
    } else {
      console.log(`[EMAIL SUCCESS] Notification sent: ${info.response}`);
    }
  });

  // Return success response
  return res.status(200).json({
    success: true,
    message: 'Thank you! Your message has been received and saved.'
  });
});

// Fallback Route for Single Page App routing
app.get('*', (req, res) => {
  res.redirect('/');
});

// Start Server
app.listen(PORT, () => {
  console.log(`\n🚀 Server is actively running on: http://localhost:${PORT}`);
  console.log(`📂 Serving static pages from: ${__dirname}`);
  console.log(`📝 Form entries ledger path: ${SUBMISSIONS_FILE}`);
  console.log(`Press Ctrl+C to terminate.\n`);
});
