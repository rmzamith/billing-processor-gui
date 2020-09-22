import { QMainWindow, QWidget, QLabel, FlexLayout, QPushButton, QIcon, QLineEdit, QPixmap, QMovie, QFileDialog } from '@nodegui/nodegui';
import favIcon from '../assets/favicon.png';
import logoPath from '../assets/think-brq.png';
import loadingSpinner from '../assets/ajax-loader.gif'


////////////////////////////////// logic /////////////////////////////////////////

const PizZip = require('pizzip');
const Docxtemplater = require('docxtemplater');
const fs = require('fs');
const csv = require('csv-parser');
const dateTime = require('node-datetime');

// The error object contains additional information when logged with JSON.stringify (it contains a properties object containing all suberrors).
function replaceErrors(key :any, value :any[]) {
    if (value instanceof Error) {
        return Object.getOwnPropertyNames(value).reduce(function(error: any, key: any) {
            error[key] = value[key];
            return error;
        }, {});
    }
    return value;
}

function errorHandler(error :any) {
    console.log(JSON.stringify({error: error}, replaceErrors));

    if (error.properties && error.properties.errors instanceof Array) {
        const errorMessages = error.properties.errors.map(function (error :any) {
            return error.properties.explanation;
        }).join("\n");
        console.log('errorMessages', errorMessages);
        // errorMessages is a humanly readable message looking like this :
        // 'The tag beginning with "foobar" is unopened'
    }
    throw error;
}

function insertSpacesOnValuesFromKey(key: string, value: string) {
    var realKeyLength = key.length + 2;
    if(realKeyLength > value.length) {
        var sizeTabDiff = (realKeyLength - value.length)/8;
        for(var i = 0; i <= sizeTabDiff; i++) {
            value = value + "\t";
        }
    }
    return value;
}

function appendTabsToKeepFormat(element :any) {
    for(var key in element) {
        element[key] = insertSpacesOnValuesFromKey(key, element[key]);
    }
}

function removeFirstLineFromCSV(csvDataFilePath:string) {
    var csvData = fs.readFileSync(csvDataFilePath);
    csvData = csvData.toString(); // stringify buffer
    var position = csvData.toString().indexOf('\n'); // find position of new line element
    if (position != -1) { // if new line element found
        csvData = csvData.substr(position + 1);
    }
    const treatedCsvFilePath :string = csvDataFilePath+".treated";
    fs.writeFileSync(treatedCsvFilePath, csvData);

    return treatedCsvFilePath;
}

function evaluateOutputName(outputNamePattern :string, csvEntry :any) {
    let matches = outputNamePattern.match(/{(.*?)\}/g);
    var diffEntriesOnName = false;
    if(matches != null) {
        matches.forEach(element => {
            const currKey = element.substring(1, element.length-1);
            var currVal = csvEntry[currKey];
            if(currVal == null) {
                currVal = "NOT_FOUND";
            } else {
                diffEntriesOnName = true;
            }
            outputNamePattern = outputNamePattern.replace(element,currVal);
        });
    }
    if(!diffEntriesOnName) {
        outputNamePattern = outputNamePattern+Math.floor(Math.random() * 100000);
    }
    return outputNamePattern;
}

function createOutputDir() {
    var dt = dateTime.create();
    var outputDir = "./billing_sheet_output_"+dt.format('Ymd_HMS');

    if (!fs.existsSync(outputDir)){
        fs.mkdirSync(outputDir);
    }
    return outputDir;
}



