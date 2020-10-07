import { QMainWindow, QWidget, QLabel, FlexLayout, QPushButton, QIcon, QLineEdit, QPixmap, QMovie, QFileDialog, Option, FileMode } from '@nodegui/nodegui';
import favIcon from '../assets/favicon.png';
import logoPath from '../assets/think-brq.png';
import loadingSpinner from '../assets/ajax-loader.gif'


////////////////////////////////// logic /////////////////////////////////////////

const PizZip = require('pizzip');
const Docxtemplater = require('docxtemplater');
const fs = require('fs');
const csv = require('csv-parser');
const dateTime = require('node-datetime');
const path = require('path');

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
    return error;
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

function evaluateOutputName(outputNamePattern :string, multipleEntries :boolean, csvEntry :any) {
    let matches = outputNamePattern.match(/{(.*?)\}/g);
    var diffEntriesOnName = false;
    if(matches != null) {
        matches.forEach(element => {
            const currKey = element.substring(1, element.length-1);
            var currVal = csvEntry[currKey];
            if(currVal == null) {
                currVal = "undefined";
            } else {
                diffEntriesOnName = true;
            }
            outputNamePattern = outputNamePattern.replace(element,currVal);
        });
    }
    if(!diffEntriesOnName && multipleEntries) {
        outputNamePattern = outputNamePattern+Math.floor(Math.random() * 100000);
    }
    return outputNamePattern;
}

function createOutputDir(outputDirectoryPath:string) {
    var dt = dateTime.create();
    var outputDir = "billing_sheet_output_"+dt.format('Ymd_HMS');

    if (!fs.existsSync(outputDir)){
        fs.mkdirSync(outputDirectoryPath+"/"+outputDir);
    }
    return outputDir;
}



function processBilling(csvDataFilePath:string, templateFilePath:string, outputDirectoryPath:string, outputFileNamePattern:string) {
    // INIT - TEMPLATE LOAD
    var content = fs.readFileSync(templateFilePath, 'binary');

    //INIT - CREATE OUTPUT DIR
    //var outputDir = createOutputDir(outputDirectoryPath);

    // INIT - LOAD CSV
    const treatedCsvFilePath :string = removeFirstLineFromCSV(csvDataFilePath);
    const results: any[] = [];
    const _err: any[] = [];
    fs.createReadStream(treatedCsvFilePath)
        .pipe(csv())
        .on('data', (data :any) => results.push(data))
        .on('end', () => {
            const multipleEntries = results.length > 1;
            results.forEach(element => {
                // INIT - DOC VAR REPLACEMENT
                appendTabsToKeepFormat(element);
                var zip = new PizZip(content);
                var doc;
                try {
                    doc = new Docxtemplater(zip);
                } catch(error) {
                    console.log("Assigning error variable.");
                    _err.push(errorHandler(error));
                    return;
                }

                doc.setData(element);

                try {
                    doc.render()
                }
                catch (error) {
                    console.log("Assigning error variable.");
                    _err.push(errorHandler(error));
                    return;
                }
                
                var buf = doc.getZip()
                            .generate({type: 'nodebuffer'});
                
                // INIT - SAVE FILE
                var outputFileName = evaluateOutputName(outputFileNamePattern, multipleEntries, element);
                fs.writeFileSync(outputDirectoryPath+"/"+outputFileName+'.docx', buf);
                console.log("Processed.")
            });
            console.log("Deleting CSV copy.");
            fs.unlinkSync(treatedCsvFilePath);
            handleResponse(_err.length > 0 ? _err[0] : null);
            processButton.show();
            spinLabel.hide();
        });
}
////////////////////////////////// logic /////////////////////////////////////////

let csvDefaultFile:string = '';
let templateDefaultFile:string = '';
let outputFolder:string = '';

