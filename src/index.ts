import { QMainWindow, QWidget, QLabel, FlexLayout, QPushButton, QIcon, QLineEdit, QPixmap } from '@nodegui/nodegui';
import favIcon from '../assets/favicon.png';
import logoPath from '../assets/think-brq.png';

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

const csvFileDialog = new QLineEdit();
csvFileDialog.setObjectName('csvFileialog');
csvFileWidgetLayout.addWidget(csvFileDialog);
// Template file widget
const templateFileWidget = new QWidget();
const templateFileWidgetLayout = new FlexLayout();
templateFileWidget.setObjectName('templateFileWidget');
templateFileWidget.setLayout(templateFileWidgetLayout);

const templateFileLabel = new QLabel();
templateFileLabel.setText('Template File: ');
templateFileWidgetLayout.addWidget(templateFileLabel);

const templateFileDialog = new QLineEdit();
templateFileDialog.setObjectName('templateFileialog');
templateFileWidgetLayout.addWidget(templateFileDialog);
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
const button = new QPushButton();
button.setObjectName('processButton')
button.setText('Process');
button.setIcon(new QIcon(favIcon));

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
rootLayout.addWidget(button);
//rootLayout.addWidget(label2);
win.setCentralWidget(centralWidget);
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
        margin-top: 10px;
        margin-left: 61px;
        flex-direction: row;
        font-size: 20px;
        
    }
    #templateFileWidget {
        margin-top: 10px;
        margin-left: 35px;
        flex-direction: row;
        font-size: 20px;
    }
    #outputFileWidget {
        margin-top: 10px;
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