function processBilling(csvDataFilePath:string, templateFilePath:string, outputFileNamePattern:string) {
    // INIT - TEMPLATE LOAD
    var content = fs.readFileSync(templateFilePath, 'binary');

    // INIT - LOAD CSV
    const treatedCsvFilePath :string = removeFirstLineFromCSV(csvDataFilePath);
    const results: any[] = [];
    fs.createReadStream(treatedCsvFilePath)
        .pipe(csv())
        .on('data', (data :any) => results.push(data))
        .on('end', () => {
            results.forEach(element => {
                // INIT - DOC VAR REPLACEMENT
                appendTabsToKeepFormat(element);
                var zip = new PizZip(content);
                var doc;
                try {
                    doc = new Docxtemplater(zip);
                } catch(error) {
                    errorHandler(error);
                }

                doc.setData(element);

                try {
                    doc.render()
                }
                catch (error) {
                    errorHandler(error);
                }
                
                var buf = doc.getZip()
                            .generate({type: 'nodebuffer'});
                
                // INIT - SAVE FILE
                var outputDir = createOutputDir();
                var outputFileName = evaluateOutputName(outputFileNamePattern, element);
                fs.writeFileSync(outputDir+"/"+outputFileName+'.docx', buf);
            });
        });

    fs.unlinkSync(treatedCsvFilePath);
    
}
////////////////////////////////// logic /////////////////////////////////////////

const win = new QMainWindow();
win.setWindowTitle("Billing Sheet Processor");

// Root view
const centralWidget = new QWidget();
centralWidget.setObjectName("myroot");
const rootLayout = new FlexLayout();
centralWidget.setLayout(rootLayout);
// Think logo
const logoLabel = new QLabel();
logoLabel.setObjectName("logoLabel")
const logoImage = new QPixmap();
logoImage.load(logoPath);
logoLabel.setPixmap(logoImage);
// Program label
const label = new QLabel();
label.setObjectName("programLabel");
label.setText("Billing Processor");
// CSV file widget
const csvFileWidget = new QWidget();
const csvFileWidgetLayout = new FlexLayout();
csvFileWidget.setObjectName('csvFileWidget');
csvFileWidget.setLayout(csvFileWidgetLayout);

const csvFileLabel = new QLabel();
csvFileLabel.setText('CSV File: ');
csvFileWidgetLayout.addWidget(csvFileLabel);

const csvFileInputPath = new QLineEdit();
csvFileInputPath.setObjectName('csvFileDialog');
csvFileInputPath.setReadOnly(true);
csvFileWidgetLayout.addWidget(csvFileInputPath);

const csvFileDialog = new QFileDialog();
csvFileDialog.setNameFilter('*.csv');
const csvFileBrowseButton = new QPushButton();
csvFileBrowseButton.setText('Browse')
csvFileBrowseButton.addEventListener('clicked', () => {
    csvFileDialog.exec();
    const csvSelectedFile = csvFileDialog.selectedFiles();
    if(csvSelectedFile.length > 0) {
        csvFileInputPath.setText(csvSelectedFile[0]);
    }
})
csvFileWidgetLayout.addWidget(csvFileBrowseButton);
// Template file widget
const templateFileWidget = new QWidget();
const templateFileWidgetLayout = new FlexLayout();
templateFileWidget.setObjectName('templateFileWidget');
templateFileWidget.setLayout(templateFileWidgetLayout);

const templateFileLabel = new QLabel();
templateFileLabel.setText('Template File: ');
templateFileWidgetLayout.addWidget(templateFileLabel);

const templateFileInputPath = new QLineEdit();
templateFileInputPath.setObjectName('templateFileDialog');
templateFileInputPath.setReadOnly(true);
templateFileWidgetLayout.addWidget(templateFileInputPath);

const templateFileDialog = new QFileDialog();
templateFileDialog.setNameFilter('*.docx');
const templateFileBrowseButton = new QPushButton();
templateFileBrowseButton.setText('Browse')
templateFileBrowseButton.addEventListener('clicked', () => {
    templateFileDialog.exec();
    const templateSelectedFiles = templateFileDialog.selectedFiles();
    if(templateSelectedFiles.length > 0) {
        templateFileInputPath.setText(templateSelectedFiles[0]);
    }
})
templateFileWidgetLayout.addWidget(templateFileBrowseButton);
// Output file widget
const outputFileWidget = new QWidget();
const outputFileWidgetLayout = new FlexLayout();
outputFileWidget.setObjectName('outputFileWidget');
outputFileWidget.setLayout(outputFileWidgetLayout);

