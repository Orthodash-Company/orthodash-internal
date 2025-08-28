const fs = require('fs');
const pdf = require('pdf-parse');

async function readPDF() {
  try {
    const dataBuffer = fs.readFileSync('Greyfinch_Datawarehouse.pdf');
    const data = await pdf(dataBuffer);
    console.log('PDF Content:');
    console.log(data.text);
  } catch (error) {
    console.error('Error reading PDF:', error);
  }
}

readPDF();