function loadConfig() {
    const configPath = './defaults.cfg';
    if(fs.existsSync(configPath)) {
        var cfgData = fs.readFileSync(configPath);
        cfgData = cfgData.toString();

        var lines = cfgData.split('\n');
        for(var line = 0; line < lines.length; line++){
            var res = lines[line].split("=");
            if(res.length != 2) {
                handleResponse("defaults.cfg config file contain format errors");
                return;
            }
            loadDefaultInputs(res[0].trim(), res[1].trim())
        }
    }

    console.log('CSV: '+csvDefaultFile);
    console.log('template: '+templateDefaultFile);
    console.log('output: '+outputFolder);
}

function loadDefaultInputs(inputName :string, inputVal :string) {
    if(fs.existsSync(inputVal)) {
        if(inputName === 'csv_directory') {
            csvDefaultFile = inputVal;
        }
        if(inputName === 'template_file') {
            templateDefaultFile = inputVal;
        }
        if(inputName === 'output_directory') {
            outputFolder = inputVal;
        }
    }
}

loadConfig();
const win = new QMainWindow();
win.setWindowTitle("Template Processor");
const icon = new QIcon (favIcon);
win.setWindowIcon (icon);

// Root view
const centralWidget = new QWidget();
centralWidget.setObjectName("myroot");
const rootLayout = new FlexLayout();
centralWidget.setLayout(rootLayout);
// Think logo
const logoLabel = new QLabel();
logoLabel.setObjectName("logoLabel");
const logoImage = new QPixmap();
logoImage.load(logoPath);
logoLabel.setPixmap(logoImage);
// Program label
const label = new QLabel();
label.setObjectName("programLabel");
label.setText("Template Processor");
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

const csvFileDialog = new QFileDialog(centralWidget, "Select CSV File", csvDefaultFile, '*.csv');
const csvFileBrowseButton = new QPushButton();
csvFileBrowseButton.setText('Browse');
csvFileBrowseButton.addEventListener('clicked', () => {
    csvFileDialog.exec();
    const csvSelectedFile = csvFileDialog.selectedFiles();
    if(csvSelectedFile.length > 0) {
        csvFileInputPath.setText(csvSelectedFile[0]);
    }
});
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
templateFileInputPath.setText(templateDefaultFile);
templateFileWidgetLayout.addWidget(templateFileInputPath);

const templateFileDialog = new QFileDialog(centralWidget, "Select DOCX File", templateDefaultFile, '*.docx');
const templateFileBrowseButton = new QPushButton();
templateFileBrowseButton.setText('Browse');
templateFileBrowseButton.addEventListener('clicked', () => {
    templateFileDialog.exec();
    const templateSelectedFiles = templateFileDialog.selectedFiles();
    if(templateSelectedFiles.length > 0) {
        templateFileInputPath.setText(templateSelectedFiles[0]);
    }
});
templateFileWidgetLayout.addWidget(templateFileBrowseButton);
// Output directory widget
const outputDirectoryWidget = new QWidget();
const outputDirectoryWidgetLayout = new FlexLayout();
outputDirectoryWidget.setObjectName('outputDirectoryWidget');
outputDirectoryWidget.setLayout(outputDirectoryWidgetLayout);

const outputDirectoryLabel = new QLabel();
outputDirectoryLabel.setText('Output Directory: ');
outputDirectoryWidgetLayout.addWidget(outputDirectoryLabel);

const outputDirectoryInputPath = new QLineEdit();
outputDirectoryInputPath.setObjectName('outputDirectoryDialog');
outputDirectoryInputPath.setReadOnly(true);
outputDirectoryInputPath.setText(outputFolder);
outputDirectoryWidgetLayout.addWidget(outputDirectoryInputPath);

