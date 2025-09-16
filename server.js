const express = require('express');
const cors = require('cors');
const multer = require('multer');
const fs = require('fs-extra');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const libre = require('libreoffice-convert');
const { PDFDocument } = require('pdf-lib');
const sharp = require('sharp');
const puppeteer = require('puppeteer');
const mammoth = require('mammoth');
const { Document, Packer, Paragraph, TextRun, AlignmentType } = require('docx');
const Docxtemplater = require('docxtemplater');
const PizZip = require('pizzip');
const fetch = require('node-fetch');
const FormData = require('form-data');

const app = express();
const PORT = process.env.PORT || 3002;

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, 'uploads');
    fs.ensureDirSync(uploadDir);
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${uuidv4()}-${file.originalname}`;
    cb(null, uniqueName);
  }
});

const upload = multer({ 
  storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/msword',
      'text/html',
      'text/plain',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'image/jpeg',
      'image/png'
    ];
    
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Unsupported file type'), false);
    }
  }
});

// CORS configuration
app.use(cors({
  origin: [
    'https://novenutility123.netlify.app',
    'https://novenutility.netlify.app',
    'http://localhost:3000',
    'http://localhost:3001',
    'http://localhost:3002'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

app.use(express.json());
app.use(express.static('public'));

// Ensure directories exist
const ensureDirectories = () => {
  const dirs = ['uploads', 'temp', 'output'];
  dirs.forEach(dir => {
    fs.ensureDirSync(path.join(__dirname, dir));
  });
};

ensureDirectories();

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'Libre PDF Converter',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    features: [
      'Format-preserving PDF conversion',
      'Multi-format support (DOCX, DOC, HTML, TXT, Excel, Images)',
      'High-fidelity rendering',
      'Batch processing',
      'Custom styling preservation'
    ]
  });
});

// Convert DOCX to PDF with format preservation
app.post('/convert-docx-to-pdf', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const inputPath = req.file.path;
    const outputDir = path.join(__dirname, 'output');
    const outputFileName = `converted-${uuidv4()}.pdf`;
    const outputPath = path.join(outputDir, outputFileName);

    console.log(`Converting ${req.file.originalname} to PDF...`);

    // Method 1: Try LibreOffice conversion (highest quality)
    try {
      await convertWithLibreOffice(inputPath, outputPath);
      console.log('✅ LibreOffice conversion successful');
    } catch (libreError) {
      console.log('⚠️ LibreOffice conversion failed, trying alternative method...');
      
      // Method 2: Try Puppeteer conversion (good quality)
      try {
        await convertWithPuppeteer(inputPath, outputPath);
        console.log('✅ Puppeteer conversion successful');
      } catch (puppeteerError) {
        console.log('⚠️ Puppeteer conversion failed, trying fallback method...');
        
        // Method 3: Fallback to basic conversion
        await convertWithFallback(inputPath, outputPath);
        console.log('✅ Fallback conversion successful');
      }
    }

    // Check if output file exists and has content
    if (!fs.existsSync(outputPath) || fs.statSync(outputPath).size === 0) {
      throw new Error('Conversion failed - no output file generated');
    }

    // Clean up input file
    fs.removeSync(inputPath);

    res.json({
      success: true,
      message: 'File converted successfully',
      downloadUrl: `/download/${outputFileName}`,
      originalName: req.file.originalname,
      convertedName: outputFileName,
      fileSize: fs.statSync(outputPath).size
    });

  } catch (error) {
    console.error('Conversion error:', error);
    
    // Clean up files on error
    if (req.file && fs.existsSync(req.file.path)) {
      fs.removeSync(req.file.path);
    }
    
    res.status(500).json({
      success: false,
      error: error.message || 'Conversion failed'
    });
  }
});

// LibreOffice conversion (highest quality)
const convertWithLibreOffice = (inputPath, outputPath) => {
  return new Promise((resolve, reject) => {
    const inputBuffer = fs.readFileSync(inputPath);
    
    libre.convert(inputBuffer, '.pdf', undefined, (err, done) => {
      if (err) {
        reject(err);
        return;
      }
      
      fs.writeFileSync(outputPath, done);
      resolve();
    });
  });
};

// Puppeteer conversion (good quality)
const convertWithPuppeteer = async (inputPath, outputPath) => {
  // First convert DOCX to HTML using mammoth
  const docxBuffer = fs.readFileSync(inputPath);
  const htmlResult = await mammoth.convertToHtml({ buffer: docxBuffer });
  
  // Create HTML file
  const htmlPath = path.join(__dirname, 'temp', `temp-${uuidv4()}.html`);
  const fullHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { 
          font-family: 'Times New Roman', serif; 
          line-height: 1.6; 
          margin: 40px;
          color: #333;
        }
        h1, h2, h3, h4, h5, h6 { 
          color: #2c3e50; 
          margin-top: 20px; 
          margin-bottom: 10px;
        }
        p { 
          margin-bottom: 12px; 
          text-align: justify;
        }
        table { 
          border-collapse: collapse; 
          width: 100%; 
          margin: 20px 0;
        }
        th, td { 
          border: 1px solid #ddd; 
          padding: 8px; 
          text-align: left;
        }
        th { 
          background-color: #f2f2f2; 
          font-weight: bold;
        }
        ul, ol { 
          margin: 10px 0; 
          padding-left: 30px;
        }
        blockquote { 
          margin: 20px 0; 
          padding: 10px 20px; 
          border-left: 4px solid #3498db;
          background-color: #f8f9fa;
        }
      </style>
    </head>
    <body>
      ${htmlResult.value}
    </body>
    </html>
  `;
  
  fs.writeFileSync(htmlPath, fullHtml);
  
  // Launch Puppeteer and convert to PDF
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const page = await browser.newPage();
  await page.goto(`file://${htmlPath}`, { waitUntil: 'networkidle0' });
  
  const pdfBuffer = await page.pdf({
    format: 'A4',
    printBackground: true,
    margin: {
      top: '20mm',
      right: '20mm',
      bottom: '20mm',
      left: '20mm'
    }
  });
  
  await browser.close();
  fs.writeFileSync(outputPath, pdfBuffer);
  fs.removeSync(htmlPath);
};

