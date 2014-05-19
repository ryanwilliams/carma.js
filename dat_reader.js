// Thanks to: http://rr2000.toshiba-3.com/R4/PC/C2FORMAT.TXT
window.carmageddon = (function () {
  // When input changes, load the file!
  var datFileInput = document.querySelector('#dat-file-input');
  datFileInput.addEventListener('change', function (e) {
    console.log("Dat FILE CHANGED!", e);
    var reader = new StainlessFileReader({file: e.target.files[0]});
  });

  var BYTE  = 1,
      INT   = 2,
      WORD  = 3,
      FLOAT = 4;

  var HEADER      = 0x12,
      MODEL_ATTRS = 0x36,
      VERTICES    = 0x17,
      TEX_COORDS  = 0x18,
      FACES       = 0x35,
      MAT_NAMES   = 0x16,
      MAT_FACES   = 0x1A;

  // How many bytes and which methods to use for each value type
  var READ_MAP = {};
  READ_MAP[BYTE]  = [1, 'Uint8'];
  READ_MAP[INT]   = [2, 'Uint16'];
  READ_MAP[WORD]  = [4, 'Uint32'];
  READ_MAP[FLOAT] = [4, 'Float32'];

  function Record (buffer, offset) {
    this.cursor = 0;

    var view = new DataView(buffer, offset);

    var type = view.getUint32(0),
        length = view.getUint32(4);

    if (length > buffer.byteLength - offset) {
      alert("Read past end of buffer; aborting");
      return;
    }

    this.type = type;
    this.byteLength = length;

    // Offset by 8 bytes to skip the record header
    this.data = new DataView(buffer, offset + 8, length);

    switch (this.type) {
      case HEADER:
        this.parseHeader()
        break;

      case MODEL_ATTRS:
        this.parseModelAttributes()
        break;

      case VERTICES:
        this.parseVertices();
        break;

      case FACES:
        this.parseFaces();
        break;

      default:
        console.warn("Skipping unknown record type:", this.type);
    }
  }

  Record.prototype.parseHeader = function () {
  };

  Record.prototype.parseModelAttributes = function () {
    // Unknown bytes, skip 'em
    this.readByte();
    this.readByte();

    var name = "";
    var byte;
    while ((byte = this.readByte()) !== 0x00) {
      name += String.fromCharCode(byte);
    }

    this.modelName = name;
  };

  Record.prototype.parseVertices = function () {
    var count = this.readWord();
    var verts = [];
    for (var i = 0; i < count; i++) {
      verts[i] = {x: this.readFloat(), y: this.readFloat(), z: this.readFloat()};
    }

    this.vertices = verts;
  };

  Record.prototype.parseFaces = function () {
    var count = this.readWord();

    var faces = [];
    for (var i = 0; i < count; i++) {
      faces[i] = [
        this.readInt(),
        this.readInt(),
        this.readInt()
      ];

      // Skip unknown thing
      this.readByte();
      this.readByte();
      this.readByte();
    }

    this.faces = faces;
  };


  Record.prototype.readValue = function (type) {
    var value = this.data['get' + READ_MAP[type][1]](this.cursor);
    this.cursor += READ_MAP[type][0];

    return value;
  };

  Record.prototype.readByte = function () {
    return this.readValue(BYTE);
  };

  Record.prototype.readInt = function () {
    return this.readValue(INT);
  };

  Record.prototype.readWord = function () {
    return this.readValue(WORD);
  };

  Record.prototype.readFloat = function () {
    return this.readValue(FLOAT);
  };





  function StainlessFileReader (options) {
    options || (options = {});

    this.cursor = 0;

    if (options.file) {
      console.log("READING", options.file);
      this.file = options.file;
      this.fileReader = new FileReader();
      this.fileReader.addEventListener('load', this.onFileLoad.bind(this));
      this.fileReader.readAsArrayBuffer(this.file);
    }
  }

  StainlessFileReader.prototype.onFileLoad = function (e) {
    console.log("FILE LOADED!", this.fileReader.result.byteLength);
    this.data = new DataView(this.fileReader.result);
    this.parseArrayBuffer();
  };

  StainlessFileReader.prototype.parseArrayBuffer = function () {
    this.cursor = 0;

    var header = this.readNextRecord();

    if (header.type != HEADER) {
      alert("I have no idea how to read this file");
      return;
    }

    var records = [];
    while (this.cursor < this.data.byteLength) {
      records.push(this.readNextRecord());
    }

    alert("Records: \n" + JSON.stringify(records, null, '  '));

    //alert(JSON.stringify(this.datModel, null, '    '));
  };

  StainlessFileReader.prototype.readNextRecord = function () {
    var record = new Record(this.data.buffer, this.cursor);

    this.cursor = record.data.byteOffset + record.byteLength;

    return record;
  };

  return {
    StainlessFileReader: StainlessFileReader
  };
})();