const outputDirectoryDialog = new QFileDialog(centralWidget, "Select Output Folder", outputFolder);
outputDirectoryDialog.setFileMode(FileMode.Directory);
outputDirectoryDialog.setOption(Option.ShowDirsOnly);
const outputDirectoryBrowseButton = new QPushButton();
outputDirectoryBrowseButton.setText('Browse')
outputDirectoryBrowseButton.addEventListener('clicked', () => {
    outputDirectoryDialog.exec();
    const templateSelectedFiles = outputDirectoryDialog.selectedFiles();
    if(templateSelectedFiles.length > 0) {
        outputDirectoryInputPath.setText(templateSelectedFiles[0]);
    }
});
outputDirectoryWidgetLayout.addWidget(outputDirectoryBrowseButton);
// Output file widget
const outputFileWidget = new QWidget();
const outputFileWidgetLayout = new FlexLayout();
outputFileWidget.setObjectName('outputFileWidget');
outputFileWidget.setLayout(outputFileWidgetLayout);

const outputFileLabel = new QLabel();
outputFileLabel.setText('Output File Name: ');
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
rootLayout.addWidget(outputDirectoryWidget);
rootLayout.addWidget(outputFileWidget);
rootLayout.addWidget(processButton);
rootLayout.addWidget(spinLabel);
rootLayout.addWidget(messageLabel);
win.setCentralWidget(centralWidget);

function writeErrorMessage(errMesage: string) {
    messageLabel.setText(errMesage);
    messageLabel.setInlineStyle(`
        color: red;
        font-size: 27px;
    `);
    messageLabel.show();
}

function handleResponse(_err: any) {
    if(_err == null || _err == '') {
        messageLabel.setText("Template successfully processed");
        messageLabel.setInlineStyle(`
            color: blue;
            font-size: 27px;
        `);
        messageLabel.show();
        return;
    }
    if(typeof _err === 'string') {
        writeErrorMessage(_err);
    } else if (_err.properties && _err.properties.errors instanceof Array) {
        const errorMessages = _err.properties.errors.map(function (error :any) {
            return error.properties.explanation;
        }).join("\n");
        writeErrorMessage(errorMessages);
    }
    else {
        writeErrorMessage("Error ocurred while processing.");
    }
}

function areFieldsValid() {
    if(csvFileInputPath.text() == null || csvFileInputPath.text() == '') {
        writeErrorMessage("Field 'CSV File' can't be empty");
        return false;
    }
    else if(!fs.existsSync(csvFileInputPath.text()) || !csvFileInputPath.text().includes(".csv")) {
        writeErrorMessage("'CSV File' not found");
        return false;
    }

    if(templateFileInputPath.text() == null || templateFileInputPath.text() == '') {
        writeErrorMessage("Field 'Template File' can't be empty");
        return false;
    }
    else if(!fs.existsSync(templateFileInputPath.text()) || !templateFileInputPath.text().includes(".docx")) {
        writeErrorMessage("'Template File' not found");
        return false;
    }

    if(outputDirectoryInputPath.text() == null || outputDirectoryInputPath.text() == '') {
        writeErrorMessage("Field 'Output Directory' can't be empty");
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
        try {
            processBilling(
                csvFileInputPath.text(), 
                templateFileInputPath.text(), 
                outputDirectoryInputPath.text(), 
                outputFileDialog.text());
        } catch (error) {
            handleResponse(error);
            processButton.show();
            spinLabel.hide();
        }
        
    }
});

win.setStyleSheet(
  `
    #myroot {
      background-color: #009688;
      height: '100%';
      align-items: 'center';
      justify-content: 'center';
      height:420px;
      width:650px;
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
        margin-left: 30px;
        flex-direction: row;
        font-size: 20px;
    }
    #outputDirectoryWidget {
        margin-left: 7px;
        flex-direction: row;
        font-size: 20px;
    }
    #outputFileWidget {
        margin-top: 3px;
        margin-left: -83px;
        flex-direction: row;
        font-size: 20px;
    }
    #csvFileDialog, #templateFileDialog, #outputDirectoryDialog, #outputFileDialog  {
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
