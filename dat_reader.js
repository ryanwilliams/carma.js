// Thanks to: http://rr2000.toshiba-3.com/R4/PC/C2FORMAT.TXT
window.carmageddon = (function () {
  var BYTE  = 1,
      INT   = 2,
      WORD  = 3,
      FLOAT = 4;

  // .DAT File
  var HEADER      = 0x12,
      MODEL_ATTRS = 0x36,
      VERTICES    = 0x17,
      TEX_COORDS  = 0x18,
      FACES       = 0x35,
      MAT_NAMES   = 0x16,
      MAT_FACES   = 0x1A;

  // .MAT File
  var MAT_ATTRS   = 0x3C,
      IMG_NAME    = 0x1C;

  // How many bytes and which methods to use for each value type
  var READ_MAP = {};
  READ_MAP[BYTE]  = [1, 'Uint8'];
  READ_MAP[INT]   = [2, 'Uint16'];
  READ_MAP[WORD]  = [4, 'Uint32'];
  READ_MAP[FLOAT] = [4, 'Float32'];

  function Record (buffer, offset) {
    this.cursor = 0;

    var view = new DataView(buffer, offset);

    this.type = view.getUint32(0);
    this.byteOffset = offset;
    this.byteLength = view.getUint32(4);

    if (length > buffer.byteLength - offset) {
      alert("Read past end of buffer; aborting");
      return;
    }

    // Offset by 8 bytes to skip the record header
    this.data = new DataView(buffer, offset + 8);

    switch (this.type) {
      case HEADER:
        console.log("Parsing header");
        this.parseHeader();
        break;

      case MODEL_ATTRS:
        console.log("Parsing model name");
        this.parseModelAttributes();
        break;

      case VERTICES:
        console.log("Parsing vertices");
        this.parseVertices();
        break;

      case FACES:
        console.log("Parsing faces");
        this.parseFaces();
        break;

      case TEX_COORDS:
        console.log("Parsing texture coords");
        break;

      case MAT_NAMES:
        console.log("Parsing material names");
        this.parseMaterialNames();
        break;

      case MAT_FACES:
        console.log("Parsing material faces");
        break;

      case MAT_ATTRS:
        console.log("Parsing material attributes");
        this.parseMaterialAttributes();
        break;

      case IMG_NAME:
        console.log("Parsing image name");
        this.parseImageName();
        break;

      case 0:
        // Ignore type 0
        break;

      default:
        console.warn("Skipping unknown record type:", this.type);
    }
  }

  Record.prototype.parseHeader = function () {
    this.filetype = this.readWord();
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

  /**
   * Material record length is often wrong, so will be corrected during parsing
   */
  Record.prototype.parseMaterialNames = function () {
    var count = this.readWord();

    // keep track of length so we can fix it
    var length = 4; // count is 4 bytes

    var names = []

    var name = "";
    var byte;
    for (var i = 0; i < count; i++) {
      while ((byte = this.readByte()) !== 0x00) {
        name += String.fromCharCode(byte);
        length++;
      }
      length++; // for the 0x00

      names.push(name);
      name = "";
    }


    this.byteLength = length;
    this.materialNames = names;
  };

  Record.prototype.parseMaterialAttributes = function () {
    var color = this.readWord(),
        ambLight = this.readWord(),
        dirLight = this.readWord(),
        specLight = this.readWord(),
        specPower = this.readWord(),
        flags = this.readWord(),
        transMatrix = this.read2DMatrix(),
        unknown = this.readWord();

    // Null 13 byte marker
    for (var i = 0; i < 13; i++) {
      this.readByte();
    }


    // Length of above stuff added up
    var length = 65;

    var name = "";
    var byte;
    while ((byte = this.readByte()) !== 0x00) {
      name += String.fromCharCode(byte);
      length++;
    }
    length++; // for the 0x00


    this.byteLength = length;
    this.materialName = name;
  };

  Record.prototype.parseImageName = function () {
    var name = "";
    var byte;
    while ((byte = this.readByte()) !== 0x00) {
      name += String.fromCharCode(byte);
    }

    this.imageName = name;
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

  Record.prototype.read2DMatrix = function () {
    // TODO format into 2d array?
    return [
      this.readFloat(),
      this.readFloat(),
      this.readFloat(),
      this.readFloat(),
      this.readFloat(),
      this.readFloat()
    ];
  };





  function StainlessFileReader (options) {
    options = options || {};

    this.cursor = 0;

    if (options.file) {
      console.log("READING", options.file);
      this.file = options.file;
      this.fileReader = new FileReader();
      this.fileReader.addEventListener('load', this.onFileLoad.bind(this));
      this.fileReader.readAsArrayBuffer(this.file);
    }

    (function (that) {
      // Cheeky DOM element to fake events
      var el = document.createElement('div');

      that.addEventListener = function (type, callback) {
        el.addEventListener(type, function (e) {
          callback({target: that});
        });
      };

      that.dispatchEvent = function (event) {
        el.dispatchEvent(event);
      };
    })(this);
  }

  StainlessFileReader.prototype.toJSON = function () {
    if (this.header && this.header.filetype === 0xFACE) {
      return this.toJSONModel();
    }

    return this;
  };

  StainlessFileReader.prototype.toJSONModel = function () {
    return {
      vertices: []
    };
  };

  StainlessFileReader.prototype.onFileLoad = function (e) {
    console.log("FILE LOADED!", this.fileReader.result.byteLength);
    this.data = new DataView(this.fileReader.result);
    this.parseArrayBuffer();
  };

  StainlessFileReader.prototype.parseArrayBuffer = function () {
    this.cursor = 0;

    this.header = this.readNextRecord();

    if (this.header.type != HEADER) {
      alert("I have no idea how to read this file");
      return;
    }

    this.records = [];
    while (this.cursor < this.data.byteLength) {
      var record = this.readNextRecord();
      if (record.type === 0) {
        continue;
      }
      this.records.push(record);
    }

    // All read, trigger event
    this.dispatchEvent(new Event('load'));

    //alert("Records: \n" + JSON.stringify(records, null, '  '));

    //alert(JSON.stringify(this.datModel, null, '    '));
  };

  StainlessFileReader.prototype.readNextRecord = function () {
    var record = new Record(this.data.buffer, this.cursor);

    this.cursor = record.data.byteOffset + record.byteLength;

    return record;
  };

  return {
    Record: Record,
    StainlessFileReader: StainlessFileReader
  };
})();