// Fallback conversion method
const convertWithFallback = async (inputPath, outputPath) => {
  // Read DOCX content
  const docxBuffer = fs.readFileSync(inputPath);
  const htmlResult = await mammoth.convertToHtml({ buffer: docxBuffer });
  
  // Create a simple PDF using pdf-lib
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([595.28, 841.89]); // A4 size
  
  // Basic text rendering (simplified)
  const text = htmlResult.value.replace(/<[^>]*>/g, ''); // Strip HTML tags
  const lines = text.split('\n');
  
  let yPosition = 800;
  const fontSize = 12;
  const lineHeight = 14;
  
  for (const line of lines) {
    if (yPosition < 50) break; // Prevent overflow
    
    page.drawText(line, {
      x: 50,
      y: yPosition,
      size: fontSize,
      color: { r: 0, g: 0, b: 0 }
    });
    
    yPosition -= lineHeight;
  }
  
  const pdfBytes = await pdfDoc.save();
  fs.writeFileSync(outputPath, pdfBytes);
};

// Download endpoint
app.get('/download/:filename', (req, res) => {
  const filename = req.params.filename;
  const filePath = path.join(__dirname, 'output', filename);
  
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: 'File not found' });
  }
  
  res.download(filePath, (err) => {
    if (err) {
      console.error('Download error:', err);
      res.status(500).json({ error: 'Download failed' });
    } else {
      // Clean up file after download
      setTimeout(() => {
        fs.removeSync(filePath);
      }, 5000);
    }
  });
});

// Batch conversion endpoint
app.post('/convert-batch', upload.array('files', 10), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'No files uploaded' });
    }

    const results = [];
    
    for (const file of req.files) {
      try {
        const inputPath = file.path;
        const outputDir = path.join(__dirname, 'output');
        const outputFileName = `batch-${uuidv4()}.pdf`;
        const outputPath = path.join(outputDir, outputFileName);

        await convertWithLibreOffice(inputPath, outputPath);
        
        results.push({
          originalName: file.originalname,
          convertedName: outputFileName,
          success: true,
          downloadUrl: `/download/${outputFileName}`
        });
        
        // Clean up input file
        fs.removeSync(inputPath);
        
      } catch (error) {
        results.push({
          originalName: file.originalname,
          success: false,
          error: error.message
        });
      }
    }

    res.json({
      success: true,
      message: `Processed ${req.files.length} files`,
      results
    });

  } catch (error) {
    console.error('Batch conversion error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Batch conversion failed'
    });
  }
});

// Clean up old files periodically
setInterval(() => {
  const outputDir = path.join(__dirname, 'output');
  const tempDir = path.join(__dirname, 'temp');
  
  [outputDir, tempDir].forEach(dir => {
    if (fs.existsSync(dir)) {
      const files = fs.readdirSync(dir);
      const now = Date.now();
      
      files.forEach(file => {
        const filePath = path.join(dir, file);
        const stats = fs.statSync(filePath);
        
        // Delete files older than 1 hour
        if (now - stats.mtime.getTime() > 60 * 60 * 1000) {
          fs.removeSync(filePath);
        }
      });
    }
  });
}, 30 * 60 * 1000); // Run every 30 minutes

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Server error:', error);
  res.status(500).json({
    success: false,
    error: error.message || 'Internal server error'
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found'
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Libre PDF Converter running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`📄 Convert endpoint: http://localhost:${PORT}/convert-docx-to-pdf`);
  console.log(`📦 Batch convert: http://localhost:${PORT}/convert-batch`);
  console.log(`✨ Features: Format-preserving PDF conversion with high fidelity`);
});
