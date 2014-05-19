(function () {
  var datFileInput = document.querySelector('#dat-file-input');
  datFileInput.addEventListener('change', onDatFileChange);


  function onDatFileChange (e) {
    console.log("DAT FILE CHANGED!", e);
    var reader = new DATReader(e.target.files[0]);
  }


  function DATReader (file) {
    console.log("READING", file);
    this.file = file;
    this.fileReader = new FileReader();
    this.fileReader.addEventListener('load', this.onFileLoad.bind(this));
    this.fileReader.readAsArrayBuffer(this.file);
  }

  DATReader.prototype.onFileLoad = function (e) {
    console.log("FILE LOADED!", this.fileReader.result.byteLength);
  };

})();
