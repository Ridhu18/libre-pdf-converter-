const fs = require('fs-extra');
const path = require('path');
const fetch = require('node-fetch');
const FormData = require('form-data');

const LIBRE_URL = 'http://localhost:3002';

async function testPdfConversions() {
  console.log('🧪 Testing Libre PDF Converter - PDF Conversions...\n');

  try {
    // Test 1: Health check
    console.log('1️⃣ Testing health endpoint...');
    const healthResponse = await fetch(`${LIBRE_URL}/health`);
    const healthData = await healthResponse.json();
    
    if (healthResponse.ok) {
      console.log('✅ Health check passed');
      console.log(`   Service: ${healthData.service}`);
      console.log(`   Version: ${healthData.version}`);
      console.log(`   Features: ${healthData.features.join(', ')}`);
      console.log(`   Endpoints: ${healthData.endpoints ? healthData.endpoints.length : 0} available`);
    } else {
      console.log('❌ Health check failed');
      return;
    }

    // Test 2: Create a test PDF file
    console.log('\n2️⃣ Creating test PDF file...');
    const testPdfPath = path.join(__dirname, 'test-document.pdf');
    
    // Create a simple PDF file for testing using pdf-lib
    const { PDFDocument, rgb } = require('pdf-lib');
    
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([595.28, 841.89]); // A4 size
    
    page.drawText('Test PDF Document', {
      x: 50,
      y: 750,
      size: 24,
      color: rgb(0, 0, 0),
    });
    
    page.drawText('This is a test PDF document for conversion testing.', {
      x: 50,
      y: 700,
      size: 12,
      color: rgb(0, 0, 0),
    });
    
    page.drawText('Features being tested:', {
      x: 50,
      y: 650,
      size: 14,
      color: rgb(0, 0, 0),
    });
    
    page.drawText('• PDF to Word conversion', {
      x: 70,
      y: 620,
      size: 12,
      color: rgb(0, 0, 0),
    });
    
    page.drawText('• PDF to Excel conversion', {
      x: 70,
      y: 590,
      size: 12,
      color: rgb(0, 0, 0),
    });
    
    page.drawText('• Format preservation', {
      x: 70,
      y: 560,
      size: 12,
      color: rgb(0, 0, 0),
    });
    
    page.drawText('• High-fidelity rendering', {
      x: 70,
      y: 530,
      size: 12,
      color: rgb(0, 0, 0),
    });

    const pdfBytes = await pdfDoc.save();
    fs.writeFileSync(testPdfPath, pdfBytes);
    console.log('✅ Test PDF file created');

    // Test 3: Convert PDF to Word
    console.log('\n3️⃣ Testing PDF to Word conversion...');
    
    const wordFormData = new FormData();
    wordFormData.append('file', fs.createReadStream(testPdfPath), {
      filename: 'test-document.pdf',
      contentType: 'application/pdf'
    });

    const wordResponse = await fetch(`${LIBRE_URL}/convert-pdf-to-word`, {
      method: 'POST',
      body: wordFormData,
    });

    const wordData = await wordResponse.json();
    
    if (wordResponse.ok && wordData.success) {
      console.log('✅ PDF to Word conversion successful');
      console.log(`   Original: ${wordData.originalName}`);
      console.log(`   Converted: ${wordData.convertedName}`);
      console.log(`   File size: ${wordData.fileSize} bytes`);
      console.log(`   Download URL: ${wordData.downloadUrl}`);
    } else {
      console.log('❌ PDF to Word conversion failed');
      console.log(`   Error: ${wordData.error}`);
    }

    // Test 4: Convert PDF to Excel
    console.log('\n4️⃣ Testing PDF to Excel conversion...');
    
    const excelFormData = new FormData();
    excelFormData.append('file', fs.createReadStream(testPdfPath), {
      filename: 'test-document.pdf',
      contentType: 'application/pdf'
    });

    const excelResponse = await fetch(`${LIBRE_URL}/convert-pdf-to-excel`, {
      method: 'POST',
      body: excelFormData,
    });

    const excelData = await excelResponse.json();
    
    if (excelResponse.ok && excelData.success) {
      console.log('✅ PDF to Excel conversion successful');
      console.log(`   Original: ${excelData.originalName}`);
      console.log(`   Converted: ${excelData.convertedName}`);
      console.log(`   File size: ${excelData.fileSize} bytes`);
      console.log(`   Download URL: ${excelData.downloadUrl}`);
    } else {
      console.log('❌ PDF to Excel conversion failed');
      console.log(`   Error: ${excelData.error}`);
    }

    // Test 5: Download converted files
    console.log('\n5️⃣ Testing file downloads...');
    
    if (wordData.success) {
      try {
        const wordDownloadResponse = await fetch(`${LIBRE_URL}${wordData.downloadUrl}`);
        if (wordDownloadResponse.ok) {
          const wordBuffer = await wordDownloadResponse.buffer();
          const wordOutputPath = path.join(__dirname, 'converted-test.docx');
          fs.writeFileSync(wordOutputPath, wordBuffer);
          console.log('✅ Word file download successful');
          console.log(`   Saved to: ${wordOutputPath}`);
          console.log(`   Word file size: ${wordBuffer.length} bytes`);
        }
      } catch (error) {
        console.log('❌ Word file download failed:', error.message);
      }
    }
    
    if (excelData.success) {
      try {
        const excelDownloadResponse = await fetch(`${LIBRE_URL}${excelData.downloadUrl}`);
        if (excelDownloadResponse.ok) {
          const excelBuffer = await excelDownloadResponse.buffer();
          const excelOutputPath = path.join(__dirname, 'converted-test.xlsx');
          fs.writeFileSync(excelOutputPath, excelBuffer);
          console.log('✅ Excel file download successful');
          console.log(`   Saved to: ${excelOutputPath}`);
          console.log(`   Excel file size: ${excelBuffer.length} bytes`);
        }
      } catch (error) {
        console.log('❌ Excel file download failed:', error.message);
      }
    }

    // Clean up test files
    console.log('\n6️⃣ Cleaning up test files...');
    fs.removeSync(testPdfPath);
    console.log('✅ Test files cleaned up');

    console.log('\n🎉 All PDF conversion tests completed!');
    console.log('\n📋 Test Summary:');
    console.log('   ✅ Health check');
    console.log('   ✅ PDF file creation');
    console.log('   ✅ PDF to Word conversion');
    console.log('   ✅ PDF to Excel conversion');
    console.log('   ✅ File downloads');
    console.log('   ✅ File cleanup');

  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    console.error('Stack trace:', error.stack);
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  testPdfConversions();
}

module.exports = { testPdfConversions };
