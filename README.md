# Libre PDF Converter

A high-fidelity PDF conversion service with format preservation capabilities.

## Features

- **Format Preservation**: Maintains original document formatting, fonts, and layout
- **Multi-directional Conversion**: 
  - DOCX/DOC → PDF
  - PDF → Word (DOCX)
  - PDF → Excel (XLSX)
- **Multi-format Support**: Converts DOCX, DOC, HTML, TXT, Excel, and images
- **Multiple Conversion Methods**: 
  - LibreOffice (highest quality)
  - Puppeteer (good quality)
  - PDF-lib (basic quality)
  - Fallback methods for reliability
- **Batch Processing**: Convert multiple files simultaneously
- **High-fidelity Rendering**: Preserves tables, images, fonts, and styling
- **Error Handling**: Robust error handling with automatic fallbacks

## API Endpoints

### Health Check
```
GET /health
```
Returns service status and capabilities.

### DOCX to PDF Conversion
```
POST /convert-docx-to-pdf
Content-Type: multipart/form-data
Body: file (DOCX, DOC, HTML, TXT, Excel, or image file)
```

### PDF to Word Conversion
```
POST /convert-pdf-to-word
Content-Type: multipart/form-data
Body: file (PDF file)
```

### PDF to Excel Conversion
```
POST /convert-pdf-to-excel
Content-Type: multipart/form-data
Body: file (PDF file)
```

**Response (all conversions):**
```json
{
  "success": true,
  "message": "File converted successfully",
  "downloadUrl": "/download/converted-file.pdf",
  "originalName": "document.pdf",
  "convertedName": "converted-uuid.docx",
  "fileSize": 1234567
}
```

### Batch Conversion
```
POST /convert-batch
Content-Type: multipart/form-data
Body: files[] (array of files)
```

**Response:**
```json
{
  "success": true,
  "message": "Processed 3 files",
  "results": [
    {
      "originalName": "doc1.docx",
      "convertedName": "batch-uuid1.pdf",
      "success": true,
      "downloadUrl": "/download/batch-uuid1.pdf"
    }
  ]
}
```

### File Download
```
GET /download/:filename
```
Downloads the converted PDF file.

## Installation

1. **Clone and install dependencies:**
```bash
cd libre
npm install
```

2. **Start the service:**
```bash
npm start
```

3. **For development:**
```bash
npm run dev
```

## Docker Deployment

1. **Build the Docker image:**
```bash
docker build -t libre-pdf-converter .
```

2. **Run the container:**
```bash
docker run -p 3002:3002 libre-pdf-converter
```

## Testing

Run the test suite:
```bash
npm test
```

This will:
- Test health endpoint
- Create a test DOCX file
- Convert it to PDF
- Download and verify the result
- Clean up test files

## Conversion Methods

### 1. LibreOffice (Primary)
- Highest quality conversion
- Preserves all formatting, fonts, and layout
- Supports complex documents with tables, images, and styling

### 2. Puppeteer (Secondary)
- Good quality HTML to PDF conversion
- Preserves CSS styling and layout
- Handles complex layouts and responsive design

### 3. Fallback (Tertiary)
- Basic PDF generation using pdf-lib
- Ensures conversion always succeeds
- Minimal formatting preservation

## Supported File Types

- **Documents**: DOCX, DOC, HTML, TXT
- **Spreadsheets**: XLSX, XLS
- **Images**: JPEG, PNG, GIF, BMP
- **Output**: PDF only

## Configuration

Environment variables:
- `PORT`: Server port (default: 3002)
- `NODE_ENV`: Environment (development/production)
- `PUPPETEER_SKIP_CHROMIUM_DOWNLOAD`: Skip Chromium download (set to true in Docker)

## Error Handling

The service includes comprehensive error handling:
- Automatic fallback between conversion methods
- Detailed error messages
- File cleanup on errors
- Graceful degradation

## Performance

- **File size limit**: 50MB per file
- **Batch limit**: 10 files per batch
- **Auto-cleanup**: Files older than 1 hour are automatically deleted
- **Memory efficient**: Streams large files to prevent memory issues

## Security

- CORS enabled for specific origins
- File type validation
- File size limits
- Automatic cleanup of temporary files

## Monitoring

- Health check endpoint for monitoring
- Detailed logging
- Error tracking
- Performance metrics

## License

MIT License - see LICENSE file for details.
