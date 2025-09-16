const fs = require('fs-extra');
const path = require('path');
const fetch = require('node-fetch');
const FormData = require('form-data');

const LIBRE_URL = 'http://localhost:3002';

async function testConversion() {
  console.log('🧪 Testing Libre PDF Converter...\n');

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
    } else {
      console.log('❌ Health check failed');
      return;
    }

    // Test 2: Create a test DOCX file
    console.log('\n2️⃣ Creating test DOCX file...');
    const testDocxPath = path.join(__dirname, 'test-document.docx');
    
    // Create a simple DOCX file for testing
    const { Document, Packer, Paragraph, TextRun, AlignmentType } = require('docx');
    
    const doc = new Document({
      sections: [{
        properties: {},
        children: [
          new Paragraph({
            children: [
              new TextRun({
                text: "Test Document for PDF Conversion",
                bold: true,
                size: 32,
              }),
            ],
            alignment: AlignmentType.CENTER,
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: "This is a test document to verify PDF conversion functionality.",
                size: 24,
              }),
            ],
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: "Features being tested:",
                bold: true,
                size: 24,
              }),
            ],
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: "• Format preservation",
                size: 20,
              }),
            ],
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: "• High-fidelity rendering",
                size: 20,
              }),
            ],
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: "• Multiple conversion methods",
                size: 20,
              }),
            ],
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: "• Error handling and fallbacks",
                size: 20,
              }),
            ],
          }),
        ],
      }],
    });

    const buffer = await Packer.toBuffer(doc);
    fs.writeFileSync(testDocxPath, buffer);
    console.log('✅ Test DOCX file created');

    // Test 3: Convert DOCX to PDF
    console.log('\n3️⃣ Testing DOCX to PDF conversion...');
    
    const formData = new FormData();
    formData.append('file', fs.createReadStream(testDocxPath), {
      filename: 'test-document.docx',
      contentType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    });

    const convertResponse = await fetch(`${LIBRE_URL}/convert-docx-to-pdf`, {
      method: 'POST',
      body: formData,
    });

    const convertData = await convertResponse.json();
    
    if (convertResponse.ok && convertData.success) {
      console.log('✅ DOCX to PDF conversion successful');
      console.log(`   Original: ${convertData.originalName}`);
      console.log(`   Converted: ${convertData.convertedName}`);
      console.log(`   File size: ${convertData.fileSize} bytes`);
      console.log(`   Download URL: ${convertData.downloadUrl}`);
    } else {
      console.log('❌ DOCX to PDF conversion failed');
      console.log(`   Error: ${convertData.error}`);
      return;
    }

    // Test 4: Download the converted PDF
    console.log('\n4️⃣ Testing PDF download...');
    const downloadResponse = await fetch(`${LIBRE_URL}${convertData.downloadUrl}`);
    
    if (downloadResponse.ok) {
      const pdfBuffer = await downloadResponse.buffer();
      const outputPath = path.join(__dirname, 'converted-test.pdf');
      fs.writeFileSync(outputPath, pdfBuffer);
      console.log('✅ PDF download successful');
      console.log(`   Saved to: ${outputPath}`);
      console.log(`   PDF size: ${pdfBuffer.length} bytes`);
    } else {
      console.log('❌ PDF download failed');
    }

    // Clean up test files
    console.log('\n5️⃣ Cleaning up test files...');
    fs.removeSync(testDocxPath);
    console.log('✅ Test files cleaned up');

    console.log('\n🎉 All tests completed successfully!');
    console.log('\n📋 Test Summary:');
    console.log('   ✅ Health check');
    console.log('   ✅ DOCX file creation');
    console.log('   ✅ PDF conversion');
    console.log('   ✅ PDF download');
    console.log('   ✅ File cleanup');

  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    console.error('Stack trace:', error.stack);
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  testConversion();
}

module.exports = { testConversion };
