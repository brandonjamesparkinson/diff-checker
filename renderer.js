const { ipcRenderer } = require('electron');
const diff = require('./assets/js/diff.js');
const { addWarningMessage, clearDiffContent, toggleClass, readFile, differenceCheck } = require('./assets/js/utils.js');
const { sameMsg, emptyMsg, baseText, newText } = require('./assets/js/constants.js');

// check events from updater
ipcRenderer.on('update-info', function (event, message, type, data) {
  const progressBar = document.getElementById('update-progress');
  const progressBarValue = document.querySelector('.progress-value');
  const progressBarMessage = document.querySelector('.progress-message');
  const progressBarDynamic = document.querySelector('.progress-dynamic');
  const progressContainer = document.querySelector('.progress-container');

  if (progressContainer.classList.contains('hidden') && type !== 'not-available' && type !== 'error') { 
    toggleClass(progressContainer, 'hidden', true); 
  }

  switch (type) {
    case 'available':
      progressBarMessage.textContent = message + ' (' + data.version + ')';
      break;
    case 'not-available':
      progressBarMessage.textContent = message;
      break;
    case 'progress':
      (data.bytesPerSecond > 1024 * 1024) 
        ? progressBarMessage.textContent = message + ' (' + Math.round(data.bytesPerSecond / 1024 / 1024, 2) + '  Mb/s)'
        : progressBarMessage.textContent = message + ' (' + Math.round(data.bytesPerSecond / 1024, 2) + '  kb/s)';
      const percent = Math.floor(data.percent);
      progressBar.value = percent;
      progressBarValue.textContent = percent + "%";
      toggleClass(progressBarDynamic, 'hidden', true);
      // if (percent === 100) {
      //   progressBarMessage.textContent = "Downloading package..";
      //   toggleClass(progressContainer, 'hidden');
      // }
      break;
    case 'downloaded':
      progressBarMessage.textContent = message + ' (' + data.version + ')';
      setTimeout(() => { toggleClass(progressContainer, 'hidden'); }, 3000);
      break;
    case 'error':
      progressBarMessage.textContent = message;
  }
});

// set drag content
const dragItems = document.querySelectorAll('textarea');
document.ondragover = document.ondrop = e => { e.preventDefault(); } 
dragItems.forEach(element => { 
  element.ondrop = e => {
    e.preventDefault();
    toggleClass(e.target, 'drag-hover', true);
    readFile(e); 
  }

  element.ondragenter = e => {
    toggleClass(e.target, 'drag-hover');
  };

  element.ondragleave = e => {
    toggleClass(e.target, 'drag-hover', true);
  };
});


// difference view
const differenceBtn = document.getElementById('differenceBtn');
differenceBtn.addEventListener('click', function(e) {
  document.getElementById('diffBtn').click();
});


// display type
const displayTypeBtn = document.querySelectorAll('.displayType');
displayTypeBtn.forEach(element => { 
  element.addEventListener('change', function(e) {
    document.getElementById('diffBtn').click();
  });
});

// reset textarea field
const resetBtn = document.querySelectorAll('.reset-area');
resetBtn.forEach(element => { 
  element.addEventListener('click', function(e) {
    e.target.previousElementSibling.value = '';
  });
});


// diff button action
const diffBtn = document.getElementById('diffBtn');
diffBtn.addEventListener('click', function(e) {
  // get content from both textareas
  const leftContent = document.querySelector('.left-container textarea').value;
  const rightContent = document.querySelector('.right-container textarea').value;
  const warningBlock = document.querySelector('.warning-container');
  const diffBlock = document.querySelector('.diff-container');

  // hide and clear diff container
  toggleClass(diffBlock, 'hidden');
  clearDiffContent(diffBlock);

  if (leftContent.length && rightContent.length) {
    if (leftContent === rightContent) {      
      // show warning message
      addWarningMessage(warningBlock, sameMsg);
      toggleClass(warningBlock, 'hidden', true);
    } else {
      // hide warning block if visible
      toggleClass(warningBlock, 'hidden');
      
      // run diff
      const lc = diff.lib.stringAsLines(leftContent);
      const rc = diff.lib.stringAsLines(rightContent);
      diff.lib.SequenceMatcher(lc, rc);
      const opcodes = diff.lib.get_opcodes();

      // set view type
      let viewType = false;
      const displayTypeBtn = document.querySelectorAll('.displayType');
      displayTypeBtn.forEach(el => { if (el.checked) { viewType = el.value }; });
      
      diffBlock.appendChild(diff.view.buildView({
        baseTextLines: lc,
        newTextLines: rc,
        opcodes: opcodes,
        baseTextName: baseText,
        newTextName: newText,
        contextSize: null,
        viewType: viewType === '0' ? 0 : 1
      }));

      // show options
      const optionsBox = document.querySelector('.options-container');
      toggleClass(optionsBox, 'hidden', true);

      // check selected difference option
      differenceCheck();

      // show diff container
      toggleClass(diffBlock, 'hidden', true);
    }
  } else {
    // show warning (textareas not filled)
    addWarningMessage(warningBlock, emptyMsg);
    toggleClass(warningBlock, 'hidden', true);
  }
});