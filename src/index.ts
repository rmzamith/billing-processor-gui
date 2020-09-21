import { QMainWindow, QWidget, QLabel, FlexLayout, QPushButton, QIcon, QLineEdit, QPixmap, QMovie, QFileDialog } from '@nodegui/nodegui';
import favIcon from '../assets/favicon.png';
import logoPath from '../assets/think-brq.png';
import loadingSpinner from '../assets/ajax-loader.gif'

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
csvFileInputPath.setObjectName('csvFileialog');
csvFileWidgetLayout.addWidget(csvFileInputPath);

const csvFileDialog = new QFileDialog()
const csvFileBrowseButton = new QPushButton()
csvFileBrowseButton.setText('Browse')
csvFileBrowseButton.addEventListener('clicked', () => {
    csvFileDialog.exec();
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
templateFileInputPath.setObjectName('templateFileialog');
templateFileWidgetLayout.addWidget(templateFileInputPath);

const templateFileDialog = new QFileDialog()
const templateFileBrowseButton = new QPushButton()
templateFileBrowseButton.setText('Browse')
templateFileBrowseButton.addEventListener('clicked', () => {
    templateFileDialog.exec();
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

const label2 = new QLabel();
label2.setText("World");
label2.setInlineStyle(`
  color: red;
`);

rootLayout.addWidget(logoLabel);
rootLayout.addWidget(label);
rootLayout.addWidget(csvFileWidget);
rootLayout.addWidget(templateFileWidget);
rootLayout.addWidget(outputFileWidget);
rootLayout.addWidget(processButton);
rootLayout.addWidget(spinLabel);
//rootLayout.addWidget(label2);
win.setCentralWidget(centralWidget);


// Event handling
processButton.addEventListener('clicked', (checked) => {
    processButton.hide();
    spinLabel.show();
    setTimeout(function() {
        processButton.show();
        spinLabel.hide();
    }, 3000);
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
    #csvFileialog, #templateFileialog, #outputFileDialog  {
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
