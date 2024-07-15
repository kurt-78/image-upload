const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const sharp = require('sharp');
const app = express();
const port = 3000;

app.set('view engine', 'ejs');
app.use(express.static('public'));

// Set up Multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({ storage: storage });

function appendToFile(data) {
  const uploadTime = new Date().toLocaleString('en-US', { timeZone: 'America/New_York' });
  const fileContent = `${uploadTime} | Name: ${data.name} | Email: ${data.email} | File: ${data.filename}\n`;
  
  fs.appendFile('uploads.txt', fileContent, (err) => {
    if (err) {
      console.error('Error writing to file:', err);
    }
  });
}

async function createThumbnail(file) {
  const thumbnailPath = path.join('uploads', `thumb_${file.filename}`);
  await sharp(file.path)
    .resize(200, 200, { fit: 'inside' })
    .toFile(thumbnailPath);
  return `thumb_${file.filename}`;
}

// Serve uploaded files
app.use('/uploads', express.static('uploads'));

app.get('/', (req, res) => {
  res.render('index');
});

app.post('/upload', upload.single('file'), async (req, res) => {
  const { name, email } = req.body;
  const file = req.file;
  
  if (!file) {
    return res.status(400).send('No file uploaded.');
  }
  
  appendToFile({ name, email, filename: file.filename });
  
  const uploadTime = new Date().toLocaleString('en-US', { timeZone: 'America/New_York' });
  
  let thumbnailFilename = '';
  if (file.mimetype.startsWith('image/')) {
    thumbnailFilename = await createThumbnail(file);
  }
  
  res.render('success', { 
    name, 
    email, 
    filename: file.filename, 
    uploadTime,
    fileUrl: `/uploads/${file.filename}`,
    thumbnailUrl: thumbnailFilename ? `/uploads/${thumbnailFilename}` : null,
    isImage: file.mimetype.startsWith('image/')
  });
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});