const outputFileLabel = new QLabel();
outputFileLabel.setText('Output File Pattern: ');
outputFileWidgetLayout.addWidget(outputFileLabel);

const outputFileDialog = new QLineEdit();
outputFileDialog.setObjectName('outputFileDialog');
outputFileWidgetLayout.addWidget(outputFileDialog);
// Process button
const processButton = new QPushButton();
processButton.setObjectName('processButton')
processButton.setText('Process');
processButton.setIcon(new QIcon(favIcon));
// Loading spinner
const spinLabel = new QLabel();
const spinMovie = new QMovie();
spinMovie.setFileName(loadingSpinner);
spinMovie.start();
spinLabel.setMovie(spinMovie);
spinLabel.hide();

const messageLabel = new QLabel();
messageLabel.hide();

rootLayout.addWidget(logoLabel);
rootLayout.addWidget(label);
rootLayout.addWidget(csvFileWidget);
rootLayout.addWidget(templateFileWidget);
rootLayout.addWidget(outputFileWidget);
rootLayout.addWidget(processButton);
rootLayout.addWidget(spinLabel);
rootLayout.addWidget(messageLabel);
win.setCentralWidget(centralWidget);

function writeErrorMessage(errMesage: string) {
    messageLabel.setText(errMesage);
    messageLabel.setInlineStyle(`
        color: red;
    `);
    messageLabel.show();
}

function handleResponse(_err: any) {
    if(_err == null || _err == '') {
        messageLabel.setText("Billing Sheets successfully processed");
        messageLabel.setInlineStyle(`
            color: green;
        `);
        messageLabel.show();
        return;
    }
    writeErrorMessage(_err);
}

function areFieldsValid() {
    if(csvFileInputPath.text() == null || csvFileInputPath.text() == '') {
        writeErrorMessage("Field 'CSV File' can't be empty");
        return false;
    }
    if(templateFileInputPath.text() == null || templateFileInputPath.text() == '') {
        writeErrorMessage("Field 'Template File' can't be empty");
        return false;
    }
    if(outputFileDialog.text() == null || outputFileDialog.text() == '') {
        writeErrorMessage("Field 'Output File Pattern' can't be empty");
        return false;
    }
    return true;
}

// Event handling
processButton.addEventListener('clicked', (checked) => {
    if(areFieldsValid()) {
        messageLabel.hide();
        processButton.hide();
        spinLabel.show();
        let _err = processBilling(csvFileInputPath.text(), templateFileInputPath.text(), outputFileDialog.text());
        handleResponse(_err);
        processButton.show();
        spinLabel.hide();
    }
    
    // setTimeout(function() {
    //     processButton.show();
    //     spinLabel.hide();
    // }, 3000);
});

win.setStyleSheet(
  `
    #myroot {
      background-color: #009688;
      height: '100%';
      align-items: 'center';
      justify-content: 'center';
      height:350px;
      width:500px;
    }
    #programLabel {
      font-size: 20px;
      font-weight: bold;
      padding: 1;
    }
    #logoLabel {
        margin-top: 0px;
    }
    #csvFileWidget {
        margin-left: 59px;
        flex-direction: row;
        font-size: 20px;
        
    }
    #templateFileWidget {
        margin-left: 32px;
        flex-direction: row;
        font-size: 20px;
    }
    #outputFileWidget {
        margin-top: 5px;
        margin-left: -87px;
        flex-direction: row;
        font-size: 20px;
    }
    #csvFileDialog, #templateFileDialog, #outputFileDialog  {
        width: 250px;
    }
    #processButton {
        width: 100px;
        height: 50px;
        margin-top: 10px;
    }
  `
);
win.show();

(global as any).win = win;
